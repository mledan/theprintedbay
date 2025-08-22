'use client'

import { useState, useEffect } from 'react'
import { appInsights } from '../lib/appInsights'
import { apiService } from '../lib/apiService'

interface PricingPanelProps {
  modelData: any
  onQuoteGenerated: (pricingData: any) => void
  onConfigurationChanged?: (config: { material: string; color: string; quality: string }) => void
}

const PricingPanel: React.FC<PricingPanelProps> = ({ modelData, onQuoteGenerated, onConfigurationChanged }) => {
  const [material, setMaterial] = useState('standard-resin')
  const [quality, setQuality] = useState('standard')
  const [color, setColor] = useState('white')
  const [pricing, setPricing] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const materials = [
    { id: 'standard-resin', name: 'Standard Resin', price: 0.030 },
    { id: 'water-washable-resin', name: 'Water-Washable Resin', price: 0.035 },
    { id: 'plant-based-resin', name: 'Plant-Based/Eco Resin', price: 0.033 },
    { id: 'high-resolution-resin', name: 'High-Resolution/8K Resin', price: 0.040 },
    { id: 'flexible-resin', name: 'Flexible Resin', price: 0.048 },
    { id: 'abs-like-resin', name: 'ABS-Like/Tough Resin', price: 0.038 },
    { id: 'high-temperature-resin', name: 'High-Temperature Resin', price: 0.043 },
    { id: 'castable-resin', name: 'Castable Resin', price: 0.083 },
    { id: 'specialty-resin', name: 'Specialty Resins', price: 0.070 }
  ]

  const qualities = [
    { id: 'draft', name: 'Draft (0.10mm)', multiplier: 0.8 },
    { id: 'standard', name: 'Standard (0.05mm)', multiplier: 1.0 },
    { id: 'high', name: 'High (0.03mm)', multiplier: 1.3 },
    { id: 'ultra', name: 'Ultra (0.025mm)', multiplier: 1.6 }
  ]

  const colors = [
    { id: 'white', name: 'White', hex: '#ffffff' },
    { id: 'black', name: 'Black', hex: '#1a202c' },
    { id: 'gray', name: 'Gray', hex: '#718096' },
    { id: 'clear', name: 'Clear', hex: '#f7fafc' },
    { id: 'red', name: 'Red', hex: '#e53e3e' },
    { id: 'blue', name: 'Blue', hex: '#3182ce' },
    { id: 'green', name: 'Green', hex: '#38a169' },
    { id: 'yellow', name: 'Yellow', hex: '#ecc94b' },
    { id: 'orange', name: 'Orange', hex: '#dd6b20' },
    { id: 'purple', name: 'Purple', hex: '#805ad5' },
    { id: 'gold-glitter', name: 'Gold Glitter', hex: '#ffd700' },
    { id: 'silver-glitter', name: 'Silver Glitter', hex: '#c0c0c0' }
  ]

  useEffect(() => {
    // Only calculate pricing when model data changes (initial load)
    if (modelData && !pricing) {
      calculatePricing()
    }
  }, [modelData]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Separate effect for material/quality/color changes with debouncing
  useEffect(() => {
    if (!modelData) return
    
    const timeoutId = setTimeout(() => {
      calculatePricing()
    }, 500) // Increased debounce for more stability
    
    return () => clearTimeout(timeoutId)
  }, [material, quality, color]) // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of configuration changes immediately (for live preview)
  useEffect(() => {
    if (onConfigurationChanged) {
      onConfigurationChanged({ material, color, quality })
    }
  }, [material, color, quality, onConfigurationChanged])

  const calculatePricing = async () => {
    const startTime = Date.now()
    setIsCalculating(true)

    try {
      const selectedMaterial = materials.find(m => m.id === material)
      const selectedQuality = qualities.find(q => q.id === quality)
      
      if (!selectedMaterial || !selectedQuality) return

      const volume = modelData.volume || 10
      
      // Use new backend API service for pricing calculation
      const pricingResult = await apiService.calculatePricing({
        modelAnalysisId: modelData.id || `temp_${Date.now()}`,
        material: selectedMaterial.id,
        quality: selectedQuality.id,
        color: color,
        deliveryOption: 'standard'
      })

      const calculationTime = Date.now() - startTime

      const pricingData = {
        materialCost: pricingResult.breakdown.materialCost,
        laborCost: pricingResult.breakdown.laborCost,
        serviceFee: pricingResult.breakdown.serviceFee,
        tax: pricingResult.breakdown.tax,
        subtotal: pricingResult.breakdown.subtotal,
        total: pricingResult.breakdown.total,
        estimatedDays: pricingResult.delivery.estimatedDays
      }

      setPricing(pricingData)

      // Track pricing calculation
      appInsights.trackPricingCalculation({
        material,
        color,
        quality,
        volume,
        totalPrice: pricingResult.breakdown.total,
        calculationTimeMs: calculationTime,
        apiMode: 'real_with_fallback'
      })

    } catch (error) {
      appInsights.trackError(error instanceof Error ? error : new Error('Pricing calculation failed'), {
        operation: 'pricingCalculation',
        material,
        quality,
        volume: modelData.volume?.toString() || '0',
        apiMode: 'real_with_fallback'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleGetQuote = () => {
    if (!pricing) return

    // Track quote generation
    appInsights.trackQuoteGeneration({
      totalPrice: pricing.total,
      material,
      estimatedDays: pricing.estimatedDays,
      success: true
    })

    // Create comprehensive quote data
    const quoteData = {
      ...pricing,
      material,
      quality,
      color,
      modelData,
      timestamp: new Date().toISOString()
    }

    onQuoteGenerated(quoteData)
    
    // Track conversion
    appInsights.trackEvent('QuoteGenerated', {
      material,
      quality,
      color,
      totalPrice: pricing.total.toFixed(2),
      estimatedDays: pricing.estimatedDays.toString()
    })
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '2rem'
    }}>
      {/* Configuration Panel */}
      <div style={{ 
        padding: '1.5rem', 
        background: '#f7fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>⚙️ Print Configuration</h3>
        
        {/* Material Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Material
          </label>
          <select 
            value={material} 
            onChange={(e) => {
              setMaterial(e.target.value)
              appInsights.trackEvent('MaterialChanged', { 
                newMaterial: e.target.value,
                previousMaterial: material 
              })
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e0',
              background: 'white',
              fontSize: '1rem',
              fontWeight: '500',
              color: '#2d3748'
            }}
          >
            {materials.map(mat => (
              <option key={mat.id} value={mat.id}>
                {mat.name} - ${mat.price.toFixed(3)}/g
              </option>
            ))}
          </select>
        </div>

        {/* Quality Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Print Quality
          </label>
          <select 
            value={quality} 
            onChange={(e) => {
              setQuality(e.target.value)
              appInsights.trackEvent('QualityChanged', { 
                newQuality: e.target.value,
                previousQuality: quality 
              })
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e0',
              background: 'white',
              fontSize: '1rem',
              fontWeight: '500',
              color: '#2d3748'
            }}
          >
            {qualities.map(qual => (
              <option key={qual.id} value={qual.id}>
                {qual.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Color
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {colors.map(clr => (
              <button
                key={clr.id}
                onClick={() => {
                  setColor(clr.id)
                  appInsights.trackEvent('ColorChanged', { 
                    newColor: clr.id,
                    previousColor: color 
                  })
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: color === clr.id ? '3px solid #667eea' : '2px solid #e2e8f0',
                  background: color === clr.id ? '#edf2f7' : 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#2d3748',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: clr.hex,
                  border: clr.id === 'white' || clr.id === 'clear' ? '1px solid #cbd5e0' : 'none',
                  background: clr.id.includes('glitter') 
                    ? `linear-gradient(45deg, ${clr.hex} 0%, ${clr.hex}cc 25%, ${clr.hex} 50%, ${clr.hex}cc 75%, ${clr.hex} 100%)` 
                    : clr.hex
                }}></div>
                {clr.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Panel */}
      <div style={{ 
        padding: '1.5rem', 
        background: 'white', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>💰 Price Quote</h3>
        
        {isCalculating ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#667eea' }}>Calculating price...</p>
          </div>
        ) : pricing ? (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Material cost:</span>
                <span>${pricing.materialCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Labor & setup:</span>
                <span>${pricing.laborCost.toFixed(2)}</span>
              </div>
              {pricing.supportCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>🏗️ Support structures:</span>
                  <span>${pricing.supportCost.toFixed(2)}</span>
                </div>
              )}
              {pricing.colorPremium > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>🎨 Color premium:</span>
                  <span>${pricing.colorPremium.toFixed(2)}</span>
                </div>
              )}
              {pricing.postProcessingCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>✨ Post-processing:</span>
                  <span>${pricing.postProcessingCost.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Service fee:</span>
                <span>${pricing.serviceFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Tax (8.75%):</span>
                <span>${pricing.tax.toFixed(2)}</span>
              </div>
              <hr style={{ margin: '1rem 0', border: '1px solid #e2e8f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Total:</span>
                <span style={{ color: '#667eea' }}>${pricing.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fff4', borderRadius: '6px', border: '1px solid #9ae6b4' }}>
              <div style={{ fontWeight: 'bold', color: '#38a169', marginBottom: '0.25rem' }}>
                ⏰ Estimated Delivery
              </div>
              <div style={{ color: '#2f855a' }}>
                {pricing.estimatedDays} business days
              </div>
            </div>
            
            <button
              onClick={handleGetQuote}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
            >
              🚀 Get This Quote - ${pricing.total.toFixed(2)}
            </button>
          </div>
        ) : (
          <p style={{ color: '#718096' }}>Select configuration to see pricing</p>
        )}
      </div>
    </div>
  )
}

export default PricingPanel
