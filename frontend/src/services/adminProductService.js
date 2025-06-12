import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // Adjust if your API URL is different

const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Fetch all products for admin
export const getAdminProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/products`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching admin products:', error.response?.data?.detail || error.message);
    throw error.response?.data?.detail || error.message;
  }
};

// Fetch CD keys for a specific product
export const getProductCDKeys = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/admin/products/${productId}/cdkeys`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching CD keys for product ${productId}:`, error.response?.data?.detail || error.message);
    throw error.response?.data?.detail || error.message;
  }
};

// Update a specific CD key for a product
export const updateProductCDKey = async (productId, cdKeyIndex, cdKeyData) => {
  try {
    const response = await axios.patch(`${API_URL}/admin/products/${productId}/cdkeys/${cdKeyIndex}`, cdKeyData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error updating CD key at index ${cdKeyIndex} for product ${productId}:`, error.response?.data?.detail || error.message);
    throw error.response?.data?.detail || error.message;
  }
};

// Delete a specific CD key for a product
export const deleteProductCDKey = async (productId, cdKeyIndex) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/products/${productId}/cdkeys/${cdKeyIndex}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error deleting CD key at index ${cdKeyIndex} for product ${productId}:`, error.response?.data?.detail || error.message);
    throw error.response?.data?.detail || error.message;
  }
};
