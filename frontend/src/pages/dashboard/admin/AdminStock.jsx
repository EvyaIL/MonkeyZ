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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyIcon from '@mui/icons-material/VpnKey';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { apiService } from '../../../lib/apiService';
import CacheManager, { CACHE_KEYS } from '../../../lib/cacheManager';

function AdminStock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openAddKeysDialog, setOpenAddKeysDialog] = useState(false);
  const [newKeys, setNewKeys] = useState("");
  const [keyFormat, setKeyFormat] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadStockData = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      // Check for sync errors and clear cache if needed
      const syncError = CacheManager.checkAndClearSyncError();
      if (syncError) {
        console.log('🔄 Recovering from sync error:', syncError);
      }

      // Check if we have valid cached data
      const cachedData = CacheManager.getCachedData(
        CACHE_KEYS.ADMIN_STOCK_DATA, 
        CACHE_KEYS.ADMIN_STOCK_TIMESTAMP, 
        1 // 1 minute cache
      );

      if (cachedData && !syncError) {
        console.debug('📦 Using cached stock data');
        setStockItems(cachedData);
        setLoading(false);
        return;
      }

      console.log('🔄 Loading fresh data from backend...');
      const [metricsResponse, productsResponse] = await Promise.all([
        apiService.get('/admin/key-metrics'),
        apiService.get('/admin/products')
      ]);
      
      if (metricsResponse.error) throw new Error(metricsResponse.error);
      if (productsResponse.error) throw new Error(productsResponse.error);

      const metrics = metricsResponse.data;
      const products = productsResponse.data;
      
      console.log('Loaded metrics:', metrics);
      console.log('Loaded products:', products);
      
      if (!metrics || !products) {
        throw new Error('Invalid response from server');
      }

      // Combine metrics with product details
      const stockData = products.map(product => {
        const productMetrics = metrics.keyUsageByProduct?.find(p => p.productId === product.id) || {};
        const stockItem = {
          id: product.id,
          productId: product.id,
          productName: product.name?.en || product.name,
          keyFormat: product.keyManagement?.format || 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
          quantity: productMetrics.availableKeys || 0,
          totalKeys: productMetrics.totalKeys || 0,
          usedKeys: (productMetrics.totalKeys || 0) - (productMetrics.availableKeys || 0),
          minStockAlert: product.keyManagement?.minStockAlert || 10,
          status: productMetrics.availableKeys === 0 ? 'Out of Stock' : 
                 productMetrics.availableKeys <= (product.keyManagement?.minStockAlert || 10) ? 'Low Stock' : 
                 'In Stock'        };
        console.log(`Product ${product.name?.en || product.name}: available=${productMetrics.availableKeys}, total=${productMetrics.totalKeys}`);
        return stockItem;
      });

      // Cache the data using CacheManager
      CacheManager.setCachedData(
        CACHE_KEYS.ADMIN_STOCK_DATA, 
        CACHE_KEYS.ADMIN_STOCK_TIMESTAMP, 
        stockData
      );
      
      setStockItems(stockData);
    } catch (err) {
      console.error('Error loading stock data:', err);
      setError("Failed to load stock data: " + err.message);
      
      // Mark sync error and try to use cached data as fallback
      CacheManager.markSyncError('AdminStock', err);
      
      const fallbackData = CacheManager.getCachedData(
        CACHE_KEYS.ADMIN_STOCK_DATA, 
        CACHE_KEYS.ADMIN_STOCK_TIMESTAMP, 
        60 // Use older cache as fallback (up to 60 minutes)
      );
        if (fallbackData) {
        console.debug('📦 Using cached stock data as fallback');
        setStockItems(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  const handleOpenAddKeysDialog = (productId) => {
    const product = stockItems.find(item => item.productId === productId);
    if (product) {
      setSelectedProductId(productId);
      setSelectedProduct(product);
      setKeyFormat(product.keyFormat);
      setNewKeys("");
      setOpenAddKeysDialog(true);
    }
  };

  const handleAddKeys = async () => {
    if (!selectedProductId || !newKeys.trim()) return;
    
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const keys = newKeys.split('\n')
        .map(key => key.trim())
        .filter(key => key.length > 0);

      if (keys.length === 0) {
        throw new Error("No valid keys entered");
      }

      // Validate key format if specified
      const keyFormatRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
      const invalidKeys = keys.filter(key => !keyFormatRegex.test(key));
      
      if (invalidKeys.length > 0) {
        throw new Error(`Invalid key format detected. Keys must be in format XXXXX-XXXXX-XXXXX-XXXXX-XXXXX. First invalid key: ${invalidKeys[0]}`);
      }      console.log('Adding keys to product:', selectedProductId);
      console.log('Keys to add:', keys.length);
      console.log('Key format:', keyFormat);

      // First, verify the product exists
      const productCheck = await apiService.get(`/admin/products/${selectedProductId}`);
      if (productCheck.error) {
        throw new Error(`Product not found: ${productCheck.error}. Please refresh the product list.`);
      }

      const response = await apiService.post(`/admin/products/${selectedProductId}/keys`, {
        keys,
        format: keyFormat
      });
      
      console.log('Add keys response:', response);

      if (response.error) throw new Error(response.error);
      
      console.log('Keys added successfully:', response.data);      const successCount = response.data?.successCount || keys.length;
      const failedKeys = response.data?.failedKeys || [];
      const totalAttempted = keys.length;
      
      let successMsg = `Successfully added ${successCount} out of ${totalAttempted} keys to ${selectedProduct?.productName}`;
      if (failedKeys.length > 0) {
        successMsg += `\n${failedKeys.length} keys failed: ${failedKeys.slice(0, 3).join(', ')}${failedKeys.length > 3 ? '...' : ''}`;
      }
      
      setSuccessMessage(successMsg);
      setOpenAddKeysDialog(false);
      setNewKeys("");
      
      // Clear any cached data to force refresh
      localStorage.removeItem('adminStockData');
      localStorage.removeItem('adminStockDataTimestamp');
      localStorage.removeItem('adminKeyMetrics');
      localStorage.removeItem('adminKeyMetricsTimestamp');
      
      // Add a small delay to ensure backend data is updated, then refresh
      setTimeout(async () => {
        await loadStockData();
      }, 1000);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);    } catch (error) {
      console.error('Error adding keys:', error);
      let errorMessage = error.message || 'Failed to add keys. Please try again.';
      
      // If it's a product not found error, suggest refreshing
      if (errorMessage.includes('Product not found') || errorMessage.includes('not found')) {
        errorMessage += ' The product list will be refreshed automatically.';
        // Automatically refresh the product list
        setTimeout(async () => {
          await loadStockData();
        }, 2000);
      }
      
      setError(errorMessage);
      
      // Auto-clear error message after 8 seconds
      setTimeout(() => setError(""), 8000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportKeys = async (productId) => {
    try {
      setLoading(true);
      const response = await apiService.get(`/admin/products/${productId}/keys/export`);
      
      if (response.error) throw new Error(response.error);

      // Create CSV content
      const csvContent = "data:text/csv;charset=utf-8," + response.data.map(key => 
        `${key.value},${key.status},${key.createdAt || ''}`
      ).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `keys_${productId}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(`Failed to export keys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredStockItems = stockItems.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status.toLowerCase().replace(' ', '-') === filterStatus;
  });

  if (loading && stockItems.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Box sx={{ p: 3 }}>      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Stock Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            setError("");
            setSuccessMessage("");
            loadStockData();
          }}
          disabled={loading}
        >
                    Refresh Products
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Stock Overview */}
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

      {/* Filters */}
      <Box mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Filter by Status"
          >
            <MenuItem value="all">All Products</MenuItem>
            <MenuItem value="in-stock">In Stock</MenuItem>
            <MenuItem value="low-stock">Low Stock</MenuItem>
            <MenuItem value="out-of-stock">Out of Stock</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStockItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No stock items found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredStockItems.map((item) => {
                const usagePercentage = item.totalKeys > 0 ? (item.usedKeys / item.totalKeys) * 100 : 0;
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
                    <TableCell align="center">
                      <Box>
                        <Tooltip title="Add Keys">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenAddKeysDialog(item.productId)}
                          >
                            <KeyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Keys">
                          <IconButton
                            color="secondary"
                            onClick={() => handleExportKeys(item.productId)}
                          >
                            <FileDownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Keys Dialog */}
      <Dialog
        open={openAddKeysDialog}
        onClose={() => setOpenAddKeysDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Add Keys to {selectedProduct?.productName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Product Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Product ID:</strong> {selectedProduct?.productId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Current Available Keys:</strong> {selectedProduct?.quantity}
                </Typography>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Enter Keys (one per line)
            </Typography>
            <TextField
              multiline
              fullWidth
              rows={10}
              placeholder="Enter each key on a new line..."
              value={newKeys}
              onChange={(e) => setNewKeys(e.target.value)}
              disabled={loading}
              InputProps={{
                sx: { fontFamily: 'monospace' }
              }}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Number of keys: {newKeys.trim() ? newKeys.split('\n').filter(k => k.trim().length > 0).length : 0}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddKeysDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddKeys}
            variant="contained" 
            color="primary"
            disabled={loading || !newKeys.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <FileUploadIcon />}
          >
            Add Keys
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminStock;
