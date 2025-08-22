# 🔍 Environment Variables Analysis & Setup

## 📊 Current Status

Your Next.js API is using **14 environment variables** that are critical for functionality:

### ✅ **CRITICAL - Required for Production:**
```bash
# Core API Configuration
NEXT_PUBLIC_API_URL=https://api.theprintedbay.com
NEXT_PUBLIC_SITE_URL=https://theprintedbay.com
API_SECRET_KEY=your-api-secret-key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Application Configuration  
NODE_ENV=production
UPLOAD_MAX_SIZE=52428800
UPLOAD_ALLOWED_TYPES=.stl,.obj,.ply,.3mf
DEFAULT_TAX_RATE=0.0875
DEFAULT_PROCESSING_FEE=5.00
ORDER_ID_PREFIX=TPB
MAX_QUANTITY_PER_ITEM=100
ALLOWED_ORIGINS=https://theprintedbay.com,https://www.theprintedbay.com

# Optional Backend Integration
NEXT_PUBLIC_BACKEND_URL=https://your-backend.com  # Only if using separate Django backend
```

### ⚠️ **MISSING - Found in code but not defined:**
```bash
# These are referenced in your code but missing from env files:
NEXT_PUBLIC_API_KEY=your-api-key
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key
ALLOWED_ORIGIN=https://theprintedbay.com  # (Note: ALLOWED_ORIGINS is better)
```

### 🗑️ **UNUSED - Can be cleaned up:**
```bash
# These are defined but not actually used:
DEFAULT_LEAD_TIME_DAYS=7
DEFAULT_RUSH_MULTIPLIER=2.0
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key  # (wrong name)
```

### 🔵 **DJANGO/BACKEND - May not be needed (46 variables):**
All those Django, Azure, Shippo, email, and GitHub integration variables are only needed if you're still using your Django backend. Since your Next.js API handles everything, you can likely remove most of these.

## 🚀 GitHub Actions Setup

### 1. Add Required Secrets to GitHub

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

**Critical secrets to add:**
```bash
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key
API_SECRET_KEY=your-generated-api-secret-key
NEXT_PUBLIC_API_URL=https://api.theprintedbay.com
NEXT_PUBLIC_SITE_URL=https://theprintedbay.com
ALLOWED_ORIGINS=https://theprintedbay.com,https://www.theprintedbay.com
```

**Configuration secrets (with sensible defaults in workflow):**
```bash
UPLOAD_MAX_SIZE=52428800
UPLOAD_ALLOWED_TYPES=.stl,.obj,.ply,.3mf
DEFAULT_TAX_RATE=0.0875
DEFAULT_PROCESSING_FEE=5.00
ORDER_ID_PREFIX=TPB
MAX_QUANTITY_PER_ITEM=100
```

### 2. Validation Process

The deployment workflow will:
1. ✅ **Scan your codebase** for environment variable usage
2. ✅ **Compare with defined variables** in your .env files
3. ✅ **Report missing GitHub secrets** and block production deployment if critical ones are missing
4. ✅ **Generate environment reports** you can download from GitHub Actions

## 🔧 Running Validation Locally

```bash
# Run the environment validation script
node scripts/validate-env.js
```

This will show you:
- Which variables are actually used in your code
- Which ones are missing from your environment files  
- Which GitHub secrets you need to set up
- Which variables you can safely remove

## 💡 Recommendations

### Immediate Actions:
1. **Add the missing variables** to your `.env.local` for development
2. **Set up the GitHub secrets** for deployment
3. **Consider removing Django variables** if you're not using Django anymore

### Next.js vs Django Decision:
Based on the analysis, your **Next.js API is comprehensive** and you likely don't need Django anymore since you have:
- File upload handling
- Pricing calculation
- Order management  
- Payment processing
- All required business logic

**Keep Django only if you need:**
- Complex admin interface
- Advanced database relationships
- Existing Django-specific features

### Clean Environment Setup:
```bash
# Your minimal production environment could be just:
NEXT_PUBLIC_API_URL=https://api.theprintedbay.com
NEXT_PUBLIC_SITE_URL=https://theprintedbay.com  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
API_SECRET_KEY=your-secret
NODE_ENV=production
```

The workflow has sensible defaults for the configuration variables, so you only need to set the critical secrets!

## 🎯 Next Steps

1. Run `node scripts/validate-env.js` to see current status
2. Add missing environment variables to your local `.env.local`
3. Set up GitHub repository secrets for deployment
4. Push to main branch to trigger deployment with validation
5. Check GitHub Actions for environment validation report

Your deployment will automatically validate environment variables and tell you exactly what's missing! 🎉
