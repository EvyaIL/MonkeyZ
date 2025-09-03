// Create test coupons through the admin API
const axios = require('axios');

const API_URL = 'https://api.monkeyz.co.il';

async function createTestCoupons() {
    console.log('🛠️  Creating Test Coupons via Admin API...\n');
    
    // Test coupons to create
    const testCoupons = [
        {
            code: 'TEST10',
            discountType: 'percentage',
            discountValue: 10,
            maxUses: 2,
            maxUsagePerUser: 1,
            active: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            description: 'Test coupon - 10% off, max 2 uses, 1 per user'
        },
        {
            code: 'SAVE20',
            discountType: 'fixed',
            discountValue: 20,
            maxUses: 5,
            maxUsagePerUser: 2,
            active: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Test coupon - $20 off, max 5 uses, 2 per user'
        },
        {
            code: 'UNLIMITED',
            discountType: 'percentage',
            discountValue: 5,
            maxUses: 0, // 0 means unlimited
            maxUsagePerUser: 0, // 0 means unlimited per user
            active: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Test coupon - 5% off, unlimited uses'
        }
    ];
    
    console.log('📝 Attempting to create coupons...');
    
    // Try different admin endpoints
    const adminEndpoints = [
        '/api/admin/coupons',
        '/admin/api/coupons',
        '/api/coupons/create',
        '/admin/coupons'
    ];
    
    for (const coupon of testCoupons) {
        console.log(`\n🎫 Creating coupon: ${coupon.code}`);
        
        let created = false;
        for (const endpoint of adminEndpoints) {
            try {
                console.log(`  Trying endpoint: ${endpoint}`);
                const response = await axios.post(`${API_URL}${endpoint}`, coupon, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 200 || response.status === 201) {
                    console.log(`  ✅ Created successfully via ${endpoint}`);
                    created = true;
                    break;
                }
            } catch (error) {
                console.log(`  ❌ Failed via ${endpoint}: ${error.response?.status || error.message}`);
            }
        }
        
        if (!created) {
            console.log(`  ⚠️  Could not create ${coupon.code} through any endpoint`);
        }
    }
    
    console.log('\n🧪 Testing created coupons...');
    
    // Test each coupon
    for (const coupon of testCoupons) {
        try {
            const response = await axios.post(`${API_URL}/api/coupons/validate`, {
                code: coupon.code,
                amount: 100,
                email: 'test@example.com'
            });
            
            if (response.data.valid) {
                console.log(`✅ ${coupon.code}: Valid! Discount: ${response.data.discount}`);
            } else {
                console.log(`❌ ${coupon.code}: ${response.data.message || response.data.error}`);
            }
        } catch (error) {
            console.log(`❌ ${coupon.code}: Request failed - ${error.message}`);
        }
    }
}

createTestCoupons();
