import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../lib/apiService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/VpnKey';
import KeyBulkManagement from '../../../components/admin/KeyBulkManagement';
import KeyManagementSection from '../../../components/admin/KeyManagementSection';

export default function AdminProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showDialog, setShowDialog] = useState(false);
  const [categories, setCategories] = useState([]);  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showKeyManagement, setShowKeyManagement] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newKeys, setNewKeys] = useState('');
  const [keyCount, setKeyCount] = useState(1);const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiService.get('/admin/products');
      
      // Log the response for debugging
      console.log('Products API response:', response);
      
      if (response.error) {
        setError(response.error || t('admin.loadError'));
        return;
      }
      
      // Handle different response structures
      let productsList = [];
      if (Array.isArray(response.data)) {
        productsList = response.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsList = response.data.products;
      } else if (response.data && typeof response.data === 'object') {
        productsList = Object.values(response.data);
      }
      
      // Ensure each product has an id
      const productsWithIds = productsList.map(product => ({
        ...product,
        id: product.id || product._id || Math.random().toString(36).substr(2, 9)
      }));
      
      setProducts(productsWithIds);
      console.log('Processed products:', productsWithIds);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('admin.loadError') || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [t]); // apiService is a singleton, doesn't need to be a dependency

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Format the data to match the backend model structure
    const nameEn = formData.get('name_en');
    const nameHe = formData.get('name_he');
    const descEn = formData.get('description_en');
    const descHe = formData.get('description_he');    const productData = {
      // Use primary language (English) as the main string values
      name: nameEn || '',  // Always use English as primary name
      description: descEn || '',  // Always use English as primary description
      price: parseFloat(formData.get('price')) || 0,
      imageUrl: formData.get('imageUrl') || formData.get('image') || '',
      category: formData.get('category') || '',
      active: formData.get('active') === 'on',
      // Store translations in metadata
      metadata: {
        translations: {
          name: {
            en: nameEn || '',
            he: nameHe || ''
          },
          description: {
            en: descEn || '',
            he: descHe || ''
          }
        }
      }
    };

    try {
      // Validate required fields
      if (!productData.name) {
        setError(t('admin.nameRequired') || 'Product name is required');
        return;
      }
      if (!productData.price || isNaN(productData.price)) {
        setError(t('admin.priceRequired') || 'Valid price is required');
        return;
      }
      if (!productData.description) {
        setError(t('admin.descriptionRequired') || 'Product description is required');
        return;
      }
      if (!productData.imageUrl) {
        setError(t('admin.imageRequired') || 'Product image URL is required');
        return;
      }
      
      setIsLoading(true);
      setError("");
      
      let response;
      
      if (editingProduct?.id) {
        response = await apiService.put(`/admin/products/${editingProduct.id}`, productData);
      } else {
        response = await apiService.post('/admin/products', productData);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      await loadProducts();
      setShowDialog(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || t('admin.saveError') || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort products
  useEffect(() => {
    let result = [...products];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        (product.name?.toLowerCase().includes(term)) ||
        (product.description?.toLowerCase().includes(term)) ||
        (product.category?.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    if (filterCategory !== "all") {
      result = result.filter(product => product.category === filterCategory);
    }
    
    // Apply sorting
    switch (sortOrder) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      default:
        break;
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, filterCategory, sortOrder]);

  // Extract categories from products
  useEffect(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);
    setCategories(uniqueCategories);
  }, [products]);

  const onDeleteProduct = async (productId) => {
    if (!window.confirm(t('admin.confirmDelete'))) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      const response = await apiService.delete(`/admin/products/${productId}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.message || t('admin.deleteError') || 'Failed to delete product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeys = async () => {
    if (!selectedProduct || !newKeys.trim()) return;

    try {
      setIsLoading(true);
      setError("");

      // Split keys by newlines and filter empty ones
      const keysList = newKeys
        .split('\n')
        .map(key => key.trim())
        .filter(key => key.length > 0);

      if (keysList.length === 0) {
        setError('Please enter at least one valid key');
        return;
      }

      // Validate key format (example: W269N-WFGWX-YVC9B-4J6C9-T83GX)
      const keyFormatRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
      const invalidKeys = keysList.filter(key => !keyFormatRegex.test(key));
      
      if (invalidKeys.length > 0) {
        setError(`Invalid key format detected. Keys should be in format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX\nFirst invalid key: ${invalidKeys[0]}`);
        return;
      }

      const response = await apiService.post(`/admin/products/${selectedProduct.id}/keys`, {
        keys: keysList
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      setShowKeyDialog(false);
      setNewKeys('');
      setSelectedProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Error adding keys:', error);
      setError(error.message || 'Failed to add keys');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const parts = [];
    for (let i = 0; i < 5; i++) {
      let part = '';
      for (let j = 0; j < 5; j++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      parts.push(part);
    }
    return parts.join('-');
  };

  const generateKeys = () => {
    const keys = [];
    for (let i = 0; i < keyCount; i++) {
      keys.push(generateRandomKey());
    }
    setNewKeys(keys.join('\n'));
  };

  return (
    <Box p={3}>
      {/* Header section with actions */}      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {t('admin.products')}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mr: 1 }}              onClick={() => {
                // Open key management modal with the first selected product
                const product = products.find(p => p.availableKeys <= (p.minStockAlert || 10)) || products[0];
                if (product) {
                  setSelectedProduct(product);
                  setShowKeyManagement(true);
                } else {
                  window.alert(t('admin.noProductsForKeyManagement'));
                }
              }}
            >
              Manage Keys
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setEditingProduct(null);
                setShowDialog(true);
              }}
            >
              {t('admin.addProduct')}
            </Button>
          </Box>
        </Box>
        
        {/* Quick Stats */}        {/* Key Management Section */}
        <KeyManagementSection />
      </Box>

      {/* Filters and search */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={t('admin.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('admin.category')}</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label={t('admin.category')}
            >
              <MenuItem value="all">{t('admin.allCategories')}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('admin.sort')}</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              label={t('admin.sort')}
            >
              <MenuItem value="newest">{t('admin.newest')}</MenuItem>
              <MenuItem value="oldest">{t('admin.oldest')}</MenuItem>
              <MenuItem value="price-high">{t('admin.priceHigh')}</MenuItem>
              <MenuItem value="price-low">{t('admin.priceLow')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Success/Error messages */}
      {showSuccessMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('admin.productSaved')}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Products grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card>
                <Box
                  sx={{
                    position: 'relative',
                    pt: '100%', // 1:1 Aspect ratio
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
                <CardContent>                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" noWrap gutterBottom>
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.category}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="subtitle1" color="primary" fontWeight="bold">
                        ₪{product.price.toFixed(2)}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${product.availableKeys || 0} keys`}
                        color={product.availableKeys > (product.minStockAlert || 10) ? "success" : "error"}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 1,
                      mt: 1
                    }}
                  >
                    {product.description}
                  </Typography>
                  
                  <Box mt={1}>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Key Format: {product.keyFormat || "Standard"}
                    </Typography>
                    {product.keyExpiry && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Validity: {product.keyValidityDays || 365} days
                      </Typography>
                    )}
                  </Box>                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      size="small"
                      label={product.category}
                      color="default"
                    />
                    <Box>
                      <Tooltip title="Add Keys">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowKeyDialog(true);
                          }}
                        >
                          <KeyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('admin.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('admin.delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteProduct(product.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Product Edit/Create Dialog */}
      <Dialog 
        open={showDialog} 
        onClose={() => {
          setShowDialog(false);
          setEditingProduct(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProduct?.id ? t('admin.editProduct') : t('admin.newProduct')}
        </DialogTitle>
        <form onSubmit={handleProductSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.productNameEn')}
                  name="name_en"
                  defaultValue={editingProduct?.name?.en || editingProduct?.name || ''}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.productNameHe')}
                  name="name_he"
                  defaultValue={editingProduct?.name?.he || ''}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.descriptionEn')}
                  name="description_en"
                  multiline
                  rows={4}
                  defaultValue={editingProduct?.description?.en || editingProduct?.description || ''}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.descriptionHe')}
                  name="description_he"
                  multiline
                  rows={4}
                  defaultValue={editingProduct?.description?.he || ''}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.price')}
                  name="price"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  defaultValue={editingProduct?.price || 0}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('admin.category')}</InputLabel>                  <Select
                    name="category"
                    defaultValue={editingProduct?.category || ''}
                    label={t('admin.category')}
                  >
                    <MenuItem value="Windows">Windows</MenuItem>
                    <MenuItem value="Office">Microsoft Office</MenuItem>
                    <MenuItem value="Security">Security Software</MenuItem>
                    <MenuItem value="VPN">VPN Services</MenuItem>
                    <MenuItem value="Gaming">Gaming</MenuItem>
                    <MenuItem value="Design">Design Software</MenuItem>
                    <MenuItem value="Development">Development Tools</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.imageUrl')}
                  name="imageUrl"
                  defaultValue={editingProduct?.imageUrl || editingProduct?.image || ''}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="active"
                      defaultChecked={editingProduct?.active ?? true}
                    />
                  }
                  label={t('admin.active')}
                />
              </Grid>
              
              {/* Key Management Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Key Management
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Key Format"
                      name="keyFormat"
                      defaultValue={editingProduct?.keyFormat || "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"}
                      helperText="Use X for characters, 0-9 for numbers only"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Available Keys"
                      type="number"
                      InputProps={{ readOnly: true }}
                      value={editingProduct?.availableKeys || 0}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Import Keys"
                      name="importKeys"
                      multiline
                      rows={4}
                      placeholder="Enter one key per line to add to inventory"
                      helperText="Keys will be validated against the specified format"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="autoGenerateKeys"
                          defaultChecked={editingProduct?.autoGenerateKeys ?? false}
                        />
                      }
                      label="Auto-generate keys when stock is low"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Minimum Stock Alert"
                      name="minStockAlert"
                      type="number"
                      defaultValue={editingProduct?.minStockAlert || 10}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText="Get notified when available keys fall below this number"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Key Validation Method</InputLabel>
                      <Select
                        name="keyValidation"
                        defaultValue={editingProduct?.keyValidation || "format"}
                      >
                        <MenuItem value="format">Format Only</MenuItem>
                        <MenuItem value="api">External API</MenuItem>
                        <MenuItem value="custom">Custom Validation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Key Usage Settings */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Key Usage Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="keyReuse"
                          defaultChecked={editingProduct?.keyReuse ?? false}
                        />
                      }
                      label="Allow key reuse"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="keyExpiry"
                          defaultChecked={editingProduct?.keyExpiry ?? false}
                        />
                      }
                      label="Keys expire"
                    />
                  </Grid>
                  {editingProduct?.keyExpiry && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Key Validity (days)"
                        name="keyValidityDays"
                        type="number"
                        defaultValue={editingProduct?.keyValidityDays || 365}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowDialog(false);
              setEditingProduct(null);
            }}>
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : editingProduct?.id ? (
                t('common.save')
              ) : (
                t('common.create')
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Key Management Dialog */}
      {selectedProduct && (
        <KeyBulkManagement
          open={showKeyManagement}
          onClose={() => {
            setShowKeyManagement(false);
            setSelectedProduct(null);
            loadProducts(); // Refresh products after key management
          }}
          productId={selectedProduct.id}
          productName={selectedProduct.name.en || selectedProduct.name}
          keyFormat={selectedProduct.keyFormat}
        />
      )}

      {/* Simple Key Management Dialog */}
      <Dialog 
        open={showKeyDialog} 
        onClose={() => {
          setShowKeyDialog(false);
          setSelectedProduct(null);
          setNewKeys('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Add Keys to {selectedProduct?.name?.en || selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Key Format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (e.g., W269N-WFGWX-YVC9B-4J6C9-T83GX)
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Number of keys to generate"
                  value={keyCount}
                  onChange={(e) => setKeyCount(Math.max(1, parseInt(e.target.value) || 1))}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  onClick={generateKeys}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  Generate Random Keys
                </Button>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={8}
              label="Product Keys (one per line)"
              value={newKeys}
              onChange={(e) => setNewKeys(e.target.value)}
              placeholder="Enter keys, one per line:&#10;W269N-WFGWX-YVC9B-4J6C9-T83GX&#10;X270O-WGHWY-ZVD0C-5K7D0-U94HY"
              helperText="Enter product keys, one per line. Use the format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowKeyDialog(false);
            setSelectedProduct(null);
            setNewKeys('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddKeys}
            variant="contained"
            disabled={isLoading || !newKeys.trim()}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Add Keys'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
