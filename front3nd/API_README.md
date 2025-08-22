# The Printed Bay - API Documentation

This Next.js application now includes a complete backend API built with Next.js API routes. The API handles all aspects of a 3D printing service including file uploads, model analysis, pricing calculations, order management, and payments.

## API Endpoints

### File Management
- `POST /api/files/upload` - Upload STL files and 3D models
- Supports STL, OBJ, PLY, and 3MF formats
- Maximum file size: 50MB
- Returns file ID and basic validation

### Model Analysis
- `POST /api/models/analyze` - Analyze uploaded 3D models
- Extracts dimensions, volume, surface area
- Calculates printability score and recommendations
- Estimates material usage and print time

### Pricing
- `GET /api/pricing/options` - Get available materials, qualities, and colors
- `POST /api/pricing/calculate` - Calculate pricing for specific model and options
- Includes material costs, print time, processing, and delivery

### Order Management
- `POST /api/orders/create` - Create new orders
- `GET /api/orders/track/[orderNumber]` - Track order status
- Full order lifecycle management
- Customer validation and notification system

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/process` - Process payment confirmation
- Mock Stripe integration (ready for real Stripe keys)

## Features

### 🚀 Production Ready
- TypeScript support with full type definitions
- Error handling and validation
- CORS support for API routes
- Structured JSON responses

### 📊 STL File Analysis
- Binary and ASCII STL file parsing
- Real-time geometry analysis
- Bounding box calculation
- Triangle count and complexity assessment

### 💰 Dynamic Pricing
- Multiple material types (Standard, Tough, Flexible, High-Detail, Biocompatible)
- Quality levels (Draft, Standard, High, Ultra)
- Color variants with pricing multipliers
- Delivery options and lead time calculation

### 📦 Order Processing
- Customer information validation
- Order number generation
- Status tracking with realistic progression
- Demo data for testing

### 💳 Payment Integration
- Mock Stripe payment processing
- Payment intent creation
- Billing validation
- Receipt generation

## Getting Started

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Run Development Server
```bash
npm run dev
# or
yarn dev
```

### 3. Test API Endpoints
The API is automatically available at `http://localhost:3000/api/`

### 4. Upload Test Files
- Create test STL files or use existing ones
- The `uploads/` directory is created automatically
- Files are stored with unique IDs

## API Usage Examples

### Upload a File
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('metadata', JSON.stringify({
  originalName: file.name,
  size: file.size,
  type: file.type
}));

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData
});
```

### Analyze a Model
```javascript
const response = await fetch('/api/models/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'model.stl',
    fileSize: 1024000,
    fileType: 'application/octet-stream'
  })
});
```

### Get Pricing Options
```javascript
const response = await fetch('/api/pricing/options');
const options = await response.json();
```

### Calculate Pricing
```javascript
const response = await fetch('/api/pricing/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelAnalysisId: 'analysis-id',
    material: 'standard-resin',
    quality: 'high',
    color: 'white',
    deliveryOption: 'standard'
  })
});
```

### Track an Order
```javascript
const response = await fetch('/api/orders/track/TPB123456789');
const tracking = await response.json();
```

## Environment Variables

For production deployment, set these environment variables:

```bash
# Optional: Custom API base URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# For real Stripe integration (not implemented yet)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## File Structure

```
front3nd/
├── src/
│   ├── app/api/           # API routes
│   │   ├── files/
│   │   │   └── upload/route.ts
│   │   ├── models/
│   │   │   └── analyze/route.ts
│   │   ├── pricing/
│   │   │   ├── options/route.ts
│   │   │   └── calculate/route.ts
│   │   ├── orders/
│   │   │   ├── create/route.ts
│   │   │   └── track/[orderNumber]/route.ts
│   │   └── payments/
│   │       ├── create-intent/route.ts
│   │       └── process/route.ts
│   ├── types/api.ts       # TypeScript definitions
│   └── lib/apiService.ts  # Frontend API client
└── uploads/               # File storage (created automatically)
```

## Development Notes

- All API routes include CORS headers for development
- File uploads are stored locally in the `uploads/` directory
- Order and payment data is stored in memory (use a database in production)
- Mock payment processing with 90% success rate for testing
- Demo order data is automatically generated for testing

## Production Deployment

For production deployment:
1. Replace in-memory storage with a database
2. Use cloud storage for file uploads (AWS S3, etc.)
3. Add real Stripe integration
4. Implement proper authentication
5. Add rate limiting
6. Set up proper error logging
7. Configure environment variables

## Testing

Demo order number: `TPB123456789`
Test the tracking endpoint: `/api/orders/track/TPB123456789`

The API includes comprehensive demo data to test all functionality without requiring real orders or payments.
