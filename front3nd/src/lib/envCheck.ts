/**
 * Environment Variable Checker
 * 
 * This utility checks for required environment variables and logs missing ones
 * to help with configuration debugging.
 */

interface EnvVar {
  name: string
  required: boolean
  description: string
  defaultValue?: string
}

const ENVIRONMENT_VARIABLES: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_API_URL',
    required: true,
    description: 'Base URL for the backend API endpoints',
    defaultValue: '/api'
  },
  {
    name: 'NEXT_PUBLIC_API_KEY',
    required: false,
    description: 'API key for backend authentication (optional - not needed for Azure Static Web Apps)'
  },
  {
    name: 'NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING',
    required: true,
    description: 'Azure Application Insights connection string (modern format - recommended)'
  },
  {
    name: 'NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY',
    required: false,
    description: 'Azure Application Insights instrumentation key (legacy format - fallback)'
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key for payment processing'
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key for server-side payment processing (backend)'
  },
  {
    name: 'SENDGRID_API_KEY',
    required: false,
    description: 'SendGrid API key for sending emails'
  },
  {
    name: 'SENDGRID_FROM_EMAIL',
    required: false,
    description: 'SendGrid verified sender email address',
    defaultValue: 'orders@theprintedbay.com'
  },
  {
    name: 'SHIPPO_API_KEY',
    required: false,
    description: 'Shippo API key for shipping label generation'
  },
  {
    name: 'AZURE_STORAGE_CONNECTION_STRING',
    required: false,
    description: 'Azure Storage connection string for file uploads'
  },
  {
    name: 'AZURE_STORAGE_CONTAINER_NAME',
    required: false,
    description: 'Azure Storage container name for 3D model files',
    defaultValue: 'uploads'
  },
  {
    name: 'NEXT_PUBLIC_ENVIRONMENT',
    required: false,
    description: 'Environment name (development, staging, production)',
    defaultValue: 'development'
  }
]

export function checkEnvironmentVariables(): void {
  console.log('🔧 Critical Service Environment Check:')
  
  // Check API Service (Critical)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    console.log(`  ✅ API Service: ${apiUrl}`)
  } else {
    console.log('  ❌ API Service: NEXT_PUBLIC_API_URL not set (using fallback: /api)')
  }
  
  // Check Simulation Fallback Setting
  const simulationFallback = process.env.ENABLE_SIMULATION_FALLBACK
  console.log(`  🔄 Simulation Fallback: ${simulationFallback || 'false'} ${simulationFallback === 'false' ? '(Real APIs Only)' : '(Fallback Enabled)'}`)
  
  // Check Application Insights (Critical for monitoring)
  const appInsightsConn = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING
  const appInsightsKey = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY
  if (appInsightsConn) {
    console.log('  ✅ Application Insights: Using connection string (modern format)')
  } else if (appInsightsKey) {
    console.log('  ⚠️  Application Insights: Using instrumentation key (legacy format)')
  } else {
    console.log('  ❌ Application Insights: Not configured')
  }
  
  // Check Payment Service (Stripe)
  const stripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (stripePublic && stripePublic !== 'pk_test_your_publishable_key_here') {
    console.log('  ✅ Stripe Payments: Configured')
  } else {
    console.log('  ⚠️  Stripe Payments: Using placeholder keys (won\'t work for real payments)')
  }
  
  // Check Email Service (SendGrid)
  const sendgridKey = process.env.SENDGRID_API_KEY
  if (sendgridKey && sendgridKey !== 'SG.your-sendgrid-api-key') {
    console.log('  ✅ Email Service: SendGrid configured')
  } else {
    console.log('  ⚠️  Email Service: Using placeholder SendGrid key (won\'t send real emails)')
  }
  
  // Check Storage Service (Azure Blob)
  const azureStorage = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (azureStorage && !azureStorage.includes('your-storage-account')) {
    console.log('  ✅ File Storage: Azure Blob configured')
  } else {
    console.log('  ⚠️  File Storage: Using placeholder Azure Storage (won\'t store real files)')
  }
  
  // Check Database Service
  const sqlConnection = process.env.SQL_CONNECTION_STRING
  if (sqlConnection && !sqlConnection.includes('your-server')) {
    console.log('  ✅ Database: SQL Server configured')
  } else {
    console.log('  ⚠️  Database: Using placeholder connection (Azure Functions will simulate)')
  }
  
  console.log('  💡 Note: Azure Functions backend required on port 7071')
}

// Browser-safe environment check
export function checkBrowserEnvironmentVariables(): void {
  if (typeof window === 'undefined') return // Only run in browser
  
  const missingVars: string[] = []
  
  // Only check public environment variables in browser
  const browserVars = ENVIRONMENT_VARIABLES.filter(envVar => 
    envVar.name.startsWith('NEXT_PUBLIC_')
  )
  
  browserVars.forEach(envVar => {
    const value = process.env[envVar.name]
    if (!value && envVar.required) {
      missingVars.push(envVar.name)
    }
  })
  
  if (missingVars.length > 0) {
    console.warn('🔧 Browser environment variables missing:', missingVars)
  }
}

export default checkEnvironmentVariables
