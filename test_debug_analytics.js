// Test the debug analytics recalculation endpoint
const axios = require('axios');

async function testDebugAnalytics() {
    console.log('=== Testing Debug Analytics Recalculation ===\n');
    
    const environments = [
        { name: 'LOCALHOST', url: 'http://localhost:8000' }
    ];
    
    for (const env of environments) {
        console.log(`\n--- Testing ${env.name} ---`);
        
        console.log('1. Testing analytics recalculation:');
        try {
            const response = await axios.post(`${env.url}/api/debug/recalc-analytics`, {
                code: 'test3'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            console.log('✅ Debug Analytics Response:', response.data);
            
            if (response.data.success && response.data.analytics) {
                const analytics = response.data.analytics;
                console.log(`   → Usage Analytics:`);
                console.log(`     - Total Orders: ${analytics.usageAnalytics?.total_orders || 0}`);
                console.log(`     - Completed: ${analytics.usageAnalytics?.completed || 0}`);
                console.log(`     - Usage Count: ${analytics.usageCount || 0}`);
                console.log(`   → Database: ${response.data.debug_info?.database}`);
            }
            
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('❌ Debug endpoint not found (404) - endpoint not deployed yet');
            } else {
                console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
            }
        }
        
        console.log('\n2. Testing coupon application:');
        try {
            const response = await axios.post(`${env.url}/api/debug/apply-coupon`, {
                code: 'test3',
                amount: 100,
                email: 'debug-test@example.com'
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            console.log('✅ Debug Apply Response:', response.data);
            
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('❌ Debug endpoint not found (404) - endpoint not deployed yet');
            } else {
                console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
            }
        }
    }
}

testDebugAnalytics().catch(console.error);
