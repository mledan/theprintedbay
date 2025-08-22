# 🚀 Azure Static Web Apps Deployment Guide

## ✅ **YES! You're absolutely right!**

Azure Static Web Apps **automatically detects your `/api` folder** and deploys it as Azure Functions. Here's how to deploy:

## 📁 **Current Structure** 
```
theprintedbay/
├── front3nd/          # Next.js frontend (static export)
├── api/               # Azure Functions backend
│   ├── files-upload/
│   ├── pricing-calculate/
│   └── host.json
└── .github/workflows/ # GitHub Actions
```

## 🎯 **Simple Deployment Steps**

### 1. **Commit and Push**
```bash
git add .
git commit -m "Add Azure Functions API support"
git push origin main
```

### 2. **Azure Static Web Apps will automatically:**
- ✅ Build your Next.js frontend (`front3nd/`) 
- ✅ Deploy Azure Functions from your `api/` folder
- ✅ Connect them together seamlessly!

## ⚙️ **Environment Variables to Set in Azure**

Go to your Azure Static Web App → Configuration → Add these:

### Required:
```bash
STRIPE_SECRET_KEY=sk_live_your_actual_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key
NEXT_PUBLIC_API_URL=https://your-site.azurestaticapps.net/api
API_SECRET_KEY=your-generated-secret
```

### Optional:
```bash
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key
UPLOAD_MAX_SIZE=52428800
DEFAULT_TAX_RATE=0.0875
```

## 🔧 **Local Development**

### Test Azure Functions locally:
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Start Functions locally
cd api
npm install
func start

# Start frontend
cd ../front3nd
npm run dev
```

Your APIs will be available at:
- `http://localhost:7071/api/files-upload`
- `http://localhost:7071/api/pricing-calculate`
- etc.

## 📝 **What Changed:**

1. **✅ Moved API routes** from Next.js to Azure Functions
2. **✅ Updated frontend** to call Azure Functions endpoints  
3. **✅ Re-enabled static export** for the frontend
4. **✅ Removed conflicting Next.js API routes** that caused build errors
5. **✅ Fixed deployment workflow** to use correct output paths

## 🎉 **Deploy Now!**

Just push to GitHub and Azure Static Web Apps will:
1. Build your static frontend from `front3nd/`
2. Deploy your Azure Functions from `api/`
3. Make them work together automatically!

Your frontend will be static HTML/JS and your APIs will be serverless Azure Functions - **exactly what you wanted!** 🎯

## 🔍 **URLs After Deployment:**

- **Frontend**: `https://your-app.azurestaticapps.net`
- **APIs**: `https://your-app.azurestaticapps.net/api/files-upload`

The `/api` routes are automatically mapped to your Azure Functions!

## 🚀 **Ready to deploy?**

```bash
git add .
git commit -m "Azure Functions API ready"
git push origin main
```

That's it! Your comprehensive 3D printing service will be live with both static frontend and serverless API! 🎨🖨️
