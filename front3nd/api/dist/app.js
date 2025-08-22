"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
// Import all function handlers
const files_upload_1 = require("./functions/files-upload");
const models_analyze_1 = require("./functions/models-analyze");
const stubs_1 = require("./functions/stubs");
// Register HTTP functions
functions_1.app.http('files-upload', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: files_upload_1.filesUpload
});
functions_1.app.http('models-analyze', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: models_analyze_1.modelsAnalyze
});
functions_1.app.http('pricing-calculate', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: stubs_1.pricingCalculate
});
functions_1.app.http('orders-create', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: stubs_1.ordersCreate
});
functions_1.app.http('payments-create-intent', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: stubs_1.paymentsCreateIntent
});
functions_1.app.http('payments-process', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: stubs_1.paymentsProcess
});
functions_1.app.http('orders-status', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: stubs_1.ordersStatus
});
functions_1.app.http('notifications-send', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: stubs_1.notificationsSend
});
//# sourceMappingURL=app.js.map