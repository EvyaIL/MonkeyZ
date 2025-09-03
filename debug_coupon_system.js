// Debug script to analyze the current coupon system
const axios = require('axios');

const API_URL = 'https://api.monkeyz.co.il';

async function debugCouponSystem() {
    console.log('🔍 Debugging Coupon System...\n');
    
    try {
        // First, let's see what happens with a simple validation
        console.log('Step 1: Testing basic validation with TEST10...');
        const response = await axios.post(`${API_URL}/api/coupons/validate`, {
            code: 'TEST10',
            amount: 100,
            email: 'test@example.com'
        });
        
        console.log('Raw response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.error) {
            console.log('❌ Error found:', response.data.error);
            console.log('Message:', response.data.message);
        }
        
        // Try with different coupon codes
        const testCodes = ['WELCOME10', 'SAVE20', 'FIRST', 'TEST', 'DISCOUNT'];
        
        console.log('\nStep 2: Testing common coupon codes...');
        for (const code of testCodes) {
            try {
                const testResponse = await axios.post(`${API_URL}/api/coupons/validate`, {
                    code: code,
                    amount: 100,
                    email: 'test@example.com'
                });
                
                if (testResponse.data.valid) {
                    console.log(`✅ ${code}: Valid! Discount: ${testResponse.data.discount}`);
                } else {
                    console.log(`❌ ${code}: ${testResponse.data.message || testResponse.data.error || 'Invalid'}`);
                }
            } catch (error) {
                console.log(`❌ ${code}: Request failed - ${error.message}`);
            }
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Check if any coupons exist in the admin database');
        console.log('2. Create a test coupon with known parameters');
        console.log('3. Test the complete flow end-to-end');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response?.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

debugCouponSystem();
