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
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyIcon from '@mui/icons-material/VpnKey';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { apiService } from '../../../lib/apiService';

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
  const [filterStatus, setFilterStatus] = useState("all");  const loadStockData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      // Check if we have cached data that's less than 1 minute old
      const cacheTimestamp = localStorage.getItem('adminStockDataTimestamp');
      // Enable caching to improve performance, but allow for forced refresh
      const isCacheValid = !forceRefresh && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 60000;
      const cachedData = localStorage.getItem('adminStockData');

      if (isCacheValid && cachedData) {
        console.debug('Using cached stock data');
        setStockItems(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      const [metricsResponse, productsResponse] = await Promise.all([
        apiService.get('/admin/key-metrics'),
        apiService.get('/admin/products')
      ]);
      
      if (metricsResponse.error) throw new Error(metricsResponse.error);
      if (productsResponse.error) throw new Error(productsResponse.error);

      const metrics = metricsResponse.data;
      const products = productsResponse.data;
      
      if (!metrics || !products) {
        throw new Error('Invalid response from server');
      }      // Add more detailed debug info
      console.debug('API Response - Metrics:', metrics);
      console.debug('API Response - Products:', products);
      
      // Check if metrics data is properly structured
      if (!metrics || typeof metrics !== 'object') {
        console.error('Metrics data is invalid or missing:', metrics);
        throw new Error('Invalid metrics data received from server');
      }
      
      if (!metrics.keyUsageByProduct || !Array.isArray(metrics.keyUsageByProduct)) {
        console.error('keyUsageByProduct is missing or not an array:', metrics.keyUsageByProduct);
      }
      
      // Log the summary metrics
      console.debug(`Summary Metrics: Total Keys: ${metrics.totalKeys}, Available: ${metrics.availableKeys}, Used: ${metrics.usedKeys}`);
      
      // Combine metrics with product details
      const stockData = products.map(product => {
        // Fix the productId and id values to ensure they're consistent
        const productId = product.id ? product.id : (product._id ? product._id : null);
        // Find corresponding metrics - add more extensive logging
        console.debug(`Looking for metrics for product ${productId}`);
        console.debug(`Available metrics: ${JSON.stringify(metrics.keyUsageByProduct?.map(p => p.productId))}`);          // Try different matching strategies
          let productMetrics = null;
          if (metrics.keyUsageByProduct && Array.isArray(metrics.keyUsageByProduct)) {
            // Try exact match first
            productMetrics = metrics.keyUsageByProduct.find(p => p.productId === productId);
            
            // If no match, try string comparison (in case of ObjectId vs string issues)
            if (!productMetrics) {
              productMetrics = metrics.keyUsageByProduct.find(p => String(p.productId) === String(productId));
            }
            
            // Try matching by product name as a last resort
            if (!productMetrics) {
              const productName = typeof product.name === "object" ? 
                (product.name.en || Object.values(product.name)[0] || "") : 
                product.name;
              
              productMetrics = metrics.keyUsageByProduct.find(
                p => p.productName === productName
              );
            }
          }
          
          // Default to empty object with zero counts if still no match
          productMetrics = productMetrics || {
            totalKeys: 0,
            availableKeys: 0,
            usedKeys: 0
          };
        
        // Enhanced debug info
        console.debug(`Processing product ${productId}, found metrics:`, productMetrics);
        
        // Process product name
        let productName = product.name;
        if (typeof product.name === "object") {
          productName = product.name.en || Object.values(product.name)[0] || "";
        }
        
        return {
          id: productId,
          productId: productId, 
          productName: productName,
          keyFormat: product.keyManagement?.format || 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
          quantity: productMetrics.availableKeys || 0,
          totalKeys: productMetrics.totalKeys || 0,
          usedKeys: productMetrics.usedKeys || ((productMetrics.totalKeys || 0) - (productMetrics.availableKeys || 0)),
          minStockAlert: product.keyManagement?.minStockAlert || 10,
          status: productMetrics.availableKeys === 0 ? 'Out of Stock' : 
                 productMetrics.availableKeys <= (product.keyManagement?.minStockAlert || 10) ? 'Low Stock' : 
                 'In Stock',
          // Include manages_cd_keys flag if present in the product
          manages_cd_keys: product.manages_cd_keys || false
        };
      });      // Cache the data
      localStorage.setItem('adminStockData', JSON.stringify(stockData));
      localStorage.setItem('adminStockDataTimestamp', Date.now().toString());
      
      setStockItems(stockData);
    } catch (err) {
      console.error('Error loading stock data:', err);
      setError("Failed to load stock data: " + err.message);
      
      // Try to use cached data as fallback
      try {
        const cachedData = localStorage.getItem('adminStockData');
        if (cachedData) {
          console.debug('Using cached stock data as fallback');
          setStockItems(JSON.parse(cachedData));
        }
      } catch (cacheError) {
        console.error('Cache fallback failed:', cacheError);
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
      if (keyFormat) {
        const formatRegex = new RegExp(keyFormat.replace(/X/g, '[A-Z0-9]'));
        const invalidKeys = keys.filter(key => !formatRegex.test(key));
        if (invalidKeys.length > 0) {
          throw new Error(`Invalid key format detected. First invalid key: ${invalidKeys[0]}`);
        }
      }

      const response = await apiService.post(`/admin/products/${selectedProductId}/keys`, {
        keys,
        format: keyFormat
      });

      if (response.error) throw new Error(response.error);      setSuccessMessage(`Successfully added ${keys.length} keys to ${selectedProduct?.productName}`);
      setOpenAddKeysDialog(false);
      setNewKeys("");
      
      // Wait a moment before refreshing data - force refresh to get latest data
      setTimeout(() => loadStockData(true), 1000);
    } catch (err) {
      setError(`Failed to add keys: ${err.message}`);
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
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Stock Management
        </Typography>        <Button 
          variant="outlined" 
          onClick={() => loadStockData(true)} 
          disabled={loading}
          startIcon={<RefreshIcon />}
        >
          Refresh
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
