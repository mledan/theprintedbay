"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = healthCheck;
const functions_1 = require("@azure/functions");
const database_1 = __importDefault(require("./database"));
// Generic CORS handler
const handleCORS = (methods = 'GET, OPTIONS') => ({
    status: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': 'Content-Type',
    }
});
async function healthCheck(request, context) {
    if (request.method === 'OPTIONS')
        return handleCORS('GET, OPTIONS');
    context.log('🔍 Health check requested');
    const timestamp = new Date().toISOString();
    const services = {};
    // Check Azure Storage
    const storageConnString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    services.storage = {
        name: 'Azure Blob Storage',
        status: (storageConnString && !storageConnString.includes('your_connection_string_here')) ? 'healthy' : 'unhealthy',
        configured: !!(storageConnString && !storageConnString.includes('your_connection_string_here')),
        lastChecked: timestamp
    };
    // Check Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    services.payments = {
        name: 'Stripe Payments',
        status: (stripeKey && !stripeKey.includes('your_secret_key_here')) ? 'healthy' : 'unhealthy',
        configured: !!(stripeKey && !stripeKey.includes('your_secret_key_here')),
        lastChecked: timestamp
    };
    // Check SendGrid
    const sendGridKey = process.env.SENDGRID_API_KEY;
    services.email = {
        name: 'SendGrid Email',
        status: (sendGridKey && !sendGridKey.includes('your_api_key_here')) ? 'healthy' : 'unhealthy',
        configured: !!(sendGridKey && !sendGridKey.includes('your_api_key_here')),
        lastChecked: timestamp
    };
    // Check Shippo
    const shippoKey = process.env.SHIPPO_API_KEY;
    services.shipping = {
        name: 'Shippo Shipping',
        status: (shippoKey && !shippoKey.includes('your_api_key_here')) ? 'healthy' : 'unhealthy',
        configured: !!(shippoKey && !shippoKey.includes('your_api_key_here')),
        lastChecked: timestamp
    };
    // Check Database
    try {
        const db = database_1.default.getInstance();
        await db.initialize(context);
        services.database = {
            name: 'Azure SQL Database',
            status: 'healthy',
            configured: true,
            lastChecked: timestamp
        };
    }
    catch (error) {
        services.database = {
            name: 'Azure SQL Database',
            status: 'unhealthy',
            configured: false,
            lastChecked: timestamp,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    // Core API functions (always healthy if we reach here)
    services.api = {
        name: 'Core API',
        status: 'healthy',
        configured: true,
        lastChecked: timestamp
    };
    services.files = {
        name: 'File Upload',
        status: 'healthy',
        configured: true,
        lastChecked: timestamp
    };
    services.pricing = {
        name: 'Pricing Calculator',
        status: 'healthy',
        configured: true,
        lastChecked: timestamp
    };
    services.orders = {
        name: 'Order Management',
        status: 'healthy',
        configured: true,
        lastChecked: timestamp
    };
    services.notifications = {
        name: 'Notifications',
        status: 'healthy',
        configured: true,
        lastChecked: timestamp
    };
    // Determine overall status
    const healthyServices = Object.values(services).filter(s => s.status === 'healthy');
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded');
    const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy');
    let overallStatus;
    if (unhealthyServices.length > 0) {
        overallStatus = degradedServices.length === 0 ? 'unhealthy' : 'degraded';
    }
    else if (degradedServices.length > 0) {
        overallStatus = 'degraded';
    }
    else {
        overallStatus = 'healthy';
    }
    const response = {
        status: overallStatus,
        services,
        timestamp,
        version: '1.0.0'
    };
    context.log(`🔍 Health check complete: ${overallStatus} (${healthyServices.length}/${Object.keys(services).length} services healthy)`);
    return {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        jsonBody: response
    };
}
functions_1.app.http('health', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: healthCheck,
});
//# sourceMappingURL=health.js.map