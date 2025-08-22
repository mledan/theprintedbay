/**
 * Environment Service
 * 
 * Checks which optional services are configured and available
 */

export interface ServiceStatus {
  name: string
  configured: boolean
  status: 'available' | 'missing' | 'partial' | 'connected' | 'disconnected'
  description: string
  requiredVars: string[]
  configuredVars: string[]
  connectivity?: 'testing' | 'connected' | 'failed' | 'unknown'
}

class EnvironmentService {
  
  // Check individual service configurations
  checkStripeConfig(): ServiceStatus {
    const requiredVars = ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY']
    const configuredVars = requiredVars.filter(varName => 
      process.env[varName] && process.env[varName] !== ''
    )
    
    return {
      name: 'Stripe Payments',
      configured: configuredVars.length === requiredVars.length,
      status: configuredVars.length === requiredVars.length ? 'available' : 
              configuredVars.length > 0 ? 'partial' : 'missing',
      description: 'Credit card payment processing',
      requiredVars,
      configuredVars
    }
  }
  
  checkSendGridConfig(): ServiceStatus {
    const requiredVars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']
    const configuredVars = requiredVars.filter(varName => 
      process.env[varName] && process.env[varName] !== ''
    )
    
    return {
      name: 'SendGrid Email',
      configured: configuredVars.length === requiredVars.length,
      status: configuredVars.length === requiredVars.length ? 'available' : 
              configuredVars.length > 0 ? 'partial' : 'missing',
      description: 'Order confirmation and notification emails',
      requiredVars,
      configuredVars
    }
  }
  
  checkShippoConfig(): ServiceStatus {
    const requiredVars = ['SHIPPO_API_KEY']
    const configuredVars = requiredVars.filter(varName => 
      process.env[varName] && process.env[varName] !== ''
    )
    
    return {
      name: 'Shippo Shipping',
      configured: configuredVars.length === requiredVars.length,
      status: configuredVars.length === requiredVars.length ? 'available' : 'missing',
      description: 'Shipping label generation and tracking',
      requiredVars,
      configuredVars
    }
  }
  
  checkAzureStorageConfig(): ServiceStatus {
    const requiredVars = ['AZURE_STORAGE_CONNECTION_STRING']
    const optionalVars = ['AZURE_STORAGE_CONTAINER_NAME']
    const allVars = [...requiredVars, ...optionalVars]
    const configuredVars = allVars.filter(varName => 
      process.env[varName] && process.env[varName] !== ''
    )
    
    return {
      name: 'Azure Storage',
      configured: requiredVars.every(varName => process.env[varName]),
      status: requiredVars.every(varName => process.env[varName]) ? 'available' : 
              configuredVars.length > 0 ? 'partial' : 'missing',
      description: 'Cloud file storage for 3D models',
      requiredVars: allVars,
      configuredVars
    }
  }
  
  checkApplicationInsightsConfig(): ServiceStatus {
    const connectionString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING
    const instrumentationKey = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY
    const hasConfig = connectionString || instrumentationKey
    
    return {
      name: 'Application Insights',
      configured: !!hasConfig,
      status: hasConfig ? 'available' : 'missing',
      description: 'Telemetry and application monitoring',
      requiredVars: ['NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING (or INSTRUMENTATION_KEY)'],
      configuredVars: hasConfig ? (connectionString ? ['CONNECTION_STRING'] : ['INSTRUMENTATION_KEY']) : []
    }
  }
  
  checkApiConfig(): ServiceStatus {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const simulationFallback = process.env.ENABLE_SIMULATION_FALLBACK
    
    return {
      name: 'Azure Functions API',
      configured: !!apiUrl,
      status: apiUrl ? 'available' : 'missing',
      description: 'Backend API for 3D printing services',
      requiredVars: ['NEXT_PUBLIC_API_URL'],
      configuredVars: apiUrl ? ['NEXT_PUBLIC_API_URL'] : [],
      connectivity: 'unknown'
    }
  }
  
  checkDatabaseConfig(): ServiceStatus {
    const requiredVars = ['AZURE_SQL_SERVER', 'AZURE_SQL_DATABASE', 'AZURE_SQL_USER', 'AZURE_SQL_PASSWORD']
    const configuredVars = requiredVars.filter(varName => 
      process.env[varName] && process.env[varName] !== '' && !process.env[varName]?.includes('your_')
    )
    
    return {
      name: 'Azure SQL Database',
      configured: configuredVars.length === requiredVars.length,
      status: configuredVars.length === requiredVars.length ? 'available' : 
              configuredVars.length > 0 ? 'partial' : 'missing',
      description: 'Database for orders, payments, and pricing data',
      requiredVars,
      configuredVars
    }
  }
  
  // Get all service statuses
  getAllServiceStatuses(): ServiceStatus[] {
    return [
      this.checkApiConfig(),
      this.checkApplicationInsightsConfig(),
      this.checkStripeConfig(),
      this.checkSendGridConfig(),
      this.checkShippoConfig(),
      this.checkAzureStorageConfig(),
      this.checkDatabaseConfig()
    ]
  }
  
  // Log service status report
  logServiceReport(): void {
    console.log('🔧 Service Configuration Report:')
    
    const services = this.getAllServiceStatuses()
    const availableServices = services.filter(s => s.status === 'available')
    const partialServices = services.filter(s => s.status === 'partial')
    const missingServices = services.filter(s => s.status === 'missing')
    
    if (availableServices.length > 0) {
      console.log('✅ Available Services:')
      availableServices.forEach(service => {
        console.log(`  • ${service.name}: ${service.description}`)
      })
    }
    
    if (partialServices.length > 0) {
      console.log('⚠️  Partially Configured Services:')
      partialServices.forEach(service => {
        console.log(`  • ${service.name}: Missing some configuration`)
        const missing = service.requiredVars.filter(v => !service.configuredVars.includes(v))
        if (missing.length > 0) {
          console.log(`    Missing: ${missing.join(', ')}`)
        }
      })
    }
    
    if (missingServices.length > 0) {
      console.log('❌ Missing Service Configuration:')
      missingServices.forEach(service => {
        console.log(`  • ${service.name}: ${service.description}`)
      })
    }
    
    console.log(`📊 Service Summary: ${availableServices.length}/${services.length} services fully configured`)
  }
  
  // Check if a specific feature is available
  isFeatureAvailable(feature: 'api' | 'payments' | 'email' | 'shipping' | 'storage' | 'analytics' | 'database'): boolean {
    switch (feature) {
      case 'api':
        return this.checkApiConfig().configured
      case 'payments':
        return this.checkStripeConfig().configured
      case 'email':
        return this.checkSendGridConfig().configured
      case 'shipping':
        return this.checkShippoConfig().configured
      case 'storage':
        return this.checkAzureStorageConfig().configured
      case 'analytics':
        return this.checkApplicationInsightsConfig().configured
      case 'database':
        return this.checkDatabaseConfig().configured
      default:
        return false
    }
  }
  
  // Get features that are ready for production
  getProductionReadyFeatures(): string[] {
    const features: string[] = []
    
    if (this.isFeatureAvailable('api')) features.push('Azure Functions API')
    if (this.isFeatureAvailable('analytics')) features.push('Analytics & Monitoring')
    if (this.isFeatureAvailable('payments')) features.push('Credit Card Payments')
    if (this.isFeatureAvailable('email')) features.push('Email Notifications')
    if (this.isFeatureAvailable('shipping')) features.push('Shipping Labels')
    if (this.isFeatureAvailable('storage')) features.push('Cloud File Storage')
    if (this.isFeatureAvailable('database')) features.push('SQL Database')
    
    return features
  }
  
  // Test API connectivity
  async testApiConnectivity(): Promise<'connected' | 'failed'> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return 'failed'
      
      // Test a simple endpoint that should always work
      const response = await fetch(`${apiUrl}/pricing-calculate`, {
        method: 'OPTIONS',
        headers: {
          'Origin': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        }
      })
      
      return response.ok ? 'connected' : 'failed'
    } catch (error) {
      return 'failed'
    }
  }
}

// Export singleton instance
export const environmentService = new EnvironmentService()
export default environmentService
