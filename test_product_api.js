// A simple script to test the product APIs
const axios = require('axios');
const baseUrl = 'http://localhost:8000'; // Change this to match your API URL

async function testProductAPIs() {
  console.log('Testing product APIs...');
  
  try {
    // Test all products endpoint
    console.log('\nTesting /product/all endpoint:');
    const allProductsResponse = await axios.get(`${baseUrl}/product/all`);
    console.log(`Found ${allProductsResponse.data.length} products`);
    
    if (allProductsResponse.data.length > 0) {
      console.log('Sample product:', JSON.stringify(allProductsResponse.data[0], null, 2));
    }

    // Test homepage products endpoint
    console.log('\nTesting /product/homepage endpoint:');
    const homepageResponse = await axios.get(`${baseUrl}/product/homepage`);
    console.log(`Found ${homepageResponse.data.length} homepage products`);
    
    // Test best-sellers endpoint
    console.log('\nTesting /product/best-sellers endpoint:');
    const bestSellersResponse = await axios.get(`${baseUrl}/product/best-sellers`);
    console.log(`Found ${bestSellersResponse.data.length} best sellers`);
    
    // Test recent products endpoint
    console.log('\nTesting /product/recent endpoint:');
    const recentResponse = await axios.get(`${baseUrl}/product/recent`);
    console.log(`Found ${recentResponse.data.length} recent products`);
    
    // Check category distribution
    console.log('\nProduct category distribution:');
    const categories = {};
    allProductsResponse.data.forEach(product => {
      const category = product.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    Object.keys(categories).forEach(category => {
      console.log(`${category}: ${categories[category]} products`);
    });
    
    // Check flag distribution
    console.log('\nProduct flags distribution:');
    let homepageCount = 0;
    let bestSellerCount = 0;
    let newProductCount = 0;
    
    allProductsResponse.data.forEach(product => {
      if (product.display_on_homepage || product.displayOnHomepage) homepageCount++;
      if (product.best_seller || product.isBestSeller) bestSellerCount++;
      if (product.is_new || product.isNew) newProductCount++;
    });
    
    console.log(`Homepage products: ${homepageCount}`);
    console.log(`Best sellers: ${bestSellerCount}`);
    console.log(`New products: ${newProductCount}`);
    
  } catch (error) {
    console.error('Error testing product APIs:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testProductAPIs();
