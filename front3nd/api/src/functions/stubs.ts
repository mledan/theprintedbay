import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import Stripe from 'stripe';
import sgMail from '@sendgrid/mail';
import DatabaseService from './database';
import ShippingService, { ShippingAddress, ShippingItem } from './shipping';

// Generic CORS handler
const handleCORS = (methods = 'GET, POST, OPTIONS'): HttpResponseInit => ({
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
  }
});

// Generic success response
const successResponse = (data: any): HttpResponseInit => ({
  status: 200,
  headers: { 'Access-Control-Allow-Origin': '*' },
  jsonBody: { success: true, ...data }
});

// Generic error response
const errorResponse = (error: string, status = 500): HttpResponseInit => ({
  status,
  headers: { 'Access-Control-Allow-Origin': '*' },
  jsonBody: { success: false, error }
});

export async function pricingCalculate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('POST, OPTIONS');
  
  try {
    const body = await request.json() as any;
    const { volume, material = 'Standard Resin', orderId } = body;
    
    context.log(`💰 Calculating pricing for volume: ${volume}, material: ${material}`);
    
    // Calculate pricing (simplified calculation)
    const volumeNum = parseFloat(volume) || 45.2;
    const basePrice = volumeNum * 0.25; // $0.25 per cubic cm
    const materialCost = volumeNum * 0.15; // $0.15 per cubic cm for material
    const processingFee = 3.00; // Fixed processing fee
    const total = basePrice + materialCost + processingFee;
    
    const pricingData = {
      pricingId: `pricing-${Date.now()}`,
      orderId,
      material,
      volume: volume?.toString() || '45.2',
      basePrice: Math.round(basePrice * 100) / 100,
      materialCost: Math.round(materialCost * 100) / 100,
      processingFee,
      total: Math.round(total * 100) / 100,
      currency: 'USD',
      estimatedDays: material === 'Premium Resin' ? 2 : 3
    };
    
    // Initialize database and save pricing
    const db = DatabaseService.getInstance();
    await db.initialize(context);
    const savedPricing = await db.savePricing(pricingData, context);
    
    return successResponse(savedPricing || pricingData);
    
  } catch (error) {
    context.error('❌ Pricing calculation failed:', error);
    return errorResponse('Failed to calculate pricing', 500);
  }
}

export async function ordersCreate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('POST, OPTIONS');
  
  try {
    const body = await request.json() as any;
    const { customerEmail, total, currency = 'USD', fileUrl, fileName } = body;
    
    context.log(`📦 Creating order for ${customerEmail}, total: $${total}`);
    
    const orderData = {
      orderId: `TPB-${Date.now()}`,
      customerEmail: customerEmail || 'customer@example.com',
      total: total || 24.25,
      currency,
      status: 'pending_payment',
      fileUrl,
      fileName
    };
    
    // Initialize database and create order
    const db = DatabaseService.getInstance();
    await db.initialize(context);
    const createdOrder = await db.createOrder(orderData, context);
    
    return successResponse(createdOrder || { ...orderData, created: new Date().toISOString() });
    
  } catch (error) {
    context.error('❌ Order creation failed:', error);
    return errorResponse('Failed to create order', 500);
  }
}

export async function paymentsCreateIntent(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('POST, OPTIONS');
  
  try {
    const body = await request.json() as any;
    const { orderId, amount, currency = 'usd' } = body;
    
    context.log(`💳 Creating payment intent for order ${orderId}, amount: ${amount}`);
    
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey.includes('your_secret_key_here')) {
      context.warn('⚠️ Stripe not configured, using mock payment intent');
      const mockIntent = {
        clientSecret: `pi_mock_${Date.now()}_secret`,
        paymentIntentId: `pi_mock_${Date.now()}`,
        amount: amount || 2425,
        currency
      };
      return successResponse(mockIntent);
    }
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    
    // Create real Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 2425, // amount in cents
      currency,
      metadata: {
        orderId: orderId || `order_${Date.now()}`,
        source: 'theprintedbay_web'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    context.log(`✅ Stripe Payment Intent created: ${paymentIntent.id}`);
    
    return successResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
    
  } catch (error) {
    context.error('❌ Payment intent creation failed:', error);
    return errorResponse('Failed to create payment intent', 500);
  }
}

export async function paymentsProcess(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('POST, OPTIONS');
  
  try {
    const body = await request.json() as any;
    const { paymentIntentId, orderId } = body;
    
    context.log(`✅ Processing payment for intent ${paymentIntentId}, order: ${orderId}`);
    
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey.includes('your_secret_key_here')) {
      context.warn('⚠️ Stripe not configured, using mock payment processing');
      const mockPayment = {
        paymentId: `pay_${Date.now()}`,
        status: 'succeeded',
        amount: 2425,
        currency: 'usd',
        processed: new Date().toISOString()
      };
      return successResponse(mockPayment);
    }
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    
    // Retrieve the payment intent to get its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Save payment to database
    const db = DatabaseService.getInstance();
    await db.initialize(context);
    
    const paymentData = {
      paymentId: paymentIntent.id,
      orderId: orderId || 'unknown',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      stripePaymentIntentId: paymentIntent.id
    };
    
    const savedPayment = await db.savePayment(paymentData, context);
    
    if (paymentIntent.status === 'succeeded') {
      context.log(`✅ Payment successful: ${paymentIntent.id}`);
      
      // Update order status to payment_confirmed if payment succeeded
      if (orderId) {
        await db.updateOrderStatus(orderId, 'payment_confirmed', context);
      }
      
      return successResponse(savedPayment || {
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        processed: new Date().toISOString()
      });
    } else {
      context.warn(`⚠️ Payment not completed: ${paymentIntent.status}`);
      return successResponse(savedPayment || {
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        processed: new Date().toISOString()
      });
    }
    
  } catch (error) {
    context.error('❌ Payment processing failed:', error);
    return errorResponse('Failed to process payment', 500);
  }
}

export async function ordersStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('GET, POST, PUT, OPTIONS');
  
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId') || url.pathname.split('/').pop();
    
    if (request.method === 'PUT') {
      // Update order status
      const body = await request.json() as any;
      const { status } = body;
      
      context.log(`📋 Updating order status for ${orderId} to ${status}`);
      
      const db = DatabaseService.getInstance();
      await db.initialize(context);
      const updatedOrder = await db.updateOrderStatus(orderId, status, context);
      
      return successResponse(updatedOrder);
    } else {
      // Get order status
      context.log(`📋 Getting order status for ${orderId}`);
      
      const db = DatabaseService.getInstance();
      await db.initialize(context);
      const orderStatus = await db.getOrderStatus(orderId, context);
      
      // Add tracking steps based on status
      const statusSteps = {
        'pending_payment': 0,
        'payment_confirmed': 1,
        'in_production': 2,
        'quality_check': 3,
        'shipped': 4,
        'delivered': 5
      };
      
      const currentStep = statusSteps[orderStatus?.status] || 0;
      const trackingSteps = [
        { step: 'Order Received', completed: currentStep >= 0, timestamp: orderStatus?.created || new Date(Date.now() - 3600000).toISOString() },
        { step: 'Payment Confirmed', completed: currentStep >= 1, timestamp: currentStep >= 1 ? new Date(Date.now() - 3000000).toISOString() : null },
        { step: 'In Production', completed: currentStep >= 2, timestamp: currentStep >= 2 ? new Date(Date.now() - 1800000).toISOString() : null },
        { step: 'Quality Check', completed: currentStep >= 3, timestamp: currentStep >= 3 ? new Date(Date.now() - 900000).toISOString() : null },
        { step: 'Shipped', completed: currentStep >= 4, timestamp: currentStep >= 4 ? new Date(Date.now() - 300000).toISOString() : null }
      ];
      
      const statusResponse = {
        orderId,
        status: orderStatus?.status || 'in_production',
        progress: Math.min(currentStep * 20 + 20, 100),
        estimatedCompletion: new Date(Date.now() + 86400000).toISOString(),
        trackingSteps,
        ...orderStatus
      };
      
      return successResponse(statusResponse);
    }
    
  } catch (error) {
    context.error('❌ Order status operation failed:', error);
    return errorResponse('Failed to process order status request', 500);
  }
}

export async function shippingRates(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('POST, OPTIONS');
  
  try {
    const body = await request.json() as any;
    const { toAddress, items } = body;
    
    context.log(`🚚 Getting shipping rates for ${toAddress?.city}, ${toAddress?.state}`);
    
    // Initialize shipping service
    const shipping = ShippingService.getInstance();
    await shipping.initialize(context);
    
    const rates = await shipping.getRates(toAddress, items, context);
    
    return successResponse({
      rates: rates || [],
      shippingAddress: toAddress
    });
    
  } catch (error) {
    context.error('❌ Failed to get shipping rates:', error);
    return errorResponse('Failed to get shipping rates', 500);
  }
}

export async function shippingLabel(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('POST, OPTIONS');
  
  try {
    const body = await request.json() as any;
    const { rateId, orderId } = body;
    
    context.log(`🏷️ Creating shipping label for order ${orderId}`);
    
    // Initialize shipping service
    const shipping = ShippingService.getInstance();
    await shipping.initialize(context);
    
    const label = await shipping.createLabel(rateId, orderId, context);
    
    // Initialize database
    const db = DatabaseService.getInstance();
    await db.initialize(context);
    
    // Save shipping label to database
    const shippingData = {
      shippingId: `ship_${Date.now()}`,
      orderId,
      trackingNumber: label.trackingNumber,
      carrier: 'usps', // Default carrier, could be extracted from rate
      labelUrl: label.labelUrl,
      cost: parseFloat(label.cost),
      currency: label.currency || 'USD',
      rateId,
      transactionId: label.transactionId
    };
    
    const savedShipping = await db.saveShippingLabel(shippingData, context);
    
    // Update order status to shipped
    await db.updateOrderStatus(orderId, 'shipped', context);
    
    // Send shipping notification email
    try {
      const orderInfo = await db.getOrderStatus(orderId, context);
      if (orderInfo?.customerEmail) {
        // This would typically be called via a separate notification service
        // For now, we'll include the tracking info in the response
        context.log(`📧 Should send shipping notification to ${orderInfo.customerEmail}`);
      }
    } catch (emailError) {
      context.warn('⚠️ Failed to send shipping notification:', emailError);
    }
    
    return successResponse({
      ...label,
      shippingId: savedShipping?.shippingId || shippingData.shippingId,
      saved: !!savedShipping
    });
    
  } catch (error) {
    context.error('❌ Failed to create shipping label:', error);
    return errorResponse('Failed to create shipping label', 500);
  }
}

export async function shippingTrack(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('GET, POST, OPTIONS');
  
  try {
    const url = new URL(request.url);
    const trackingNumber = url.searchParams.get('trackingNumber') || url.pathname.split('/').pop();
    const carrier = url.searchParams.get('carrier') || 'usps';
    
    context.log(`📦 Tracking package ${trackingNumber} via ${carrier}`);
    
    // Initialize shipping service
    const shipping = ShippingService.getInstance();
    await shipping.initialize(context);
    
    const trackingInfo = await shipping.getTrackingInfo(trackingNumber, carrier, context);
    
    return successResponse(trackingInfo);
    
  } catch (error) {
    context.error('❌ Failed to get tracking info:', error);
    return errorResponse('Failed to get tracking info', 500);
  }
}

export async function notificationsSend(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return handleCORS('GET, POST, OPTIONS');
  
  try {
    const body = await request.json() as any;
    const { to, subject, message, type = 'order_status_update', orderId } = body;
    
    context.log(`📧 Sending ${type} notification to ${to}`);
    
    // Initialize SendGrid
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@theprintedbay.com';
    
    if (!sendGridApiKey || sendGridApiKey.includes('your_api_key_here')) {
      context.warn('⚠️ SendGrid not configured, using mock email sending');
      const mockNotification = {
        notificationId: `notif_${Date.now()}`,
        type,
        sent: true,
        to,
        subject,
        timestamp: new Date().toISOString()
      };
      return successResponse(mockNotification);
    }
    
    sgMail.setApiKey(sendGridApiKey);
    
    // Create email content based on type
    let emailSubject = subject;
    let emailHtml = message;
    
    if (type === 'order_confirmation' && orderId) {
      emailSubject = `Order Confirmation - ${orderId}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p>We've received your 3D printing request and will begin processing it shortly.</p>
          <p>You'll receive updates as your order progresses through production.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666;">The Printed Bay Team</p>
        </div>
      `;
    } else if (type === 'order_status_update' && orderId) {
      emailSubject = `Order Update - ${orderId}`;
      emailHtml = message || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Order Status Update</h2>
          <p>Your order ${orderId} has been updated.</p>
          <p>${message || 'Please check your order status for the latest information.'}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666;">The Printed Bay Team</p>
        </div>
      `;
    } else if (type === 'shipping_notification' && orderId) {
      emailSubject = `Your Order Has Shipped - ${orderId}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your Order Has Shipped!</h2>
          <p>Great news! Your order ${orderId} has been shipped.</p>
          ${message ? `<p>${message}</p>` : ''}
          <p>You should receive it within the estimated delivery timeframe.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666;">The Printed Bay Team</p>
        </div>
      `;
    }
    
    const msg = {
      to,
      from: fromEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailHtml.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };
    
    const result = await sgMail.send(msg);
    
    context.log(`✅ Email sent successfully to ${to}`);
    
    return successResponse({
      notificationId: `notif_${Date.now()}`,
      type,
      sent: true,
      to,
      subject: emailSubject,
      messageId: result[0]?.headers?.['x-message-id'],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    context.error('❌ Email sending failed:', error);
    return errorResponse('Failed to send email notification', 500);
  }
}

// Register HTTP functions
app.http('pricing-calculate', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: pricingCalculate
});

app.http('orders-create', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: ordersCreate
});

app.http('payments-create-intent', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: paymentsCreateIntent
});

app.http('payments-process', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: paymentsProcess
});

app.http('orders-status', {
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: ordersStatus
});

app.http('shipping-rates', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: shippingRates
});

app.http('shipping-label', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: shippingLabel
});

app.http('shipping-track', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: shippingTrack
});

app.http('notifications-send', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: notificationsSend
});
