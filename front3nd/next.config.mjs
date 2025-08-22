// Check environment variables at build time
function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_API_URL'
  ];
  
  // Application Insights: either connection string OR instrumentation key is required
  const hasAppInsights = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING || 
                        process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY;
  
  // API Key is optional - not needed for Azure Static Web Apps
  const optionalVars = [
    'NEXT_PUBLIC_API_KEY'
  ];
  
  const missingRequired = [];
  const missingProduction = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    }
  });
  
  // API Key check removed - it's optional for Azure Static Web Apps
  
  // Check Application Insights separately
  if (!hasAppInsights) {
    console.error('\u001b[31m❌ Missing Application Insights Configuration:\u001b[0m');
    console.error('  Set either NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING (recommended)');
    console.error('  or NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY (legacy)');
    missingRequired.push('Application Insights');
  } else {
    if (process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING) {
      console.log('\u001b[32m✅ Application Insights: Using connection string (modern format)\u001b[0m');
    } else {
      console.log('\u001b[33m⚠️  Application Insights: Using instrumentation key (legacy format)\u001b[0m');
    }
  }
  
  if (missingRequired.length > 0) {
    console.error('\u001b[31m❌ Missing Required Environment Variables:\u001b[0m');
    missingRequired.forEach(varName => {
      console.error(`  - ${varName}`);
    });
  }
  
  if (missingRequired.length === 0) {
    console.log('\u001b[32m✅ All required environment variables are set\u001b[0m');
  }
}

// Run environment check
checkEnvironmentVariables();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Azure Static Web Apps (API routes moved to Azure Functions)
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Performance optimizations
  swcMinify: true,
  experimental: {
    // Enable build caching
    forceSwcTransforms: true,
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\/\\]node_modules[\/\\]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          three: {
            test: /[\/\\]node_modules[\/\\](three|@react-three)[\/\\]/,
            name: 'three',
            priority: 20,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Environment variables configuration
  env: {
    UPLOAD_MAX_SIZE: process.env.UPLOAD_MAX_SIZE,
    UPLOAD_ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES,
    DEFAULT_TAX_RATE: process.env.DEFAULT_TAX_RATE,
    DEFAULT_PROCESSING_FEE: process.env.DEFAULT_PROCESSING_FEE,
    ORDER_ID_PREFIX: process.env.ORDER_ID_PREFIX,
    MAX_QUANTITY_PER_ITEM: process.env.MAX_QUANTITY_PER_ITEM,
  },
  
  // Headers removed since we're using static export
  // CORS will be handled by Azure Functions
};

export default nextConfig;
