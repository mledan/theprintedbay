# 🧪 **Endpoint Testing & Verification Guide**

This guide shows you how to verify each endpoint and test the complete 3D printing workflow.

## 🎯 **Quick Start - Run the App**

```bash
cd /Users/mladenmilesic/Dev/print3dbay-django/print3d/front3nd
npm run dev
```

Open http://localhost:3000 and you'll see the development monitoring dashboard at the bottom showing:
- Current Step (1-5)
- File Upload Status
- Model Analysis Status  
- File Cache Status
- Quote Status
- Application Insights Status

## 📊 **Development Monitoring Dashboard**

The app includes a **real-time monitoring dashboard** (only visible in development mode) that shows:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Current Step   │ │  File Uploaded  │ │ Model Analyzed  │
│      1/5        │ │      ❌ No      │ │     ❌ No       │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   File Cache    │ │   Quote Ready   │ │ App Insights    │
│     ❌ None     │ │      ❌ No      │ │    📊 Active    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🔄 **Step-by-Step Endpoint Verification**

### **Step 1: File Upload API** 📁
**Endpoint:** `POST /api/files/upload`

**How to Test:**
1. Go to http://localhost:3000
2. Drag & drop any STL/OBJ file OR click "browse files"
3. **Watch for:**
   - Upload progress animation (0% → 100%)
   - Status messages: "💾 Caching file locally..." → "⬆️ Processing upload..." → "✅ Upload complete!"
   - Auto-scroll to preview section
   - Development dashboard updates: "File Uploaded: ✅ Yes" and "File Cache: 💾 Cached"

**Behind the Scenes:**
```javascript
// The upload flow automatically:
1. Validates file (size, type, name)
2. Caches file in IndexedDB (instant access)
3. Attempts backend API call (falls back to simulation)
4. Tracks telemetry (file size, upload time, cache status)
5. Updates UI state and scrolls to next step
```

**Console Verification:**
Press F12 → Console tab and look for:
```
🔄 API call failed for FileUpload, falling back to simulation: [error]
FileCached event logged
FileUploaded event logged
```

---

### **Step 2: Model Analysis API** 🔬  
**Endpoint:** `POST /api/models/analyze`

**How to Test:**
1. After file upload, you'll automatically see the 3D viewer
2. **Watch for:**
   - Three.js scene loads with Halot Mage 8K print bed
   - Model appears centered on print bed
   - Progress: "Loading 3D model..." → Model visible with info overlay
   - Model Info overlay shows: Vertices, Faces, Volume, Dimensions
   - Development dashboard: "Model Analyzed: ✅ Yes"

**Interactive Features to Test:**
- 🖱️ **Drag to rotate** the model
- 🔍 **Scroll to zoom** in/out
- 📱 **Touch controls** on mobile
- **Model auto-scaling** (models > 100mm are scaled to fit)
- **Print bed visualization** (230×130mm grid)

**Behind the Scenes:**
```javascript
// The analysis flow:
1. Retrieves file from IndexedDB cache
2. Loads STL/OBJ using Three.js loaders
3. Analyzes geometry (vertices, faces, dimensions, volume)
4. Creates 3D visualization with proper materials
5. Calculates printability (support needs, complexity)
6. Updates parent component with analysis data
```

---

### **Step 3: Pricing Calculation API** 💰
**Endpoint:** `POST /api/pricing/calculate`  

**How to Test:**
1. After model analysis, pricing panel appears
2. **Test Material Changes:**
   - Standard Resin → Tough Resin → Flexible Resin → Clear Resin → Ceramic Resin
   - Watch price updates (each material has different $/cm³)
3. **Test Quality Changes:**  
   - Draft (0.10mm) → Standard (0.05mm) → High (0.03mm) → Ultra (0.025mm)
   - Watch multipliers apply (0.8x → 1.0x → 1.3x → 1.8x)
4. **Test Color Changes:**
   - Standard colors (free) → Premium colors (+5-10%) → Glitter (+20-25%)
   - **Watch color previews** update in real-time on 3D model
   - Notice visual color swatches in selection panel

**Pricing Stability Test:**
- Change materials rapidly → Pricing should debounce (500ms delay)
- No endless loops or constant recalculations
- Final price should be deterministic and stable

**Price Breakdown to Verify:**
```
Material cost: $X.XX    (volume × material rate × quality × complexity)
Labor & setup: $8.50    (fixed)
Service fee: $4.95      (fixed) 
Tax (8%): $X.XX        (calculated)
Total: $XX.XX          (final amount)

Estimated Delivery: 3-7 business days
```

---

### **Step 4: Order Creation API** 📦
**Endpoint:** `POST /api/orders/create`

**How to Test:**
1. Click "🚀 Get This Quote - $XX.XX" button
2. Fill out order form:
   - Full Name, Email (required)
   - Shipping Address, City, ZIP (required)  
   - Phone (optional)
3. Click "Create Order - $XX.XX"
4. **Watch for:**
   - "Creating Order..." status
   - Transition to payment step
   - Order ID generation (PB12345678 format)
   - Development dashboard: "Quote Ready: 💰 Yes"

**Form Validation to Test:**
- Empty required fields → Button disabled
- Invalid email format → Validation error
- All fields filled → Button enabled

---

### **Step 5: Payment Processing API** 💳
**Endpoint:** `POST /api/payments/process`

**How to Test:**
1. After order creation, payment form appears
2. Fill out payment details:
   - Card Number: `4242424242424242` (test card)
   - Expiry: `12/28`  
   - CVV: `123`
   - Name on Card: `Test User`
3. Click payment button
4. **Watch for:**
   - "Processing payment..." status  
   - Success confirmation
   - Receipt generation
   - Final step completion (Step 5/5)

---

## 🔍 **Browser Developer Tools Testing**

### **Network Tab Monitoring:**
1. Press **F12** → **Network** tab
2. Upload a file and watch the API calls:
   ```
   POST /api/files/upload        → 200 (simulated) or 500 (fallback)
   POST /api/models/analyze      → 200 (simulated) or 500 (fallback) 
   POST /api/pricing/calculate   → 200 (simulated) or 500 (fallback)
   POST /api/orders/create       → 200 (simulated) or 500 (fallback)
   POST /api/payments/process    → 200 (simulated) or 500 (fallback)
   ```

### **Console Tab Verification:**
Look for telemetry events:
```javascript
// File Upload Events
"APICallAttempt - FileUpload"
"APICallFailed - falling back to simulation"  
"FileCached event logged"
"FileUploaded event logged"

// Model Analysis Events  
"ModelViewerInitialized"
"SimulationModelAnalysis"
"ModelAnalyzed event logged"

// Pricing Events
"MaterialChanged", "QualityChanged", "ColorChanged" 
"SimulationPricing"
"PricingCalculation event logged"

// Order Events
"OrderCreationStarted"
"QuoteGenerated event logged" 
"PaymentProcessingStarted"
"Purchase event logged"
```

### **IndexedDB Verification:**
1. **F12** → **Application** tab → **Storage** → **IndexedDB** 
2. Look for `print3dbay_files` database
3. Expand `files` object store
4. See your uploaded file cached with:
   ```javascript
   {
     id: "file_1703123456789_abc123",
     name: "model.stl", 
     size: 1234567,
     type: "application/sla",
     data: ArrayBuffer(1234567),
     uploadedAt: 1703123456789,
     lastAccessed: 1703123456789
   }
   ```

---

## 📱 **Mobile/Responsive Testing**

Test on different screen sizes:
- **Desktop:** Full layout with side-by-side panels
- **Tablet:** Stacked layout with responsive grids  
- **Mobile:** Single column, touch controls for 3D viewer

---

## 🧪 **Automated Testing Scripts**

I can create automated test scripts for you. Would you like me to create:

1. **Cypress E2E tests** that automate the entire user flow?
2. **Jest unit tests** for individual components?
3. **Playwright tests** for cross-browser verification?
4. **API testing scripts** using Postman or similar?

---

## 🚨 **Error Scenarios to Test**

### **File Upload Errors:**
- Upload file > 50MB → "File too large" error
- Upload unsupported format (.txt) → "Format not supported" error
- Upload file with name > 255 chars → "Name too long" error

### **Network Errors:**
- Disable internet → All APIs should gracefully fall back to simulation
- Check console for "falling back to simulation" messages

### **3D Model Errors:**  
- Upload corrupted STL → "Failed to load model" with error message
- Upload empty OBJ → "No mesh found in OBJ file" error

---

## 📊 **Performance Benchmarks**

Monitor these metrics during testing:

| Operation | Target Time | What to Watch |
|-----------|-------------|---------------|
| File Upload | < 2 seconds | Progress animation |
| 3D Model Load | < 5 seconds | Loading spinner → model appears |
| Pricing Calc | < 1 second | Debounced, no loops |
| Order Creation | < 3 seconds | Form submission → payment step |
| Payment Process | < 5 seconds | Processing → success |

---

## 🎯 **Success Criteria Checklist**

✅ **File Upload:**
- [ ] Files cache in IndexedDB immediately
- [ ] Progress animation completes smoothly  
- [ ] Auto-scroll to preview works
- [ ] Development dashboard updates

✅ **3D Viewer:**
- [ ] Model loads and displays correctly
- [ ] Color changes reflect on model in real-time
- [ ] Print bed shows correct Halot Mage 8K dimensions
- [ ] Orbit controls work (drag, zoom, pan)
- [ ] Model info overlay shows correct stats

✅ **Pricing:**
- [ ] No infinite loops or constant recalculations
- [ ] Materials, qualities, colors affect price correctly
- [ ] Color swatches display properly
- [ ] Debouncing prevents excessive API calls

✅ **Order Flow:**
- [ ] Form validation works correctly
- [ ] Order creation generates unique ID
- [ ] Payment form accepts test card details
- [ ] Success confirmation appears

✅ **Fallback & Error Handling:**
- [ ] All API failures gracefully fall back to simulation
- [ ] Error messages are user-friendly
- [ ] App never crashes or becomes unresponsive
- [ ] Console shows appropriate telemetry events

---

## 🔧 **Quick Debug Commands**

```bash
# Check if Three.js assets loaded correctly
ls -la node_modules/three*

# Verify build includes all dependencies  
npm run build && ls -la .next/static/chunks/

# Test IndexedDB in browser console:
# (Open DevTools Console and paste)
navigator.storage.estimate().then(estimate => 
  console.log('Storage:', estimate.usage, '/', estimate.quota)
)

# Force cleanup cached files
localStorage.clear()
# Then reload page
```

This comprehensive testing guide will help you verify every endpoint and ensure the entire system works perfectly! 🚀
