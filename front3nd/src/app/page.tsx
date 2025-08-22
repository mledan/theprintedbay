'use client'

import { useEffect, useState, useCallback } from 'react'
import { appInsights } from '../lib/appInsights'
import { fileCache } from '../lib/fileCache'
import { apiService } from '../lib/apiService'
import { checkBrowserEnvironmentVariables } from '../lib/envCheck'
import { environmentService } from '../lib/environmentService'
import SimpleFileUpload from '../components/SimpleFileUpload'
import ThreeViewer from '../components/ThreeViewer'
import PricingPanel from '../components/PricingPanel'
import OrderManager from '../components/OrderManager'
import LiveSequenceDiagram from '../components/LiveSequenceDiagram'
import styles from './page.module.css'

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)
  const [modelData, setModelData] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMaterial, setSelectedMaterial] = useState('standard-resin')
  const [selectedColor, setSelectedColor] = useState('white')
  const [selectedQuality, setSelectedQuality] = useState('standard')
  const [pricingData, setPricingData] = useState<any>(null)
  const [isUploadingInBackground, setIsUploadingInBackground] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true)
    
    // Check environment variables in browser
    checkBrowserEnvironmentVariables()
    
    // Track page view with Application Insights
    appInsights.trackPageView('Home - 3D Printing Service', {
      version: '1.0.0',
      feature: '3d-printing-service'
    })
    
    // Track funnel entry
    appInsights.trackFunnelStep('PrintingOrder', 'LandingPage', 1)
    
    // Set global properties
    appInsights.setGlobalProperty('service', 'ThePrintedBay')
    appInsights.setGlobalProperty('version', '1.0.0')
  }, [])

  // New handler for immediate file drop - starts viewer right away
  const handleFileDropped = async (file: File) => {
    const startTime = Date.now()
    
    try {
      // Immediately cache the file and start viewer
      const cachedFileId = await fileCache.storeFile(file)
      
      setUploadedFile(file)
      setFileId(cachedFileId)
      setCurrentStep(2)
      setIsUploadingInBackground(true)
      
      // Track immediate file drop
      appInsights.trackEvent('FileDroppedImmediate', {
        fileName: file.name,
        fileSize: file.size.toString(),
        interactionType: 'immediate_drop'
      })
      
      // Scroll to viewer after a short delay to allow DOM update
      setTimeout(() => {
        const previewSection = document.getElementById('model-preview-section')
        if (previewSection) {
          // Add a subtle scroll indicator
          const scrollIndicator = document.createElement('div')
          scrollIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(102, 126, 234, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
          `
          scrollIndicator.textContent = '📍 Scrolling to 3D viewer...'
          document.body.appendChild(scrollIndicator)
          
          // Show indicator
          setTimeout(() => scrollIndicator.style.opacity = '1', 10)
          
          // Scroll to viewer
          previewSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
          
          // Remove indicator after scroll
          setTimeout(() => {
            scrollIndicator.style.opacity = '0'
            setTimeout(() => document.body.removeChild(scrollIndicator), 300)
          }, 2000)
        }
      }, 400) // Increased delay for even smoother experience
      
      // Start background upload process
      handleBackgroundUpload(file, cachedFileId)
      
    } catch (error) {
      console.error('Failed to handle file drop:', error)
      appInsights.trackError(error instanceof Error ? error : new Error('File drop failed'), {
        operation: 'immediateFileDrop',
        fileName: file.name
      })
    }
  }
  
  // Background upload handler
  const handleBackgroundUpload = async (file: File, cachedFileId: string) => {
    try {
      // This runs in background while user sees the viewer
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
      const uploadResult = await apiService.uploadFile(file)
      
      // Upload completed in background
      appInsights.trackEvent('BackgroundUploadComplete', {
        fileName: file.name,
        fileId: cachedFileId,
        uploadSuccess: 'true'
      })
      
    } catch (backendError) {
      // Backend failed, but that's OK - we have the file cached
      console.log('Background upload failed, using cached file:', backendError)
      appInsights.trackEvent('BackgroundUploadFailed', {
        fileName: file.name,
        fileId: cachedFileId,
        fallbackToCached: 'true'
      })
    } finally {
      setIsUploadingInBackground(false)
    }
  }
  
  const handleFileUpload = (file: File, cachedFileId: string) => {
    const startTime = Date.now()
    
    try {
      setUploadedFile(file)
      setFileId(cachedFileId)
      setCurrentStep(2)
      
      const duration = Date.now() - startTime
      
      // Track successful file upload with cache info
      appInsights.trackFileUpload(
        file.name,
        file.size,
        file.type || file.name.split('.').pop() || 'unknown',
        true,
        duration
      )
      
      // Track additional cache info
      appInsights.trackEvent('FileCached', {
        fileName: file.name,
        fileId: cachedFileId,
        cached: 'true'
      })
      
      // Track user flow progression
      appInsights.trackUserFlow('FileUploaded', 'PrintingOrderFlow', 2, {
        fileName: file.name,
        fileSize: file.size.toString(),
        cached: 'true',
        fileId: cachedFileId
      })
      
      // Track funnel progression
      appInsights.trackFunnelStep('PrintingOrder', 'FileUploaded', 2)
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Track failed upload
      appInsights.trackFileUpload(
        file.name,
        file.size,
        file.type || 'unknown',
        false,
        duration,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      appInsights.trackError(error instanceof Error ? error : new Error('File upload failed'), {
        operation: 'fileUpload',
        fileName: file.name
      })
    }
  }

  const handleModelAnalysis = useCallback((analysis: any) => {
    setModelData(analysis)
    setCurrentStep(3)
    
    // Track model analysis completion
    appInsights.trackModelAnalysis({
      vertices: analysis.vertices || 0,
      faces: analysis.faces || 0,
      volume: analysis.volume,
      dimensions: analysis.dimensions,
      analysisTimeMs: analysis.analysisTime || 0
    })
    
    // Track user flow
    appInsights.trackUserFlow('ModelAnalyzed', 'PrintingOrderFlow', 3, {
      modelComplexity: analysis.faces > 100000 ? 'high' : analysis.faces > 10000 ? 'medium' : 'low'
    })
    
    // Track funnel progression  
    appInsights.trackFunnelStep('PrintingOrder', 'ModelAnalyzed', 3)
  }, [])

  const handleQuoteGenerated = (quote: any) => {
    setPricingData(quote)
    setCurrentStep(4)
    
    // Track quote generation
    appInsights.trackUserFlow('QuoteGenerated', 'PrintingOrderFlow', 4, {
      totalPrice: quote.total.toString(),
      material: selectedMaterial,
      color: selectedColor
    })
    appInsights.trackFunnelStep('PrintingOrder', 'QuoteGenerated', 4)
    
    // Track conversion event
    appInsights.trackEvent('ConversionIntent', {
      stage: 'quote_generated',
      hasModel: (!!uploadedFile).toString(),
      modelAnalyzed: (!!modelData).toString(),
      totalPrice: quote.total
    })
  }
  
  const handleOrderComplete = (orderData: any) => {
    setCurrentStep(5)
    
    // Track order completion
    appInsights.trackPurchase({
      transactionId: orderData.id || 'unknown',
      orderId: orderData.orderNumber,
      totalValue: orderData.pricing.total,
      currency: 'USD',
      items: [{
        name: uploadedFile?.name || 'unknown',
        category: '3d_print',
        price: orderData.pricing.total,
        quantity: 1
      }]
    })
    
    appInsights.trackUserFlow('OrderCompleted', 'PrintingOrderFlow', 5)
    appInsights.trackFunnelStep('PrintingOrder', 'OrderCompleted', 5)
  }

  // Handle configuration changes from PricingPanel to update 3D viewer
  const handleConfigurationChange = (config: { material: string; color: string; quality: string }) => {
    setSelectedMaterial(config.material)
    setSelectedColor(config.color)
    setSelectedQuality(config.quality)
    
    // Track live configuration changes
    appInsights.trackEvent('LiveConfigurationChange', {
      material: config.material,
      color: config.color,
      quality: config.quality,
      hasModel: (!!uploadedFile).toString()
    })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🖨️ The Printed Bay</h1>
        <p className={styles.subtitle}>
          Professional 3D printing service with instant quotes and comprehensive monitoring
        </p>
      </header>

      <main className={styles.main}>
        {/* Step 1: File Upload */}
        <section className={styles.section}>
          <div className={styles.stepHeader}>
            <span className={`${styles.stepNumber} ${currentStep >= 1 ? styles.active : ''}`}>1</span>
            <h2>Upload Your 3D Model</h2>
          </div>
          
          <SimpleFileUpload
            onFileSelect={(file) => {
              console.log('File selected in page:', file.name)
              // Just call the existing handler for now
              handleFileDropped(file)
            }}
            acceptedFormats={['.stl', '.obj', '.ply', '.3mf', '.gltf', '.glb']}
          />
        </section>

        {/* Step 2: 3D Model Viewer */}
        {uploadedFile && fileId && (
          <section id="model-preview-section" className={styles.section}>
            <div className={styles.stepHeader}>
              <span className={`${styles.stepNumber} ${currentStep >= 2 ? styles.active : ''}`}>2</span>
              <div style={{ flex: 1 }}>
                <h2>Preview & Analyze</h2>
                {isUploadingInBackground && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    color: '#667eea',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #667eea',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Uploading in background...</span>
                  </div>
                )}
              </div>
            </div>
            
            <ThreeViewer 
              fileId={fileId}
              fileName={uploadedFile.name}
              material={selectedMaterial}
              color={selectedColor}
              onAnalysisComplete={handleModelAnalysis}
            />
          </section>
        )}

        {/* Step 3: Pricing & Quote */}
        {modelData && (
          <section className={styles.section}>
            <div className={styles.stepHeader}>
              <span className={`${styles.stepNumber} ${currentStep >= 3 ? styles.active : ''}`}>3</span>
              <h2>Get Your Quote</h2>
            </div>
            
            <PricingPanel 
              modelData={modelData}
              onQuoteGenerated={handleQuoteGenerated}
              onConfigurationChanged={handleConfigurationChange}
            />
          </section>
        )}
        
        {/* Step 4: Order & Payment */}
        {pricingData && currentStep >= 4 && (
          <section className={styles.section}>
            <div className={styles.stepHeader}>
              <span className={`${styles.stepNumber} ${currentStep >= 4 ? styles.active : ''}`}>4</span>
              <h2>Complete Your Order</h2>
            </div>
            
            <OrderManager 
              pricing={pricingData}
              material={pricingData.material || selectedMaterial}
              quality={pricingData.quality || 'standard'}
              color={pricingData.color || selectedColor}
              fileName={uploadedFile?.name || 'model'}
              onOrderComplete={handleOrderComplete}
            />
          </section>
        )}
        
        {/* Monitoring Dashboard (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <section className={styles.devSection}>
            <h3>📊 Development Monitoring</h3>
            <div className={styles.monitoringGrid}>
              <div className={styles.metricCard}>
                <h4>Current Step</h4>
                <p>{currentStep}/5</p>
              </div>
              <div className={styles.metricCard}>
                <h4>File Uploaded</h4>
                <p>{uploadedFile ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div className={styles.metricCard}>
                <h4>Model Analyzed</h4>
                <p>{modelData ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div className={styles.metricCard}>
                <h4>File Cache</h4>
                <p>{fileId ? '💾 Cached' : '❌ None'}</p>
              </div>
              <div className={styles.metricCard}>
                <h4>Quote Ready</h4>
                <p>{pricingData ? '💰 Yes' : '❌ No'}</p>
              </div>
              <div className={styles.metricCard}>
                <h4>Analytics</h4>
                <p>{environmentService.isFeatureAvailable('analytics') ? '✅ Active' : '❌ Missing'}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <h4>🔧 Service Configuration</h4>
              <div className={styles.serviceGrid}>
              <div className={styles.serviceCard}>
                <h5>🔌 API</h5>
                <p>{isClient ? (environmentService.isFeatureAvailable('api') ? '✅ Azure Functions Ready' : '❌ Not Configured') : '⏳ Loading...'}</p>
              </div>
              <div className={styles.serviceCard}>
                <h5>💳 Payments</h5>
                <p>{isClient ? (environmentService.isFeatureAvailable('payments') ? '✅ Stripe Ready' : '❌ Not Configured') : '⏳ Loading...'}</p>
              </div>
              <div className={styles.serviceCard}>
                <h5>📧 Email</h5>
                <p>{isClient ? (environmentService.isFeatureAvailable('email') ? '✅ SendGrid Ready' : '❌ Not Configured') : '⏳ Loading...'}</p>
              </div>
              <div className={styles.serviceCard}>
                <h5>📦 Shipping</h5>
                <p>{isClient ? (environmentService.isFeatureAvailable('shipping') ? '✅ Shippo Ready' : '❌ Not Configured') : '⏳ Loading...'}</p>
              </div>
              <div className={styles.serviceCard}>
                <h5>☁️ Storage</h5>
                <p>{isClient ? (environmentService.isFeatureAvailable('storage') ? '✅ Azure Ready' : '❌ Not Configured') : '⏳ Loading...'}</p>
              </div>
              </div>
            </div>
            
            {/* Live Sequence Diagram - Real-time journey validation */}
            <LiveSequenceDiagram 
              currentStep={currentStep}
              uploadedFile={uploadedFile}
              modelData={modelData}
              pricingData={pricingData}
              isUploadingInBackground={isUploadingInBackground}
            />
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Powered by Application Insights monitoring • Real-time analytics • Professional 3D printing</p>
      </footer>
    </div>
  )
}
