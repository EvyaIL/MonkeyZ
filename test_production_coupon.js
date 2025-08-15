// Test coupon validation on production
const axios = require('axios');

async function testProductionCoupon() {
    console.log('Testing coupon validation on production...');
    
    const productionUrl = 'https://api.monkeyz.co.il/api/coupons/validate';
    
    const testData = {
        code: 'test3',
        amount: 100,
        email: 'test@example.com'
    };
    
    try {
        console.log('Sending request to:', productionUrl);
        console.log('Request data:', testData);
        
        const response = await axios.post(productionUrl, testData, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://monkeyz.co.il'
            },
            timeout: 10000
        });
        
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
    } catch (error) {
        console.error('Error occurred:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response data:', error.response?.data);
        console.error('Full error:', error.message);
        
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

// Also test localhost for comparison
async function testLocalhostCoupon() {
    console.log('\nTesting coupon validation on localhost...');
    
    const localhostUrl = 'http://localhost:8000/api/coupons/validate';
    
    const testData = {
        code: 'test3',
        amount: 100,
        email: 'test@example.com'
    };
    
    try {
        console.log('Sending request to:', localhostUrl);
        console.log('Request data:', testData);
        
        const response = await axios.post(localhostUrl, testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
    } catch (error) {
        console.error('Error occurred:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response data:', error.response?.data);
        console.error('Full error:', error.message);
    }
}

async function runTests() {
    await testProductionCoupon();
    await testLocalhostCoupon();
}

runTests().catch(console.error);
