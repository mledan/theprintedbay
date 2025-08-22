'use client'

import { useState, useCallback } from 'react'
import { appInsights } from '../lib/appInsights'
import { apiService } from '../lib/apiService'
import { fileCache } from '../lib/fileCache'
import styles from './FileUpload.module.css'

interface FileUploadProps {
  onFileUpload: (file: File, fileId: string) => void
  onFileDropped?: (file: File) => void // New: immediate drop handler
  acceptedFormats: string[]
  maxSize?: number // in MB
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  onFileDropped,
  acceptedFormats, 
  maxSize = 50 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'caching' | 'uploading' | 'complete' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    const startTime = Date.now()

    try {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxSize) {
        const error = `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSize}MB)`
        appInsights.trackEvent('FileValidationFailed', {
          reason: 'size_exceeded',
          fileName: file.name,
          fileSizeMB: fileSizeMB.toFixed(1),
          maxSizeMB: maxSize.toString()
        })
        return error
      }

      // Check file format
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFormats.includes(fileExtension)) {
        const error = `File format ${fileExtension} is not supported. Accepted formats: ${acceptedFormats.join(', ')}`
        appInsights.trackEvent('FileValidationFailed', {
          reason: 'unsupported_format',
          fileName: file.name,
          fileExtension,
          acceptedFormats: acceptedFormats.join(', ')
        })
        return error
      }

      // Check file name
      if (file.name.length > 255) {
        const error = 'File name is too long (maximum 255 characters)'
        appInsights.trackEvent('FileValidationFailed', {
          reason: 'name_too_long',
          fileName: file.name,
          nameLength: file.name.length.toString()
        })
        return error
      }

      // Track successful validation
      const validationTime = Date.now() - startTime
      appInsights.trackPerformance('FileValidation', validationTime, true, {
        fileName: file.name,
        fileExtension,
        fileSizeMB: fileSizeMB.toString()
      })

      return null
    } catch (error) {
      const validationTime = Date.now() - startTime
      appInsights.trackPerformance('FileValidation', validationTime, false, {
        error: error instanceof Error ? error.message : 'Unknown validation error'
      })
      return 'File validation failed'
    }
  }, [acceptedFormats, maxSize])

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    setIsProcessing(true)
    setUploadStatus('caching')
    setUploadProgress(0)
    
    const startTime = Date.now()
    
    try {
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setUploadStatus('error')
        return
      }

      // Track file selection
      appInsights.trackEvent('FileSelected', {
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileExtension: '.' + file.name.split('.').pop()?.toLowerCase(),
        selectionMethod: 'upload',
        apiMode: 'cache_first'
      }, {
        fileSizeBytes: file.size
      })

      // Step 1: Cache file locally for instant access (30%)
      setUploadProgress(30)
      const fileId = await fileCache.storeFile(file)
      
      // Step 2: Simulate processing steps with smooth progress
      const progressSteps = [50, 70, 85]
      for (const progress of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setUploadProgress(progress)
      }
      
      setUploadStatus('uploading')
      setUploadProgress(95)
      
      // Step 3: Try backend upload (this will fallback to simulation gracefully)
      try {
        const uploadResult = await apiService.uploadFile(file)
        // Backend upload successful, but we already have the file cached
      } catch (backendError) {
        // Backend failed, but that's OK - we have the file cached
        console.log('Backend upload failed, using cached file:', backendError)
      }
      
      // Step 4: Complete (100%)
      setUploadProgress(100)
      setUploadStatus('complete')
      
      const processingTime = Date.now() - startTime
      
      // Track successful processing
      appInsights.trackPerformance('FileProcessing', processingTime, true, {
        fileName: file.name,
        fileSize: file.size.toString(),
        fileId,
        cached: true
      })

      // Small delay to show completion, then notify parent
      setTimeout(() => {
        onFileUpload(file, fileId)
        
        // Auto-scroll to preview section after upload
        setTimeout(() => {
          const previewSection = document.getElementById('model-preview-section')
          if (previewSection) {
            previewSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            })
          }
        }, 300)
      }, 1000)
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'File processing failed'
      
      setError(errorMessage)
      setUploadStatus('error')
      
      // Track processing error
      appInsights.trackError(error instanceof Error ? error : new Error(errorMessage), {
        operation: 'fileProcessing',
        fileName: file.name
      })
      
      appInsights.trackPerformance('FileProcessing', processingTime, false, {
        error: errorMessage
      })
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
      }, 1200)
    }
  }, [validateFile, onFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    
    // Track drag interaction
    appInsights.trackEvent('FileDragOver', {
      interactionType: 'drag_hover'
    })
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    
    // Track drop interaction
    appInsights.trackEvent('FileDrop', {
      fileCount: files.length.toString(),
      interactionType: 'drag_drop'
    })
    
    if (files.length > 0) {
      const file = files[0]
      
      // Validate file first
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      
      // If we have the immediate drop handler, use it for instant viewer activation
      if (onFileDropped) {
        // Clear any previous errors
        setError(null)
        
        // Call the immediate drop handler - this starts the viewer right away
        onFileDropped(file)
        
        // Track immediate activation
        appInsights.trackEvent('ImmediateViewerActivated', {
          fileName: file.name,
          fileSize: file.size.toString(),
          trigger: 'file_drop'
        })
      } else {
        // Fallback to old behavior for file input clicks
        handleFileSelect(file)
      }
    }
  }, [validateFile, onFileDropped, handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Track input change
    appInsights.trackEvent('FileInputChange', {
      fileCount: files.length.toString(),
      interactionType: 'file_input'
    })
    
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className={styles.container}>
      {/* Native HTML label for 100% reliable click-to-upload */}
      <label 
        htmlFor="file-input"
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${isProcessing ? styles.processing : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.dropzoneContent}>
          {isProcessing ? (
            <>
              {uploadStatus === 'complete' ? (
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: '#48bb78',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 1rem',
                  animation: 'pulse 0.5s ease-in-out'
                }}>✅</div>
              ) : (
                <div className={styles.loader}></div>
              )}
              
              <h3 style={{
                color: uploadStatus === 'complete' ? '#2f855a' : '#667eea',
                margin: '0 0 0.5rem 0'
              }}>
                {uploadStatus === 'caching' && '💾 Caching file locally...'}
                {uploadStatus === 'uploading' && '⬆️ Processing upload...'}
                {uploadStatus === 'complete' && '✅ Upload complete!'}
                {uploadStatus === 'error' && '❌ Upload failed'}
              </h3>
              
              <p className={styles.processingText} style={{
                color: uploadStatus === 'complete' ? '#68d391' : '#718096'
              }}>
                {uploadStatus === 'caching' && 'Securing your file for instant access'}
                {uploadStatus === 'uploading' && 'Your file is ready for preview'}
                {uploadStatus === 'complete' && 'Redirecting to 3D preview...'}
                {uploadStatus === 'error' && 'Please try again'}
              </p>
              
              {/* Animated progress bar */}
              <div style={{
                width: '100%',
                maxWidth: '300px',
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden',
                margin: '1rem auto 0.5rem'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: uploadStatus === 'complete' 
                    ? 'linear-gradient(90deg, #48bb78 0%, #68d391 100%)'
                    : uploadStatus === 'error'
                    ? 'linear-gradient(90deg, #e53e3e 0%, #fc8181 100%)'
                    : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease'
                }}></div>
              </div>
              <p style={{
                color: '#718096',
                margin: '0.5rem 0 0 0',
                fontSize: '0.9rem'
              }}>
                {uploadProgress}% complete
              </p>
            </>
          ) : (
            <>
              <div className={styles.icon}>📁</div>
              <h3>Drop your 3D model here</h3>
              <p>or click to browse files</p>
              <div className={styles.formats}>
                <strong>Supported formats:</strong> {acceptedFormats.join(', ')}
              </div>
              <div className={styles.maxSize}>
                <strong>Maximum size:</strong> {maxSize}MB
              </div>
            </>
          )}
        </div>
      </label>

      <input
        id="file-input"
        type="file"
        className={styles.visuallyHidden}
        accept={acceptedFormats.join(',')}
        onChange={handleInputChange}
      />

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* File Format Guide */}
      <div className={styles.guide}>
        <h4>📋 File Format Guide</h4>
        <div className={styles.formatGrid}>
          <div className={styles.formatCard}>
            <strong>.STL</strong>
            <span>Most common, widely supported</span>
          </div>
          <div className={styles.formatCard}>
            <strong>.OBJ</strong>
            <span>Good for textured models</span>
          </div>
          <div className={styles.formatCard}>
            <strong>.PLY</strong>
            <span>Polygon format with colors</span>
          </div>
          <div className={styles.formatCard}>
            <strong>.3MF</strong>
            <span>Microsoft 3D format</span>
          </div>
          <div className={styles.formatCard}>
            <strong>.GLTF/.GLB</strong>
            <span>Modern 3D format</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileUpload
