import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import KeyIcon from '@mui/icons-material/VpnKey';
import ErrorIcon from '@mui/icons-material/Error';
import { KeyMetrics as IKeyMetrics, KeyUsageByProduct } from './types';

interface IKeyMetricsProps {
  metrics: IKeyMetrics;
  onRefresh: () => void;
  isLoading: boolean;
  onManageKeys: (product: KeyUsageByProduct) => void;
}

function calculateUsagePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return (used / total) * 100;
}

function getStatusColor(percentage: number): 'success' | 'warning' | 'error' {
  if (percentage >= 90) return 'error';
  if (percentage >= 70) return 'warning';
  return 'success';
}

export default function KeyMetrics({ metrics, onRefresh, isLoading, onManageKeys }: IKeyMetricsProps) {
  const { t } = useTranslation();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          {t('admin.keyMetrics')}
        </Typography>
        <IconButton onClick={onRefresh} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3} mb={4}>
        {/* Total Keys Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.totalKeys')}
              </Typography>
              <Typography variant="h4">
                {metrics.totalKeys.toLocaleString()}
              </Typography>
              <Box mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={calculateUsagePercentage(metrics.usedKeys, metrics.totalKeys)}
                  color={getStatusColor(calculateUsagePercentage(metrics.usedKeys, metrics.totalKeys))}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Keys Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.availableKeys')}
              </Typography>
              <Typography variant="h4">
                {metrics.availableKeys.toLocaleString()}
              </Typography>
              <Box mt={1} display="flex" alignItems="center">
                <Typography variant="body2" color="textSecondary">
                  {((metrics.availableKeys / metrics.totalKeys) * 100).toFixed(1)}% available
                </Typography>
                {metrics.availableKeys < metrics.totalKeys * 0.2 && (
                  <Tooltip title={t('admin.lowKeyInventory')}>
                    <WarningIcon color="warning" sx={{ ml: 1 }} />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Used Keys Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.usedKeys')}
              </Typography>
              <Typography variant="h4">
                {metrics.usedKeys.toLocaleString()}
              </Typography>
              <Box mt={1}>
                <Typography variant="body2" color="textSecondary">
                  {((metrics.usedKeys / metrics.totalKeys) * 100).toFixed(1)}% used
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Products Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.lowStockProducts')}
              </Typography>
              <Typography variant="h4">
                {metrics.lowStockProducts}
              </Typography>
              <Box mt={1} display="flex" alignItems="center">
                <Typography variant="body2" color="textSecondary">
                  {t('admin.productsNeedKeys')}
                </Typography>
                {metrics.lowStockProducts > 0 && (
                  <Tooltip title={t('admin.lowStockWarning')}>
                    <ErrorIcon color="error" sx={{ ml: 1 }} />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product-specific key usage */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('admin.keysByProduct')}
          </Typography>
          <Grid container spacing={3}>
            {metrics.keyUsageByProduct.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.productId}>
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Typography variant="subtitle1" noWrap>
                        {product.productName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {t('admin.available')}: {product.availableKeys}/{product.totalKeys}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Box flex={1} mr={2}>
                          <LinearProgress
                            variant="determinate"
                            value={calculateUsagePercentage(
                              product.totalKeys - product.availableKeys,
                              product.totalKeys
                            )}
                            color={getStatusColor(calculateUsagePercentage(
                              product.totalKeys - product.availableKeys,
                              product.totalKeys
                            ))}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<KeyIcon />}
                      onClick={() => onManageKeys(product)}
                      variant={product.availableKeys <= (product.totalKeys * 0.2) ? 'contained' : 'text'}
                      color={product.availableKeys <= (product.totalKeys * 0.2) ? 'warning' : 'primary'}
                    >
                      {t('admin.manage')}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
