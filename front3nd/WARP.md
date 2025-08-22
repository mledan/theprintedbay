# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Next.js 14 app (TypeScript) for The Printed Bay - Professional 3D printing service frontend. Node 20.x+ required.

Commands
- Install deps: npm install
- Dev server: npm run dev
- Build: npm run build
- Start (after build): npm run start
- Lint: npm run lint
- Unit tests (Jest):
  - All: npm test
  - Watch: npm run test:watch
  - Coverage: npm run test:coverage
  - Single file: npx jest src/path/to/file.test.tsx
  - Filter by name: npx jest -t "test name substring"
- E2E tests (Playwright):
  - All: npm run test:e2e
  - Single spec: npx playwright test tests/e2e/path/to/spec.spec.ts
  - Specific project: npx playwright test tests/e2e/spec.spec.ts --project=chromium
  - Payment flow only: npm run test:e2e:payment
  - Launch UI runner: npm run test:e2e:ui

Environment and config
- Environment variables: Use .env.local for local development (see .env.local.example)
- Required for deployment:
  - NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING: Azure Application Insights
  - NEXT_PUBLIC_API_URL: Backend API endpoint (defaults to /api)
- Optional services (see docs/GITHUB_SECRETS_SETUP.md):
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + STRIPE_SECRET_KEY: Payments
  - SENDGRID_API_KEY + SENDGRID_FROM_EMAIL: Email notifications  
  - SHIPPO_API_KEY: Shipping labels
  - AZURE_STORAGE_CONNECTION_STRING: File storage
- Environment validation: Comprehensive checking with helpful error messages
- Service monitoring: Development dashboard shows which services are configured

Testing setup
- Unit tests: Jest configured via jest.config.js (next/jest). Key settings:
  - setupFilesAfterEnv: <rootDir>/jest.setup.js
  - testEnvironment: jest-environment-jsdom
  - Module alias: "@/*" → src/*
  - Coverage collected from src/**/* with 70% global thresholds
  - Transforms ignore most node_modules except ESM allowances
- E2E tests: Playwright configured in playwright.config.ts
  - testDir: ./tests/e2e
  - fullyParallel: true; retries on CI; default reporter: html (output in playwright-report/)
  - use.baseURL: process.env.E2E_BASE_URL || http://localhost:3000
  - webServer: starts npm run dev with NEXT_PUBLIC_API_URL set (defaults to http://127.0.0.1:8000/)
  - Projects: chromium, firefox; enable more by setting E2E_ALL_BROWSERS=1

Linting
- ESLint uses Next.js presets (next/core-web-vitals, next/typescript). Run: npm run lint
- Build-time linting is disabled (ignoreDuringBuilds: true) to avoid failing builds on warnings.

Build and deploy notes
- Next.js config (next.config.mjs):
  - output: 'export' for Azure Static Web Apps
  - trailingSlash: true, images: { unoptimized: true }
  - Build-time environment variable validation
  - Webpack optimizations for Three.js and vendor chunks
  - Performance optimizations: caching, SWC transforms
- Deployment: Azure Static Web Apps with GitHub Actions
- Required GitHub secrets (see docs/GITHUB_SECRETS_SETUP.md):
  - NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING
  - Optional: NEXT_PUBLIC_API_URL, service API keys
- Build performance: Enhanced with npm caching and Next.js build cache

Architecture overview
- App framework: Next.js 14 with app directory, TypeScript, static export
- Core features:
  - 3D model upload, analysis, and professional showroom-quality visualization
  - Real-time pricing with live material/color preview
  - Complete order flow: Details → Shipping → Payment → Completion
  - Comprehensive telemetry with Azure Application Insights
- 3D visualization:
  - Three.js with professional 6-light setup (key, corner, rim, ambient lights)
  - Real-time material/color changes with physics-based materials
  - STL/OBJ file support with automatic analysis
  - Print bed visualization for Halot Mage 8K (230×130×160mm)
- Libraries:
  - React 18, Three.js ecosystem (fiber, drei, stdlib)
  - File caching system for instant preview
  - Azure Application Insights for comprehensive monitoring
  - API service with simulation fallback
- Environment management:
  - Smart service detection and configuration validation
  - Development monitoring dashboard
  - Comprehensive error handling and logging

Conventions and paths
- TypeScript: strict, noEmit; moduleResolution: bundler; jsx: preserve; incremental builds enabled.
- Source alias: @/* resolves to src/* (configured in tsconfig.json and Jest config).
- Tests:
  - Unit tests colocated under src/**/__tests__ or named *.test.ts(x)/*.spec.ts(x)
  - E2E tests live under tests/e2e/**

Key features implemented
- Professional 3D model viewer with showroom lighting
- Real-time pricing calculator with detailed breakdowns
- Complete order management with shipping options
- Comprehensive service monitoring and environment validation
- Azure Application Insights integration for production monitoring
- File caching system for instant model preview
- Responsive design with development monitoring dashboard

GitHub CLI Setup (August 2025)
- GitHub CLI (gh) installed and configured for repository secret management
- All 41 production environment variables pushed to GitHub repository secrets
- Automated secret deployment script created and executed successfully
- Repository: mledan/the-printed-bay fully configured for production deployment
- Secrets include: Azure Storage, Stripe, SendGrid, Shippo, Application Insights, shipping details

Recent improvements (see docs/FIXES_SUMMARY.md)
- Fixed runtime errors with proper null safety throughout
- Enhanced 3D lighting with professional 6-light setup
- Added comprehensive environment variable monitoring
- Improved service configuration detection and reporting
- Updated all documentation and deployment guides
- Production secrets fully configured via GitHub CLI

Current Development Status (August 2025)
- Core 3D printing service frontend: ✅ COMPLETE
- Professional 3D model viewer with showroom lighting: ✅ COMPLETE
- Real-time pricing and order management: ✅ COMPLETE
- Environment validation and service monitoring: ✅ COMPLETE
- Production deployment configuration: ✅ COMPLETE
- GitHub repository secrets: ✅ COMPLETE
- **Backend API (Azure Functions MVP)**: ✅ COMPLETE
  - 8 core Azure Functions implemented (26.7% of full service)
  - Complete order flow: Upload → Analyze → Price → Order → Pay → Track
  - Functions: files-upload, pricing-calculate, models-analyze, orders-create, payments-create-intent, payments-process, notifications-send, orders-status
- Payment integration (Stripe): ✅ READY (backend integration complete, needs frontend testing)
- Email notifications (SendGrid): ✅ READY (backend integration complete, needs frontend testing)
- Shipping integration (Shippo): 🔄 READY (configured, needs backend implementation)
- Full backend integration: 🔄 IN PROGRESS (MVP complete, Phase 2 functions next)

Azure Functions API (MVP Complete)
- Location: /api directory (Azure Functions v4 with Node.js 20+)
- Build API: cd api && npm run build
- Deploy API: Azure Functions deployment (configured for production)
- API Specification: See api/FUNCTIONS_SPECIFICATION.md for complete function catalog
- MVP Functions (8/30 complete):
  1. files-upload: 3D model file upload and validation
  2. pricing-calculate: Real-time pricing with material options
  3. models-analyze: 3D model analysis (volume, complexity, printability)
  4. orders-create: Order creation and management
  5. payments-create-intent: Stripe payment intent creation
  6. payments-process: Payment confirmation and webhook handling
  7. notifications-send: Email notifications for order lifecycle
  8. orders-status: Order status tracking and updates
- Complete order flow implemented: Upload → Analyze → Price → Order → Pay → Track
- Next Phase: Shipping integration, customer management, admin dashboard

Warp Workflows (August 2025)
- Automated workflow system: 6 custom workflows configured in .warp/workflows/
- Access workflows: Ctrl+Shift+R (Cmd+Shift+R on Mac) to open command palette
- Available workflows:
  1. "Start Development Server": npm run dev with environment validation
  2. "Run Tests": Parameterized testing (unit, unit-watch, unit-coverage, e2e, e2e-ui, payment-flow)
  3. "Build and Deploy": Complete frontend + API build with deployment checklist
  4. "GitHub Secrets Management": List, view, and update repository secrets via CLI
  5. "Environment Setup & Validation": Automated environment setup and dependency installation
  6. "Run Specific Test": Target specific Jest/Playwright tests with advanced options
- Workflow features:
  - Project-specific automation (stored in .warp/workflows/)
  - Parameterized commands with user input
  - Conditional logic and validation
  - Integration with existing npm scripts and GitHub CLI
  - Tag-based organization for easy discovery

Quick recipes
- Start development: npm run dev (includes environment validation)
- Build for production: npm run build (includes service status check)
- Build API: cd api && npm run build
- View service status: Check development dashboard at bottom of page
- Environment setup: Copy .env.local.example to .env.local and configure
- Deployment setup: Follow docs/GITHUB_SECRETS_SETUP.md
- Manage GitHub secrets: Use `gh secret list --repo mledan/the-printed-bay`
- View production secrets: https://github.com/mledan/the-printed-bay/settings/secrets/actions
- **Use Warp workflows**: Press Ctrl+Shift+R and search for project-specific automation

