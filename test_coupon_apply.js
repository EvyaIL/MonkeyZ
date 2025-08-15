// Test coupon application (with usage increment) on production vs localhost
const axios = require('axios');

async function testCouponApplication(baseUrl, environment) {
    console.log(`\n=== Testing Coupon Application on ${environment} ===`);
    console.log(`Base URL: ${baseUrl}`);
    
    const testData = {
        code: 'test3',
        amount: 100,
        email: 'test@example.com'
    };
    
    // First, validate the coupon (this should NOT increment usage)
    console.log('\n1. Testing coupon VALIDATION (should not increment usage):');
    try {
        const validationResponse = await axios.post(`${baseUrl}/api/coupons/validate`, testData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        console.log('✅ Validation Response:', validationResponse.data);
    } catch (error) {
        console.log('❌ Validation Error:', error.response?.data || error.message);
    }
    
    // Now test if there's an endpoint for applying coupons (with usage increment)
    console.log('\n2. Checking for coupon APPLICATION endpoint:');
    try {
        // Try to find admin endpoint for applying coupons
        const applyResponse = await axios.post(`${baseUrl}/api/admin/coupons/validate`, testData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        console.log('✅ Admin Apply Response:', applyResponse.data);
    } catch (error) {
        console.log('❌ Admin Apply Error:', error.response?.status, error.response?.data || error.message);
    }
}

async function runTests() {
    // Test production
    await testCouponApplication('https://api.monkeyz.co.il', 'PRODUCTION');
    
    // Test localhost  
    await testCouponApplication('http://localhost:8000', 'LOCALHOST');
}

runTests().catch(console.error);
