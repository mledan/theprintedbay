'use client'

import { useRef, useState } from 'react'

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => void
  acceptedFormats: string[]
}

export default function SimpleFileUpload({ onFileSelect, acceptedFormats }: SimpleFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const handleClick = () => {
    console.log('Upload area clicked')
    if (fileInputRef.current) {
      console.log('Triggering file input click')
      fileInputRef.current.click()
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name)
      onFileSelect(file)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      console.log('File dropped:', file.name)
      onFileSelect(file)
    }
  }
  
  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      {/* Visible file input that covers the entire area */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileChange}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          zIndex: 2
        }}
      />
      
      {/* Visual upload area */}
      <div
        style={{
          border: isDragging ? '3px solid #0070f3' : '3px dashed #ccc',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ fontSize: '3rem' }}>📁</div>
        <h3 style={{ margin: '0', color: '#333' }}>Drop your 3D model here</h3>
        <p style={{ margin: '0', color: '#666' }}>or click to browse files</p>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#888' }}>
          Supported: {acceptedFormats.join(', ')}
        </p>
      </div>
    </div>
  )
}
