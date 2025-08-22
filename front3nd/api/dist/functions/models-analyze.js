"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelsAnalyze = modelsAnalyze;
async function modelsAnalyze(request, context) {
    var _a;
    const method = (_a = request.method) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    // Handle CORS preflight
    if (method === 'options') {
        return {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        };
    }
    if (method !== 'post') {
        return {
            status: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            jsonBody: { success: false, error: 'Method not allowed' }
        };
    }
    try {
        const body = await request.json();
        context.log(`🔍 Analyzing model: ${body.fileName}`);
        // Simulate model analysis
        const mockAnalysis = {
            success: true,
            analysisId: `analysis-${Date.now()}`,
            fileName: body.fileName,
            vertices: Math.floor(Math.random() * 50000) + 1000,
            faces: Math.floor(Math.random() * 100000) + 2000,
            volume: (Math.random() * 100 + 1).toFixed(2), // cm³
            dimensions: {
                x: (Math.random() * 200 + 10).toFixed(1),
                y: (Math.random() * 200 + 10).toFixed(1),
                z: (Math.random() * 200 + 10).toFixed(1)
            },
            analysisTime: Math.floor(Math.random() * 5000) + 1000
        };
        return {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            jsonBody: mockAnalysis
        };
    }
    catch (error) {
        context.error('❌ Model analysis error:', error);
        return {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            jsonBody: { success: false, error: 'Analysis failed' }
        };
    }
}
//# sourceMappingURL=models-analyze.js.map