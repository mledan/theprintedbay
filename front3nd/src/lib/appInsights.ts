import { ApplicationInsights, IExceptionTelemetry, SeverityLevel } from '@microsoft/applicationinsights-web';

class AppInsightsService {
  private appInsights: ApplicationInsights;
  private isInitialized = false;

  constructor() {
    // Support both connection string and instrumentation key formats
    const connectionString = this.getConnectionString();
    
    // Log missing environment variables
    if (!process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING && !process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY) {
      console.warn('🔧 Missing Application Insights configuration. Set either:');
      console.warn('  - NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING (modern format)');
      console.warn('  - NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY (legacy format)');
    }
    
    this.appInsights = new ApplicationInsights({
      config: {
        connectionString,
        enableAutoRouteTracking: true,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        correlationHeaderExcludedDomains: ['*.blob.core.windows.net'],
        disableAjaxTracking: false,
        disableFetchTracking: false,
        excludeRequestFromAutoTrackingPatterns: ['/health', '/ping'],
      }
    });
  }

  private getConnectionString(): string {
    // Check for connection string first (modern format)
    if (process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING) {
      const connString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;
      
      // Warn if using placeholder value
      if (connString === 'InstrumentationKey=00000000-0000-0000-0000-000000000000') {
        console.warn('🔧 Application Insights is using placeholder connection string');
      }
      
      return connString;
    }
    
    // Fall back to instrumentation key (legacy format)
    if (process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY) {
      const instrumentationKey = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_INSTRUMENTATION_KEY;
      
      // Warn if using placeholder value
      if (instrumentationKey === '00000000-0000-0000-0000-000000000000') {
        console.warn('🔧 Application Insights is using placeholder instrumentation key');
      }
      
      console.log('📊 Using Application Insights instrumentation key format');
      return `InstrumentationKey=${instrumentationKey}`;
    }
    
    // Default placeholder
    console.warn('🔧 No Application Insights configuration found, using placeholder');
    return 'InstrumentationKey=00000000-0000-0000-0000-000000000000';
  }

  initialize() {
    if (!this.isInitialized) {
      this.appInsights.loadAppInsights();
      this.appInsights.trackPageView(); // Initial page view
      this.isInitialized = true;
      console.log('📊 Application Insights initialized');
    }
  }

  // Page and navigation tracking
  trackPageView(name?: string, properties?: Record<string, any>) {
    this.appInsights.trackPageView({
      name: name || 'Page View',
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      }
    });
  }

  // User interaction tracking
  trackEvent(name: string, properties?: Record<string, any>, measurements?: Record<string, number>) {
    this.appInsights.trackEvent({
      name,
      properties: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...properties
      },
      measurements
    });
  }

  // File upload tracking
  trackFileUpload(fileName: string, fileSize: number, fileType: string, success: boolean, duration?: number, errorMessage?: string) {
    this.trackEvent('FileUpload', {
      fileName,
      fileType,
      success: success.toString(),
      errorMessage: errorMessage || 'none'
    }, {
      fileSizeBytes: fileSize,
      uploadDurationMs: duration || 0
    });
  }

  // 3D model analysis tracking
  trackModelAnalysis(modelStats: {
    vertices: number;
    faces: number;
    volume?: number;
    dimensions?: { x: number; y: number; z: number };
    analysisTimeMs: number;
  }) {
    this.trackEvent('ModelAnalysis', {
      analysisComplete: 'true'
    }, {
      vertices: modelStats.vertices,
      faces: modelStats.faces,
      volumeCm3: modelStats.volume || 0,
      widthMm: modelStats.dimensions?.x || 0,
      heightMm: modelStats.dimensions?.y || 0,
      depthMm: modelStats.dimensions?.z || 0,
      analysisTimeMs: modelStats.analysisTimeMs
    });
  }

  // Pricing calculation tracking
  trackPricingCalculation(pricingData: {
    material: string;
    color: string;
    quality: string;
    volume: number;
    totalPrice: number;
    calculationTimeMs: number;
    simulationEnabled?: string;
    [key: string]: any; // Allow additional properties
  }) {
    this.trackEvent('PricingCalculation', {
      material: pricingData.material,
      color: pricingData.color,
      quality: pricingData.quality,
      simulationEnabled: pricingData.simulationEnabled || 'false'
    }, {
      volumeCm3: pricingData.volume,
      totalPriceUSD: pricingData.totalPrice,
      calculationTimeMs: pricingData.calculationTimeMs
    });
  }

  // Order/quote tracking
  trackQuoteGeneration(quoteData: {
    quoteId?: string;
    totalPrice: number;
    material: string;
    estimatedDays: number;
    success: boolean;
  }) {
    this.trackEvent('QuoteGeneration', {
      quoteId: quoteData.quoteId || 'unknown',
      material: quoteData.material,
      success: quoteData.success.toString()
    }, {
      totalPriceUSD: quoteData.totalPrice,
      estimatedDeliveryDays: quoteData.estimatedDays
    });
  }

  // Performance tracking
  trackPerformance(operationName: string, duration: number, success: boolean, additionalData?: Record<string, any>) {
    this.trackEvent('Performance', {
      operation: operationName,
      success: success.toString(),
      ...additionalData
    }, {
      durationMs: duration
    });
  }

  // Error and exception tracking
  trackError(error: Error, properties?: Record<string, any>) {
    const exception: IExceptionTelemetry = {
      exception: error,
      severityLevel: SeverityLevel.Error,
      properties: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...properties
      }
    };
    this.appInsights.trackException(exception);
  }

  // Custom metrics for business KPIs
  trackMetric(name: string, value: number, properties?: Record<string, any>) {
    this.appInsights.trackMetric({
      name,
      average: value,
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      }
    });
  }

  // Dependency tracking (API calls)
  trackDependency(name: string, commandName: string, duration: number, success: boolean, resultCode?: string) {
    this.appInsights.trackDependencyData({
      id: `dep_${Date.now()}`,
      name,
      data: commandName,
      duration,
      success,
      responseCode: resultCode ? parseInt(resultCode) : (success ? 200 : 500),
      type: 'HTTP',
      target: 'API'
    });
  }

  // User flow tracking
  trackUserFlow(stepName: string, flowName: string, stepNumber: number, additionalProperties?: Record<string, any>) {
    this.trackEvent('UserFlow', {
      flowName,
      stepName,
      stepNumber: stepNumber.toString(),
      ...additionalProperties
    });
  }

  // Conversion funnel tracking
  trackFunnelStep(funnelName: string, stepName: string, stepNumber: number, userId?: string) {
    this.trackEvent('FunnelStep', {
      funnelName,
      stepName,
      stepNumber: stepNumber.toString(),
      userId: userId || 'anonymous'
    });
  }

  // Purchase/transaction tracking
  trackPurchase(purchaseData: {
    transactionId: string;
    orderId: string;
    totalValue: number;
    currency: string;
    items: Array<{
      name: string;
      category: string;
      price: number;
      quantity: number;
    }>;
    paymentTimeMs?: number;
  }) {
    this.trackEvent('Purchase', {
      transactionId: purchaseData.transactionId,
      orderId: purchaseData.orderId,
      currency: purchaseData.currency,
      itemCount: purchaseData.items.length.toString(),
      paymentMethod: 'credit_card'
    }, {
      totalValue: purchaseData.totalValue,
      paymentTimeMs: purchaseData.paymentTimeMs || 0,
      itemQuantity: purchaseData.items.reduce((sum, item) => sum + item.quantity, 0)
    });

    // Track individual items
    purchaseData.items.forEach((item, index) => {
      this.trackEvent('PurchaseItem', {
        transactionId: purchaseData.transactionId,
        itemName: item.name,
        itemCategory: item.category,
        itemIndex: index.toString()
      }, {
        itemPrice: item.price,
        itemQuantity: item.quantity
      });
    });
  }

  // A/B Testing tracking
  trackExperiment(experimentName: string, variant: string, converted: boolean = false) {
    this.trackEvent('Experiment', {
      experimentName,
      variant,
      converted: converted.toString()
    });
  }

  // Session tracking
  setUserContext(userId: string, accountId?: string) {
    this.appInsights.setAuthenticatedUserContext(userId, accountId);
  }

  clearUserContext() {
    this.appInsights.clearAuthenticatedUserContext();
  }

  // Custom properties for all telemetry
  setGlobalProperty(key: string, value: string) {
    this.appInsights.addTelemetryInitializer((envelope) => {
      if (envelope.data) {
        envelope.data.customProperties = envelope.data.customProperties || {};
        envelope.data.customProperties[key] = value;
      }
    });
  }

  // Manual flush (useful for SPA navigation)
  flush() {
    this.appInsights.flush();
  }
}

// Singleton instance
const appInsights = new AppInsightsService();

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  appInsights.initialize();
}

export { appInsights };
export default AppInsightsService;
