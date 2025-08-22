/**
 * API Service - Real API calls with simulation fallback
 * 
 * This service always tries to make real API calls to your backend first.
 * If the backend is not available or returns an error, it gracefully falls back
 * to simulation mode so the user can still interact with the app.
 */

import { appInsights } from './appInsights';
import { simulationService } from './simulation';

// API Base URLs - using Azure Functions for Static Web Apps
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Log missing environment variables
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('🔧 Missing environment variable: NEXT_PUBLIC_API_URL - using fallback: /api');
}
// API Key is optional for Azure Static Web Apps (authentication handled by Azure Functions)
if (!process.env.NEXT_PUBLIC_API_KEY) {
  console.log('📊 API Key not set - using Azure Functions authentication');
}
const ENDPOINTS = {
  uploadFile: `${API_BASE_URL}/files-upload`,
  analyzeModel: `${API_BASE_URL}/models-analyze`,
  calculatePricing: `${API_BASE_URL}/pricing-calculate`,
  getPricingOptions: `${API_BASE_URL}/pricing-calculate`, // Fallback to pricing-calculate for now
  createOrder: `${API_BASE_URL}/orders-create`,
  createPaymentIntent: `${API_BASE_URL}/payments-create-intent`,
  processPayment: `${API_BASE_URL}/payments-process`,
  trackOrder: `${API_BASE_URL}/orders-status`, // Azure Functions uses orders-status
  orderStatus: `${API_BASE_URL}/orders-status`,
  sendNotification: `${API_BASE_URL}/notifications-send`,
};

class ApiService {
  private useSimulationFallback = process.env.ENABLE_SIMULATION_FALLBACK === 'true';
  
  constructor() {
    console.log('🚀 API Service initialized:', {
      baseUrl: API_BASE_URL,
      simulationFallback: this.useSimulationFallback,
      environment: process.env.NODE_ENV
    })
  }

  // Helper method to make API requests with fallback
  private async makeApiRequest<T>(
    url: string,
    options: RequestInit,
    fallbackMethod: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Try real API call first
      console.log(`🌐 Making real API call: ${operationName} -> ${url}`)
      
      appInsights.trackEvent('APICallAttempt', {
        operation: operationName,
        url,
        method: options.method || 'GET'
      })

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_KEY && {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
          }),
          ...options.headers,
        },
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log(`✅ Real API call successful: ${operationName} (${duration}ms)`)
      
      // Track successful API call
      appInsights.trackDependency(operationName, url, duration, true, response.status.toString())
      appInsights.trackEvent('APICallSuccess', {
        operation: operationName,
        responseTime: duration.toString(),
        fallbackUsed: 'false'
      })

      return data

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown API error';

      // Track API failure
      appInsights.trackDependency(operationName, url, duration, false, '0');
      appInsights.trackEvent('APICallFailed', {
        operation: operationName,
        error: errorMessage,
        fallbackAvailable: this.useSimulationFallback.toString()
      });

      // Fall back to simulation if enabled
      if (this.useSimulationFallback) {
        console.warn(`🔄 API call failed for ${operationName}, falling back to simulation:`, errorMessage)
        
        appInsights.trackEvent('FallbackToSimulation', {
          operation: operationName,
          originalError: errorMessage
        })

        return await fallbackMethod()
      } else {
        console.error(`❌ API call failed for ${operationName} and simulation fallback is disabled:`, errorMessage)
      }

      // Re-throw if no fallback
      throw error;
    }
  }

  // File upload with FormData
  async uploadFile(file: File): Promise<{ success: boolean; fileId: string; uploadUrl?: string; error?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      originalName: file.name,
      size: file.size,
      type: file.type
    }));

    return this.makeApiRequest(
      ENDPOINTS.uploadFile,
      {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set Content-Type for FormData
      },
      () => simulationService.uploadFile(file),
      'FileUpload'
    );
  }

  // 3D model analysis with updated signature
  async analyzeModel(data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    analysisLevel?: string;
  }): Promise<any> {
    const requestData = {
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType.toLowerCase(),
      analysisLevel: data.analysisLevel || 'detailed'
    };

    return this.makeApiRequest(
      ENDPOINTS.analyzeModel,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      () => simulationService.analyzeModel({ name: data.fileName, size: data.fileSize } as File),
      'ModelAnalysis'
    );
  }

  // Pricing calculation with updated structure
  async calculatePricing(data: {
    modelAnalysisId: string;
    material: string;
    quality: string;
    color: string;
    deliveryOption?: string;
  }): Promise<any> {
    const requestData = {
      modelAnalysisId: data.modelAnalysisId,
      material: data.material,
      quality: data.quality,
      color: data.color,
      deliveryOption: data.deliveryOption || 'standard'
    };

    return this.makeApiRequest(
      ENDPOINTS.calculatePricing,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      () => simulationService.calculatePricing({}, data.material, data.quality, data.color),
      'PricingCalculation'
    );
  }

  // Get pricing options
  async getPricingOptions(): Promise<any> {
    return this.makeApiRequest(
      ENDPOINTS.getPricingOptions,
      {
        method: 'GET',
        headers: {},
      },
      () => Promise.resolve({
        materials: [
          { material_type: 'standard-resin', name: 'Standard Resin', description: 'General purpose resin', lead_time_days: 3 },
          { material_type: 'tough-resin', name: 'Tough Resin', description: 'High strength resin', lead_time_days: 5 },
        ],
        qualities: [
          { name: 'draft', description: 'Draft quality', layer_height_mm: 0.3 },
          { name: 'standard', description: 'Standard quality', layer_height_mm: 0.2 },
          { name: 'high', description: 'High quality', layer_height_mm: 0.1 },
        ],
        colors: [
          { value: 'white', name: 'White', category: 'standard' },
          { value: 'black', name: 'Black', category: 'standard' },
          { value: 'red', name: 'Red', category: 'premium' },
        ],
        deliveryOptions: {
          standard: { days: 7, fee: 9.99, name: 'Standard Delivery' },
          express: { days: 3, fee: 19.99, name: 'Express Delivery' },
          rush: { days: 1, fee: 39.99, name: 'Rush Delivery' }
        }
      }),
      'GetPricingOptions'
    );
  }

  // Order creation
  async createOrder(
    modelAnalysis: any,
    pricing: any,
    customerInfo: any
  ): Promise<any> {
    const requestData = {
      modelAnalysisId: modelAnalysis.id || 'temp_id',
      pricingId: pricing.id || 'temp_id',
      customer: {
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: {
          street: customerInfo.address,
          city: customerInfo.city,
          state: 'CA', // Default for now
          zip: customerInfo.zipCode,
          country: 'US' // Default for now
        }
      },
      delivery: {
        method: 'standard'
      },
      items: [{
        type: '3d_print',
        fileName: modelAnalysis.fileName,
        material: pricing.material?.name,
        quality: pricing.material?.quality,
        color: pricing.material?.color,
        price: pricing.breakdown?.total,
        quantity: 1
      }]
    };

    return this.makeApiRequest(
      ENDPOINTS.createOrder,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      () => simulationService.createOrder(modelAnalysis, pricing, customerInfo),
      'OrderCreation'
    );
  }

  // Create order with new backend structure
  async createOrderFromQuote(data: {
    quoteId: string;
    customer: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      company?: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
      billingAddress?: {
        sameAsShipping: boolean;
      };
      preferences?: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        marketingEmails: boolean;
      };
    };
    customerNotes?: string;
  }): Promise<any> {
    const requestData = {
      quoteId: data.quoteId,
      customer: data.customer,
      customerNotes: data.customerNotes || ''
    };

    return this.makeApiRequest(
      ENDPOINTS.createOrder,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      () => simulationService.createOrder({}, {}, data.customer),
      'OrderCreation'
    );
  }

  // Create Stripe Payment Intent
  async createPaymentIntent(data: {
    orderId: string;
    paymentMethods?: string[];
  }): Promise<any> {
    const requestData = {
      orderId: data.orderId,
      paymentMethods: data.paymentMethods || ['card']
    };

    return this.makeApiRequest(
      ENDPOINTS.createPaymentIntent,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      () => Promise.resolve({
        clientSecret: 'pi_test_client_secret_xxx',
        paymentIntentId: 'pi_test_xxx',
        amount: 2599,
        currency: 'usd'
      }),
      'CreatePaymentIntent'
    );
  }

  // Process payment with Stripe
  async processPayment(data: {
    orderId: string;
    paymentMethod: any;
    billingDetails: any;
  }): Promise<any> {
    const requestData = {
      orderId: data.orderId,
      paymentMethod: data.paymentMethod,
      billingDetails: data.billingDetails
    };

    return this.makeApiRequest(
      ENDPOINTS.processPayment,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      },
      () => simulationService.processPayment(data.orderId, data),
      'PaymentProcessing'
    );
  }

  // Track order by order number
  async trackOrder(orderNumber: string): Promise<any> {
    return this.makeApiRequest(
      `${ENDPOINTS.trackOrder}/${orderNumber}`,
      {
        method: 'GET',
        headers: {},
      },
      () => Promise.resolve({
        order: {
          id: 'test-order-id',
          orderNumber: orderNumber,
          status: 'in_production',
          statusDisplay: 'In Production',
          customer: {
            name: 'Test User',
            email: 'test@example.com'
          },
          pricing: { total: 25.99 },
          delivery: {
            option: 'standard',
            estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            actualDate: null
          },
          createdAt: new Date().toISOString()
        },
        statusUpdates: [
          {
            status: 'in_production',
            statusDisplay: 'In Production',
            notes: 'Your order is being printed',
            timestamp: new Date().toISOString(),
            customerNotified: true
          }
        ],
        containerFiles: []
      }),
      'TrackOrder'
    );
  }

  // Utility methods
  setSimulationFallback(enabled: boolean) {
    this.useSimulationFallback = enabled;
    appInsights.trackEvent('SimulationFallbackToggled', {
      enabled: enabled.toString()
    });
  }

  getStatus() {
    return {
      apiBaseUrl: API_BASE_URL,
      simulationFallbackEnabled: this.useSimulationFallback,
      endpoints: ENDPOINTS
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
