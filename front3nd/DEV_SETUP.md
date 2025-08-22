# The Printed Bay - Development Setup

## Running the Complete Application

### Prerequisites
- Node.js 18+
- Azure Functions Core Tools v4 (`npm install -g azure-functions-core-tools@4 --unsafe-perm true`)
- Azure Storage Emulator (optional, for local blob storage)

### Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Update these critical environment variables:
   ```env
   # Database
   SQL_CONNECTION_STRING=Server=tcp:your-server.database.windows.net,1433;...
   
   # Azure Storage  
   AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

### Development Commands

#### Run Everything (Recommended)
```bash
npm run dev:full
```
This starts both:
- Frontend (Next.js) on http://localhost:3000
- Azure Functions API on http://localhost:7071

#### Run Separately
```bash
# Terminal 1: Frontend only
npm run dev

# Terminal 2: API only  
npm run api:dev
```

### Architecture Overview

```
Frontend (localhost:3000) → Azure Functions (localhost:7071) → Azure Services
     ↓                           ↓                              ↓
  - File upload UI           - File upload handler         - Blob Storage
  - 3D model viewer         - Model analysis              - SQL Database  
  - Pricing calculator      - Pricing calculation         - Stripe API
  - Order management        - Order processing            - SendGrid Email
```

### Key Endpoints

| Function | URL | Purpose |
|----------|-----|---------|
| files-upload | POST /api/files-upload | Upload 3D model to blob storage |
| models-analyze | POST /api/models-analyze | Analyze 3D model geometry |
| pricing-calculate | POST /api/pricing-calculate | Calculate printing price |
| orders-create | POST /api/orders-create | Create new order |
| payments-create-intent | POST /api/payments-create-intent | Create Stripe payment |

### Customer Data Isolation

All data is isolated by customer:
- **Blob Storage**: `/customers/{customer_id}/files/`
- **Database**: `WHERE customer_id = @customerId`
- **Orders**: Customer can only access their own orders

### Testing File Upload

1. Start both frontend and API: `npm run dev:full`
2. Open http://localhost:3000
3. Click upload area or drag/drop a .stl file
4. File should upload to blob storage and show in 3D viewer
5. Check browser network tab for API calls to localhost:7071

### Troubleshooting

#### File Upload Not Working
- Check Azure Functions are running on port 7071
- Verify CORS settings in `api/local.settings.json`
- Check Azure Storage connection string

#### Database Connection Issues
- Verify SQL_CONNECTION_STRING in both .env.local and api/local.settings.json
- Check database server firewall allows your IP
- Ensure database exists with proper schema

#### Missing Environment Variables
- Check console logs for missing env var warnings
- Compare your .env.local with the template
- Restart both frontend and API after env changes
