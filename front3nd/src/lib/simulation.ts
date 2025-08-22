/**
 * Headless Simulation Service
 * 
 * This service simulates backend API responses for development purposes.
 * Toggle ENABLE_SIMULATION to switch between real API calls and simulated responses.
 * 
 * When ENABLE_SIMULATION is true, all API calls are intercepted and return
 * realistic mock data with appropriate delays to simulate network latency.
 */

import { appInsights } from './appInsights';

// 🚀 FEATURE FLAG: Always try real API first, fallback to simulation if it fails
const ENABLE_SIMULATION_FALLBACK = true;

// Simulate network delays for realism
const NETWORK_DELAYS = {
  fileUpload: 1500,      // File upload processing
  modelAnalysis: 3000,   // 3D model analysis
  pricingCalculation: 800, // Pricing calculation  
  orderCreation: 1200,   // Order creation
  paymentProcessing: 2000 // Payment processing
};

// Mock data generators
const generateRandomId = () => `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateModelAnalysis = (file: File) => {
  // Simulate realistic model analysis based on file size
  const complexity = Math.min(file.size / 1000000, 5); // MB to complexity factor
  
  return {
    id: generateRandomId(),
    fileName: file.name,
    fileSize: file.size,
    format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
    
    // Geometry analysis
    vertices: Math.floor(10000 + (complexity * 20000) + (Math.random() * 15000)),
    faces: Math.floor(5000 + (complexity * 10000) + (Math.random() * 8000)),
    edges: Math.floor(15000 + (complexity * 30000) + (Math.random() * 12000)),
    
    // Physical properties  
    volume: Math.round((5 + (complexity * 20) + (Math.random() * 15)) * 100) / 100, // cm³
    surfaceArea: Math.round((50 + (complexity * 200) + (Math.random() * 100)) * 100) / 100, // cm²
    dimensions: {
      x: Math.round((20 + Math.random() * 80) * 10) / 10, // mm
      y: Math.round((15 + Math.random() * 60) * 10) / 10, // mm
      z: Math.round((10 + Math.random() * 40) * 10) / 10, // mm
    },
    
    // Print analysis
    complexity: complexity > 3 ? 'complex' : complexity > 1.5 ? 'moderate' : 'simple',
    supportNeeded: Math.random() > 0.6, // 40% chance of needing supports
    overhangs: Math.floor(Math.random() * 15),
    bridging: Math.floor(Math.random() * 8),
    hollowPercentage: Math.round(Math.random() * 30), // % hollow
    
    // Printability assessment
    printable: Math.random() > 0.05, // 95% chance it's printable
    warnings: generateWarnings(complexity),
    recommendations: generateRecommendations(complexity),
    
    // Processing metadata
    processingTime: Date.now() - Date.now() + NETWORK_DELAYS.modelAnalysis,
    timestamp: new Date().toISOString(),
  };
};

const generateWarnings = (complexity: number) => {
  const warnings = [];
  if (complexity > 3) warnings.push('High complexity model - longer print time expected');
  if (Math.random() > 0.7) warnings.push('Thin walls detected - may require support');
  if (Math.random() > 0.8) warnings.push('Overhangs detected - supports recommended');
  if (Math.random() > 0.9) warnings.push('Model may require scaling for optimal print quality');
  return warnings;
};

const generateRecommendations = (complexity: number) => {
  const recommendations = [];
  if (complexity > 2) recommendations.push('Consider using higher quality settings for better detail');
  if (Math.random() > 0.6) recommendations.push('PLA material recommended for this model');
  if (Math.random() > 0.7) recommendations.push('0.2mm layer height optimal for this model');
  recommendations.push('Ensure proper bed adhesion for successful print');
  return recommendations;
};

const generatePricingBreakdown = (analysis: any, material: string, quality: string, color: string) => {
  const volume = analysis.volume || 10;
  const dimensions = analysis.dimensions || { x: 30, y: 30, z: 30 };
  
  // Use hash of inputs to make complexity deterministic
  const inputHash = `${volume}-${material}-${quality}-${color}`.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const complexity = Math.abs(inputHash % 100) > 70 ? 1.5 : Math.abs(inputHash % 100) > 30 ? 1.2 : 1.0;
  
  // Enhanced material costs per cm³ with better margins 💰
  const materialPricing: Record<string, number> = {
    'standard-resin': 0.22,   // Was 0.15, increased 47%
    'tough-resin': 0.30,      // Was 0.20, increased 50%
    'flexible-resin': 0.45,   // Was 0.30, increased 50%
    'clear-resin': 0.28,      // Was 0.18, increased 56%
    'ceramic-resin': 0.55,    // Was 0.35, increased 57%
    // Legacy FDM support
    pla: 0.12,
    abs: 0.15,
    petg: 0.18,
    tpu: 0.35
  };
  
  // Enhanced quality multipliers for better margins
  const qualityMultipliers: Record<string, number> = {
    draft: 0.85,     // Was 0.8
    standard: 1.15,  // Was 1.0, base price increase
    high: 1.55,      // Was 1.3, premium pricing
    ultra: 2.25      // Was 1.8, luxury pricing
  };
  
  // Enhanced color premiums - premium colors cost more
  const colorPremiums: Record<string, number> = {
    white: 0,
    black: 0.02,
    gray: 0.02,
    clear: 0.20,      // Was 0.15, premium transparent
    red: 0.08,        // Was 0.05, increased
    blue: 0.08,       // Was 0.05, increased
    green: 0.08,      // Was 0.05, increased
    yellow: 0.12,     // Was 0.08, increased
    orange: 0.12,     // Was 0.08, increased
    purple: 0.15,     // Was 0.10, premium color
    'gold-glitter': 0.35,  // Was 0.25, luxury
    'silver-glitter': 0.30  // Was 0.20, luxury
  };
  
  // Smart support detection based on model analysis
  const needsSupports = analysis.supportNeeded || 
                       dimensions.z > Math.max(dimensions.x, dimensions.y) * 1.5 || 
                       volume > 20; // Larger objects often need supports
  
  // Enhanced support pricing - supports are expensive! 💰
  const baseSupportCost = needsSupports ? Math.max(4.50, volume * 0.15) : 0;
  
  // Complex models need more support
  const complexitySupportMultiplier = complexity > 1.3 ? 1.4 : 1.0;
  const supportCost = baseSupportCost * complexitySupportMultiplier;
  
  const baseMaterialCost = volume * (materialPricing[material] || 0.15);
  const qualityMultiplier = qualityMultipliers[quality] || 1.0;
  const complexityMultiplier = complexity;
  const colorPremium = baseMaterialCost * (colorPremiums[color] || 0);
  
  const materialCost = baseMaterialCost * qualityMultiplier * complexityMultiplier;
  
  // Enhanced labor costs - skilled work costs more
  const baseLaborCost = 12.50; // Was 8.50, increased 47%
  const complexityLaborMultiplier = complexity > 1.3 ? 1.3 : 1.0;
  const laborCost = baseLaborCost * complexityLaborMultiplier;
  
  // Post-processing costs for high quality
  const postProcessingCost = quality === 'ultra' ? 6.00 : 
                           quality === 'high' ? 3.50 : 0;
  
  // Enhanced service fee
  const serviceFee = 6.95; // Was 4.95, increased 40%
  
  const subtotal = materialCost + laborCost + supportCost + colorPremium + postProcessingCost;
  const tax = subtotal * 0.0875; // 8.75% tax (slightly higher)
  const total = subtotal + serviceFee + tax;
  
  // Estimate delivery time based on complexity and quality
  const estimatedDays = quality === 'ultra' ? 8 : 
                       quality === 'high' ? 6 : 
                       needsSupports ? 5 :
                       complexity > 1.3 ? 4 : 3;
  
  return {
    id: `pricing_${Math.abs(inputHash)}_${Date.now()}`,
    breakdown: {
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      supportCost: Math.round(supportCost * 100) / 100,
      colorPremium: Math.round(colorPremium * 100) / 100,
      postProcessingCost: Math.round(postProcessingCost * 100) / 100,
      serviceFee,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    },
    delivery: {
      estimatedDays,
      rushAvailable: estimatedDays > 3,
      rushCost: estimatedDays > 3 ? 19.99 : 0 // Was 15.00, increased rush fee
    },
    material: {
      name: material,
      color,
      quality,
      estimatedWeight: Math.round(volume * 1.2 * 10) / 10, // grams
      wastePercentage: needsSupports ? 18 : 10, // More realistic waste
      supportsRequired: needsSupports,
      complexityLevel: complexity > 1.3 ? 'high' : complexity > 1.1 ? 'medium' : 'low'
    },
    timestamp: new Date().toISOString()
  };
};

const generateOrder = (modelAnalysis: any, pricing: any, customerInfo: any) => {
  const orderNumber = `PB${Date.now().toString().slice(-8)}`;
  
  return {
    id: generateRandomId(),
    orderNumber,
    status: 'pending_payment',
    customer: {
      email: customerInfo.email,
      name: customerInfo.name || 'Customer',
      phone: customerInfo.phone || null
    },
    model: {
      fileName: modelAnalysis.fileName,
      analysis: modelAnalysis,
      specifications: {
        material: pricing.material.name,
        color: pricing.material.color,
        quality: pricing.material.quality
      }
    },
    pricing: pricing.breakdown,
    delivery: pricing.delivery,
    timeline: {
      ordered: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + (pricing.delivery.estimatedDays * 24 * 60 * 60 * 1000)).toISOString(),
      estimatedShipping: new Date(Date.now() + ((pricing.delivery.estimatedDays + 2) * 24 * 60 * 60 * 1000)).toISOString()
    },
    paymentUrl: `https://checkout.stripe.com/c/pay/sim_payment_${generateRandomId()}`,
    trackingUrl: `https://theprintedbay.com/track#${orderNumber}`,
    timestamp: new Date().toISOString()
  };
};

// Simulation service class
class SimulationService {
  private isEnabled = true; // Always enabled as fallback
  
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    appInsights.trackEvent('SimulationToggled', {
      enabled: enabled.toString(),
      environment: process.env.NODE_ENV || 'unknown'
    });
  }
  
  getStatus() {
    return {
      enabled: this.isEnabled,
      environment: process.env.NODE_ENV,
      delays: NETWORK_DELAYS
    };
  }
  
  // Simulate file upload processing
  async uploadFile(file: File): Promise<{ success: boolean; fileId: string; uploadUrl?: string; error?: string }> {
    if (!this.isEnabled) {
      // Return real API call structure when simulation is disabled
      throw new Error('Simulation disabled - implement real file upload API call here');
    }
    
    appInsights.trackEvent('SimulationFileUpload', {
      fileName: file.name,
      fileSize: file.size.toString(),
      fileType: file.type
    });
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAYS.fileUpload));
    
    const fileId = generateRandomId();
    return {
      success: true,
      fileId,
      uploadUrl: `https://api.theprintedbay.com/files/${fileId}`
    };
  }
  
  // Simulate 3D model analysis
  async analyzeModel(file: File): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('Simulation disabled - implement real model analysis API call here');
    }
    
    appInsights.trackEvent('SimulationModelAnalysis', {
      fileName: file.name,
      fileSize: file.size.toString()
    });
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAYS.modelAnalysis));
    
    return generateModelAnalysis(file);
  }
  
  // Simulate pricing calculation
  async calculatePricing(modelAnalysis: any, material: string, quality: string, color: string): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('Simulation disabled - implement real pricing API call here');
    }
    
    appInsights.trackEvent('SimulationPricing', {
      material,
      quality,
      color,
      volume: modelAnalysis.volume?.toString() || '0'
    });
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAYS.pricingCalculation));
    
    return generatePricingBreakdown(modelAnalysis, material, quality, color);
  }
  
  // Simulate order creation
  async createOrder(modelAnalysis: any, pricing: any, customerInfo: any): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('Simulation disabled - implement real order creation API call here');
    }
    
    appInsights.trackEvent('SimulationOrderCreation', {
      customerEmail: customerInfo.email,
      totalPrice: pricing.breakdown.total.toString()
    });
    
    // Simulate order creation delay
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAYS.orderCreation));
    
    return generateOrder(modelAnalysis, pricing, customerInfo);
  }
  
  // Simulate payment processing
  async processPayment(orderId: string, paymentDetails: any): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('Simulation disabled - implement real payment processing API call here');
    }
    
    appInsights.trackEvent('SimulationPayment', {
      orderId,
      amount: paymentDetails.amount?.toString() || '0'
    });
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAYS.paymentProcessing));
    
    return {
      id: generateRandomId(),
      orderId,
      status: 'succeeded',
      paymentIntentId: `pi_sim_${generateRandomId()}`,
      amount: paymentDetails.amount,
      currency: 'usd',
      receipt_url: `https://pay.stripe.com/receipts/sim_${generateRandomId()}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const simulationService = new SimulationService();

// Export types for backend developers
export interface BackendFileUploadRequest {
  file: File;
  metadata?: {
    originalName: string;
    size: number;
    type: string;
  };
}

export interface BackendFileUploadResponse {
  success: boolean;
  fileId: string;
  uploadUrl?: string;
  error?: string;
}

export interface BackendModelAnalysisRequest {
  fileId: string;
  fileName: string;
  analysisLevel: 'basic' | 'detailed' | 'advanced';
}

export interface BackendModelAnalysisResponse {
  id: string;
  fileName: string;
  fileSize: number;
  format: string;
  vertices: number;
  faces: number;
  edges: number;
  volume: number; // cm³
  surfaceArea: number; // cm²
  dimensions: { x: number; y: number; z: number }; // mm
  complexity: 'simple' | 'moderate' | 'complex';
  supportNeeded: boolean;
  overhangs: number;
  bridging: number;
  hollowPercentage: number;
  printable: boolean;
  warnings: string[];
  recommendations: string[];
  processingTime: number; // ms
  timestamp: string;
}

export interface BackendPricingRequest {
  modelAnalysisId: string;
  material: string;
  quality: string;
  color: string;
  quantity?: number;
}

export interface BackendPricingResponse {
  id: string;
  breakdown: {
    materialCost: number;
    laborCost: number;
    supportCost: number;
    colorPremium: number;
    serviceFee: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  delivery: {
    estimatedDays: number;
    rushAvailable: boolean;
    rushCost: number;
  };
  material: {
    name: string;
    color: string;
    quality: string;
    estimatedWeight: number; // grams
    wastePercentage: number;
  };
  timestamp: string;
}

export interface BackendOrderRequest {
  modelAnalysisId: string;
  pricingId: string;
  customer: {
    email: string;
    name?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  delivery: {
    method: 'standard' | 'rush';
    address?: any; // If different from customer address
  };
}

export interface BackendOrderResponse {
  id: string;
  orderNumber: string;
  status: 'pending_payment' | 'paid' | 'in_production' | 'completed' | 'shipped';
  customer: object;
  model: object;
  pricing: object;
  delivery: object;
  timeline: {
    ordered: string;
    estimatedCompletion: string;
    estimatedShipping: string;
  };
  paymentUrl: string;
  trackingUrl: string;
  timestamp: string;
}

export default simulationService;
