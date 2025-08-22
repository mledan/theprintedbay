"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shippo_1 = require("shippo");
class ShippingService {
    constructor() {
        this.shippoClient = null;
        this.fromAddress = null;
    }
    static getInstance() {
        if (!ShippingService.instance) {
            ShippingService.instance = new ShippingService();
        }
        return ShippingService.instance;
    }
    async initialize(context) {
        if (this.shippoClient)
            return;
        const shippoApiKey = process.env.SHIPPO_API_KEY;
        if (!shippoApiKey || shippoApiKey.includes('your_api_key_here')) {
            context.warn('⚠️ Shippo not configured, shipping operations will use mock data');
            return;
        }
        // Initialize Shippo client
        this.shippoClient = new shippo_1.Shippo({ apiKeyHeader: shippoApiKey });
        // Set up default from address from environment
        this.fromAddress = {
            name: process.env.SHIP_FROM_NAME || 'The Printed Bay',
            company: process.env.SHIP_FROM_COMPANY || 'The Printed Bay LLC',
            street1: process.env.SHIP_FROM_STREET1 || '123 Maker Street',
            city: process.env.SHIP_FROM_CITY || 'Austin',
            state: process.env.SHIP_FROM_STATE || 'TX',
            zip: process.env.SHIP_FROM_ZIP || '78701',
            country: process.env.SHIP_FROM_COUNTRY || 'US',
            phone: process.env.SHIP_FROM_PHONE || '555-0123',
            email: process.env.SHIP_FROM_EMAIL || 'orders@theprintedbay.com'
        };
        context.log('✅ Shippo shipping service initialized');
    }
    async getRates(toAddress, items, context) {
        if (!this.shippoClient) {
            context.warn('⚠️ Shippo not available, returning mock shipping rates');
            return this.getMockRates();
        }
        try {
            // Create parcel based on items
            const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
            const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
            // Use largest item dimensions or defaults
            const maxLength = Math.max(...items.map(item => item.length || 6));
            const maxWidth = Math.max(...items.map(item => item.width || 4));
            const maxHeight = Math.max(...items.map(item => item.height || 3));
            const parcel = {
                length: maxLength.toString(),
                width: maxWidth.toString(),
                height: maxHeight.toString(),
                distance_unit: 'in',
                weight: Math.max(totalWeight, 1).toString(), // Minimum 1 oz
                mass_unit: 'oz'
            };
            const shipment = await this.shippoClient.shipment.create({
                address_from: this.fromAddress,
                address_to: toAddress,
                parcels: [parcel],
                extra: {
                    insurance: {
                        amount: totalValue.toString(),
                        currency: 'USD'
                    }
                }
            });
            const rates = shipment.rates.map((rate) => ({
                rateId: rate.object_id,
                servicelevel: rate.servicelevel,
                amount: rate.amount,
                currency: rate.currency,
                estimated_days: rate.estimated_days || 7,
                provider: rate.provider,
                provider_image_75: rate.provider_image_75,
                provider_image_200: rate.provider_image_200
            }));
            context.log(`✅ Retrieved ${rates.length} shipping rates from Shippo`);
            return rates;
        }
        catch (error) {
            context.error('❌ Failed to get shipping rates:', error);
            return this.getMockRates();
        }
    }
    async createLabel(rateId, orderId, context) {
        if (!this.shippoClient) {
            context.warn('⚠️ Shippo not available, returning mock shipping label');
            return {
                labelUrl: `https://mock-label.theprintedbay.com/${orderId}.pdf`,
                trackingNumber: `TPB${Date.now()}`,
                trackingUrl: `https://mock-tracking.theprintedbay.com/${orderId}`,
                cost: '8.99',
                currency: 'USD'
            };
        }
        try {
            const transaction = await this.shippoClient.transaction.create({
                rate: rateId,
                label_file_type: 'PDF',
                metadata: `Order: ${orderId}`
            });
            if (transaction.status === 'SUCCESS') {
                context.log(`✅ Shipping label created for order ${orderId}`);
                return {
                    labelUrl: transaction.label_url,
                    trackingNumber: transaction.tracking_number,
                    trackingUrl: transaction.tracking_url_provider,
                    cost: transaction.rate.amount,
                    currency: transaction.rate.currency,
                    transactionId: transaction.object_id
                };
            }
            else {
                throw new Error(`Transaction failed with status: ${transaction.status}`);
            }
        }
        catch (error) {
            context.error('❌ Failed to create shipping label:', error);
            throw error;
        }
    }
    async getTrackingInfo(trackingNumber, carrier, context) {
        if (!this.shippoClient) {
            context.warn('⚠️ Shippo not available, returning mock tracking info');
            return {
                trackingNumber,
                status: 'TRANSIT',
                statusDate: new Date().toISOString(),
                statusDetails: 'Package is in transit',
                eta: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
                trackingHistory: [
                    {
                        status: 'PRE_TRANSIT',
                        statusDate: new Date(Date.now() - 86400000).toISOString(),
                        statusDetails: 'Label created',
                        location: 'Austin, TX'
                    },
                    {
                        status: 'TRANSIT',
                        statusDate: new Date().toISOString(),
                        statusDetails: 'Package picked up and in transit',
                        location: 'Austin, TX'
                    }
                ]
            };
        }
        try {
            const track = await this.shippoClient.track.get_status(carrier, trackingNumber);
            return {
                trackingNumber: track.tracking_number,
                status: track.tracking_status.status,
                statusDate: track.tracking_status.status_date,
                statusDetails: track.tracking_status.status_details,
                eta: track.eta,
                trackingHistory: track.tracking_history.map((event) => ({
                    status: event.status,
                    statusDate: event.status_date,
                    statusDetails: event.status_details,
                    location: event.location ? `${event.location.city}, ${event.location.state}` : undefined
                }))
            };
        }
        catch (error) {
            context.error('❌ Failed to get tracking info:', error);
            return null;
        }
    }
    getMockRates() {
        return [
            {
                rateId: 'mock_ground',
                servicelevel: {
                    name: 'Ground',
                    token: 'GROUND'
                },
                amount: '8.99',
                currency: 'USD',
                estimated_days: 5,
                provider: 'USPS',
                provider_image_75: 'https://shippo-static.s3.amazonaws.com/providers/75/USPS.png',
                provider_image_200: 'https://shippo-static.s3.amazonaws.com/providers/200/USPS.png'
            },
            {
                rateId: 'mock_priority',
                servicelevel: {
                    name: 'Priority Mail',
                    token: 'PRIORITY'
                },
                amount: '14.99',
                currency: 'USD',
                estimated_days: 3,
                provider: 'USPS',
                provider_image_75: 'https://shippo-static.s3.amazonaws.com/providers/75/USPS.png',
                provider_image_200: 'https://shippo-static.s3.amazonaws.com/providers/200/USPS.png'
            },
            {
                rateId: 'mock_express',
                servicelevel: {
                    name: 'Priority Express',
                    token: 'EXPRESS'
                },
                amount: '24.99',
                currency: 'USD',
                estimated_days: 1,
                provider: 'USPS',
                provider_image_75: 'https://shippo-static.s3.amazonaws.com/providers/75/USPS.png',
                provider_image_200: 'https://shippo-static.s3.amazonaws.com/providers/200/USPS.png'
            }
        ];
    }
}
exports.default = ShippingService;
//# sourceMappingURL=shipping.js.map