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
  MenuItem,
  TableFooter // Add TableFooter
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyIcon from '@mui/icons-material/VpnKey'; // Used for Add Keys
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EditIcon from '@mui/icons-material/Edit'; // New icon for Manage/Edit Keys
import CloseIcon from '@mui/icons-material/Close'; // Import CloseIcon
import { apiService } from '../../../lib/apiService';
import CDKeyManager from '../../../components/admin/cdkeys/CDKeyManager'; // Import CDKeyManager

// Helper functions for status display
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

function AdminStock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState(''); // Add state for product name
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openAddKeysDialog, setOpenAddKeysDialog] = useState(false);
  const [openManageKeysDialog, setOpenManageKeysDialog] = useState(false);
  const [newKeys, setNewKeys] = useState("");
  const [keyFormat, setKeyFormat] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadStockData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (!forceRefresh) {
        const cacheTimestamp = localStorage.getItem('adminStockDataTimestamp');
        const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 60000; // 1 minute
        const cachedData = localStorage.getItem('adminStockData');

        if (isCacheValid && cachedData) {
          console.debug('Using cached stock data');
          setStockItems(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      } else {
        // If forcing refresh, clear the cache
        localStorage.removeItem('adminStockData');
        localStorage.removeItem('adminStockDataTimestamp');
        console.debug('Cache cleared due to forceRefresh');
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
      }

      // Combine metrics with product details
      const stockData = products.map(product => {
        const productMetrics = metrics.keyUsageByProduct?.find(p => p.productId === product.id) || {};
        const availableKeys = productMetrics.availableKeys || 0;
        const totalKeys = productMetrics.totalKeys || 0;
        // const minStockAlert = product.keyManagement?.minStockAlert || 10; // Old logic
        const minStockAlert = 5; // New Low Stock Threshold

        return {
          id: product.id,
          productId: product.id,
          productName: typeof product.name === "object" ? (product.name.en || Object.values(product.name)[0] || "") : product.name,
          keyFormat: product.keyManagement?.format || 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
          quantity: availableKeys,
          totalKeys: totalKeys,
          usedKeys: totalKeys - availableKeys,
          minStockAlert: minStockAlert, // Use the new threshold
          status: availableKeys === 0 ? 'Out of Stock' : 
                 availableKeys <= minStockAlert ? 'Low Stock' : 
                 'In Stock'
        };
      });      // Cache the data
      localStorage.setItem('adminStockData', JSON.stringify(stockData));
      localStorage.setItem('adminStockDataTimestamp', Date.now().toString());
      
      setStockItems(stockData);
    } catch (err) {
      console.error('Error loading stock data:', err);
      setError("Failed to load stock data: " + err.message);
      
      // Try to use cached data as fallback only if not forcing refresh
      if (!forceRefresh) {
        try {
          const cachedData = localStorage.getItem('adminStockData');
          if (cachedData) {
            console.debug('Using cached stock data as fallback');
            setStockItems(JSON.parse(cachedData));
          }
        } catch (cacheError) {
          console.error('Cache fallback failed:', cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []); // Keep useCallback dependencies minimal, forceRefresh is a param

  useEffect(() => {
    loadStockData(); // Initial load
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

  const handleOpenManageKeysDialog = (productId, productName) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setOpenManageKeysDialog(true);
  };

  const handleCloseManageKeysDialog = () => {
    setOpenManageKeysDialog(false);
    setSelectedProductId(null);
    setSelectedProductName('');
  };
  
  const refreshStockDataAndCloseDialogs = () => {
    loadStockData(true); // Force refresh
    setOpenAddKeysDialog(false);
    // Potentially close other dialogs if needed
  };


  const handleAddKeys = async () => {
    if (!selectedProductId || !newKeys.trim()) return;
    
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const keyStrings = newKeys.split('\n')
        .map(key => key.trim())
        .filter(key => key.length > 0);

      if (keyStrings.length === 0) {
        throw new Error("No valid keys entered");
      }

      // Validate key format if specified (client-side validation can remain)
      if (keyFormat) {
        const formatRegex = new RegExp(keyFormat.replace(/X/g, '[A-Z0-9]'));
        const invalidKeys = keyStrings.filter(key => !formatRegex.test(key));
        if (invalidKeys.length > 0) {
          throw new Error(`Invalid key format detected. First invalid key: ${invalidKeys[0]}`);
        }
      }

      // Prepare the payload according to backend expectations
      const payload = {
        keys: keyStrings.map(k => ({ key: k }))
      };

      const response = await apiService.post(`/admin/products/${selectedProductId}/cdkeys`, payload);

      if (response.error) throw new Error(response.error);

      setSuccessMessage(`Successfully added ${keyStrings.length} keys to ${selectedProduct?.productName}`);
      setNewKeys("");
      // Call the new refresh function
      refreshStockDataAndCloseDialogs(); 
      // No need for setTimeout if loadStockData handles loading state correctly
      // setTimeout(() => loadStockData(true), 1000); // Old way
    } catch (err) {
      setError(`Failed to add keys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredStockItems = stockItems.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status.toLowerCase().replace(' ', '-') === filterStatus;
  });

  // Calculate overall analytics
  const totalAvailableKeys = stockItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalUsedKeys = stockItems.reduce((sum, item) => sum + item.usedKeys, 0);
  const grandTotalKeys = stockItems.reduce((sum, item) => sum + item.totalKeys, 0);
  const averageUsage = grandTotalKeys > 0 ? (totalUsedKeys / grandTotalKeys) * 100 : 0;

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
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => loadStockData(true)} // Call with forceRefresh = true
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
          <InputLabel>Filter by Status</InputLabel>          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Filter by Status"
            displayEmpty
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
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Tooltip title="Add Keys (Bulk)">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenAddKeysDialog(item.productId)}
                          >
                            <KeyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Manage/Edit CD Keys">
                          <IconButton
                            color="info" // Can change to 'secondary' or other if 'info' is too similar
                            size="small"
                            onClick={() => handleOpenManageKeysDialog(item.productId, item.productName)}
                          >
                            <EditIcon /> {/* Changed icon */}
                          </IconButton>
                        </Tooltip>                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ '& > *': { fontWeight: 'bold', backgroundColor: 'action.hover' } }}>
              <TableCell>Overall Totals / Average</TableCell>
              <TableCell align="center">{totalAvailableKeys}</TableCell>
              <TableCell align="center">{grandTotalKeys}</TableCell>
              <TableCell align="center">{totalUsedKeys}</TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={averageUsage} 
                    sx={{ width: '60px', mr: 1 }}
                    color={averageUsage > 90 ? 'error' : averageUsage > 70 ? 'warning' : 'primary'}
                  />
                  <Typography variant="caption">
                    {averageUsage.toFixed(1)}%
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">-</TableCell>
              <TableCell align="center">-</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Add Keys Dialog */}      <Dialog
        open={openAddKeysDialog}
        onClose={() => setOpenAddKeysDialog(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
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

      {/* Manage CD Keys Dialog */}      <Dialog
        open={openManageKeysDialog}
        onClose={handleCloseManageKeysDialog}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          Manage CD Keys {selectedProductName && `for ${selectedProductName}`}
          <IconButton
            aria-label="close"
            onClick={handleCloseManageKeysDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedProductId && 
            <CDKeyManager productId={selectedProductId} productName={selectedProductName} onKeysUpdated={() => loadStockData(true)} /> // Pass productName
          }
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AdminStock;
