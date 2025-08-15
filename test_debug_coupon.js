// Test the debug coupon application endpoint
const axios = require('axios');

async function testDebugCouponApplication() {
    console.log('=== Testing Debug Coupon Application ===\n');
    
    const environments = [
        { name: 'LOCALHOST', url: 'http://localhost:8000' },
        { name: 'PRODUCTION', url: 'https://api.monkeyz.co.il' }
    ];
    
    for (const env of environments) {
        console.log(`\n--- Testing ${env.name} ---`);
        
        try {
            const response = await axios.post(`${env.url}/api/debug/apply-coupon`, {
                code: 'test3',
                amount: 100,
                email: 'debug-test@example.com'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            console.log('✅ Debug Apply Response:', response.data);
            
            if (response.data.success) {
                console.log(`   → Discount Applied: ${response.data.discount_applied}`);
                console.log(`   → Used Count: ${response.data.coupon_used_count}`);
                console.log(`   → Database: ${response.data.debug_info?.database}`);
            }
            
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('❌ Debug endpoint not found (404) - endpoint not deployed yet');
            } else {
                console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
            }
        }
    }
}

testDebugCouponApplication().catch(console.error);
