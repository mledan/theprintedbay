'use client'

import { useEffect, useState } from 'react'
import { appInsights } from '../lib/appInsights'
import { apiService } from '../lib/apiService'

interface ModelViewerProps {
  file: File
  onAnalysisComplete: (analysis: any) => void
}

const ModelViewer: React.FC<ModelViewerProps> = ({ file, onAnalysisComplete }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('Initializing...')
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Track model viewer initialization
    appInsights.trackEvent('ModelViewerInitialized', {
      fileName: file.name,
      fileSize: file.size.toString(),
      apiMode: 'real_with_fallback'
    })

    // Analyze model using API service
    const analyzeModel = async () => {
      const startTime = Date.now()
      
      try {
        setIsLoading(true)
        setError(null)
        setProgress(10)
        setProgressText('Uploading file...')
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 90) {
              const increment = Math.random() * 15 + 5 // 5-20% increments
              const newProgress = Math.min(prev + increment, 90)
              
              if (newProgress < 30) setProgressText('Analyzing geometry...')
              else if (newProgress < 60) setProgressText('Calculating dimensions...')
              else if (newProgress < 80) setProgressText('Checking printability...')
              else setProgressText('Finalizing analysis...')
              
              return newProgress
            }
            return prev
          })
        }, 200)
        
        // Use API service for analysis (tries real API first, falls back to simulation)
        const analysisResult = await apiService.analyzeModel({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop() || 'unknown',
          analysisLevel: 'detailed'
        })
        
        clearInterval(progressInterval)
        setProgress(100)
        setProgressText('Analysis complete!')
        
        // Small delay to show completion
        setTimeout(() => {
          setAnalysis(analysisResult)
          onAnalysisComplete(analysisResult)
          setIsLoading(false)
        }, 500)
        
        // Track successful analysis
        appInsights.trackModelAnalysis({
          vertices: analysisResult.vertices,
          faces: analysisResult.faces,
          volume: analysisResult.volume,
          dimensions: analysisResult.dimensions,
          analysisTimeMs: Date.now() - startTime
        })
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Model analysis failed'
        setError(errorMessage)
        setIsLoading(false)
        
        appInsights.trackError(error instanceof Error ? error : new Error(errorMessage), {
          operation: 'modelAnalysis',
          fileName: file.name,
          apiMode: 'real_with_fallback'
        })
      }
    }

    analyzeModel()
  }, [file, onAnalysisComplete])

  if (isLoading) {
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center', 
        background: '#f7fafc', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid #e2e8f0',
          borderTop: '6px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <h3 style={{ color: '#667eea', margin: 0 }}>🔍 Analyzing 3D Model...</h3>
        <p style={{ color: '#718096', margin: '0.5rem 0 1rem 0' }}>
          {progressText}
        </p>
        
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden',
          margin: '0 auto'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        <p style={{ color: '#718096', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
          {Math.round(progress)}% complete
        </p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'white', 
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        height: '400px', 
        background: '#2a2a2a',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: '600',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Halot Mage 8K Print Bed Visualization */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          width: '320px', // Scaled representation (230mm actual)
          height: '180px', // Scaled representation (130mm actual)
          background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
          border: '2px solid #667eea',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Grid pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(102, 126, 234, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(102, 126, 234, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* Sample model placeholder */}
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            zIndex: 1,
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }}>
            🎯
          </div>
        </div>
        
        {/* Info overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '0.9rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Halot Mage 8K</div>
          <div style={{ opacity: 0.9 }}>230×130×200mm build volume</div>
        </div>
        
        {/* Center text */}
        <div style={{
          textAlign: 'center',
          marginBottom: '100px'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🖨️ Resin Printer Preview</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            (Interactive 3D viewer will be implemented here)
          </div>
        </div>
      </div>
      
      {analysis && (
        <div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>📊 Model Analysis</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', color: '#667eea' }}>Vertices</div>
              <div style={{ fontSize: '1.2rem', color: '#2d3748' }}>{analysis.vertices.toLocaleString()}</div>
            </div>
            <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', color: '#667eea' }}>Faces</div>
              <div style={{ fontSize: '1.2rem', color: '#2d3748' }}>{analysis.faces.toLocaleString()}</div>
            </div>
            <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', color: '#667eea' }}>Volume</div>
              <div style={{ fontSize: '1.2rem', color: '#2d3748' }}>{analysis.volume.toFixed(2)} cm³</div>
            </div>
          </div>
          
          <div>
            <h4 style={{ margin: '1rem 0 0.5rem 0', color: '#2d3748' }}>📏 Dimensions (mm)</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span><strong>Width:</strong> {analysis.dimensions.x.toFixed(1)}mm</span>
              <span><strong>Height:</strong> {analysis.dimensions.y.toFixed(1)}mm</span>
              <span><strong>Depth:</strong> {analysis.dimensions.z.toFixed(1)}mm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelViewer
