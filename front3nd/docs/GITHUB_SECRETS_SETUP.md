# GitHub Secrets Setup for Deployment

This guide explains how to set up the required environment variables as GitHub Secrets for your Azure Static Web App deployment.

## Required Secrets

You need to add **only 2 secrets** to your GitHub repository:

### 1. Application Insights Connection String

**Secret Name:** `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING`

**Value:**
```
InstrumentationKey=db71d491-13e0-4cdb-8f35-9f03abc99dbe;IngestionEndpoint=https://centralus-2.in.applicationinsights.azure.com/;LiveEndpoint=https://centralus.livediagnostics.monitor.azure.com/;ApplicationId=332c8f80-0938-4641-a36a-08f46bff3699
```

### 2. API URL (Optional - has a default)

**Secret Name:** `NEXT_PUBLIC_API_URL`

**Value:**
```
/api
```

## How to Add GitHub Secrets

1. **Go to your GitHub repository**
2. **Click Settings** (in the top menu of your repo)
3. **Click "Secrets and variables"** → **"Actions"** (in the left sidebar)
4. **Click "New repository secret"**
5. **Add each secret:**
   - Name: `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING`
   - Value: (paste the connection string above)
   - Click "Add secret"
6. **Repeat for the API URL if needed**

## What About NEXT_PUBLIC_API_KEY?

**You DON'T need it!** 

The `NEXT_PUBLIC_API_KEY` is **optional** for your Azure Static Web Apps setup because:
- Your frontend exports as static files
- Authentication is handled by Azure Functions
- No client-side API authentication is required

## Deployment Process

Once you add these secrets:

1. **Commit and push** your code to GitHub
2. **GitHub Actions** will automatically:
   - Build your frontend with the environment variables
   - Deploy to Azure Static Web Apps
   - Deploy your Azure Functions

## Verification

After deployment, check that Application Insights is receiving data:

1. Go to Azure Portal
2. Navigate to your Application Insights resource
3. Check the "Live Metrics" or "Logs" section
4. You should see telemetry data from your deployed app

## Troubleshooting

### Build Fails with Missing Environment Variables

If you see errors like:
```
❌ Missing Application Insights Configuration
❌ Missing Required Environment Variables
```

Make sure you've added the secrets correctly:
- Check spelling of secret names (case-sensitive)
- Ensure no extra spaces in values
- Verify the connection string is complete

### No Data in Application Insights

If telemetry isn't appearing:
- Verify the connection string is correct
- Check that the Application Insights resource is active
- Wait a few minutes for data to appear (there can be a delay)

## GitHub Actions Environment Variables

Your GitHub Actions workflow automatically passes the secrets to the build process. The workflow should include something like:

```yaml
env:
  NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING: ${{ secrets.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING }}
  NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
```

If you don't see this in your workflow file (`.github/workflows/*.yml`), you may need to add it.
