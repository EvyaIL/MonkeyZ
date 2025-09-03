// Test script to verify email change coupon validation fix
// This script simulates the frontend behavior to test the email change issue

const axios = require('axios');

const API_URL = 'https://api.monkeyz.co.il';

async function testEmailChangeCouponValidation() {
    console.log('🧪 Testing email change coupon validation behavior...\n');
    
    // Test data - replace with actual coupon code and emails from your system
    const testCoupon = 'TEST10'; // Replace with a real coupon code
    const emailNotExceeded = 'test1@example.com'; // Email that hasn't exceeded max usage
    const emailExceeded = 'test2@example.com'; // Email that has exceeded max usage
    const testAmount = 100;
    
    try {
        console.log('Step 1: Validating coupon with email that has NOT exceeded max usage...');
        const response1 = await axios.post(`${API_URL}/api/coupons/validate`, {
            code: testCoupon,
            amount: testAmount,
            email: emailNotExceeded
        });
        
        console.log('Response 1 (should be valid):');
        console.log(`- Valid: ${response1.data.valid}`);
        console.log(`- Discount: ₪${response1.data.discount || 0}`);
        console.log(`- Message: ${response1.data.message || 'N/A'}`);
        console.log(`- Error: ${response1.data.error || 'None'}\n`);
        
        console.log('Step 2: Validating same coupon with email that HAS exceeded max usage...');
        const response2 = await axios.post(`${API_URL}/api/coupons/validate`, {
            code: testCoupon,
            amount: testAmount,
            email: emailExceeded
        });
        
        console.log('Response 2 (should be invalid if email exceeded limit):');
        console.log(`- Valid: ${response2.data.valid}`);
        console.log(`- Discount: ₪${response2.data.discount || 0}`);
        console.log(`- Message: ${response2.data.message || 'N/A'}`);
        console.log(`- Error: ${response2.data.error || 'None'}\n`);
        
        // Analysis
        console.log('🔍 Analysis:');
        const firstIsValid = response1.data.valid !== false && response1.data.discount > 0;
        const secondIsValid = response2.data.valid !== false && response2.data.discount > 0;
        
        if (firstIsValid && !secondIsValid) {
            console.log('✅ CORRECT: First email shows discount, second email properly rejected');
        } else if (firstIsValid && secondIsValid) {
            console.log('⚠️  WARNING: Both emails show discount - check if max usage per user is set');
        } else if (!firstIsValid && !secondIsValid) {
            console.log('❌ ISSUE: Both emails rejected - coupon might be fully exhausted or expired');
        } else {
            console.log('❓ UNEXPECTED: First email rejected, second email valid');
        }
        
        console.log('\n🎯 Frontend Fix: The updated Checkout.jsx now:');
        console.log('- Immediately clears discount when email changes');
        console.log('- Shows "Validating coupon with new email..." message');
        console.log('- Re-validates after 1 second delay');
        console.log('- Prevents stale discount from showing with wrong email');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

// Instructions for manual testing
console.log('📋 Manual Testing Instructions:');
console.log('1. Start the frontend development server');
console.log('2. Go to checkout page');
console.log('3. Enter a coupon code');
console.log('4. Enter an email that has NOT exceeded max usage per user');
console.log('5. Verify discount appears');
console.log('6. Change email to one that HAS exceeded max usage per user');
console.log('7. Verify discount disappears immediately and error message shows');
console.log('');

testEmailChangeCouponValidation();
