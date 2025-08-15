// Test to create a mock PayPal order and see if coupon tracking works
const axios = require('axios');

async function testPayPalOrderFlow(baseUrl, environment) {
    console.log(`\n=== Testing PayPal Order Flow on ${environment} ===`);
    console.log(`Base URL: ${baseUrl}`);
    
    // 1. Create PayPal order with coupon
    console.log('\n1. Creating PayPal order with coupon test3:');
    const orderData = {
        cart: [
            {
                productId: "66b91ea5fad33cb7976b1b81", // Use a real product ID from your system
                quantity: 1,
                price: 100
            }
        ],
        couponCode: "test3",
        customerEmail: "test@example.com",
        customerName: "Test User",
        phone: "+1234567890"
    };
    
    try {
        const orderResponse = await axios.post(`${baseUrl}/api/paypal/orders`, orderData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        console.log('✅ Order Creation Response:', {
            status: orderResponse.status,
            orderId: orderResponse.data?.id,
            total: orderResponse.data?.purchase_units?.[0]?.amount?.value
        });
        
        const orderId = orderResponse.data?.id;
        if (orderId) {
            console.log(`Created order ID: ${orderId}`);
            
            // NOTE: We won't actually capture this in the test
            // Just check if the order was created with the right discount
            return orderId;
        }
        
    } catch (error) {
        console.log('❌ Order Creation Error:', {
            status: error.response?.status,
            error: error.response?.data || error.message
        });
    }
    
    return null;
}

async function runTests() {
    // Test production
    const prodOrderId = await testPayPalOrderFlow('https://api.monkeyz.co.il', 'PRODUCTION');
    
    // Test localhost  
    const localOrderId = await testPayPalOrderFlow('http://localhost:8000', 'LOCALHOST');
    
    if (prodOrderId) {
        console.log(`\nProduction Order ID: ${prodOrderId}`);
    }
    if (localOrderId) {
        console.log(`Localhost Order ID: ${localOrderId}`);
    }
}

runTests().catch(console.error);
