/**
 * API Testing Utilities
 * 
 * This file provides utilities to test and verify each API endpoint
 * You can use these in browser console to test individual endpoints
 */

import { apiService } from './apiService';
import { fileCache } from './fileCache';
import { appInsights } from './appInsights';

// Test file for demonstrations (creates a mock STL file)
export const createTestFile = (filename: string = 'test_cube.stl', sizeKB: number = 100): File => {
  // Create a simple STL-like content for testing
  const stlContent = `
solid test_cube
  facet normal 0.0 0.0 1.0
    outer loop
      vertex 0.0 0.0 1.0
      vertex 1.0 0.0 1.0
      vertex 1.0 1.0 1.0
    endloop
  endfacet
  facet normal 0.0 0.0 1.0
    outer loop
      vertex 0.0 0.0 1.0
      vertex 1.0 1.0 1.0
      vertex 0.0 1.0 1.0
    endloop
  endfacet
endsolid test_cube
`.repeat(Math.floor(sizeKB / 2)); // Rough size estimation

  return new File([stlContent], filename, { type: 'application/sla' });
};

// Test each endpoint individually
export class EndpointTester {
  
  // Test 1: File Upload API
  static async testFileUpload(file?: File) {
    console.group('🔄 Testing File Upload API');
    
    const testFile = file || createTestFile('test_model.stl', 50);
    console.log('Test file created:', testFile.name, `${Math.round(testFile.size/1024)}KB`);
    
    try {
      const startTime = Date.now();
      const result = await apiService.uploadFile(testFile);
      const duration = Date.now() - startTime;
      
      console.log('✅ Upload Result:', result);
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log('📊 Expected: success:true, fileId:string, uploadUrl:string');
      
      // Verify file is cached
      const fileId = await fileCache.storeFile(testFile);
      console.log('💾 File cached with ID:', fileId);
      
      return { success: true, result, duration, fileId };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  }
  
  // Test 2: Model Analysis API
  static async testModelAnalysis(file?: File) {
    console.group('🔬 Testing Model Analysis API');
    
    const testFile = file || createTestFile('analysis_test.stl', 75);
    console.log('Test file for analysis:', testFile.name);
    
    try {
      const startTime = Date.now();
      const result = await apiService.analyzeModel({
        fileName: testFile.name,
        fileSize: testFile.size,
        fileType: testFile.type || testFile.name.split('.').pop() || 'unknown',
        analysisLevel: 'detailed'
      });
      const duration = Date.now() - startTime;
      
      console.log('✅ Analysis Result:', result);
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log('📊 Expected: vertices, faces, volume, dimensions, complexity, etc.');
      
      // Validate required fields
      const requiredFields = ['vertices', 'faces', 'volume', 'dimensions'];
      const missingFields = requiredFields.filter(field => !(field in result));
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
      } else {
        console.warn('⚠️ Missing fields:', missingFields);
      }
      
      return { success: true, result, duration };
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  }
  
  // Test 3: Pricing Calculation API
  static async testPricingCalculation() {
    console.group('💰 Testing Pricing Calculation API');
    
    // Mock model analysis data
    const mockAnalysis = {
      id: 'test_analysis_123',
      volume: 15.5, // cm³
      dimensions: { x: 25.0, y: 30.0, z: 20.0 }, // mm
      complexity: 'moderate'
    };
    
    const testCases = [
      { material: 'standard-resin', quality: 'standard', color: 'white' },
      { material: 'tough-resin', quality: 'high', color: 'red' },
      { material: 'clear-resin', quality: 'ultra', color: 'clear' },
      { material: 'flexible-resin', quality: 'draft', color: 'gold-glitter' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.material} + ${testCase.quality} + ${testCase.color}`);
        
        const startTime = Date.now();
        const result = await apiService.calculatePricing({
          modelAnalysisId: mockAnalysis.id,
          material: testCase.material,
          quality: testCase.quality,
          color: testCase.color,
          deliveryOption: 'standard'
        });
        const duration = Date.now() - startTime;
        
        console.log(`✅ Price for ${testCase.material}:`, `$${result.breakdown.total}`);
        console.log('📊 Breakdown:', result.breakdown);
        
        results.push({ testCase, result, duration });
        
        // Validate pricing structure
        const requiredFields = ['materialCost', 'laborCost', 'serviceFee', 'tax', 'total'];
        const missingFields = requiredFields.filter(field => !(field in result.breakdown));
        if (missingFields.length > 0) {
          console.warn('⚠️ Missing pricing fields:', missingFields);
        }
        
      } catch (error) {
        console.error(`❌ Pricing failed for ${testCase.material}:`, error);
        results.push({ testCase, error });
      }
    }
    
    console.log('🎯 Pricing Test Summary:', results);
    console.groupEnd();
    return results;
  }
  
  // Test 4: Order Creation API
  static async testOrderCreation() {
    console.group('📦 Testing Order Creation API');
    
    // Mock data
    const mockModelAnalysis = {
      id: 'test_model_456',
      fileName: 'test_order.stl',
      volume: 12.3,
      dimensions: { x: 20, y: 25, z: 15 }
    };
    
    const mockPricing = {
      breakdown: {
        materialCost: 1.85,
        laborCost: 8.50,
        serviceFee: 4.95,
        tax: 1.30,
        total: 16.60
      },
      delivery: { estimatedDays: 5 }
    };
    
    const mockCustomer = {
      email: 'test@example.com',
      name: 'Test User',
      address: '123 Test Street',
      city: 'Test City',
      zipCode: '12345',
      phone: '+1234567890'
    };
    
    try {
      const startTime = Date.now();
      const result = await apiService.createOrder(mockModelAnalysis, mockPricing, mockCustomer);
      const duration = Date.now() - startTime;
      
      console.log('✅ Order Result:', result);
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log('📊 Expected: id, orderNumber, status, customer, pricing, paymentUrl');
      
      // Validate order structure
      const requiredFields = ['id', 'orderNumber', 'status', 'paymentUrl'];
      const missingFields = requiredFields.filter(field => !(field in result));
      if (missingFields.length === 0) {
        console.log('✅ All required order fields present');
      } else {
        console.warn('⚠️ Missing order fields:', missingFields);
      }
      
      return { success: true, result, duration };
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  }
  
  // Test 5: Payment Processing API
  static async testPaymentProcessing() {
    console.group('💳 Testing Payment Processing API');
    
    const mockOrderId = 'test_order_789';
    const mockPaymentDetails = {
      amount: 25.99,
      currency: 'USD',
      paymentMethod: {
        type: 'credit_card',
        cardNumber: '4242424242424242', // Stripe test card
        expiryDate: '12/28',
        cvv: '123',
        nameOnCard: 'Test User'
      }
    };
    
    try {
      const startTime = Date.now();
      const result = await apiService.processPayment({
        orderId: mockOrderId,
        paymentMethod: mockPaymentDetails.paymentMethod,
        billingDetails: {
          name: mockPaymentDetails.paymentMethod.nameOnCard,
          email: 'test@example.com',
          phone: '+1234567890'
        }
      });
      const duration = Date.now() - startTime;
      
      console.log('✅ Payment Result:', result);
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log('📊 Expected: id, orderId, status, paymentIntentId, receipt_url');
      
      // Validate payment structure
      const requiredFields = ['id', 'orderId', 'status', 'paymentIntentId'];
      const missingFields = requiredFields.filter(field => !(field in result));
      if (missingFields.length === 0) {
        console.log('✅ All required payment fields present');
      } else {
        console.warn('⚠️ Missing payment fields:', missingFields);
      }
      
      return { success: true, result, duration };
    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  }
  
  // Test full workflow end-to-end
  static async testFullWorkflow() {
    console.group('🚀 Testing Full Workflow End-to-End');
    
    const testFile = createTestFile('workflow_test.stl', 100);
    const results: {
      fileUpload: any;
      modelAnalysis: any;
      pricingCalculation: any;
      orderCreation: any;
      paymentProcessing: any;
      totalDuration: number;
    } = {
      fileUpload: null,
      modelAnalysis: null, 
      pricingCalculation: null,
      orderCreation: null,
      paymentProcessing: null,
      totalDuration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Step 1: Upload
      console.log('Step 1/5: File Upload');
      results.fileUpload = await this.testFileUpload(testFile);
      
      // Step 2: Analysis
      console.log('Step 2/5: Model Analysis');
      results.modelAnalysis = await this.testModelAnalysis(testFile);
      
      // Step 3: Pricing (using analysis result)
      console.log('Step 3/5: Pricing Calculation');
      if (results.modelAnalysis.success) {
        const mockAnalysis = results.modelAnalysis.result;
        const pricingResult = await apiService.calculatePricing({
          modelAnalysisId: mockAnalysis.id || 'test_id',
          material: 'standard-resin',
          quality: 'standard',
          color: 'white',
          deliveryOption: 'standard'
        });
        results.pricingCalculation = { success: true, result: pricingResult };
      } else {
        results.pricingCalculation = { success: false, error: 'Analysis failed' };
      }
      
      // Step 4: Order Creation
      console.log('Step 4/5: Order Creation');
      results.orderCreation = await this.testOrderCreation();
      
      // Step 5: Payment
      console.log('Step 5/5: Payment Processing');
      results.paymentProcessing = await this.testPaymentProcessing();
      
      results.totalDuration = Date.now() - startTime;
      
      console.log('🎉 Full Workflow Complete!');
      console.log(`⏱️ Total Duration: ${results.totalDuration}ms`);
      console.log('📊 Results Summary:', results);
      
      // Success rate
      const successCount = Object.values(results)
        .filter(r => r && typeof r === 'object' && 'success' in r && r.success).length;
      console.log(`✅ Success Rate: ${successCount}/5 endpoints working`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Full workflow failed:', error);
      return { ...results, error, totalDuration: Date.now() - startTime };
    } finally {
      console.groupEnd();
    }
  }
}

// Cache Testing Utilities
export class CacheTester {
  
  static async testFileCache() {
    console.group('💾 Testing File Cache');
    
    const testFile = createTestFile('cache_test.stl', 25);
    
    try {
      // Store file
      const fileId = await fileCache.storeFile(testFile);
      console.log('✅ File stored with ID:', fileId);
      
      // Retrieve file
      const retrievedFile = await fileCache.getFile(fileId);
      console.log('✅ File retrieved:', retrievedFile?.name, retrievedFile?.size);
      
      // List files
      const allFiles = await fileCache.listFiles();
      console.log('✅ All cached files:', allFiles.length, 'files');
      
      // Cache size
      const cacheSize = await fileCache.getCacheSize();
      console.log('✅ Cache size:', Math.round(cacheSize / 1024), 'KB');
      
      // Test file URL
      const fileUrl = await fileCache.createFileURL(fileId);
      console.log('✅ File URL created:', fileUrl ? 'success' : 'failed');
      
      return { success: true, fileId, cacheSize, fileCount: allFiles.length };
      
    } catch (error) {
      console.error('❌ Cache test failed:', error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  }
  
  static async clearCache() {
    console.log('🧹 Clearing file cache...');
    
    try {
      const files = await fileCache.listFiles();
      console.log(`Found ${files.length} files to remove`);
      
      for (const file of files) {
        await fileCache.removeFile(file.id);
      }
      
      console.log('✅ Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      return false;
    }
  }
}

// Telemetry Testing
export class TelemetryTester {
  
  static testAppInsights() {
    console.group('📊 Testing Application Insights');
    
    try {
      // Test various event types
      appInsights.trackEvent('TestEvent', { testType: 'manual', timestamp: Date.now() });
      
      appInsights.trackFileUpload('test.stl', 1024, 'application/sla', true, 1500);
      
      appInsights.trackModelAnalysis({
        vertices: 1000,
        faces: 500,
        volume: 10.5,
        dimensions: { x: 20, y: 20, z: 20 },
        analysisTimeMs: 2000
      });
      
      appInsights.trackPricingCalculation({
        material: 'standard-resin',
        color: 'white',
        quality: 'standard',
        volume: 10.5,
        totalPrice: 15.99,
        calculationTimeMs: 500,
        apiMode: 'test'
      });
      
      console.log('✅ All telemetry events sent');
      console.log('Check browser console for "event logged" messages');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Telemetry test failed:', error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  }
}

// Make testing utilities available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).EndpointTester = EndpointTester;
  (window as any).CacheTester = CacheTester;
  (window as any).TelemetryTester = TelemetryTester;
  (window as any).createTestFile = createTestFile;
  
  console.log('🧪 Testing utilities loaded. Available commands:');
  console.log('- EndpointTester.testFullWorkflow()');
  console.log('- EndpointTester.testFileUpload()');
  console.log('- EndpointTester.testModelAnalysis()');
  console.log('- EndpointTester.testPricingCalculation()');
  console.log('- EndpointTester.testOrderCreation()');
  console.log('- EndpointTester.testPaymentProcessing()');
  console.log('- CacheTester.testFileCache()');
  console.log('- CacheTester.clearCache()');
  console.log('- TelemetryTester.testAppInsights()');
}
