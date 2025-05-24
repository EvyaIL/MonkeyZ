import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../lib/apiService';

export const useApi = () => {
  const navigate = useNavigate();

  const handleApiError = useCallback((error) => {
    if (error?.response?.status === 401) {
      // Handle unauthorized access
      navigate('/sign-in');
    }
    return { error: error?.response?.data || 'An error occurred' };
  }, [navigate]);

  const get = useCallback(async (endpoint) => {
    try {
      const response = await apiService.get(endpoint);
      return { data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);

  const post = useCallback(async (endpoint, data) => {
    try {
      const response = await apiService.post(endpoint, data);
      return { data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);
  const put = useCallback(async (endpoint, data) => {
    try {
      const response = await apiService.put(endpoint, data);
      return { data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);
  
  const patch = useCallback(async (endpoint, data) => {
    try {
      const response = await apiService.patch(endpoint, data);
      return { data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);

  const del = useCallback(async (endpoint) => {
    try {
      const response = await apiService.delete(endpoint);
      return { data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleApiError]);
  return {
    get,
    post,
    put,
    patch,
    delete: del
  };
};
