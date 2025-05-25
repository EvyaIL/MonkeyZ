import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress, 
  Card, 
  CardContent, 
  Grid, 
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { apiService } from '../../../lib/apiService';

function AdminStock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadStockData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Try to fetch real data from the key-metrics endpoint
      const { data, error: apiError } = await apiService.get('/admin/key-metrics');
      
      if (apiError) {
        throw new Error(apiError);
      }
      
      // Transform the key metrics data into stock format
      const stockData = data.keyUsageByProduct.map((product, index) => ({
        id: `${index + 1}`,
        productId: product.productId,
        productName: product.productName,
        quantity: product.availableKeys,
        totalKeys: product.totalKeys,
        usedKeys: product.totalKeys - product.availableKeys,
        lowStockThreshold: Math.ceil(product.totalKeys * 0.1), // 10% threshold
        status: product.availableKeys === 0 ? 'Out of Stock' : 
                product.availableKeys <= Math.ceil(product.totalKeys * 0.1) ? 'Low Stock' : 'In Stock'
      }));
      
      setStockItems(stockData);
      
    } catch (err) {
      setError("Failed to load stock data. Please try again later.");
      console.error("Stock loading error:", err);
      
      // Fall back to mock data if API fails
      const mockStockData = [
        { id: '1', productId: '101', productName: 'MonkeyZ Pro Key', quantity: 125, totalKeys: 150, usedKeys: 25, lowStockThreshold: 20, status: 'In Stock' },
        { id: '2', productId: '102', productName: 'MonkeyZ Standard', quantity: 8, totalKeys: 50, usedKeys: 42, lowStockThreshold: 15, status: 'Low Stock' },
        { id: '3', productId: '103', productName: 'MonkeyZ Tutorial Pack', quantity: 56, totalKeys: 80, usedKeys: 24, lowStockThreshold: 10, status: 'In Stock' },
        { id: '4', productId: '104', productName: 'MonkeyZ Enterprise License', quantity: 0, totalKeys: 20, usedKeys: 20, lowStockThreshold: 5, status: 'Out of Stock' }
      ];
      setStockItems(mockStockData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);
  const getStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock': return 'error';
      case 'Low Stock': return 'warning';
      case 'In Stock': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Out of Stock': return <ErrorIcon />;
      case 'Low Stock': return <WarningIcon />;
      case 'In Stock': return <CheckCircleIcon />;
      default: return null;
    }
  };

  const calculateUsagePercentage = (used, total) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={loadStockData} 
          sx={{ mt: 2 }}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Stock Management
        </Typography>
        <Button 
          variant="outlined" 
          onClick={loadStockData} 
          disabled={loading}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>

      {/* Stock Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Products
              </Typography>
              <Typography variant="h4" color="primary">
                {stockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                In Stock
              </Typography>
              <Typography variant="h4" color="success.main">
                {stockItems.filter(item => item.status === 'In Stock').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Low Stock
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stockItems.filter(item => item.status === 'Low Stock').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Out of Stock
              </Typography>
              <Typography variant="h4" color="error.main">
                {stockItems.filter(item => item.status === 'Out of Stock').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stock Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell align="center">Available Keys</TableCell>
              <TableCell align="center">Total Keys</TableCell>
              <TableCell align="center">Used Keys</TableCell>
              <TableCell align="center">Usage %</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No stock items found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              stockItems.map((item) => {
                const usagePercentage = calculateUsagePercentage(item.usedKeys, item.totalKeys);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {item.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {item.productId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" color={item.quantity === 0 ? 'error.main' : 'text.primary'}>
                        {item.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {item.totalKeys}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {item.usedKeys}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={usagePercentage} 
                          sx={{ width: '60px', mr: 1 }}
                          color={usagePercentage > 90 ? 'error' : usagePercentage > 70 ? 'warning' : 'primary'}
                        />
                        <Typography variant="caption">
                          {usagePercentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getStatusIcon(item.status)}
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AdminStock;
