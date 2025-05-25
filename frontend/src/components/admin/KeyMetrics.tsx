import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useTranslation } from 'react-i18next';

interface IKeyMetricsProps {
  metrics: {
    totalKeys: number;
    availableKeys: number;
    usedKeys: number;
    expiredKeys: number;
    lowStockProducts: number;
    averageKeyUsageTime?: number;
    keyUsageByProduct: Array<{
      productId: string;
      productName: string;
      totalKeys: number;
      availableKeys: number;
    }>;
  };
  onRefresh: () => void;
  isLoading: boolean;
}

export default function KeyMetrics({ metrics, onRefresh, isLoading }: IKeyMetricsProps) {
  const { t } = useTranslation();

  const calculateUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Key Metrics Overview
        </Typography>
        <IconButton onClick={onRefresh} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
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
                  <Tooltip title="Low key inventory">
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

        {/* Low Stock Alert Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: metrics.lowStockProducts > 0 ? 'warning.light' : 'inherit' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.lowStockAlert')}
              </Typography>
              <Typography variant="h4">
                {metrics.lowStockProducts}
              </Typography>
              <Box mt={1} display="flex" alignItems="center">
                <Typography variant="body2" color={metrics.lowStockProducts > 0 ? 'error' : 'textSecondary'}>
                  {t('admin.productsNeedKeys')}
                </Typography>
                {metrics.lowStockProducts > 0 && (
                  <Tooltip title={t('admin.lowStockWarning')}>
                    <InfoIcon color="warning" sx={{ ml: 1 }} />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Product-specific key usage */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin.keysByProduct')}
              </Typography>
              <Grid container spacing={2}>
                {metrics.keyUsageByProduct.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.productId}>
                    <Box>
                      <Typography variant="subtitle2" noWrap>
                        {product.productName}
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
                        <Typography variant="body2" color="textSecondary">
                          {product.availableKeys}/{product.totalKeys}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
