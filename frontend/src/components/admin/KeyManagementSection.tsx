import React, { useState, useEffect, useCallback } from 'react';
import { Box, Alert, CircularProgress, Snackbar, Button } from '@mui/material';
import KeyMetricsComponent from './KeyMetrics';
import KeyBulkManagement from './KeyBulkManagement';
import { useApi } from '../../hooks/useApi';
import { useTranslation } from 'react-i18next';
import { KeyMetrics as IKeyMetrics, KeyUsageByProduct } from './types';

export default function KeyManagementSection(): JSX.Element {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<IKeyMetrics | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<KeyUsageByProduct | null>(null);
  const [showBulkManagement, setShowBulkManagement] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const api = useApi();
  const fetchMetrics = useCallback(async () => {
    try {
      // Check cache first
      const cachedData = localStorage.getItem('keyMetricsData');
      const cacheTimestamp = localStorage.getItem('keyMetricsTimestamp');
      const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 300000; // 5 minutes

      if (isCacheValid && cachedData) {
        const parsedData = JSON.parse(cachedData);
        setMetrics(parsedData);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const response = await api.get('/admin/key-metrics');
      
      if ('error' in response) {
        throw new Error(response.error);
      }
      
      // Cache the metrics
      localStorage.setItem('keyMetricsData', JSON.stringify(response.data));
      localStorage.setItem('keyMetricsTimestamp', Date.now().toString());
      
      setMetrics(response.data);
      setError('');
    } catch (err) {
      // Try to load from cache as fallback
      const cachedData = localStorage.getItem('keyMetricsData');
      const cacheTimestamp = localStorage.getItem('keyMetricsTimestamp');
      
      if (cachedData) {
        setMetrics(JSON.parse(cachedData));
      } else {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(t('admin.errorFetchingMetrics') + ': ' + errorMessage);
        setShowError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [api, t]);
  useEffect(() => {
    // Call fetchMetrics but only when the component mounts
    fetchMetrics();

    // Only set up polling if we're in a tab that needs it
    const shouldPoll = window.location.pathname.includes('/admin/');
    let intervalId: NodeJS.Timeout | null = null;
    
    if (shouldPoll) {
      // Set up a refresh interval of 5 minutes (300000 ms)
      intervalId = setInterval(fetchMetrics, 300000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only on mount
  const handleOpenBulkManagement = useCallback(async (product: KeyUsageByProduct) => {
    try {
      // Get product details including key format
      const response = await api.get(`/admin/products/${product.productId}`);
      if ('error' in response) {
        throw new Error(response.error);
      }
      
      const updatedProduct: KeyUsageByProduct = {
        ...product,
        keyManagement: {
          format: response.data.keyManagement?.format || 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'
        }
      };
      
      setSelectedProduct(updatedProduct);
      setShowBulkManagement(true);
    } catch (err) {
      console.error('Error getting product details:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(t('admin.errorFetchingProduct') + ': ' + errorMessage);
      setShowError(true);
    }
  }, [api, t]);

  const handleCloseBulkManagement = useCallback(() => {
    setShowBulkManagement(false);
    setSelectedProduct(null);
    fetchMetrics(); // Refresh metrics after bulk operations
  }, [fetchMetrics]);

  if (!metrics && isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {error}
        </Alert>
      </Snackbar>      {metrics && (
        <KeyMetricsComponent
          metrics={metrics}
          onRefresh={fetchMetrics}
          isLoading={isLoading}
          onManageKeys={(product) => handleOpenBulkManagement(product)}
        />
      )}

      {selectedProduct && (
        <KeyBulkManagement
          open={showBulkManagement}
          onClose={handleCloseBulkManagement}
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
          keyFormat={selectedProduct.keyManagement?.format}
        />
      )}

      {metrics && metrics.lowStockProducts > 0 && (
        <Box mt={2}>
          <Alert 
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {                  const lowStockProduct = metrics.keyUsageByProduct.find(
                    p => p.availableKeys <= (p.totalKeys * 0.2)
                  );
                  if (lowStockProduct) {
                    handleOpenBulkManagement(lowStockProduct);
                  }
                }}
              >
                {t('admin.manageKeys')}
              </Button>
            }
          >
            {t('admin.lowStockAlert')} - {metrics.lowStockProducts} {t('admin.productsNeedKeys')}
          </Alert>
        </Box>
      )}
    </Box>
  );
}
