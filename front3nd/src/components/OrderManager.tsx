'use client'

import { useState, useCallback } from 'react'
import { appInsights } from '../lib/appInsights'
import { apiService } from '../lib/apiService'

interface OrderManagerProps {
  pricing: any
  material: string
  quality: string
  color: string
  fileName: string
  onOrderComplete: (orderId: string) => void
}

const OrderManager: React.FC<OrderManagerProps> = ({
  pricing,
  material,
  quality,
  color,
  fileName,
  onOrderComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderStep, setOrderStep] = useState<'details' | 'shipping' | 'payment' | 'processing' | 'complete'>('details')
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    name: '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  })
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [selectedShipping, setSelectedShipping] = useState<'standard' | 'express' | 'rush'>('standard')

  const handleCreateOrder = useCallback(async () => {
    setIsProcessing(true)
    setError(null)
    const startTime = Date.now()

    try {
      // Track order creation start
      appInsights.trackEvent('OrderCreationStarted', {
        material,
        quality,
        color,
        totalPrice: pricing?.total?.toFixed(2) || '0.00',
        apiMode: 'real_with_fallback'
      })

      // Create order using API service (tries real API first, falls back to simulation)
      const mockModelAnalysis = { fileName, volume: 10, dimensions: { x: 50, y: 50, z: 50 } }
      const orderResult = await apiService.createOrder(
        mockModelAnalysis,
        pricing,
        customerInfo
      )

      setOrderId(orderResult.id)
      setOrderStep('shipping')

      // Track successful order creation
      const orderTime = Date.now() - startTime
      appInsights.trackEvent('OrderCreated', {
        orderId: orderResult.id,
        material,
        quality,
        totalPrice: pricing?.total?.toFixed(2) || '0.00',
        creationTimeMs: orderTime.toString()
      })

    } catch (error) {
      const orderTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Order creation failed'
      
      setError(errorMessage)
      
      // Track order creation error
      appInsights.trackError(error instanceof Error ? error : new Error(errorMessage), {
        operation: 'orderCreation',
        material,
        quality,
        apiMode: 'real_with_fallback'
      })
      
      appInsights.trackPerformance('OrderCreation', orderTime, false, {
        error: errorMessage
      })
    } finally {
      setIsProcessing(false)
    }
  }, [customerInfo, pricing, material, quality, color, fileName])

  const handlePayment = useCallback(async () => {
    if (!orderId) return
    
    setIsProcessing(true)
    setError(null)
    setOrderStep('processing')
    const startTime = Date.now()

    try {
      // Track payment processing start
      appInsights.trackEvent('PaymentProcessingStarted', {
        orderId,
        amount: pricing?.total?.toFixed(2) || '0.00',
        apiMode: 'real_with_fallback'
      })

      // Process payment using API service (tries real API first, falls back to simulation)
      const paymentResult = await apiService.processPayment({
        orderId,
        paymentMethod: {
          type: 'credit_card',
          cardNumber: paymentInfo.cardNumber.replace(/\d(?=\d{4})/g, '*'),
          expiryDate: paymentInfo.expiryDate,
          nameOnCard: paymentInfo.nameOnCard
        },
        billingDetails: {
          name: paymentInfo.nameOnCard,
          email: customerInfo.email,
          phone: customerInfo.phone || ''
        }
      })

      setOrderStep('complete')
      onOrderComplete(orderId)

      // Track successful payment
      const paymentTime = Date.now() - startTime
      appInsights.trackPurchase({
        transactionId: paymentResult.paymentIntentId,
        orderId,
        totalValue: pricing?.total || 0,
        currency: 'USD',
        items: [{
          name: `3D Print: ${fileName}`,
          category: '3d_printing',
          price: pricing?.total || 0,
          quantity: 1
        }],
        paymentTimeMs: paymentTime
      })

    } catch (error) {
      const paymentTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed'
      
      setError(errorMessage)
      setOrderStep('payment') // Go back to payment step
      
      // Track payment error
      appInsights.trackError(error instanceof Error ? error : new Error(errorMessage), {
        operation: 'paymentProcessing',
        orderId,
        amount: pricing?.total?.toString() || '0',
        apiMode: 'real_with_fallback'
      })
      
      appInsights.trackPerformance('PaymentProcessing', paymentTime, false, {
        error: errorMessage
      })
    } finally {
      setIsProcessing(false)
    }
  }, [orderId, pricing, paymentInfo, fileName, onOrderComplete, customerInfo.email, customerInfo.phone])

  const renderDetailsStep = () => (
    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>📋 Order Details</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Full Name *
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Email *
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            required
          />
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
          Shipping Address *
        </label>
        <textarea
          value={customerInfo.address}
          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
          rows={3}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            City *
          </label>
          <input
            type="text"
            value={customerInfo.city}
            onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            ZIP Code *
          </label>
          <input
            type="text"
            value={customerInfo.zipCode}
            onChange={(e) => setCustomerInfo({ ...customerInfo, zipCode: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Phone
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          />
        </div>
      </div>

      <button
        onClick={handleCreateOrder}
        disabled={isProcessing || !customerInfo.name || !customerInfo.email || !customerInfo.address || !customerInfo.city || !customerInfo.zipCode}
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
          opacity: (isProcessing || !customerInfo.name || !customerInfo.email) ? 0.6 : 1
        }}
      >
        {isProcessing ? 'Creating Order...' : `Create Order - $${pricing?.total?.toFixed(2) || '0.00'}`}
      </button>
    </div>
  )

  const renderShippingStep = () => {
    const shippingOptions = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '7-10 business days',
        price: 9.99,
        icon: '📦'
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '3-5 business days',
        price: 19.99,
        icon: '⚡'
      },
      {
        id: 'rush',
        name: 'Rush Shipping',
        description: '1-2 business days',
        price: 39.99,
        icon: '🚀'
      }
    ]

    return (
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>🚚 Shipping Options</h3>
        
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f7fafc', borderRadius: '6px' }}>
          <p><strong>Order ID:</strong> {orderId}</p>
          <p><strong>Subtotal:</strong> ${pricing?.total?.toFixed(2) || '0.00'}</p>
        </div>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {shippingOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => setSelectedShipping(option.id as 'standard' | 'express' | 'rush')}
              style={{
                padding: '1rem',
                border: selectedShipping === option.id ? '2px solid #667eea' : '1px solid #cbd5e0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedShipping === option.id ? '#f0f4ff' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{option.icon}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2d3748' }}>{option.name}</div>
                    <div style={{ color: '#718096', fontSize: '0.9rem' }}>{option.description}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: '#2d3748' }}>
                  ${option.price.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f7fafc', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal:</span>
            <span>${pricing?.total?.toFixed(2) || '0.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Shipping:</span>
            <span>${shippingOptions.find(opt => opt.id === selectedShipping)?.price.toFixed(2) || '0.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '1px solid #cbd5e0', paddingTop: '0.5rem' }}>
            <span>Total:</span>
            <span>${((pricing?.total || 0) + (shippingOptions.find(opt => opt.id === selectedShipping)?.price || 0)).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button
            onClick={() => setOrderStep('details')}
            style={{
              padding: '1rem',
              background: '#f7fafc',
              color: '#4a5568',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Details
          </button>
          
          <button
            onClick={() => setOrderStep('payment')}
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Continue to Payment →
          </button>
        </div>
      </div>
    )
  }

  const renderPaymentStep = () => (
    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>💳 Payment Information</h3>
      
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f7fafc', borderRadius: '6px' }}>
        <p><strong>Order ID:</strong> {orderId}</p>
        <p><strong>Total:</strong> ${pricing?.total?.toFixed(2) || '0.00'}</p>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Card Number *
          </label>
          <input
            type="text"
            value={paymentInfo.cardNumber}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
            placeholder="1234 5678 9012 3456"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
            Name on Card *
          </label>
          <input
            type="text"
            value={paymentInfo.nameOnCard}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, nameOnCard: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            required
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
              Expiry Date *
            </label>
            <input
              type="text"
              value={paymentInfo.expiryDate}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })}
              placeholder="MM/YY"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4a5568' }}>
              CVV *
            </label>
            <input
              type="text"
              value={paymentInfo.cvv}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
              placeholder="123"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
              required
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button
          onClick={() => setOrderStep('shipping')}
          style={{
            padding: '1rem',
            background: '#f7fafc',
            color: '#4a5568',
            border: '1px solid #cbd5e0',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          ← Back to Shipping
        </button>
        
        <button
          onClick={handlePayment}
          disabled={isProcessing || !paymentInfo.cardNumber || !paymentInfo.nameOnCard || !paymentInfo.expiryDate || !paymentInfo.cvv}
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: (isProcessing || !paymentInfo.cardNumber) ? 0.6 : 1
          }}
        >
          {isProcessing ? 'Processing...' : `Pay $${pricing?.total?.toFixed(2) || '0.00'}`}
        </button>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '6px solid #e2e8f0',
        borderTop: '6px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }}></div>
      <h3 style={{ color: '#667eea', margin: 0 }}>🏦 Processing Payment...</h3>
      <p style={{ color: '#718096', margin: '0.5rem 0 0 0' }}>
        Please wait while we process your payment securely.
      </p>
    </div>
  )

  const renderCompleteStep = () => (
    <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
      <h3 style={{ color: '#38a169', margin: '0 0 1rem 0' }}>Order Complete!</h3>
      <p style={{ color: '#4a5568', marginBottom: '1.5rem' }}>
        Thank you for your order! Your 3D print job has been submitted.
      </p>
      <div style={{ padding: '1rem', background: '#f0fff4', borderRadius: '6px', marginBottom: '1rem', textAlign: 'left' }}>
        <p><strong>Order ID:</strong> {orderId}</p>
        <p><strong>Estimated Delivery:</strong> {pricing?.estimatedDays || 'TBD'} business days</p>
        <p><strong>Total Paid:</strong> ${pricing?.total?.toFixed(2) || '0.00'}</p>
      </div>
      <p style={{ color: '#718096', fontSize: '0.9rem' }}>
        You will receive a confirmation email shortly with tracking information.
      </p>
    </div>
  )

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {error && (
        <div style={{ 
          padding: '1rem', 
          background: '#fed7d7', 
          color: '#c53030', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          border: '1px solid #feb2b2'
        }}>
          <span style={{ marginRight: '0.5rem' }}>⚠️</span>
          {error}
        </div>
      )}

      {orderStep === 'details' && renderDetailsStep()}
      {orderStep === 'shipping' && renderShippingStep()}
      {orderStep === 'payment' && renderPaymentStep()}
      {orderStep === 'processing' && renderProcessingStep()}
      {orderStep === 'complete' && renderCompleteStep()}
    </div>
  )
}

export default OrderManager
