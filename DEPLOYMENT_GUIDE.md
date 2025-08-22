# The Printed Bay - Complete Production Deployment Guide

## 🚀 **Production Deployment Checklist**

This guide covers the complete setup for The Printed Bay 3D printing service with all real integrations.

---

## 🔧 **1. Azure SQL Database Setup**

### Create Database Tables

```sql
-- Orders table
CREATE TABLE Orders (
    orderId NVARCHAR(50) PRIMARY KEY,
    customerEmail NVARCHAR(255) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    status NVARCHAR(50) DEFAULT 'pending_payment',
    fileUrl NVARCHAR(500),
    fileName NVARCHAR(255),
    created DATETIME2 DEFAULT GETDATE(),
    updated DATETIME2 DEFAULT GETDATE()
);

-- Payments table  
CREATE TABLE Payments (
    paymentId NVARCHAR(50) PRIMARY KEY,
    orderId NVARCHAR(50) NOT NULL,
    amount INT NOT NULL, -- Amount in cents
    currency NVARCHAR(10) DEFAULT 'USD',
    status NVARCHAR(50) NOT NULL,
    stripePaymentIntentId NVARCHAR(100),
    processed DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (orderId) REFERENCES Orders(orderId)
);

-- Pricing table
CREATE TABLE Pricing (
    pricingId NVARCHAR(50) PRIMARY KEY,
    orderId NVARCHAR(50),
    material NVARCHAR(100) NOT NULL,
    volume NVARCHAR(50) NOT NULL,
    basePrice DECIMAL(10,2) NOT NULL,
    materialCost DECIMAL(10,2) NOT NULL,
    processingFee DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    estimatedDays INT DEFAULT 3,
    created DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (orderId) REFERENCES Orders(orderId)
);

-- Shipping Labels table
CREATE TABLE ShippingLabels (
    shippingId NVARCHAR(50) PRIMARY KEY,
    orderId NVARCHAR(50) NOT NULL,
    trackingNumber NVARCHAR(100) NOT NULL,
    carrier NVARCHAR(50) NOT NULL,
    labelUrl NVARCHAR(500) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    rateId NVARCHAR(100),
    transactionId NVARCHAR(100),
    created DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (orderId) REFERENCES Orders(orderId)
);

-- Create indexes for performance
CREATE INDEX IX_Orders_CustomerEmail ON Orders(customerEmail);
CREATE INDEX IX_Orders_Status ON Orders(status);
CREATE INDEX IX_Orders_Created ON Orders(created);
CREATE INDEX IX_Payments_OrderId ON Payments(orderId);
CREATE INDEX IX_Payments_Status ON Payments(status);
CREATE INDEX IX_ShippingLabels_OrderId ON ShippingLabels(orderId);
CREATE INDEX IX_ShippingLabels_TrackingNumber ON ShippingLabels(trackingNumber);
```

---

## 🌐 **2. Environment Variables Setup**

### Azure Functions Environment Variables

```bash
# Azure SQL Database
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=theprintedbay_prod
AZURE_SQL_USER=your_admin_user
AZURE_SQL_PASSWORD=your_secure_password

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=3d-models

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid Email
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=orders@theprintedbay.com

# Shippo Shipping
SHIPPO_API_KEY=shippo_live_...
SHIP_FROM_NAME=The Printed Bay
SHIP_FROM_COMPANY=The Printed Bay LLC
SHIP_FROM_STREET1=123 Maker Street
SHIP_FROM_CITY=Austin
SHIP_FROM_STATE=TX
SHIP_FROM_ZIP=78701
SHIP_FROM_COUNTRY=US
SHIP_FROM_PHONE=555-0123
SHIP_FROM_EMAIL=orders@theprintedbay.com
```

### Next.js Frontend Environment Variables

```bash
# Production URLs
NEXT_PUBLIC_API_URL=https://theprintedbay-api.azurewebsites.net/api
NEXT_PUBLIC_SITE_URL=https://theprintedbay.com

# Stripe Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Application Insights (Optional)
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Production Settings
NODE_ENV=production
ENABLE_SIMULATION_FALLBACK=false
DEBUG_API_CALLS=false
```

---

## 🔌 **3. Service Integrations Status**

### ✅ **Fully Implemented Services**

| Service | Status | Purpose | Mock Fallback |
|---------|--------|---------|---------------|
| **Azure Blob Storage** | ✅ Real | File uploads | ❌ |
| **Stripe Payments** | ✅ Real | Payment processing | ✅ |
| **SendGrid Email** | ✅ Real | Order notifications | ✅ |
| **Azure SQL Database** | ✅ Real | Data persistence | ✅ |
| **Shippo Shipping** | ✅ Real | Shipping labels & tracking | ✅ |

### 🔄 **API Endpoints Available**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/files-upload` | POST | File upload to Azure Storage |
| `/api/pricing-calculate` | POST | Calculate 3D printing costs |
| `/api/orders-create` | POST | Create new orders |
| `/api/payments-create-intent` | POST | Create Stripe payment intent |
| `/api/payments-process` | POST | Process Stripe payments |
| `/api/orders-status` | GET/PUT | Get/update order status |
| `/api/shipping-rates` | POST | Get shipping rates from Shippo |
| `/api/shipping-label` | POST | Create shipping labels |
| `/api/shipping-track` | GET | Track shipments |
| `/api/notifications-send` | POST | Send email notifications |
| `/api/health` | GET | Service health check |

---

## 📊 **4. Health Monitoring**

### Health Check Endpoint: `/api/health`

Returns comprehensive service status:

```json
{
  "status": "healthy|degraded|unhealthy",
  "services": {
    "storage": { "status": "healthy", "configured": true },
    "payments": { "status": "healthy", "configured": true },
    "email": { "status": "healthy", "configured": true },
    "shipping": { "status": "healthy", "configured": true },
    "database": { "status": "healthy", "configured": true },
    "api": { "status": "healthy", "configured": true }
  },
  "timestamp": "2024-08-22T22:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 🏗️ **5. Data Flow Architecture**

### Complete User Journey:

1. **File Upload** → Azure Blob Storage
2. **Pricing Calculation** → Database (Pricing table)
3. **Order Creation** → Database (Orders table)  
4. **Payment Processing** → Stripe API + Database (Payments table)
5. **Order Status Updates** → Database + Email notifications
6. **Shipping** → Shippo API + Database (ShippingLabels table)
7. **Tracking** → Shippo API + Email notifications

---

## 🔒 **6. Security & Production Readiness**

### ✅ **Security Features**
- All API calls use HTTPS
- Database connections are encrypted
- Environment variables for sensitive data
- CORS properly configured
- SQL parameterized queries (prevent injection)
- Stripe webhook signature verification
- File type validation for uploads

### ✅ **Error Handling**
- Graceful degradation to mock data when services unavailable
- Comprehensive logging with emojis for easy parsing
- Database transaction rollbacks on failures
- Proper HTTP status codes and error messages

### ✅ **Performance Features**
- Database connection pooling
- Singleton services to prevent multiple initializations
- Proper database indexing
- Efficient blob storage for file handling

---

## 🚀 **7. Deployment Steps**

### Step 1: Azure Resources
1. Create Azure SQL Database
2. Create Azure Storage Account
3. Create Azure Functions App
4. Run database schema creation scripts

### Step 2: External Services
1. Set up Stripe account (live keys)
2. Set up SendGrid account (API key)
3. Set up Shippo account (live API key)

### Step 3: Environment Configuration
1. Set all environment variables in Azure Functions
2. Set frontend environment variables for production build
3. Configure custom domain and SSL certificates

### Step 4: Deployment
1. Deploy Azure Functions with all environment variables
2. Deploy Next.js frontend to production
3. Test `/api/health` endpoint - should show all services "healthy"
4. Run end-to-end test with real payment (small amount)

### Step 5: Verification
1. Upload a 3D model file → should appear in Azure Storage
2. Complete payment flow → should create Stripe payment
3. Check database → should have records in all tables
4. Generate shipping label → should create real USPS label
5. Send test email → should arrive from SendGrid

---

## 🎯 **8. Live Service Status**

After deployment, verify all services are operational:

```bash
# Check overall health
curl https://theprintedbay-api.azurewebsites.net/api/health

# Test file upload (multipart/form-data)
curl -X POST -F "file=@test.stl" https://theprintedbay-api.azurewebsites.net/api/files-upload

# Test pricing calculation
curl -X POST -H "Content-Type: application/json" \
  -d '{"volume":"45.2","material":"Standard Resin"}' \
  https://theprintedbay-api.azurewebsites.net/api/pricing-calculate
```

---

## 🏆 **Production-Ready Features**

### ✅ **Complete Feature Set**
- ✅ Real file uploads to Azure Storage
- ✅ Real Stripe payment processing  
- ✅ Real email notifications via SendGrid
- ✅ Real shipping labels via Shippo
- ✅ Real database persistence (SQL Server)
- ✅ Live sequence diagram with journey tracking
- ✅ Comprehensive health monitoring
- ✅ Production environment configuration
- ✅ Error handling and graceful degradation
- ✅ Security best practices

**The application is now fully production-ready with all real service integrations!** 🎉

---

## 📞 **Support & Troubleshooting**

If any service shows "unhealthy" in the health check:
1. Verify environment variables are set correctly
2. Check service-specific API keys are valid and not expired
3. Ensure network connectivity from Azure Functions
4. Review Azure Functions logs for detailed error messages
5. Test individual service endpoints to isolate issues

The system is designed to continue operating even if some services are down, falling back to mock responses where appropriate.
