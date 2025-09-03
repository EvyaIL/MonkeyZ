// Script to create test coupons using debug endpoint
const axios = require('axios');

const API_URL = 'https://api.monkeyz.co.il';

async function createTestCouponsViaDebug() {
    console.log('🔧 Creating Test Coupons via Debug Endpoint...\n');
    
    try {
        console.log('Step 1: Creating test coupons...');
        const createResponse = await axios.post(`${API_URL}/api/debug/create-test-coupons`);
        
        console.log('✅ Creation Response:', JSON.stringify(createResponse.data, null, 2));
        
        console.log('\nStep 2: Testing created coupons...');
        
        const testCoupons = ['TEST10', 'SAVE20', 'UNLIMITED'];
        
        for (const coupon of testCoupons) {
            try {
                const response = await axios.post(`${API_URL}/api/coupons/validate`, {
                    code: coupon,
                    amount: 100,
                    email: 'test@example.com'
                });
                
                if (response.data.valid) {
                    console.log(`✅ ${coupon}: Valid! Discount: ₪${response.data.discount}`);
                    
                    // Test with specific scenarios
                    if (coupon === 'TEST10') {
                        console.log('   Testing TEST10 scenarios:');
                        
                        // Test with first email
                        const test1 = await axios.post(`${API_URL}/api/coupons/validate`, {
                            code: coupon,
                            amount: 100,
                            email: 'user1@test.com'
                        });
                        console.log(`   - user1@test.com: ${test1.data.valid ? 'VALID' : 'INVALID'} (${test1.data.message || test1.data.error})`);
                        
                        // Test with second email
                        const test2 = await axios.post(`${API_URL}/api/coupons/validate`, {
                            code: coupon,
                            amount: 100,
                            email: 'user2@test.com'
                        });
                        console.log(`   - user2@test.com: ${test2.data.valid ? 'VALID' : 'INVALID'} (${test2.data.message || test2.data.error})`);
                    }
                } else {
                    console.log(`❌ ${coupon}: ${response.data.message || response.data.error}`);
                }
            } catch (error) {
                console.log(`❌ ${coupon}: Request failed - ${error.message}`);
            }
        }
        
        console.log('\n🧪 Manual Testing Guide:');
        console.log('Now you can manually test:');
        console.log('1. TEST10: Should work max 2 times total, 1 per user');
        console.log('2. SAVE20: Should work max 5 times total, 2 per user');
        console.log('3. UNLIMITED: Should work unlimited times');
        console.log('\nTest by going through the full PayPal checkout flow!');
        
    } catch (error) {
        console.error('❌ Failed to create test coupons:', error.message);
        if (error.response?.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

createTestCouponsViaDebug();
