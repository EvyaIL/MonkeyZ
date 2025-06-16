import React, { useState, useEffect } from 'react';
import { apiService } from '../../../lib/apiService';
import { useNavigate } from 'react-router-dom';
import OrderForm from '../../../components/admin/OrderForm';

export default function AdminOrderCreate() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Initial order state
  const [order, setOrder] = useState(null);

  // Load products for selection
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/product/all');
        if (response.error) {
          throw new Error(response.error);
        }
        const fetchedProducts = response.data || [];
        const formattedProducts = fetchedProducts.map(p => ({
          id: String(p.id || p._id),
          name: typeof p.name === 'object' ? (p.name.en || p.name.he || 'Unnamed Product') : (p.name || 'Unnamed Product'),
          price: p.price !== undefined && p.price !== null ? p.price : 0,
          manages_cd_keys: p.manages_cd_keys
        }));
        setProducts(formattedProducts);
      } catch (err) {
        setError('Failed to load products. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Handle order submission
  const handleOrderSubmit = async (formData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiService.post('/admin/orders', formData);
      if (response.error) {
        throw new Error(response.error);
      }
      setSuccess('Order created successfully!');
      setTimeout(() => {
        navigate('/dashboard/admin/orders');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/dashboard/admin/orders');
  };

  return (
    <OrderForm
      order={order}
      onSubmit={handleOrderSubmit}
      onCancel={handleCancel}
      allProducts={products}
      loading={loading}
      error={error}
      t={x => x} // Pass a dummy translation function or your real one
    />
  );
}
