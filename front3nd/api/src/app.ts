import { app } from '@azure/functions';

// Import all function handlers
import { filesUpload } from './functions/files-upload';
import { modelsAnalyze } from './functions/models-analyze';
import { 
  pricingCalculate, 
  ordersCreate, 
  paymentsCreateIntent, 
  paymentsProcess, 
  ordersStatus, 
  notificationsSend 
} from './functions/stubs';

// Register HTTP functions
app.http('files-upload', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: filesUpload
});

app.http('models-analyze', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous', 
    handler: modelsAnalyze
});

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

app.http('notifications-send', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: notificationsSend
});
