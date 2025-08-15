// Test script to verify the frontend now shows correct usage
const axios = require('axios');

async function testCouponDisplay() {
    console.log('=== Testing Coupon Display Fix ===\n');
    
    try {
        // Test the coupon validation endpoint (this should show updated usage)
        const response = await axios.post('http://localhost:8000/api/coupons/validate', {
            code: 'test3',
            amount: 100,
            email: 'test@example.com'
        });
        
        console.log('✅ Coupon Validation Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Test the debug analytics endpoint
        const analyticsResponse = await axios.post('http://localhost:8000/api/debug/recalc-analytics', {
            code: 'test3'
        });
        
        console.log('\n✅ Analytics Response:');
        console.log(JSON.stringify(analyticsResponse.data, null, 2));
        
        // Test the comprehensive fix endpoint
        const fixResponse = await axios.post('http://localhost:8000/api/debug/fix-all-coupons');
        
        console.log('\n✅ Comprehensive Fix Response:');
        console.log(JSON.stringify(fixResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCouponDisplay();
