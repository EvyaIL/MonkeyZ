// Frontend coupon test - to be run in browser console
// Go to https://monkeyz.co.il/checkout and run this in the browser console

console.log('Testing frontend coupon validation...');

// Test the handleCoupon function directly
async function testFrontendCoupon() {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il';
    console.log('API URL:', apiUrl);
    
    const requestData = {
        code: 'test3',
        amount: 100,
        email: 'test@example.com'
    };
    
    console.log('Request data:', requestData);
    
    try {
        const response = await fetch(`${apiUrl}/api/coupons/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        // Check the validation logic
        if (data.valid === false || data.error) {
            console.log('❌ Frontend would reject this coupon');
            console.log('Reason:', data.message || data.error);
        } else if (data.discount && data.discount > 0) {
            console.log('✅ Frontend would accept this coupon');
            console.log('Discount:', data.discount);
        } else {
            console.log('⚠️ Unclear response - frontend might reject');
            console.log('Missing valid field and discount');
        }
        
    } catch (error) {
        console.error('Frontend request failed:', error);
    }
}

testFrontendCoupon();
