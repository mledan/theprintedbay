'use client'

import { useEffect, useState, useCallback } from 'react'
import { appInsights } from '../lib/appInsights'

interface SequenceStep {
  id: string
  phase: string
  step: number
  from: string
  to: string
  action: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  timestamp?: Date
  duration?: number
  details?: string
}

interface LiveSequenceDiagramProps {
  currentStep: number
  uploadedFile?: File | null
  modelData?: any
  pricingData?: any
  isUploadingInBackground?: boolean
}

const LiveSequenceDiagram: React.FC<LiveSequenceDiagramProps> = ({
  currentStep,
  uploadedFile,
  modelData,
  pricingData,
  isUploadingInBackground
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [failedSteps, setFailedSteps] = useState<Set<string>>(new Set())

  // Define all sequence steps from the diagram
  const sequenceSteps: SequenceStep[] = [
    // PHASE 1: FILE UPLOAD & ANALYSIS
    { id: 'step1', phase: 'UPLOAD', step: 1, from: 'Customer', to: 'Frontend', action: 'Upload 3D model file', status: 'pending' },
    { id: 'step2', phase: 'UPLOAD', step: 2, from: 'Frontend', to: 'File Cache', action: 'Cache file locally', status: 'pending' },
    { id: 'step3', phase: 'UPLOAD', step: 3, from: 'Frontend', to: 'App Insights', action: 'Track upload event', status: 'pending' },
    { id: 'step4', phase: 'UPLOAD', step: 4, from: 'Frontend', to: 'Frontend', action: 'Show 3D preview', status: 'pending' },
    { id: 'step5', phase: 'UPLOAD', step: 5, from: 'Frontend', to: 'Backend API', action: 'Upload to backend (background)', status: 'pending' },
    { id: 'step6', phase: 'UPLOAD', step: 6, from: 'Backend API', to: 'Azure Storage', action: 'Store in Azure Blob', status: 'pending' },
    { id: 'step7', phase: 'UPLOAD', step: 7, from: 'Backend API', to: 'Backend API', action: 'Analyze model geometry', status: 'pending' },
    { id: 'step8', phase: 'UPLOAD', step: 8, from: 'Backend API', to: 'Frontend', action: 'Return analysis results', status: 'pending' },
    { id: 'step9', phase: 'UPLOAD', step: 9, from: 'Frontend', to: 'Customer', action: 'Display model preview & analysis', status: 'pending' },
    
    // PHASE 2: PRICING & QUOTATION
    { id: 'step10', phase: 'PRICING', step: 10, from: 'Customer', to: 'Frontend', action: 'Select material/quality/color', status: 'pending' },
    { id: 'step11', phase: 'PRICING', step: 11, from: 'Frontend', to: 'Backend API', action: 'Request pricing calculation', status: 'pending' },
    { id: 'step12', phase: 'PRICING', step: 12, from: 'Backend API', to: 'Inventory', action: 'Check material availability', status: 'pending' },
    { id: 'step13', phase: 'PRICING', step: 13, from: 'Inventory', to: 'Backend API', action: 'Return stock levels & pricing', status: 'pending' },
    { id: 'step14', phase: 'PRICING', step: 14, from: 'Backend API', to: 'Backend API', action: 'Calculate: material + labor + overhead', status: 'pending' },
    { id: 'step15', phase: 'PRICING', step: 15, from: 'Backend API', to: 'Frontend', action: 'Return detailed quote', status: 'pending' },
    { id: 'step16', phase: 'PRICING', step: 16, from: 'Frontend', to: 'App Insights', action: 'Track quote generation', status: 'pending' },
    { id: 'step17', phase: 'PRICING', step: 17, from: 'Frontend', to: 'Customer', action: 'Display pricing breakdown', status: 'pending' },
    
    // PHASE 3: ORDER CREATION
    { id: 'step18', phase: 'ORDER', step: 18, from: 'Customer', to: 'Frontend', action: 'Fill customer details', status: 'pending' },
    { id: 'step19', phase: 'ORDER', step: 19, from: 'Customer', to: 'Frontend', action: 'Select shipping option', status: 'pending' },
    { id: 'step20', phase: 'ORDER', step: 20, from: 'Frontend', to: 'Backend API', action: 'Create order record', status: 'pending' },
    { id: 'step21', phase: 'ORDER', step: 21, from: 'Backend API', to: 'Azure Storage', action: 'Store order data', status: 'pending' },
    { id: 'step22', phase: 'ORDER', step: 22, from: 'Backend API', to: 'Backend API', action: 'Generate order number', status: 'pending' },
    { id: 'step23', phase: 'ORDER', step: 23, from: 'Backend API', to: 'Frontend', action: 'Return order ID', status: 'pending' },
    { id: 'step24', phase: 'ORDER', step: 24, from: 'Frontend', to: 'Customer', action: 'Show order confirmation', status: 'pending' },
    
    // PHASE 4: PAYMENT PROCESSING
    { id: 'step25', phase: 'PAYMENT', step: 25, from: 'Customer', to: 'Frontend', action: 'Enter payment details', status: 'pending' },
    { id: 'step26', phase: 'PAYMENT', step: 26, from: 'Frontend', to: 'Stripe', action: 'Create payment intent', status: 'pending' },
    { id: 'step27', phase: 'PAYMENT', step: 27, from: 'Stripe', to: 'Frontend', action: 'Return client secret', status: 'pending' },
    { id: 'step28', phase: 'PAYMENT', step: 28, from: 'Customer', to: 'Frontend', action: 'Confirm payment', status: 'pending' },
    { id: 'step29', phase: 'PAYMENT', step: 29, from: 'Frontend', to: 'Stripe', action: 'Process payment', status: 'pending' },
    { id: 'step30', phase: 'PAYMENT', step: 30, from: 'Stripe', to: 'Backend API', action: 'Webhook: payment successful', status: 'pending' },
  ]

  // Update step statuses based on current app state
  useEffect(() => {
    const newCompletedSteps = new Set<string>()
    const newFailedSteps = new Set<string>()
    let currentActiveStep: string | null = null

    // PHASE 1: File Upload & Analysis
    if (uploadedFile) {
      newCompletedSteps.add('step1') // Upload file
      newCompletedSteps.add('step2') // Cache locally
      newCompletedSteps.add('step3') // Track event
      newCompletedSteps.add('step4') // Show preview
      
      if (isUploadingInBackground) {
        currentActiveStep = 'step5' // Background upload active
      } else {
        newCompletedSteps.add('step5') // Background upload done
        newCompletedSteps.add('step6') // Azure storage
      }
    }

    if (modelData) {
      newCompletedSteps.add('step7') // Model analysis
      newCompletedSteps.add('step8') // Return analysis
      newCompletedSteps.add('step9') // Display to customer
    }

    // PHASE 2: Pricing & Quotation  
    if (currentStep >= 3) {
      newCompletedSteps.add('step10') // Select materials
      if (!pricingData) {
        currentActiveStep = 'step11' // Pricing calculation active
      }
    }

    if (pricingData) {
      newCompletedSteps.add('step11') // Request pricing
      newCompletedSteps.add('step12') // Check inventory
      newCompletedSteps.add('step13') // Stock levels
      newCompletedSteps.add('step14') // Calculate pricing
      newCompletedSteps.add('step15') // Return quote
      newCompletedSteps.add('step16') // Track quote
      newCompletedSteps.add('step17') // Display pricing
    }

    // PHASE 3: Order Creation
    if (currentStep >= 4) {
      currentActiveStep = currentActiveStep || 'step18' // Customer details active
    }

    // PHASE 4: Payment Processing
    if (currentStep >= 5) {
      newCompletedSteps.add('step18') // Customer details
      newCompletedSteps.add('step19') // Shipping option
      newCompletedSteps.add('step20') // Create order
      newCompletedSteps.add('step21') // Store order
      newCompletedSteps.add('step22') // Generate order number
      newCompletedSteps.add('step23') // Return order ID
      newCompletedSteps.add('step24') // Show confirmation
    }

    setCompletedSteps(newCompletedSteps)
    setFailedSteps(newFailedSteps)
    setActiveStep(currentActiveStep)
  }, [currentStep, uploadedFile, modelData, pricingData, isUploadingInBackground])

  // Get phase color
  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'UPLOAD': return '#667eea'
      case 'PRICING': return '#f093fb'
      case 'ORDER': return '#4facfe'
      case 'PAYMENT': return '#43e97b'
      default: return '#718096'
    }
  }

  // Get step status color
  const getStatusColor = (stepId: string): string => {
    if (failedSteps.has(stepId)) return '#e53e3e'
    if (completedSteps.has(stepId)) return '#48bb78'
    if (activeStep === stepId) return '#f093fb'
    return '#cbd5e0'
  }

  // Get step icon
  const getStepIcon = (stepId: string): string => {
    if (failedSteps.has(stepId)) return '❌'
    if (completedSteps.has(stepId)) return '✅'
    if (activeStep === stepId) return '⏳'
    return '⏸️'
  }

  const phaseSteps = {
    'UPLOAD': sequenceSteps.filter(s => s.phase === 'UPLOAD'),
    'PRICING': sequenceSteps.filter(s => s.phase === 'PRICING'),
    'ORDER': sequenceSteps.filter(s => s.phase === 'ORDER'),
    'PAYMENT': sequenceSteps.filter(s => s.phase === 'PAYMENT')
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      border: '1px solid #e2e8f0', 
      padding: '1.5rem',
      marginTop: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📊</span>
        <h3 style={{ margin: 0, color: '#2d3748' }}>Live Sequence Diagram</h3>
        <div style={{ 
          padding: '0.25rem 0.75rem', 
          background: '#f0fff4', 
          borderRadius: '12px', 
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: '#38a169'
        }}>
          REAL-TIME VALIDATION
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1rem' }}>
        Watch your user journey progress through the system in real-time. Each step lights up as you complete it!
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {Object.entries(phaseSteps).map(([phase, steps]) => (
          <div key={phase}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '0.75rem' 
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getPhaseColor(phase)
              }}></div>
              <h4 style={{ margin: 0, color: '#2d3748', fontSize: '1rem' }}>
                PHASE: {phase.replace('_', ' ')}
              </h4>
              <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                ({steps.filter(s => completedSteps.has(s.id)).length}/{steps.length} completed)
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gap: '0.5rem',
              marginLeft: '1rem',
              borderLeft: `2px solid ${getPhaseColor(phase)}20`,
              paddingLeft: '1rem'
            }}>
              {steps.map((step) => (
                <div 
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: activeStep === step.id ? '#f8fafc' : 'transparent',
                    border: activeStep === step.id ? '1px solid #667eea' : '1px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ 
                    fontSize: '0.9rem',
                    minWidth: '20px'
                  }}>
                    {getStepIcon(step.id)}
                  </div>
                  
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: getStatusColor(step.id),
                    minWidth: '25px',
                    fontSize: '0.8rem'
                  }}>
                    {step.step}
                  </div>
                  
                  <div style={{ 
                    background: getPhaseColor(step.phase) + '20',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: getPhaseColor(step.phase),
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {step.from}
                  </div>
                  
                  <div style={{ color: '#718096', fontSize: '0.8rem' }}>→</div>
                  
                  <div style={{ 
                    background: '#f7fafc',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: '#4a5568',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {step.to}
                  </div>
                  
                  <div style={{ 
                    flex: 1, 
                    color: completedSteps.has(step.id) ? '#2d3748' : '#718096',
                    fontSize: '0.85rem',
                    fontWeight: completedSteps.has(step.id) ? 'bold' : 'normal'
                  }}>
                    {step.action}
                  </div>
                  
                  {activeStep === step.id && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#f093fb',
                      animation: 'pulse 1s infinite'
                    }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Progress Summary</span>
          <span style={{ color: '#718096', fontSize: '0.85rem' }}>
            {completedSteps.size}/{sequenceSteps.length} steps completed
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          background: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(completedSteps.size / sequenceSteps.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '0.75rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: '#48bb78' }}>✅</span>
            <span>{completedSteps.size} Completed</span>
          </div>
          {activeStep && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: '#f093fb' }}>⏳</span>
              <span>1 Active</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: '#cbd5e0' }}>⏸️</span>
            <span>{sequenceSteps.length - completedSteps.size - (activeStep ? 1 : 0)} Pending</span>
          </div>
          {failedSteps.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: '#e53e3e' }}>❌</span>
              <span>{failedSteps.size} Failed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveSequenceDiagram
