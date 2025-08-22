# Print3D Bay - Complete System Sequence Diagram

## 🔄 User Journey & System Interactions

```mermaid
sequenceDiagram
    participant C as Customer
    participant FE as Frontend (Next.js)
    participant BE as Backend (Django)
    participant FC as File Cache
    participant AS as Azure Storage  
    participant ST as Stripe
    participant AI as App Insights
    participant EM as Email Service
    participant OP as Operator
    participant PS as Print System
    participant INV as Inventory

    Note over C,INV: 📋 PHASE 1: FILE UPLOAD & ANALYSIS
    
    C->>FE: 1. Upload 3D model file
    FE->>FC: 2. Cache file locally
    FE->>AI: 3. Track upload event
    FE->>FE: 4. Show 3D preview immediately
    
    par Background Upload
        FE->>BE: 5. Upload to backend (background)
        BE->>AS: 6. Store in Azure Blob
        BE->>BE: 7. Analyze model geometry
        BE->>FE: 8. Return analysis results
    end
    
    FE->>C: 9. Display model preview & analysis
    
    Note over C,INV: 💰 PHASE 2: PRICING & QUOTATION
    
    C->>FE: 10. Select material/quality/color
    FE->>BE: 11. Request pricing calculation
    BE->>INV: 12. Check material availability
    INV->>BE: 13. Return stock levels & pricing
    BE->>BE: 14. Calculate: material + labor + overhead
    BE->>FE: 15. Return detailed quote
    FE->>AI: 16. Track quote generation
    FE->>C: 17. Display pricing breakdown
    
    Note over C,INV: 🛒 PHASE 3: ORDER CREATION
    
    C->>FE: 18. Fill customer details
    C->>FE: 19. Select shipping option
    FE->>BE: 20. Create order record
    BE->>AS: 21. Store order data
    BE->>BE: 22. Generate order number
    BE->>FE: 23. Return order ID
    FE->>C: 24. Show order confirmation
    
    Note over C,INV: 💳 PHASE 4: PAYMENT PROCESSING
    
    C->>FE: 25. Enter payment details
    FE->>ST: 26. Create payment intent
    ST->>FE: 27. Return client secret
    C->>FE: 28. Confirm payment
    FE->>ST: 29. Process payment
    ST->>BE: 30. Webhook: payment successful
    BE->>AS: 31. Update order status to PAID
    BE->>EM: 32. Send confirmation email
    BE->>AI: 33. Track successful payment
    
    Note over C,INV: 🏭 PHASE 5: PRODUCTION WORKFLOW
    
    BE->>OP: 34. Notify operator of new order
    OP->>PS: 35. Queue print job
    PS->>INV: 36. Reserve materials
    PS->>PS: 37. Start printing
    PS->>BE: 38. Update status: PRINTING
    BE->>EM: 39. Send "in production" email
    
    PS->>PS: 40. Complete print job
    PS->>BE: 41. Update status: PRINTED
    OP->>OP: 42. Quality check & post-processing
    OP->>BE: 43. Update status: READY_TO_SHIP
    
    Note over C,INV: 📦 PHASE 6: FULFILLMENT
    
    OP->>BE: 44. Generate shipping label
    OP->>BE: 45. Update status: SHIPPED
    BE->>EM: 46. Send tracking email
    BE->>C: 47. SMS tracking notification
    
    Note over C,INV: 📊 PHASE 7: COMPLETION & ANALYTICS
    
    C->>FE: 48. Track via magic link
    FE->>BE: 49. Get order status
    BE->>FE: 50. Return tracking info
    
    alt Package Delivered
        BE->>EM: 51. Send delivery confirmation
        BE->>C: 52. Request review/feedback
        BE->>AI: 53. Track order completion
    end
    
    Note over C,INV: 🔄 CONTINUOUS OPERATIONS
    
    loop Every Hour
        PS->>INV: Monitor material levels
        INV->>OP: Alert low stock
        OP->>INV: Reorder materials
    end
    
    loop Daily
        AI->>OP: Send performance analytics
        BE->>OP: Generate revenue reports
    end
```

## 🏗️ System Architecture Flow

```mermaid
graph TD
    A[Customer Portal] --> B[File Upload Service]
    B --> C[3D Model Analysis]
    C --> D[Pricing Engine]
    D --> E[Order Management]
    E --> F[Payment Processing]
    F --> G[Production Queue]
    G --> H[Printer Management]
    H --> I[Quality Control]
    I --> J[Fulfillment]
    J --> K[Customer Notifications]
    
    L[Inventory Management] --> D
    L --> H
    M[Analytics Engine] --> N[Business Intelligence]
    N --> O[Operator Dashboard]
    
    P[Territory Management] --> O
    P --> Q[Revenue Sharing]
    
    subgraph "Missing Systems"
        R[Customer Support]
        S[Mobile Apps]
        T[Advanced Analytics]
        U[Franchise Portal]
    end
```

## 🎯 Critical Data Flows

### Order State Machine
```
OPPORTUNITY → QUOTED → PAID → QUEUED → PRINTING → PRINTED → 
QUALITY_CHECK → READY_TO_SHIP → SHIPPED → DELIVERED → COMPLETE
```

### Material Inventory Flow
```
STOCK_AVAILABLE → RESERVED → CONSUMED → LOW_STOCK_ALERT → REORDERED → RESTOCKED
```

### Territory Revenue Flow (Future)
```
ORDER_COMPLETED → REVENUE_CALCULATION → PLATFORM_FEE → TERRITORY_PAYOUT → MONTHLY_SETTLEMENT
```
