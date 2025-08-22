/**
 * File Cache Service
 * 
 * Manages 3D model files in browser storage using IndexedDB
 * Provides persistence across sessions and instant access to files
 */

interface CachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
  uploadedAt: number;
  lastAccessed: number;
}

interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  lastAccessed: number;
}

class FileCacheService {
  private dbName = 'print3dbay_files';
  private version = 1;
  private storeName = 'files';
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not available')
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  // Store file in cache
  async storeFile(file: File): Promise<string> {
    if (!this.db) await this.init();

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const arrayBuffer = await file.arrayBuffer();

    const cachedFile: CachedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      data: arrayBuffer,
      uploadedAt: Date.now(),
      lastAccessed: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(cachedFile);

      request.onsuccess = () => resolve(fileId);
      request.onerror = () => reject(request.error);
    });
  }

  // Retrieve file from cache
  async getFile(fileId: string): Promise<File | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(fileId);

      request.onsuccess = () => {
        const cachedFile = request.result as CachedFile;
        if (cachedFile) {
          // Update last accessed time
          cachedFile.lastAccessed = Date.now();
          store.put(cachedFile);

          // Convert back to File
          const file = new File([cachedFile.data], cachedFile.name, {
            type: cachedFile.type,
            lastModified: cachedFile.uploadedAt
          });
          resolve(file);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get file metadata without loading full file
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(fileId);

      request.onsuccess = () => {
        const cachedFile = request.result as CachedFile;
        if (cachedFile) {
          resolve({
            id: cachedFile.id,
            name: cachedFile.name,
            size: cachedFile.size,
            type: cachedFile.type,
            uploadedAt: cachedFile.uploadedAt,
            lastAccessed: cachedFile.lastAccessed
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // List all cached files
  async listFiles(): Promise<FileMetadata[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result.map((cached: CachedFile) => ({
          id: cached.id,
          name: cached.name,
          size: cached.size,
          type: cached.type,
          uploadedAt: cached.uploadedAt,
          lastAccessed: cached.lastAccessed
        }));
        resolve(files);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Remove file from cache
  async removeFile(fileId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(fileId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clean up old files (older than 7 days and not accessed in 24 hours)
  async cleanupOldFiles(): Promise<number> {
    if (!this.db) await this.init();

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    const accessCutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result as CachedFile[];
        let cleaned = 0;

        files.forEach((file) => {
          if (file.uploadedAt < cutoffTime && file.lastAccessed < accessCutoff) {
            store.delete(file.id);
            cleaned++;
          }
        });

        resolve(cleaned);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get total cache size
  async getCacheSize(): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result as CachedFile[];
        const totalSize = files.reduce((size, file) => size + file.size, 0);
        resolve(totalSize);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Create URL for cached file (for preview purposes)
  async createFileURL(fileId: string): Promise<string | null> {
    const file = await this.getFile(fileId);
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }

  // Check if file exists in cache
  async hasFile(fileId: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(fileId);
    return metadata !== null;
  }
}

// Export singleton instance
export const fileCache = new FileCacheService();

// Initialize on first import (client-side only)
if (typeof window !== 'undefined') {
  fileCache.init().catch(console.error)
  
  // Auto cleanup on app start
  setTimeout(() => {
    fileCache.cleanupOldFiles().then(cleaned => {
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} old cached files`)
      }
    }).catch(() => {
      // Ignore cleanup errors during initialization
    })
  }, 1000)
}

export default fileCache;
