'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiService } from '../../lib/apiService'
import { appInsights } from '../../lib/appInsights'
import styles from '../page.module.css'

interface OrderTrackingData {
  order: {
    id: string
    orderNumber: string
    status: string
    statusDisplay: string
    customer: {
      name: string
      email: string
    }
    pricing: {
      total: number
    }
    delivery: {
      option: string
      estimatedDate?: string
      actualDate?: string
    }
    createdAt: string
  }
  statusUpdates: Array<{
    status: string
    statusDisplay: string
    notes: string
    timestamp: string
    customerNotified: boolean
  }>
  containerFiles: Array<{
    name: string
    url: string
    type: string
  }>
}

const statusColors: Record<string, string> = {
  'pending_payment': '#fbbf24',
  'payment_failed': '#ef4444',
  'paid': '#10b981',
  'in_production': '#3b82f6',
  'quality_check': '#8b5cf6',
  'ready_to_ship': '#06b6d4',
  'shipped': '#059669',
  'delivered': '#065f46',
  'cancelled': '#6b7280',
  'refunded': '#dc2626',
}

const statusIcons: Record<string, string> = {
  'pending_payment': '💳',
  'payment_failed': '❌',
  'paid': '✅',
  'in_production': '🖨️',
  'quality_check': '🔍',
  'ready_to_ship': '📦',
  'shipped': '🚚',
  'delivered': '🎉',
  'cancelled': '🚫',
  'refunded': '💸',
}

function OrderTrackingPageContent() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState('')
  const [inputOrderNumber, setInputOrderNumber] = useState('')
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for order number in URL hash first (for direct links)
    const hash = window.location.hash.substring(1)
    if (hash) {
      setOrderNumber(hash)
      setInputOrderNumber(hash)
      trackOrder(hash)
      return
    }

    // Check for order number in search params
    const orderParam = searchParams.get('order')
    if (orderParam) {
      setOrderNumber(orderParam)
      setInputOrderNumber(orderParam)
      trackOrder(orderParam)
    }
  }, [searchParams])

  const trackOrder = async (orderNum: string) => {
    if (!orderNum.trim()) return

    try {
      setLoading(true)
      setError(null)

      // Track page view
      appInsights.trackPageView('Order Tracking', {
        orderNumber: orderNum,
        feature: 'order_tracking'
      })

      const data = await apiService.trackOrder(orderNum)
      setTrackingData(data)

      // Update URL hash for direct linking
      window.location.hash = orderNum

      // Track successful tracking
      appInsights.trackEvent('OrderTracked', {
        orderNumber: orderNum,
        orderStatus: data.order.status,
        success: 'true'
      })

    } catch (err) {
      console.error('Error tracking order:', err)
      setError(err instanceof Error ? err.message : 'Failed to track order')
      
      // Track tracking failure
      appInsights.trackError(err instanceof Error ? err : new Error('Order tracking failed'), {
        operation: 'orderTracking',
        orderNumber: orderNum
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputOrderNumber.trim()) {
      setOrderNumber(inputOrderNumber.trim())
      trackOrder(inputOrderNumber.trim())
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show search form if no order number or no tracking data
  if (!orderNumber || (!loading && !trackingData && !error)) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>📋 Order Tracking</h1>
          <p className={styles.subtitle}>
            Enter your order number to track your 3D print order
          </p>
        </header>

        <main className={styles.main}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '3rem',
            maxWidth: '500px',
            margin: '0 auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
              <h2 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>Track Your Order</h2>
              <p style={{ color: '#718096' }}>
                Enter your order number to see real-time status updates
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '2rem' }}>
                <label 
                  htmlFor="orderNumber" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#2d3748',
                    fontWeight: 'bold'
                  }}
                >
                  Order Number
                </label>
                <input
                  id="orderNumber"
                  type="text"
                  value={inputOrderNumber}
                  onChange={(e) => setInputOrderNumber(e.target.value)}
                  placeholder="e.g., ORD-2024-001234"
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontFamily: 'monospace',
                    textAlign: 'center'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              
              <button
                type="submit"
                disabled={!inputOrderNumber.trim() || loading}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: inputOrderNumber.trim() && !loading ? '#667eea' : '#cbd5e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: inputOrderNumber.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (inputOrderNumber.trim() && !loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.background = '#5a67d8'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)'
                  if (inputOrderNumber.trim() && !loading) {
                    e.currentTarget.style.background = '#667eea'
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Tracking...
                  </span>
                ) : (
                  '🔍 Track Order'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <a 
                href="/" 
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </main>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '6px solid #e2e8f0',
              borderTop: '6px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 2rem'
            }}></div>
            <h2 style={{ color: '#667eea', marginBottom: '1rem' }}>Tracking Your Order</h2>
            <p style={{ color: '#718096' }}>Loading order #{orderNumber}...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trackingData) {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>❌</div>
            <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Order Not Found</h2>
            <p style={{ color: '#718096', marginBottom: '2rem' }}>
              {error || `Order #${orderNumber} could not be found. Please check your order number and try again.`}
            </p>
            <button 
              onClick={() => {
                setOrderNumber('')
                setInputOrderNumber('')
                setTrackingData(null)
                setError(null)
                window.location.hash = ''
              }}
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              ← Try Again
            </button>
            <a 
              href="/" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#718096',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const { order, statusUpdates, containerFiles } = trackingData

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>📋 Order Tracking</h1>
        <p className={styles.subtitle}>
          Track your 3D print order in real-time
        </p>
      </header>

      <main className={styles.main}>
        {/* Order Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Order Number</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea', margin: 0 }}>
                #{order.orderNumber}
              </p>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Status</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{statusIcons[order.status]}</span>
                <span 
                  style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold',
                    color: statusColors[order.status] || '#6b7280'
                  }}
                >
                  {order.statusDisplay}
                </span>
              </div>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Total</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38a169', margin: 0 }}>
                ${order.pricing.total.toFixed(2)}
              </p>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Customer</h3>
              <p style={{ margin: 0, color: '#4a5568' }}>{order.customer.name}</p>
              <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>{order.customer.email}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 2rem 0', color: '#2d3748' }}>📍 Order Timeline</h3>
          
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '1rem',
              bottom: '1rem',
              width: '2px',
              background: '#e2e8f0'
            }}></div>
            
            {statusUpdates.map((update, index) => (
              <div key={index} style={{ 
                position: 'relative', 
                marginBottom: index === statusUpdates.length - 1 ? 0 : '2rem',
                paddingLeft: '3rem'
              }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: '0.25rem',
                  top: '0.25rem',
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  background: statusColors[update.status] || '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem'
                }}>
                  {statusIcons[update.status]}
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#2d3748' }}>
                    {update.statusDisplay}
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>
                    {update.notes}
                  </p>
                  <p style={{ margin: 0, color: '#718096', fontSize: '0.85rem' }}>
                    {formatDate(update.timestamp)}
                    {update.customerNotified && (
                      <span style={{ marginLeft: '1rem', color: '#38a169' }}>
                        ✉️ Email sent
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Information */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>🚚 Delivery Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>Delivery Option</h4>
              <p style={{ margin: 0, color: '#2d3748', fontWeight: '500' }}>
                {order.delivery.option.charAt(0).toUpperCase() + order.delivery.option.slice(1)} Delivery
              </p>
            </div>
            
            {order.delivery.estimatedDate && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>Estimated Delivery</h4>
                <p style={{ margin: 0, color: '#667eea', fontWeight: '500' }}>
                  {new Date(order.delivery.estimatedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            
            {order.delivery.actualDate && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>Delivered On</h4>
                <p style={{ margin: 0, color: '#38a169', fontWeight: '500' }}>
                  {new Date(order.delivery.actualDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Documents */}
        {containerFiles.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>📄 Order Documents</h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {containerFiles.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    color: '#2d3748',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#edf2f7'
                    e.currentTarget.style.borderColor = '#cbd5e0'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f7fafc'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>📄</div>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                      {file.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#667eea' }}>
                    ↗️
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ textAlign: 'center', marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              setOrderNumber('')
              setInputOrderNumber('')
              setTrackingData(null)
              setError(null)
              window.location.hash = ''
            }}
            style={{
              padding: '1rem 2rem',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#667eea'
              e.currentTarget.style.color = 'white'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = '#667eea'
            }}
          >
            🔍 Track Another Order
          </button>
          
          <a 
            href="/" 
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
          >
            ← Start New Order
          </a>
        </div>
      </main>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid #e2e8f0',
            borderTop: '6px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 2rem'
          }}></div>
          <h2 style={{ color: '#667eea', marginBottom: '1rem' }}>Loading Order Tracking</h2>
          <p style={{ color: '#718096' }}>Please wait...</p>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Main export with Suspense wrapper
export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderTrackingPageContent />
    </Suspense>
  )
}
