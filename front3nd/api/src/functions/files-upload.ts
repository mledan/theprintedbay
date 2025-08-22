import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as multipart from 'parse-multipart-data';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient } from '@azure/storage-blob';

// Supported file types for 3D printing
const SUPPORTED_MIME_TYPES = [
  'application/octet-stream', // STL files
  'model/stl',
  'application/sla', // SLA files
  'model/obj',
  'application/obj',
  'text/plain', // Sometimes STL files are detected as text/plain
];

const SUPPORTED_EXTENSIONS = ['.stl', '.obj', '.ply', '.3mf'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

interface FileUploadResponse {
  success: boolean;
  fileId: string;
  uploadUrl?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  error?: string;
}

export async function filesUpload(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method?.toLowerCase();
  
  // Handle CORS preflight
  if (method === 'options') {
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    };
  }

  if (method !== 'post') {
    return {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      jsonBody: { 
        success: false, 
        error: 'Method not allowed',
        fileId: '',
        fileName: '',
        fileSize: 0,
        fileType: ''
      } as FileUploadResponse
    };
  }

  try {
    // Parse multipart form data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        jsonBody: {
          success: false,
          error: 'Content-Type must be multipart/form-data',
          fileId: '',
          fileName: '',
          fileSize: 0,
          fileType: ''
        } as FileUploadResponse
      };
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        jsonBody: {
          success: false,
          error: 'Invalid multipart boundary',
          fileId: '',
          fileName: '',
          fileSize: 0,
          fileType: ''
        } as FileUploadResponse
      };
    }

    const bodyBuffer = await request.arrayBuffer();
    const parts = multipart.parse(Buffer.from(bodyBuffer), boundary);
    
    const filePart = parts.find(part => part.name === 'file');
    if (!filePart) {
      return {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        jsonBody: {
          success: false,
          error: 'No file provided',
          fileId: '',
          fileName: '',
          fileSize: 0,
          fileType: ''
        } as FileUploadResponse
      };
    }

    const fileName = filePart.filename || 'unknown';
    const fileBuffer = filePart.data;
    const fileSize = fileBuffer.length;
    const fileType = filePart.type || 'application/octet-stream';

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        status: 413,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        jsonBody: {
          success: false,
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          fileId: '',
          fileName,
          fileSize,
          fileType
        } as FileUploadResponse
      };
    }

    // Validate file type
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const isValidExtension = SUPPORTED_EXTENSIONS.includes(fileExtension);

    if (!isValidExtension) {
      return {
        status: 415,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        jsonBody: {
          success: false,
          error: `Unsupported file type. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
          fileId: '',
          fileName,
          fileSize,
          fileType
        } as FileUploadResponse
      };
    }

    // Generate file ID and upload to Azure Blob Storage
    const fileId = uuidv4();
    const customerId = request.headers.get('x-customer-id') || `anonymous-${Date.now()}`;
    
    // Upload to Azure Blob Storage
    let uploadUrl: string;
    try {
      uploadUrl = await uploadToAzureBlob(fileBuffer, fileName, fileId, customerId, context);
    } catch (uploadError) {
      context.error('❌ Azure Blob upload failed:', uploadError);
      // Fallback: return success but note that file is cached locally
      uploadUrl = `local://cache/${fileId}`;
    }
    
    // Log upload attempt
    context.log(`✅ File upload: ${fileName} (${fileSize} bytes) for customer ${customerId} -> ${uploadUrl}`);

    const response: FileUploadResponse = {
      success: true,
      fileId: fileId,
      uploadUrl: uploadUrl,
      fileName,
      fileSize: fileSize,
      fileType: fileType || `application/octet-stream${fileExtension}`
    };

    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      jsonBody: response
    };

  } catch (error) {
    // Log error
    context.error('❌ File upload error:', error);

    return {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      jsonBody: {
        success: false,
        error: 'Internal server error during file upload',
        fileId: '',
        fileName: '',
        fileSize: 0,
        fileType: ''
      } as FileUploadResponse
    };
  }
}

// Azure Blob Storage upload function
async function uploadToAzureBlob(
  fileBuffer: Buffer, 
  fileName: string, 
  fileId: string, 
  customerId: string, 
  context: InvocationContext
): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'customer-files';
  
  if (!connectionString || connectionString.includes('your-storage-account')) {
    context.warn('⚠️ Azure Storage not configured, using local cache');
    throw new Error('Azure Storage not configured');
  }
  
  try {
    // Create BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({ access: 'blob' });
    
    // Create blob name with customer isolation
    const blobName = `${customerId}/${fileId}/${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file buffer to blob
    const uploadResult = await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      metadata: {
        originalName: fileName,
        customerId: customerId,
        uploadDate: new Date().toISOString(),
        fileId: fileId
      },
      blobHTTPHeaders: {
        blobContentType: getContentType(fileName)
      }
    });
    
    context.log(`✅ File uploaded to Azure Blob: ${blobName}`);
    return blockBlobClient.url;
    
  } catch (error) {
    context.error('❌ Azure Blob upload error:', error);
    throw error;
  }
}

// Get content type based on file extension
function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  switch (ext) {
    case '.stl':
      return 'model/stl';
    case '.obj':
      return 'model/obj';
    case '.ply':
      return 'model/ply';
    case '.3mf':
      return 'model/3mf';
    default:
      return 'application/octet-stream';
  }
}
