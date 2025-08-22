"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
class DatabaseService {
    constructor() {
        this.pool = null;
        this.config = null;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async initialize(context) {
        if (this.pool)
            return;
        const server = process.env.AZURE_SQL_SERVER;
        const database = process.env.AZURE_SQL_DATABASE;
        const user = process.env.AZURE_SQL_USER;
        const password = process.env.AZURE_SQL_PASSWORD;
        if (!server || !database || !user || !password ||
            server.includes('your_server_here') ||
            database.includes('your_database_here') ||
            user.includes('your_user_here') ||
            password.includes('your_password_here')) {
            context.warn('⚠️ Database not configured, operations will use mock data');
            return;
        }
        this.config = {
            server,
            database,
            user,
            password,
            options: {
                encrypt: true,
                trustServerCertificate: false,
                enableArithAbort: true
            }
        };
        try {
            this.pool = new mssql_1.default.ConnectionPool(this.config);
            await this.pool.connect();
            context.log('✅ Database connected successfully');
        }
        catch (error) {
            context.error('❌ Database connection failed:', error);
            this.pool = null;
            throw error;
        }
    }
    async query(query, params = {}, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, using mock data');
            return null;
        }
        try {
            const request = this.pool.request();
            // Add parameters
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });
            const result = await request.query(query);
            return result.recordset;
        }
        catch (error) {
            context.error('❌ Database query failed:', error);
            throw error;
        }
    }
    async createOrder(orderData, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, returning mock order');
            return {
                orderId: orderData.orderId,
                ...orderData,
                created: new Date().toISOString()
            };
        }
        const query = `
      INSERT INTO Orders (orderId, customerEmail, total, currency, status, fileUrl, fileName, created)
      OUTPUT INSERTED.*
      VALUES (@orderId, @customerEmail, @total, @currency, @status, @fileUrl, @fileName, GETDATE())
    `;
        try {
            const result = await this.query(query, orderData, context);
            return result[0];
        }
        catch (error) {
            context.error('❌ Failed to create order in database:', error);
            throw error;
        }
    }
    async updateOrderStatus(orderId, status, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, returning mock status update');
            return { orderId, status, updated: new Date().toISOString() };
        }
        const query = `
      UPDATE Orders 
      SET status = @status, updated = GETDATE()
      OUTPUT INSERTED.*
      WHERE orderId = @orderId
    `;
        try {
            const result = await this.query(query, { orderId, status }, context);
            return result[0];
        }
        catch (error) {
            context.error('❌ Failed to update order status in database:', error);
            throw error;
        }
    }
    async getOrderStatus(orderId, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, returning mock order status');
            return {
                orderId,
                status: 'in_production',
                progress: 65,
                created: new Date(Date.now() - 3600000).toISOString(),
                updated: new Date().toISOString()
            };
        }
        const query = `
      SELECT * FROM Orders WHERE orderId = @orderId
    `;
        try {
            const result = await this.query(query, { orderId }, context);
            return result[0];
        }
        catch (error) {
            context.error('❌ Failed to get order status from database:', error);
            throw error;
        }
    }
    async savePricing(pricingData, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, returning mock pricing');
            return {
                ...pricingData,
                created: new Date().toISOString()
            };
        }
        const query = `
      INSERT INTO Pricing (pricingId, orderId, material, volume, basePrice, materialCost, processingFee, total, currency, estimatedDays, created)
      OUTPUT INSERTED.*
      VALUES (@pricingId, @orderId, @material, @volume, @basePrice, @materialCost, @processingFee, @total, @currency, @estimatedDays, GETDATE())
    `;
        try {
            const result = await this.query(query, pricingData, context);
            return result[0];
        }
        catch (error) {
            context.error('❌ Failed to save pricing in database:', error);
            throw error;
        }
    }
    async savePayment(paymentData, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, returning mock payment');
            return {
                ...paymentData,
                processed: new Date().toISOString()
            };
        }
        const query = `
      INSERT INTO Payments (paymentId, orderId, amount, currency, status, stripePaymentIntentId, processed)
      OUTPUT INSERTED.*
      VALUES (@paymentId, @orderId, @amount, @currency, @status, @stripePaymentIntentId, GETDATE())
    `;
        try {
            const result = await this.query(query, paymentData, context);
            return result[0];
        }
        catch (error) {
            context.error('❌ Failed to save payment in database:', error);
            throw error;
        }
    }
    async saveShippingLabel(labelData, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, returning mock shipping label');
            return {
                ...labelData,
                created: new Date().toISOString()
            };
        }
        const query = `
      INSERT INTO ShippingLabels (shippingId, orderId, trackingNumber, carrier, labelUrl, cost, currency, rateId, transactionId, created)
      OUTPUT INSERTED.*
      VALUES (@shippingId, @orderId, @trackingNumber, @carrier, @labelUrl, @cost, @currency, @rateId, @transactionId, GETDATE())
    `;
        try {
            const result = await this.query(query, labelData, context);
            return result[0];
        }
        catch (error) {
            context.error('❌ Failed to save shipping label in database:', error);
            throw error;
        }
    }
    async getShippingInfo(orderId, context) {
        if (!this.pool) {
            context.warn('⚠️ Database not available, returning mock shipping info');
            return {
                orderId,
                trackingNumber: `TPB${Date.now()}`,
                carrier: 'usps',
                status: 'shipped',
                created: new Date(Date.now() - 86400000).toISOString()
            };
        }
        const query = `
      SELECT * FROM ShippingLabels WHERE orderId = @orderId ORDER BY created DESC
    `;
        try {
            const result = await this.query(query, { orderId }, context);
            return result[0]; // Get the most recent shipping label
        }
        catch (error) {
            context.error('❌ Failed to get shipping info from database:', error);
            throw error;
        }
    }
    async close() {
        if (this.pool) {
            await this.pool.close();
            this.pool = null;
        }
    }
}
exports.default = DatabaseService;
//# sourceMappingURL=database.js.map