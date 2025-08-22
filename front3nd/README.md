# The Printed Bay Frontend

Professional 3D printing service with instant quotes and comprehensive monitoring.

## Features
- 🖨️ **3D Model Upload & Analysis**: STL/OBJ support with instant preview
- 💡 **Professional 3D Viewer**: Showroom-quality lighting with real-time material preview
- 💰 **Real-time Pricing**: Instant quotes with detailed cost breakdowns
- 📦 **Complete Order Flow**: Details → Shipping → Payment → Completion
- 📊 **Azure Application Insights**: Comprehensive telemetry and monitoring
- 🚀 **Performance Optimized**: File caching, lazy loading, and optimized builds

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and configure
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Setup

**Required:**
- `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING`: Azure Application Insights

**Optional Services:**
- Stripe (payments), SendGrid (email), Shippo (shipping), Azure Storage (files)

See [docs/GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md) for deployment configuration.

## Development

The development dashboard shows service configuration status. Check the bottom of the page when running `npm run dev`.

## Deployment

Deployed to Azure Static Web Apps with GitHub Actions. See deployment guides in `/docs`.

## Documentation

- **[WARP.md](WARP.md)**: Complete development guide and architecture overview
- **[docs/GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md)**: Deployment configuration
- **[docs/APPINSIGHTS_SETUP.md](docs/APPINSIGHTS_SETUP.md)**: Application Insights setup
- **[docs/FIXES_SUMMARY.md](docs/FIXES_SUMMARY.md)**: Recent improvements and fixes

## Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Testing
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:coverage # Test coverage report
```

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **3D Graphics**: Three.js with professional lighting setup
- **Monitoring**: Azure Application Insights
- **Deployment**: Azure Static Web Apps
- **Testing**: Jest + Playwright
- **Performance**: Optimized builds with caching
