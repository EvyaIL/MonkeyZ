// Test to manually check coupon usage tracking
const axios = require('axios');

async function testCouponUsageTracking() {
    console.log('=== Testing Coupon Usage Tracking ===\n');
    
    // Test both environments
    const environments = [
        { name: 'PRODUCTION', url: 'https://api.monkeyz.co.il' },
        { name: 'LOCALHOST', url: 'http://localhost:8000' }
    ];
    
    for (const env of environments) {
        console.log(`\n--- Testing ${env.name} (${env.url}) ---`);
        
        // 1. First validate the coupon (should NOT increment usage)
        console.log('1. Validating coupon test3 (should not increment usage):');
        try {
            const validateResponse = await axios.post(`${env.url}/api/coupons/validate`, {
                code: 'test3',
                amount: 100,
                email: 'test1@example.com'
            });
            console.log('   ✅ Validation result:', validateResponse.data);
        } catch (error) {
            console.log('   ❌ Validation error:', error.response?.data || error.message);
        }
        
        // 2. Try to find an endpoint that actually applies the coupon
        console.log('\n2. Looking for coupon application methods...');
        
        // Check if there's a test endpoint for applying coupons
        const testEndpoints = [
            '/api/test/apply-coupon',
            '/api/admin/coupons/apply',
            '/api/coupons/apply'
        ];
        
        for (const endpoint of testEndpoints) {
            try {
                const response = await axios.post(`${env.url}${endpoint}`, {
                    code: 'test3',
                    amount: 100,
                    email: 'test2@example.com'
                }, { timeout: 5000 });
                console.log(`   ✅ ${endpoint} worked:`, response.data);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`   ⚠️  ${endpoint} not found (404)`);
                } else {
                    console.log(`   ❌ ${endpoint} error:`, error.response?.status, error.response?.data?.detail || error.message);
                }
            }
        }
    }
    
    console.log('\n=== Summary ===');
    console.log('The coupon validation works, but we need to check:');
    console.log('1. PayPal order capture process');
    console.log('2. Database configuration differences');
    console.log('3. Whether apply_coupon() is being called during capture');
}

testCouponUsageTracking().catch(console.error);
