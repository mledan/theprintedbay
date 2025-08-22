# 🚀 The Printed Bay - Quick Deployment Guide

Your repository is now live at: **https://github.com/mledan/theprintedbay**

## 📋 Step 1: Create Azure Function App

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create a new Function App**:
   - **Name**: `theprintedbay-api`
   - **Runtime**: Node.js 20
   - **Operating System**: Linux
   - **Plan Type**: Consumption (Serverless)
   - **Region**: Choose your preferred region

3. **Get Publish Profile**:
   - After creation, go to your Function App
   - Click **"Get publish profile"** in the Overview tab
   - Download the `.PublishSettings` file

## 🔐 Step 2: Set Up GitHub Secrets

Run these commands to add secrets to your repository:

```bash
# Add the publish profile content as a secret
gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE < path/to/your-publish-profile.PublishSettings

# Add your environment variables (replace with your actual keys)
gh secret set STRIPE_SECRET_KEY --body "YOUR_STRIPE_SECRET_KEY"

gh secret set SENDGRID_API_KEY --body "YOUR_SENDGRID_API_KEY"

gh secret set SHIPPO_API_KEY --body "YOUR_SHIPPO_API_KEY"

gh secret set AZURE_STORAGE_CONNECTION_STRING --body "YOUR_AZURE_STORAGE_CONNECTION_STRING"

gh secret set SENDGRID_FROM_EMAIL --body "orders@theprintedbay.com"

# Shipping address environment variables
gh secret set SHIP_FROM_NAME --body "ThePrintedBay"
gh secret set SHIP_FROM_COMPANY --body "TETECARE LLC"  
gh secret set SHIP_FROM_STREET1 --body "555 S River Rd, Apt 302"
gh secret set SHIP_FROM_CITY --body "Des Plaines"
gh secret set SHIP_FROM_STATE --body "Illinois"
gh secret set SHIP_FROM_ZIP --body "60016"
gh secret set SHIP_FROM_COUNTRY --body "US"
gh secret set SHIP_FROM_PHONE --body "2246160771"
gh secret set SHIP_FROM_EMAIL --body "orders@theprintedbay.com"
```

## 🔄 Step 3: Deploy via GitHub Actions

1. **Go to your GitHub repo**: https://github.com/mledan/theprintedbay
2. **Go to Actions tab**
3. **Click "Deploy Azure Functions - The Printed Bay API"**
4. **Click "Run workflow"** → **"Run workflow"**

This will:
- Install dependencies
- Build the TypeScript code
- Deploy to your Azure Function App
- Run a health check to verify deployment

## ✅ Step 4: Verify Deployment

After successful deployment, test these endpoints:

```bash
# Replace YOUR_FUNCTION_APP_NAME with your actual function app name
curl https://theprintedbay-api.azurewebsites.net/api/health

# Should return service health status with all integrations
```

## 🗄️ Step 5: Set Up Database (Optional but Recommended)

If you want real database integration instead of mocks:

1. **Create Azure SQL Database**
2. **Run the SQL scripts from DEPLOYMENT_GUIDE.md**
3. **Add database connection secrets**:

```bash
gh secret set AZURE_SQL_SERVER --body "your-server.database.windows.net"
gh secret set AZURE_SQL_DATABASE --body "theprintedbay_prod" 
gh secret set AZURE_SQL_USER --body "your_admin_user"
gh secret set AZURE_SQL_PASSWORD --body "your_secure_password"
```

4. **Trigger another deployment**

## 🎯 Available API Endpoints

Once deployed, these endpoints will be live:

- `GET /api/health` - Service health monitoring
- `POST /api/files-upload` - Upload 3D models to Azure Storage
- `POST /api/models-analyze` - Analyze uploaded 3D models
- `POST /api/pricing-calculate` - Calculate printing costs
- `POST /api/orders-create` - Create new orders
- `GET/PUT /api/orders-status` - Order status tracking
- `POST /api/payments-create-intent` - Create Stripe payment intents
- `POST /api/payments-process` - Process Stripe payments
- `POST /api/shipping-rates` - Get Shippo shipping rates  
- `POST /api/shipping-label` - Create shipping labels
- `GET /api/shipping-track` - Track packages
- `POST /api/notifications-send` - Send email notifications

## 🏆 Success!

Your production API will be live at:
**https://theprintedbay-api.azurewebsites.net**

All services are integrated with real APIs:
- ✅ Stripe for payments
- ✅ Azure Storage for files  
- ✅ SendGrid for emails
- ✅ Shippo for shipping
- ✅ Optional Azure SQL for data

**You're ready to launch! 🚀**
