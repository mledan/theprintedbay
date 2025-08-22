#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * 
 * This script analyzes the codebase to find which environment variables are actually used,
 * compares them with what's defined in .env files, and reports on missing GitHub secrets.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Environment variables found in the codebase
const USED_ENV_VARS = [
  // Frontend/Client-side variables (NEXT_PUBLIC_*)
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SITE_URL', 
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING',
  'NEXT_PUBLIC_API_KEY',
  'NEXT_PUBLIC_BACKEND_URL',
  
  // Server-side API variables
  'NODE_ENV',
  'STRIPE_SECRET_KEY',
  'API_SECRET_KEY',
  'ALLOWED_ORIGIN',
  'ALLOWED_ORIGINS',
  
  // Configuration variables used in next.config.mjs
  'UPLOAD_MAX_SIZE',
  'UPLOAD_ALLOWED_TYPES', 
  'DEFAULT_TAX_RATE',
  'DEFAULT_PROCESSING_FEE',
  'ORDER_ID_PREFIX',
  'MAX_QUANTITY_PER_ITEM'
];

// Django/Backend variables (if still using Django)
const DJANGO_ENV_VARS = [
  'SECRET_KEY',
  'DJANGO_DEBUG',
  'ALLOWED_HOSTS',
  'SITE_URL',
  'CORS_ALLOWED_ORIGINS',
  'CSRF_TRUSTED_ORIGINS',
  'AZURE_ACCOUNT_NAME',
  'AZURE_ACCOUNT_KEY',
  'AZURE_CONTAINER',
  'STRIPE_WEBHOOK_SECRET',
  'EMAIL_BACKEND',
  'DEFAULT_FROM_EMAIL',
  'ADMIN_EMAIL',
  'USE_EMAIL_AUTOMATION_SERVICE',
  'SENDGRID_API_KEY',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USE_TLS',
  'EMAIL_HOST_USER',
  'EMAIL_HOST_PASSWORD',
  'APPLICATIONINSIGHTS_CONNECTION_STRING',
  'ENV_STAGE',
  'ADMIN_API_TOKEN',
  'API_TITLE',
  'API_DESCRIPTION', 
  'API_VERSION',
  'GITHUB_OWNER',
  'GITHUB_BACK_REPO',
  'GITHUB_FRONT_REPO',
  'GITHUB_TOKEN',
  'BACKEND_URL',
  'AZURE_RESOURCE_ID',
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'AZURE_TENANT_ID',
  'SHIPPO_API_KEY',
  'SHIPPO_WEBHOOK_TOKEN',
  'SHIP_FROM_NAME',
  'SHIP_FROM_COMPANY',
  'SHIP_FROM_STREET1',
  'SHIP_FROM_CITY',
  'SHIP_FROM_STATE',
  'SHIP_FROM_ZIP',
  'SHIP_FROM_COUNTRY',
  'SHIP_FROM_PHONE',
  'SHIP_FROM_EMAIL'
];

// Development-only variables
const DEV_ONLY_VARS = [
  'DEBUG_API_CALLS',
  'ENABLE_SIMULATION_FALLBACK'
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      
      // Remove {{}} template syntax and quotes
      const cleanValue = value.replace(/^["']|["']$/g, '').replace(/{{.*?}}/g, 'TEMPLATE_VALUE');
      vars[key.trim()] = cleanValue;
    }
  });
  
  return vars;
}

function scanCodebaseForEnvVars() {
  const foundVars = new Set();
  
  try {
    // Search for process.env usage in the codebase
    const grepResult = execSync(`find ./src -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" \\) -exec grep -l "process\\.env\\." {} \\; 2>/dev/null || true`, 
      { cwd: path.join(__dirname, '..', 'front3nd'), encoding: 'utf8' });
    
    const files = grepResult.split('\n').filter(f => f.trim());
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(__dirname, '..', 'front3nd', file), 'utf8');
        const matches = content.match(/process\.env\.([A-Z_][A-Z0-9_]*)/g) || [];
        matches.forEach(match => {
          const varName = match.replace('process.env.', '');
          foundVars.add(varName);
        });
      } catch (err) {
        // Skip files we can't read
      }
    });
    
    // Also check next.config.mjs
    const nextConfigPath = path.join(__dirname, '..', 'front3nd', 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      const matches = content.match(/process\.env\.([A-Z_][A-Z0-9_]*)/g) || [];
      matches.forEach(match => {
        const varName = match.replace('process.env.', '');
        foundVars.add(varName);
      });
    }
    
  } catch (err) {
    log('Warning: Could not scan codebase automatically', 'yellow');
  }
  
  return Array.from(foundVars);
}

function analyzeEnvironment() {
  log('\n🔍 THE PRINTED BAY - Environment Analysis', 'bold');
  log('=' .repeat(50), 'blue');
  
  // Read environment files
  const localEnv = readEnvFile(path.join(__dirname, '..', 'front3nd', '.env.local'));
  const prodEnv = readEnvFile(path.join(__dirname, '..', 'front3nd', '.env.production'));
  
  // Scan codebase for actual usage
  const foundInCode = scanCodebaseForEnvVars();
  
  log(`\n📊 Environment Variables Analysis:`, 'blue');
  log(`   Local env file: ${Object.keys(localEnv).length} variables`);
  log(`   Production env file: ${Object.keys(prodEnv).length} variables`);
  log(`   Found in code: ${foundInCode.length} variables\n`);
  
  // Categorize variables
  const categories = {
    'CRITICAL - Actually Used in Code': [],
    'DJANGO/BACKEND - May not be needed': [],
    'DEVELOPMENT ONLY': [],
    'UNUSED - Defined but not used': [],
    'MISSING - Used in code but not defined': []
  };
  
  // Check which defined vars are actually used
  const allDefinedVars = [...new Set([...Object.keys(localEnv), ...Object.keys(prodEnv)])];
  
  allDefinedVars.forEach(varName => {
    if (foundInCode.includes(varName) || USED_ENV_VARS.includes(varName)) {
      categories['CRITICAL - Actually Used in Code'].push(varName);
    } else if (DJANGO_ENV_VARS.includes(varName)) {
      categories['DJANGO/BACKEND - May not be needed'].push(varName);
    } else if (DEV_ONLY_VARS.includes(varName)) {
      categories['DEVELOPMENT ONLY'].push(varName);
    } else {
      categories['UNUSED - Defined but not used'].push(varName);
    }
  });
  
  // Check for missing variables
  [...foundInCode, ...USED_ENV_VARS].forEach(varName => {
    if (!allDefinedVars.includes(varName)) {
      categories['MISSING - Used in code but not defined'].push(varName);
    }
  });
  
  // Display results
  Object.entries(categories).forEach(([category, vars]) => {
    if (vars.length > 0) {
      const color = category.includes('CRITICAL') ? 'red' : 
                   category.includes('MISSING') ? 'yellow' :
                   category.includes('DJANGO') ? 'blue' : 'green';
      
      log(`\n${category}:`, color);
      vars.sort().forEach(varName => {
        const hasLocal = localEnv.hasOwnProperty(varName);
        const hasProd = prodEnv.hasOwnProperty(varName);
        const status = hasLocal && hasProd ? '✓ Both' : 
                      hasLocal ? '⚠ Local only' :
                      hasProd ? '⚠ Prod only' : '❌ Missing';
        log(`   • ${varName} (${status})`);
      });
    }
  });
  
  // Generate GitHub Actions summary
  log('\n🚀 GITHUB ACTIONS SETUP:', 'bold');
  log('=' .repeat(30), 'blue');
  
  const requiredSecrets = categories['CRITICAL - Actually Used in Code']
    .filter(varName => !DEV_ONLY_VARS.includes(varName))
    .sort();
  
  if (requiredSecrets.length > 0) {
    log('\nAdd these secrets to your GitHub repository:', 'green');
    log('(Settings → Secrets and variables → Actions → New repository secret)\n');
    
    requiredSecrets.forEach(varName => {
      const example = getExampleValue(varName);
      log(`${varName}=${example}`, 'yellow');
    });
    
    // Generate GitHub Actions workflow snippet
    log('\n📝 GitHub Actions Workflow Environment Section:', 'blue');
    log('```yaml');
    log('env:');
    requiredSecrets.forEach(varName => {
      log(`  ${varName}: \${{ secrets.${varName} }}`);
    });
    log('```\n');
  }
  
  // Summary recommendations
  log('💡 RECOMMENDATIONS:', 'bold');
  if (categories['DJANGO/BACKEND - May not be needed'].length > 0) {
    log(`   • Consider removing ${categories['DJANGO/BACKEND - May not be needed'].length} Django variables if not using Django`, 'yellow');
  }
  if (categories['UNUSED - Defined but not used'].length > 0) {
    log(`   • Clean up ${categories['UNUSED - Defined but not used'].length} unused environment variables`, 'yellow');
  }
  if (categories['MISSING - Used in code but not defined'].length > 0) {
    log(`   • Add ${categories['MISSING - Used in code but not defined'].length} missing environment variables`, 'red');
  }
  log(`   • Your Next.js API is using ${categories['CRITICAL - Actually Used in Code'].length} environment variables`, 'green');
  
  return {
    requiredSecrets,
    totalUsed: categories['CRITICAL - Actually Used in Code'].length,
    unusedCount: categories['UNUSED - Defined but not used'].length,
    missingCount: categories['MISSING - Used in code but not defined'].length
  };
}

function getExampleValue(varName) {
  const examples = {
    'STRIPE_SECRET_KEY': 'sk_live_your_stripe_secret_key',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_live_your_stripe_publishable_key',
    'AZURE_ACCOUNT_NAME': 'your_storage_account',
    'AZURE_ACCOUNT_KEY': 'your_storage_key',
    'SENDGRID_API_KEY': 'SG.your_sendgrid_key',
    'APPLICATIONINSIGHTS_CONNECTION_STRING': 'InstrumentationKey=your-key',
    'API_SECRET_KEY': 'your-api-secret-key'
  };
  
  return examples[varName] || 'your_value_here';
}

// Run the analysis
if (require.main === module) {
  analyzeEnvironment();
}
