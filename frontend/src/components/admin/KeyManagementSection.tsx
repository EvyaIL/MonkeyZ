import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Alert, CircularProgress } from '@mui/material';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const api = useApi();  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/admin/key-metrics');
      
      if ('error' in response) {
        throw new Error(response.error);
      }
      setMetrics(response.data);
    } catch (err) {
      console.error('Error fetching key metrics:', err);
      setError(t('admin.errorFetchingMetrics'));
    } finally {
      setIsLoading(false);
    }
  }, [api, t]);
  useEffect(() => {
    fetchMetrics();
    
    // Set up a refresh interval of 5 minutes instead of continuous polling
    const intervalId = setInterval(fetchMetrics, 300000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  const handleOpenBulkManagement = useCallback((product: KeyUsageByProduct) => {
    setSelectedProduct(product);
    setShowBulkManagement(true);
  }, []);

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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}      {metrics && (
        <KeyMetricsComponent
          metrics={metrics}
          onRefresh={fetchMetrics}
          isLoading={isLoading}
        />
      )}

      {selectedProduct && (
        <KeyBulkManagement
          open={showBulkManagement}
          onClose={handleCloseBulkManagement}
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
        />
      )}      {/* Quick Actions */}
      {metrics && metrics.lowStockProducts > 0 && (
        <Box mt={2}>
          <Alert 
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  // metrics is guaranteed to be non-null here due to the condition above
                  const lowStockProduct = metrics.keyUsageByProduct.find(
                    (p: KeyUsageByProduct) => p.availableKeys <= (p.totalKeys * 0.2)
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
