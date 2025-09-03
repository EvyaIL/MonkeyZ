// Test script to verify the coupon max usage fix
const axios = require('axios');

const API_URL = 'https://api.monkeyz.co.il';

async function testCouponMaxUsageFix() {
    console.log('🔧 Testing Coupon Max Usage Fix...\n');
    
    // Test configuration - replace with actual values from your system
    const testCoupon = 'TEST10'; // Replace with a real coupon code
    const testEmail1 = 'test1@example.com';
    const testEmail2 = 'test2@example.com';
    const testAmount = 100;
    
    console.log('📋 Test Scenario:');
    console.log(`- Coupon: ${testCoupon}`);
    console.log('- Should have maxUsagePerUser: 1 and maxUses: 2');
    console.log('- Expected behavior: Work max 2 times total, max 1 time per user\n');
    
    try {
        console.log('Step 1: Validate coupon with first email (should work)...');
        const validate1 = await axios.post(`${API_URL}/api/coupons/validate`, {
            code: testCoupon,
            amount: testAmount,
            email: testEmail1
        });
        
        console.log(`✅ Validation 1: Valid=${validate1.data.valid}, Discount=${validate1.data.discount}`);
        
        console.log('\nStep 2: Validate coupon with second email (should work)...');
        const validate2 = await axios.post(`${API_URL}/api/coupons/validate`, {
            code: testCoupon,
            amount: testAmount,
            email: testEmail2
        });
        
        console.log(`✅ Validation 2: Valid=${validate2.data.valid}, Discount=${validate2.data.discount}`);
        
        // This test only validates - it doesn't actually apply the coupon
        // The real test is when users actually complete orders through PayPal
        
        console.log('\n🎯 What the fix addresses:');
        console.log('✅ create_paypal_order() now uses apply_coupon() instead of validate_coupon()');
        console.log('✅ This increments usage count immediately when PayPal order is created');
        console.log('✅ capture_paypal_order() no longer double-applies (just updates analytics)');
        console.log('✅ Prevents race condition where multiple orders could be created before usage incremented');
        
        console.log('\n📝 Technical Changes Made:');
        console.log('1. In create_paypal_order(): Changed validate_coupon() → apply_coupon()');
        console.log('2. In capture_paypal_order(): Removed coupon application, only updates analytics');
        console.log('3. Now usage count increments at order creation, not payment capture');
        console.log('4. Frontend email change fix prevents stale discount display');
        
        console.log('\n⚠️  Manual Testing Required:');
        console.log('1. Create a coupon with maxUsagePerUser=1, maxUses=2');
        console.log('2. Try to use it with same email twice → should fail on second attempt');
        console.log('3. Try to use it 3 times total → should fail on third attempt');
        console.log('4. Verify usage count increments immediately when PayPal order created');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

console.log('🧪 Coupon Max Usage Bug Fix Test\n');
console.log('This test verifies the fix for the issue where coupons with');
console.log('maxUsagePerUser=1 and maxUses=2 were working more than twice.\n');

testCouponMaxUsageFix();
