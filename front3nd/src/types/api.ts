// API Types and Interfaces for The Printed Bay

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// File Upload Types
export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  uploadUrl?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  error?: string;
}

export interface FileUploadRequest {
  file: File;
  metadata: {
    originalName: string;
    size: number;
    type: string;
  };
}

// Model Analysis Types
export interface ModelAnalysisRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
  analysisLevel?: 'basic' | 'detailed' | 'premium';
}

export interface ModelAnalysisResponse {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dimensions: {
    x: number;
    y: number;
    z: number;
    units: 'mm' | 'inches';
  };
  volume: {
    value: number;
    units: 'mm3' | 'in3';
  };
  surfaceArea: {
    value: number;
    units: 'mm2' | 'in2';
  };
  printability: {
    score: number; // 0-100
    issues: string[];
    warnings: string[];
  };
  materialEstimate: {
    volume: number;
    weight: number;
    units: 'g' | 'ml';
  };
  printTime: {
    estimated: number; // minutes
    quality: string;
  };
  complexity: 'low' | 'medium' | 'high';
  supportRequired: boolean;
  hollowingRecommended: boolean;
}

// Pricing Types
export interface PricingRequest {
  modelAnalysisId: string;
  material: string;
  quality: string;
  color: string;
  deliveryOption?: string;
  quantity?: number;
}

export interface MaterialOption {
  material_type: string;
  name: string;
  description: string;
  base_price_per_ml: number;
  properties: {
    strength: number;
    flexibility: number;
    detail: number;
  };
  lead_time_days: number;
  colors: string[];
}

export interface QualityOption {
  name: string;
  description: string;
  layer_height_mm: number;
  speed_multiplier: number;
  price_multiplier: number;
}

export interface ColorOption {
  value: string;
  name: string;
  category: 'standard' | 'premium' | 'special';
  price_multiplier: number;
}

export interface DeliveryOption {
  days: number;
  fee: number;
  name: string;
  description: string;
}

export interface PricingOptionsResponse {
  materials: MaterialOption[];
  qualities: QualityOption[];
  colors: ColorOption[];
  deliveryOptions: Record<string, DeliveryOption>;
}

export interface PricingBreakdown {
  material: {
    volume: number;
    cost: number;
  };
  printing: {
    time_minutes: number;
    cost: number;
  };
  processing: {
    cost: number;
  };
  delivery: {
    option: string;
    cost: number;
  };
  subtotal: number;
  tax: number;
  total: number;
}

export interface PricingResponse {
  id: string;
  modelAnalysisId: string;
  material: {
    name: string;
    type: string;
    quality: string;
    color: string;
  };
  breakdown: PricingBreakdown;
  leadTime: {
    production: number; // days
    shipping: number; // days
    total: number; // days
  };
  validUntil: string; // ISO date
}

// Order Types
export interface CustomerInfo {
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
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
  };
}

export interface OrderItem {
  type: '3d_print';
  fileName: string;
  material: string;
  quality: string;
  color: string;
  price: number;
  quantity: number;
  modelAnalysisId: string;
  pricingId: string;
}

export interface OrderRequest {
  modelAnalysisId: string;
  pricingId: string;
  customer: CustomerInfo;
  delivery: {
    method: string;
  };
  items: OrderItem[];
  customerNotes?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'printing' | 'post_processing' | 'quality_check' | 'shipping' | 'delivered' | 'cancelled';
  statusDisplay: string;
  customer: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  pricing: PricingBreakdown;
  delivery: {
    option: string;
    estimatedDate: string;
    trackingNumber?: string;
  };
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface PaymentIntentRequest {
  orderId: string;
  paymentMethods?: string[];
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentRequest {
  orderId: string;
  paymentMethod: any; // Stripe PaymentMethod object
  billingDetails: {
    name: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface PaymentResponse {
  success: boolean;
  paymentIntentId: string;
  status: string;
  orderId: string;
  receiptUrl?: string;
}

// Order Tracking Types
export interface StatusUpdate {
  status: string;
  statusDisplay: string;
  notes: string;
  timestamp: string;
  customerNotified: boolean;
  images?: string[];
}

export interface OrderTrackingResponse {
  order: OrderResponse;
  statusUpdates: StatusUpdate[];
  containerFiles: {
    name: string;
    url: string;
    type: 'model' | 'image' | 'document';
  }[];
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
