// Get a list of products to use in tests
const axios = require('axios');

async function getProducts(baseUrl, environment) {
    console.log(`\n=== Getting Products from ${environment} ===`);
    
    try {
        const response = await axios.get(`${baseUrl}/product/all`, {
            timeout: 10000
        });
        
        console.log(`✅ Found ${response.data.length} products`);
        
        // Show first few products
        const products = response.data.slice(0, 3);
        products.forEach((product, index) => {
            console.log(`${index + 1}. ID: ${product.id || product._id}, Name: ${product.name}, Price: ${product.price}`);
        });
        
        return response.data[0]; // Return first product for testing
        
    } catch (error) {
        console.log('❌ Error getting products:', error.response?.data || error.message);
        return null;
    }
}

async function runProductCheck() {
    // Check production products
    const prodProduct = await getProducts('https://api.monkeyz.co.il', 'PRODUCTION');
    
    // Check localhost products
    const localProduct = await getProducts('http://localhost:8000', 'LOCALHOST');
    
    return { prodProduct, localProduct };
}

runProductCheck().catch(console.error);
