import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function StockManager() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newCodes, setNewCodes] = useState('');  const { isAdmin } = useAuth();
  
  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddCodes = async (productId) => {
    try {
      const codes = newCodes.split('\n').filter(code => code.trim());
      
      const response = await fetch(`/api/admin/products/${productId}/codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ codes })
      });
      
      if (response.ok) {
        fetchProducts(); // Refresh products list
        setNewCodes('');
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error adding codes:', error);
    }
  };

  const handleDeleteCode = async (productId, code) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/codes/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchProducts(); // Refresh products list
      }
    } catch (error) {
      console.error('Error deleting code:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Stock Management</h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedProduct?.id || ''}
            onChange={(e) => {
              const product = products.find(p => p.id === e.target.value);
              setSelectedProduct(product);
            }}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSelectedProduct(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View All
          </button>
        </div>
      </div>

      {selectedProduct ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-medium mb-4">{selectedProduct.name}</h3>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Available Codes: {selectedProduct.codes?.length || 0}</span>
              <button
                onClick={() => {
                  const el = document.createElement('textarea');
                  el.value = selectedProduct.codes?.join('\n') || '';
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy');
                  document.body.removeChild(el);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Copy All
              </button>
            </div>
            
            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              {selectedProduct.codes?.map((code) => (
                <div key={code} className="flex justify-between items-center py-2">
                  <code className="text-sm">{code}</code>
                  <button
                    onClick={() => handleDeleteCode(selectedProduct.id, code)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Codes (one per line)
            </label>
            <textarea
              value={newCodes}
              onChange={(e) => setNewCodes(e.target.value)}
              rows={5}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter codes here..."
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleAddCodes(selectedProduct.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Codes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium mb-2">{product.name}</h3>
              <div className="text-gray-600 mb-4">
                Available Codes: {product.codes?.length || 0}
              </div>
              <button
                onClick={() => setSelectedProduct(product)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Manage Stock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
