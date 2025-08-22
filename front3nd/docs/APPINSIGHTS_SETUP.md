# Application Insights Setup Guide

This document explains how to configure Azure Application Insights for The Printed Bay frontend application.

## Overview

The application supports both modern connection string format and legacy instrumentation key format for Application Insights configuration.

## Configuration Options

### Option 1: Modern Connection String Format (Recommended)

Set the following environment variable in your `.env.local` file:

```bash
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=db71d491-13e0-4cdb-8f35-9f03abc99dbe;IngestionEndpoint=https://centralus-2.in.applicationinsights.azure.com/;LiveEndpoint=https://centralus.livediagnostics.monitor.azure.com/;ApplicationId=332c8f80-0938-4641-a36a-08f46bff3699
```

### Option 2: Legacy Instrumentation Key Format (Fallback)

Alternatively, you can use just the instrumentation key:

```bash
NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=db71d491-13e0-4cdb-8f35-9f03abc99dbe
```

## Your Application Insights Configuration

- **Instrumentation Key**: `db71d491-13e0-4cdb-8f35-9f03abc99dbe`
- **Application ID**: `332c8f80-0938-4641-a36a-08f46bff3699`
- **Ingestion Endpoint**: `https://centralus-2.in.applicationinsights.azure.com/`
- **Live Endpoint**: `https://centralus.livediagnostics.monitor.azure.com/`
- **Region**: Central US

## What Gets Tracked

The application automatically tracks:

### Page Views
- Landing page visits
- Navigation between steps
- User flow progression

### User Interactions
- File uploads (name, size, type, duration)
- Material/color/quality selections
- Live configuration changes
- Quote generations
- Order creations
- Payment processing

### 3D Model Analysis
- Model complexity (vertices, faces)
- Model dimensions and volume
- Analysis processing time

### Performance Metrics
- API call response times
- File upload speeds
- Pricing calculation times
- Overall operation success/failure rates

### Business Metrics
- Conversion funnel tracking
- Purchase transactions
- Revenue tracking
- Order completion rates

### Error Tracking
- JavaScript errors
- API call failures
- Upload failures
- Payment processing errors

## Verification

To verify Application Insights is working:

1. **During Development**: Check the browser console for Application Insights initialization messages:
   ```
   📊 Using Application Insights instrumentation key format
   📊 Application Insights initialized
   ```

2. **During Build**: Look for the environment variable confirmation:
   ```
   ✅ Application Insights: Using connection string (modern format)
   ```

3. **In Azure Portal**: Visit your Application Insights resource to see real-time telemetry data.

## Environment Variable Priority

The application checks for Application Insights configuration in this order:

1. `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` (modern format - preferred)
2. `NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY` (legacy format - fallback)
3. Default placeholder (development only)

## Production Deployment

For production deployment, ensure the connection string is set as an environment variable in your Azure Static Web App or deployment platform.

## Troubleshooting

### Common Issues

1. **No data appearing in Application Insights**:
   - Verify the connection string/instrumentation key is correct
   - Check browser console for initialization messages
   - Ensure the Application Insights resource is active in Azure

2. **Build warnings about missing variables**:
   - Make sure you have either `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` or `NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY` set
   - Check that the variable is properly formatted in your `.env.local` file

3. **Placeholder warnings**:
   - Update your environment variables with the actual values
   - Restart your development server after making changes

### Debug Mode

The application includes comprehensive logging. Check the browser console for:
- 🔧 Environment variable warnings
- 📊 Application Insights status messages
- ⚠️ Configuration issues
- ✅ Successful operations

## Additional Resources

- [Azure Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript)
- [Application Insights JavaScript SDK](https://github.com/Microsoft/ApplicationInsights-JS)
