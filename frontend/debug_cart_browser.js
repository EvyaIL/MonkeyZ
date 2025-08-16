// Test cart behavior in browser console:
// 1. Check current rate limiting status
console.log('Last cart validation:', localStorage.getItem('lastCartValidation'));
console.log('Time since last validation (minutes):', (Date.now() - parseInt(localStorage.getItem('lastCartValidation') || 0)) / (1000 * 60));

// 2. Test product API directly
fetch('http://localhost:8000/product/all')
  .then(response => response.json())
  .then(products => {
    console.log('Products API test:', {
      status: 'success',
      count: products.length,
      firstProductId: products[0]?.id || products[0]?._id,
      sampleProducts: products.slice(0, 2).map(p => ({
        id: p.id || 'NULL',
        _id: p._id,
        name: typeof p.name === 'object' ? p.name.en : p.name
      }))
    });
  })
  .catch(error => {
    console.error('Products API test failed:', error);
  });

// 3. Check current cart state
const cart = JSON.parse(localStorage.getItem('cart') || '{}');
console.log('Current cart:', {
  itemCount: Object.keys(cart).length,
  items: Object.entries(cart).map(([id, item]) => ({
    id: id,
    name: item.name,
    lastValidated: new Date(item.lastValidated || 0).toLocaleString()
  }))
});

console.log('✅ Cart debugging complete - check above results');
