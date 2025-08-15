const axios = require('axios');

async function testCoupons() {
  console.log('=== COUPON DEBUGGING ===');
  
  const testData = {
    code: 'test3',
    amount: 100,
    email: 'test@example.com'
  };

  console.log('Testing with data:', testData);
  console.log('');

  // Test localhost
  console.log('--- TESTING LOCALHOST ---');
  try {
    const localhostResponse = await axios.post('http://localhost:8000/api/coupons/validate', testData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    console.log('✅ Localhost Status:', localhostResponse.status);
    console.log('✅ Localhost Response:', JSON.stringify(localhostResponse.data, null, 2));
  } catch (localhostError) {
    console.log('❌ Localhost Error Status:', localhostError.response?.status);
    console.log('❌ Localhost Error Data:', JSON.stringify(localhostError.response?.data, null, 2));
    console.log('❌ Localhost Error Message:', localhostError.message);
  }

  console.log('');

  // Test production
  console.log('--- TESTING PRODUCTION ---');
  try {
    const productionResponse = await axios.post('https://api.monkeyz.co.il/api/coupons/validate', testData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    console.log('✅ Production Status:', productionResponse.status);
    console.log('✅ Production Response:', JSON.stringify(productionResponse.data, null, 2));
  } catch (productionError) {
    console.log('❌ Production Error Status:', productionError.response?.status);
    console.log('❌ Production Error Data:', JSON.stringify(productionError.response?.data, null, 2));
    console.log('❌ Production Error Message:', productionError.message);
    console.log('❌ Production Full Error:', productionError.code);
  }

  console.log('');
  console.log('=== DEBUGGING COMPLETE ===');
}

testCoupons().catch(console.error);
