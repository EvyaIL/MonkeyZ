import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  VpnKey,
  Inventory,
  Add,
  Edit,
  Visibility,
  Refresh
} from '@mui/icons-material';
import { apiService } from '../../../lib/apiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Create component as a named function expression
const AdminOverview = function AdminOverviewComponent() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);  const [analytics, setAnalytics] = React.useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailySales: [],
    totalProducts: 0,
    activeProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    keyMetrics: {
      totalKeys: 0,
      availableKeys: 0,
      usedKeys: 0,
      expiredKeys: 0,
    },
    recentOrders: [],
    topSellingProducts: [],
    monthlyRevenue: 0,
    weeklyGrowth: 0,
    conversionRate: 0
  });  // Use useCallback for the data loading function to avoid recreation on each render
  const loadAnalyticsData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const { data, error } = await apiService.get('/admin/dashboard/stats');
      
      if (error) {
        console.error('Error loading dashboard stats:', error);
        setAnalytics(prev => ({ ...prev }));
        return;
      }      // Load key metrics with improved error handling and caching
      let keyMetrics = { totalKeys: 0, availableKeys: 0, usedKeys: 0, expiredKeys: 0 };
      try {
        // Check if we have cached metrics that are less than 5 minutes old
        const cachedMetrics = JSON.parse(localStorage.getItem('adminKeyMetrics') || '{}');
        const cacheTimestamp = localStorage.getItem('adminKeyMetricsTimestamp');
        const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 300000;

        if (isCacheValid && cachedMetrics.totalKeys !== undefined) {
          console.debug('Using cached key metrics');
          keyMetrics = cachedMetrics;
        } else {
          const keyResponse = await apiService.get('/admin/key-metrics');
          if (!keyResponse.error && keyResponse.data) {
            console.debug('Key metrics loaded successfully from API');
            keyMetrics = {
              totalKeys: keyResponse.data.totalKeys || 0,
              availableKeys: keyResponse.data.availableKeys || 0,
              usedKeys: keyResponse.data.usedKeys || 0,
              expiredKeys: keyResponse.data.expiredKeys || 0,
            };
            // Cache the metrics
            localStorage.setItem('adminKeyMetrics', JSON.stringify(keyMetrics));
            localStorage.setItem('adminKeyMetricsTimestamp', Date.now().toString());
          }
        }
      } catch (keyError) {
        console.warn('Key metrics not available:', keyError);
        // Try to load from cache as fallback even if it's old
        try {
          const cachedMetrics = JSON.parse(localStorage.getItem('adminKeyMetrics') || '{}');
          if (cachedMetrics.totalKeys !== undefined) {
            console.debug('Using cached key metrics as fallback');
            keyMetrics = cachedMetrics;
          }
        } catch (cacheError) {
          console.error('Cache fallback failed:', cacheError);
        }
      }

      // Load recent orders
      let recentOrders = [];
      try {
        const ordersResponse = await apiService.get('/admin/orders?limit=5');
        if (!ordersResponse.error && ordersResponse.data) {
          recentOrders = ordersResponse.data.slice(0, 5);
        }
      } catch (ordersError) {
        console.warn('Recent orders not available:', ordersError);
      }

      // Load products data
      let productsData = { total: 0, active: 0, topSelling: [] };
      try {
        const productsResponse = await apiService.get('/admin/products');
        if (!productsResponse.error && productsResponse.data) {
          const products = productsResponse.data;
          productsData = {
            total: products.length,
            active: products.filter(p => p.active !== false).length,
            topSelling: products.slice(0, 5) // Top 5 products
          };
        }
      } catch (productsError) {
        console.warn('Products data not available:', productsError);
      }
      
      // Calculate additional metrics
      const monthlyRevenue = data?.totalRevenue || 0;
      const weeklyGrowth = Math.random() * 20 - 10; // Mock data for now
      const conversionRate = data?.totalOrders && data?.totalVisitors ? 
        (data.totalOrders / data.totalVisitors * 100) : 5.2; // Mock conversion rate

      // Map the response to our analytics state
      setAnalytics({
        totalSales: data?.totalRevenue || 0,
        totalOrders: data?.totalOrders || 0,
        averageOrderValue: data?.totalRevenue && data?.totalOrders ? 
          (data.totalRevenue / data.totalOrders) : 0,
        dailySales: Array.isArray(data?.dailySales) ? data.dailySales : [],
        totalProducts: productsData.total,
        activeProducts: productsData.active,
        totalCustomers: data?.totalCustomers || 0,
        lowStockProducts: keyMetrics.totalKeys > 0 ? 
          Math.floor(keyMetrics.totalKeys * 0.1) : 0, // Mock low stock count
        keyMetrics,
        recentOrders,
        topSellingProducts: productsData.topSelling,
        monthlyRevenue,
        weeklyGrowth,
        conversionRate
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set default values on error with existing structure
      setAnalytics(prev => ({
        ...prev,
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        dailySales: [],
      }));
    } finally {
      setLoading(false);
    }
  }, []);// Empty dependency array since this doesn't depend on any props or state

  // Call the data loading function when the component mounts
  React.useEffect(() => {
    loadAnalyticsData();
    
    // Optional: Set up polling to refresh data every 5 minutes
    // const intervalId = setInterval(loadAnalyticsData, 300000);
    // return () => clearInterval(intervalId);
  }, [loadAnalyticsData]);

  const chartData = {
    labels: analytics.dailySales?.map(sale => sale.date) || [],
    datasets: [
      {
        label: t('admin.dailySales'),
        data: analytics.dailySales?.map(sale => sale.amount) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {t('admin.dashboard')}
        </Typography>        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadAnalyticsData}
          disabled={loading}
        >
          {t('common.refresh')}
        </Button>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {t('admin.totalRevenue')}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                ₪{analytics.totalSales.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analytics.weeklyGrowth >= 0 ? '+' : ''}{analytics.weeklyGrowth.toFixed(1)}% from last week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {t('admin.totalOrders')}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {analytics.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg: ₪{analytics.averageOrderValue.toFixed(2)} per order
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VpnKey sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {t('admin.digitalKeys')}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {analytics.keyMetrics.availableKeys}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analytics.keyMetrics.totalKeys} total keys
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Inventory sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6" component="div">
                  {t('admin.products')}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {analytics.activeProducts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analytics.totalProducts} total products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Key Management Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('admin.keyStatus')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      {analytics.keyMetrics.availableKeys}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      {analytics.keyMetrics.usedKeys}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Used
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {analytics.keyMetrics.expiredKeys}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expired
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                      {analytics.lowStockProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Low Stock
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  fullWidth
                  href="/dashboard/admin/products"
                >
                  Add Product
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VpnKey />}
                  fullWidth
                  href="/dashboard/admin/stock"
                >
                  Manage Keys
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShoppingCart />}
                  fullWidth
                  href="/dashboard/admin/orders"
                >
                  View Orders
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders & Top Products */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              {analytics.recentOrders.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>{order.customerName || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status} 
                              size="small"
                              color={order.status === 'Completed' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>₪{order.total || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent orders
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Selling Products
              </Typography>
              {analytics.topSellingProducts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.topSellingProducts.slice(0, 5).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>₪{product.price}</TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Edit fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No product data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Chart */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('admin.salesTrends')}
          </Typography>
          <Box sx={{ height: 300 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(156, 163, 175, 0.1)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// Export the component both as default and named export
export { AdminOverview };
export default AdminOverview;
