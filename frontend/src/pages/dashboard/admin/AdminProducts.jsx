import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../lib/apiService';
import CacheManager from '../../../lib/cacheManager';
import KeyDialog from '../../../components/admin/KeyDialog';
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
  FormControl,
  Checkbox
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
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showDialog, setShowDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [showKeyManagement, setShowKeyManagement] = useState(false);
  const [categories, setCategories] = useState([]);  const loadProducts = useCallback(async () => {
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
      
      // Ensure each product has a valid MongoDB ObjectId as id
      const productsWithIds = productsList.map(product => {
        // Check if product.id is present and is a string.
        if (!product.id || typeof product.id !== 'string') {
          console.error('Product received from backend is missing a valid string ID field or has an incorrect type. Product data:', product);
          // Attempt to use product._id if it's a string, as a fallback.
          if (product._id && typeof product._id === 'string') {
            // If using product._id, ensure the original _id field is preserved or also updated if necessary for consistency
            return { ...product, id: product._id, _id: product._id };
          }
          // If neither product.id nor product._id is a usable string, this product is problematic.
          // Assign a temporary random ID for frontend purposes, though operations requiring this ID on the backend will likely fail.
          console.warn('Assigning temporary ID to product:', product);
          const tempId = `temp_${Math.random().toString(36).substr(2, 9)}`;
          return { ...product, id: tempId, _id: tempId }; // Ensure _id is also set for consistency if id is temporary
        }
        // If product.id is already the correct string ID, ensure it's used.
        // Return a new object to ensure no unintended mutations of the original product data.
        // Also, ensure _id field is consistent with the id field if not already present or different.
        return { ...product, id: product.id, _id: product._id || product.id };
      });
      setProducts(productsWithIds);
      console.log('Processed products:', productsWithIds);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('admin.loadError') || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [t]);  // Remove apiService from dependencies as it's a singleton

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Extract form values
    const nameEn = formData.get('name_en') || '';
    const nameHe = formData.get('name_he') || '';
    const descriptionEn = formData.get('description_en') || '';
    const descriptionHe = formData.get('description_he') || '';
    
    // Format the data to match the backend model structure
    // Backend expects name and description as strings (primary language)
    const productData = {      name: nameEn, // Primary language (English) as string
      description: descriptionEn, // Primary language (English) as string
      price: parseFloat(formData.get('price')) || 0,
      imageUrl: formData.get('imageUrl') || formData.get('image') || '',
      category: formData.get('category') || '',
      active: formData.get('active') === 'on',
      inStock: true,
      // New fields, specify both naming conventions to ensure compatibility
      discountPercentage: parseInt(formData.get('discountPercentage')) || 0,
      isBestSeller: formData.get('isBestSeller') === 'on',
      best_seller: formData.get('isBestSeller') === 'on', // Backend uses snake_case 
      isNew: formData.get('isNew') === 'on',
      is_new: formData.get('isNew') === 'on', // Backend uses snake_case
      displayOnHomepage: formData.get('displayOnHomepage') === 'on',
      display_on_homepage: formData.get('displayOnHomepage') === 'on', // Backend uses snake_case
      keyManagement: {
        format: formData.get('keyFormat') || 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
        minStockAlert: parseInt(formData.get('minStockAlert')) || 10,
        autoGenerateKeys: formData.get('autoGenerateKeys') === 'on',
        validationMethod: formData.get('keyValidation') || 'format',
        allowReuse: formData.get('keyReuse') === 'on',
        keyExpiry: formData.get('keyExpiry') === 'on',
        validityDays: parseInt(formData.get('keyValidityDays')) || 365
      },
      metadata: {
        translations: {
          name: {
            en: nameEn,
            he: nameHe
          },
          description: {
            en: descriptionEn,
            he: descriptionHe
          }
        }
      }
    };    try {
      // Enhanced validation with detailed error messages
      setError("");
      const validationErrors = [];
      
      if (!nameEn?.trim()) {
        validationErrors.push('Product name (English) is required');
      }
      
      if (!descriptionEn?.trim()) {
        validationErrors.push('Product description (English) is required');
      }
      
      if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
        validationErrors.push('Valid price greater than 0 is required');
      }
      
      if (!productData.imageUrl?.trim()) {
        validationErrors.push('Image URL is required');
      } else if (!productData.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        validationErrors.push('Image URL must be a valid image file (.jpg, .jpeg, .png, .gif, .webp)');
      }
      
      if (!productData.category?.trim()) {
        validationErrors.push('Product category is required');
      }
      
      // Validate key management settings
      if (productData.keyManagement.minStockAlert < 0) {
        validationErrors.push('Minimum stock alert cannot be negative');
      }
      
      if (productData.keyManagement.keyExpiry && (!productData.keyManagement.validityDays || productData.keyManagement.validityDays < 1)) {
        validationErrors.push('Key validity days must be at least 1 when key expiry is enabled');
      }
      
      if (productData.discountPercentage < 0 || productData.discountPercentage > 100) {
        validationErrors.push('Discount percentage must be between 0 and 100');
      }
      
      // Display validation errors
      if (validationErrors.length > 0) {
        setError(`Validation failed: ${validationErrors.join('; ')}`);
        return;
      }
      
      setIsLoading(true);
      console.log('🔄 Submitting product data:', productData);
      
      // Check for duplicate product names
      const duplicateProduct = products.find(p => 
        p.id !== editingProduct?.id && 
        (p.name?.toLowerCase() === nameEn.toLowerCase() || 
         p.name?.en?.toLowerCase() === nameEn.toLowerCase())
      );
      
      if (duplicateProduct) {
        setError('A product with this name already exists. Please choose a different name.');
        setIsLoading(false);
        return;
      }
      
      let response;
      const operation = editingProduct?.id ? 'update' : 'create';
      
      if (editingProduct?.id) {
        console.log(`📝 Updating product ${editingProduct.id}`);
        response = await apiService.put(`/admin/products/${editingProduct.id}`, productData);
      } else {
        console.log('➕ Creating new product');
        response = await apiService.post('/admin/products', productData);
      }
      
      console.log('✅ Backend response:', response);
      
      if (response.error) {
        // Handle specific backend errors
        let errorMessage = response.error;
        
        if (response.error.includes('duplicate') || response.error.includes('already exists')) {
          errorMessage = 'A product with this name already exists. Please choose a different name.';
        } else if (response.error.includes('validation')) {
          errorMessage = `Validation error: ${response.error}`;
        } else if (response.error.includes('network') || response.error.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        throw new Error(errorMessage);      }
      
      // Success handling
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);

      await loadProducts(); // Ensure product list is always up-to-date
      setShowDialog(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('❌ Error saving product:', error);
      
      // Enhanced error handling with user-friendly messages
      let userFriendlyError = 'Failed to save product. Please try again.';
      
      if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          userFriendlyError = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          userFriendlyError = 'Request timed out. Please try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
          userFriendlyError = 'You do not have permission to perform this action.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          userFriendlyError = 'Product not found. Please refresh the page and try again.';
        } else {
          userFriendlyError = error.message;
        }
      }
      
      setError(userFriendlyError);
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
      }      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Clear any cached data to ensure synchronization
      CacheManager.clearComponentCache('AdminProducts');
      CacheManager.clearComponentCache('AdminStock');
      CacheManager.clearComponentCache('AdminOrders');
      
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.message || t('admin.deleteError') || 'Failed to delete product');
    } finally {
      setIsLoading(false);
    }  };  
  
  // Batch operations
  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    if (!window.confirm(`Delete ${selectedProducts.size} selected products? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const deletePromises = Array.from(selectedProducts).map(productId =>
        apiService.delete(`/admin/products/${productId}`)
      );
      
      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
        setError(`${failed} products failed to delete`);
      } else {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
        // Clear any cached data to ensure synchronization
      CacheManager.clearComponentCache('AdminProducts');
      CacheManager.clearComponentCache('AdminStock');
      CacheManager.clearComponentCache('AdminOrders');
      
      setSelectedProducts(new Set());
      await loadProducts();
    } catch (error) {
      setError('Failed to delete products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchStatusChange = async (active) => {
    if (selectedProducts.size === 0) return;
    
    setIsLoading(true);
    try {
      const updatePromises = Array.from(selectedProducts).map(productId => {
        const product = products.find(p => p.id === productId);
        return apiService.put(`/admin/products/${productId}`, { ...product, active });
      });
        await Promise.allSettled(updatePromises);
      setSelectedProducts(new Set());
      
      // Clear any cached data to ensure synchronization
      localStorage.removeItem('adminStockData');
      localStorage.removeItem('adminStockDataTimestamp');
      localStorage.removeItem('adminProducts');
      localStorage.removeItem('adminProductsTimestamp');
      localStorage.removeItem('adminKeyMetrics');
      localStorage.removeItem('adminKeyMetricsTimestamp');
      
      await loadProducts();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      setError('Failed to update products');
    } finally {
      setIsLoading(false);
    }
  };

  // Key management is now handled in KeyDialog component
  // Key generation is now handled in KeyDialog component

  const handleKeyManagement = (product) => {
    setSelectedProduct(product);
    setShowKeyManagement(true);
  };

  return (
    <Box p={3}>
      {/* Header section with actions */}      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            {t('admin.products')}
          </Typography>
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

        {showSuccessMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t('admin.operationSuccess')}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Key Management Overview */}
      <Box mb={4}>
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
          </FormControl>        </Grid>
      </Grid>

      {/* Select All Row */}
      <Box mb={2} display="flex" alignItems="center">
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
              indeterminate={selectedProducts.size > 0 && selectedProducts.size < filteredProducts.length}
              onChange={handleSelectAll}
            />
          }
          label={`Select All (${filteredProducts.length} products)`}
        />
        {selectedProducts.size > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {selectedProducts.size} selected
          </Typography>
        )}
      </Box>

      {/* Batch Operations Toolbar */}
      {selectedProducts.size > 0 && (
        <Box mb={2} p={2} bgcolor="action.hover" borderRadius={1}>
          <Typography variant="body2" component="span" sx={{ mr: 2 }}>
            {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
          </Typography>
          <Button
            size="small"
            color="error"
            onClick={handleBatchDelete}
            sx={{ mr: 1 }}
          >
            Delete Selected
          </Button>
          <Button
            size="small"
            color="primary"
            onClick={() => handleBatchStatusChange(true)}
            sx={{ mr: 1 }}
          >
            Activate
          </Button>
          <Button
            size="small"
            color="secondary"
            onClick={() => handleBatchStatusChange(false)}
            sx={{ mr: 1 }}
          >
            Deactivate
          </Button>
          <Button
            size="small"
            onClick={() => setSelectedProducts(new Set())}
          >
            Clear Selection
          </Button>
        </Box>
      )}

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
            <Grid item xs={12} sm={6} md={4} key={product.id}>
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
                </Box>                <CardContent sx={{ position: 'relative' }}>
                  {/* Selection checkbox */}
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      }
                    }}
                    size="small"
                  />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
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
                      <Tooltip title="Manage Codes (Stock)">
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
                      <Tooltip title={t('admin.manageKeys')}>
                        <IconButton
                          size="small"
                          onClick={() => handleKeyManagement(product)}
                        >
                          <KeyIcon fontSize="small" />
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
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct?.id ? t('admin.editProduct') : t('admin.newProduct')}
        </DialogTitle>
        <form onSubmit={handleProductSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
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
                      <InputLabel>{t('admin.category')}</InputLabel>
                      <Select
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
                  </Grid>                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('admin.imageUrl')}
                      name="imageUrl"
                      defaultValue={editingProduct?.imageUrl || editingProduct?.image || ''}
                      required
                    />
                  </Grid>

                  {/* Additional Product Options */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Product Options
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Discount Percentage"
                      name="discountPercentage"
                      type="number"
                      inputProps={{ min: 0, max: 100, step: 1 }}
                      defaultValue={editingProduct?.discountPercentage || 0}
                      helperText="Enter discount percentage (0-100)"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="isBestSeller"
                          defaultChecked={editingProduct?.isBestSeller ?? false}
                        />
                      }
                      label="Show in Best Sellers"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="isNew"
                          defaultChecked={editingProduct?.isNew ?? false}
                        />
                      }
                      label="Mark as New Product"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                    <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="active"
                          defaultChecked={editingProduct?.active ?? true}
                        />
                      }
                      label="Product Active"
                      sx={{ mt: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="displayOnHomepage"
                          defaultChecked={editingProduct?.displayOnHomepage ?? false}
                        />
                      }
                      label="Display on Homepage"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
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
                </Grid>
              </Grid>

              {/* Stock Management Info */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Stock Management (Codes/Keys)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can add codes/keys for this product after saving it, using the 'Manage Codes' button.
                </Typography>
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
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : editingProduct?.id ? t('admin.saveChanges') : t('admin.addProduct')}
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
            loadProducts();
          }}
          productId={selectedProduct.id}
          productName={selectedProduct.name.en || selectedProduct.name}
          keyFormat={selectedProduct.keyFormat}
        />
      )}
        {/* Add Keys Dialog using our new component */}
      <KeyDialog 
        open={showKeyDialog}
        onClose={() => {
          setShowKeyDialog(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={loadProducts}
        t={t}
      />
    </Box>
  );
}
