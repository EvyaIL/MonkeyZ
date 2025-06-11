import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../lib/apiService';
// import KeyDialog from '../../../components/admin/KeyDialog'; // Removed
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
  AlertTitle,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/VpnKey';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
// import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Removed if only for keys
// import KeyBulkManagement from '../../../components/admin/KeyBulkManagement'; // Removed
// import KeyManagementSection from '../../../components/admin/KeyManagementSection'; // Removed
import AssessmentIcon from '@mui/icons-material/Assessment'; // For analytics
import InfoIcon from '@mui/icons-material/Info'; // For info icons on cards

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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  // const [showKeyDialog, setShowKeyDialog] = useState(false); // Removed
  // const [showKeyManagement, setShowKeyManagement] = useState(false); // Removed
  const [categories, setCategories] = useState([]);
  const [displayOnHomePage, setDisplayOnHomePage] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isNewProduct, setIsNewProduct] = useState(false);
  // const [keyReuse, setKeyReuse] = useState(false); // Removed
  // const [keyExpiry, setKeyExpiry] = useState(false); // Removed
  // const [autoGenerateKeys, setAutoGenerateKeys] = useState(false); // Removed
  // const [keyValidityDays, setKeyValidityDays] = useState(365); // Removed

  // State for analytics
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsModalTitle, setAnalyticsModalTitle] = useState('');
  const [analyticsModalContent, setAnalyticsModalContent] = useState(null);

  const loadProducts = useCallback(async () => {
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
        id: product.id || product._id || Math.random().toString(36).substr(2, 9),
        // Normalize displayOnHomePage for UI compatibility
        displayOnHomePage: product.displayOnHomePage ?? product.display_on_homepage ?? false,
        display_on_homepage: product.display_on_homepage ?? product.displayOnHomePage ?? false,
      }));
      
      setProducts(productsWithIds);
      console.log('Processed products:', productsWithIds);
      calculateAnalytics(productsWithIds); // Calculate analytics after loading products
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('admin.loadError') || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }  }, [t]);  // Remove apiService from dependencies as it's a singleton

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const calculateAnalytics = (currentProducts) => {
    if (!currentProducts || currentProducts.length === 0) {
      setAnalyticsData(null);
      return;
    }

    const totalProducts = currentProducts.length;
    const newProducts = currentProducts.filter(p => p.is_new).length;
    const discountedProducts = currentProducts.filter(p => p.percent_off && p.percent_off > 0).length;
    const bestSellerProducts = currentProducts.filter(p => p.best_seller).length;
    const activeProducts = currentProducts.filter(p => p.active).length;
    const inactiveProducts = totalProducts - activeProducts;
    const onHomepageProducts = currentProducts.filter(p => p.displayOnHomePage).length;

    const categoriesCount = currentProducts.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    setAnalyticsData({
      totalProducts,
      newProducts,
      discountedProducts,
      bestSellerProducts,
      activeProducts,
      inactiveProducts,
      onHomepageProducts,
      categoriesCount,
    });
  };

  const handleOpenAnalyticsModal = (title, dataRenderer) => {
    setAnalyticsModalTitle(title);
    setAnalyticsModalContent(dataRenderer);
    setShowAnalyticsModal(true);
  };

  const renderCategoryAnalytics = () => {
    if (!analyticsData || !analyticsData.categoriesCount) return null;
    return (
      <Box>
        {Object.entries(analyticsData.categoriesCount)
          .sort(([, countA], [, countB]) => countB - countA)
          .map(([category, count]) => (
            <Typography key={category} variant="body1">
              {category}: {count}
            </Typography>
          ))}
      </Box>
    );
  };

  const renderStatusVisibilityAnalytics = () => {
    if (!analyticsData) return null;
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Product Status</Typography>
        <Typography variant="body1">Active: {analyticsData.activeProducts}</Typography>
        <Typography variant="body1">Inactive: {analyticsData.inactiveProducts}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Visibility</Typography>
        <Typography variant="body1">Best Sellers: {analyticsData.bestSellerProducts}</Typography>
        <Typography variant="body1">Displayed on Homepage: {analyticsData.onHomepageProducts}</Typography>
      </Box>
    );
  };


  // Sync state with editingProduct when it changes
  useEffect(() => {
    if (editingProduct) {
      setBestSeller(editingProduct?.best_seller ?? false);
      setDisplayOnHomePage(editingProduct?.displayOnHomePage ?? editingProduct?.display_on_homepage ?? false);
      setIsActive(editingProduct?.active ?? true);
      setIsNewProduct(editingProduct?.is_new ?? false);
      // setKeyReuse(editingProduct?.keyReuse ?? false); // Removed
      // setKeyExpiry(editingProduct?.keyExpiry ?? false); // Removed
      // setAutoGenerateKeys(editingProduct?.autoGenerateKeys ?? false); // Removed
      // setKeyValidityDays(editingProduct?.keyValidityDays || 365); // Removed
    } else {
      setBestSeller(false);
      setDisplayOnHomePage(false);
      setIsActive(true);
      setIsNewProduct(false);
      // setKeyReuse(false); // Removed
      // setKeyExpiry(false); // Removed
      // setAutoGenerateKeys(false); // Removed
      // setKeyValidityDays(365); // Removed
    }
  }, [editingProduct]);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Format the data to match the backend model structure
    const isBestSellerValue = formData.get('best_seller') === 'on';
    const productData = {
      name: {
        en: formData.get('name_en') || '',
        he: formData.get('name_he') || ''
      },
      description: {
        en: formData.get('description_en') || '',
        he: formData.get('description_he') || ''
      },
      price: parseFloat(formData.get('price')) || 0,
      imageUrl: formData.get('imageUrl') || formData.get('image') || '',
      category: formData.get('category') || '',
      active: isActive,
      inStock: true, // This might need re-evaluation or removal if stock is entirely separate
      // keyManagement: { // Removed
      //   format: formData.get('keyFormat') || 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
      //   minStockAlert: parseInt(formData.get('minStockAlert')) || 10,
      //   autoGenerateKeys: autoGenerateKeys,
      //   validationMethod: formData.get('keyValidation') || 'format',
      //   allowReuse: keyReuse,
      //   keyExpiry: keyExpiry,
      //   validityDays: keyValidityDays
      // },
      metadata: {
        translations: {
          name: {
            en: formData.get('name_en') || '',
            he: formData.get('name_he') || ''
          },
          description: {
            en: formData.get('description_en') || '',
            he: formData.get('description_he') || ''
          }
        }      },
      is_new: isNewProduct,
      percent_off: parseInt(formData.get('percent_off')) || 0,
      best_seller: bestSeller, // Use state, not formData
      displayOnHomePage: displayOnHomePage,
    };

    try {
      // Validate required fields
      if (!productData.name.en && !productData.name.he) {
        setError(t('admin.nameRequired'));
        return;
      }
      if (!productData.price || isNaN(productData.price)) {
        setError(t('admin.priceRequired'));
        return;
      }
      if (!productData.description.en && !productData.description.he) {
        setError(t('admin.descriptionRequired'));
        return;
      }
      if (!productData.imageUrl) {
        setError(t('admin.imageRequired'));
        return;
      }
      
      setIsLoading(true);
      setError("");
      
      let response;
      
      if (editingProduct?.id) {
        response = await apiService.patch(`/admin/products/${editingProduct.id}`, productData);
      } else {
        response = await apiService.post('/admin/products', productData);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      await loadProducts();
      setShowDialog(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || t('admin.saveError'));
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
  };  // Key management is now handled in KeyDialog component
  // Key generation is now handled in KeyDialog component

  // const handleKeyManagement = (product) => { // Removed
  //   setSelectedProduct(product);
  //   setShowKeyManagement(true);
  // };

  // When editingProduct changes (dialog opens), sync bestSeller state
  useEffect(() => {
    setBestSeller(editingProduct?.best_seller ?? false);
  }, [editingProduct]);

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

      {/* Product Analytics Section */}
      {analyticsData && (
        <Box mb={4}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1 }} /> Product Analytics
          </Typography>
          <Grid container spacing={2}>
            {/* General Stats Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 0.5, color: 'primary.main' }} /> General Stats
                  </Typography>
                  <Typography variant="body1">Total Products: {analyticsData.totalProducts}</Typography>
                  <Typography variant="body1">New Products (last 30 days): {analyticsData.newProducts}</Typography>
                  <Typography variant="body1">Products with Discount: {analyticsData.discountedProducts}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Status & Visibility Card (Clickable) */}
            <Grid item xs={12} md={4}>
              <Card onClick={() => handleOpenAnalyticsModal('Product Status & Visibility', renderStatusVisibilityAnalytics)} sx={{ cursor: 'pointer', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 0.5, color: 'primary.main' }} /> Status & Visibility
                  </Typography>
                  <Typography variant="body1">Active: {analyticsData.activeProducts} / Inactive: {analyticsData.inactiveProducts}</Typography>
                  <Typography variant="body1">Best Sellers: {analyticsData.bestSellerProducts}</Typography>
                  <Typography variant="body1">On Homepage: {analyticsData.onHomepageProducts}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Click to see details</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Category Breakdown Card (Clickable) */}
            <Grid item xs={12} md={4}>
              <Card onClick={() => handleOpenAnalyticsModal('Products by Category', renderCategoryAnalytics)} sx={{ cursor: 'pointer', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 0.5, color: 'primary.main' }} /> Category Breakdown
                  </Typography>
                  {analyticsData.categoriesCount && Object.keys(analyticsData.categoriesCount).length > 0 ? (
                    <>
                      {Object.entries(analyticsData.categoriesCount)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .slice(0, 2)
                        .map(([category, count]) => (
                          <Typography key={category} variant="body1">
                            {category}: {count}
                          </Typography>
                        ))}
                      {Object.keys(analyticsData.categoriesCount).length > 2 && (
                        <Typography variant="body2" color="text.secondary">+ {Object.keys(analyticsData.categoriesCount).length - 2} more</Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body1">No category data</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Click to see all categories</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Key Management Overview */}
      {/* <Box mb={4}>
        <KeyManagementSection />
      </Box> */} {/* Removed KeyManagementSection component */}

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
                </Box>
                <CardContent>                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" noWrap gutterBottom>
                        {typeof product.name === "object" ? (product.name.en || Object.values(product.name)[0] || "") : product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.category}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="subtitle1" color="primary" fontWeight="bold">
                        ₪{product.price.toFixed(2)}
                      </Typography>
                      {/* <Chip // Removed key/stock related chip
                        size=\"small\"
                        label={`${product.availableKeys || 0} keys`}
                        color={product.availableKeys > (product.minStockAlert || 10) ? \"success\" : \"error\"}
                        sx={{ mt: 0.5 }}
                      /> */}
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
                    {typeof product.description === "object" ? (product.description.en || Object.values(product.description)[0] || "") : product.description}
                  </Typography>
                  
                  {/* <Box mt={1}> // Removed key format and validity display
                    <Typography variant=\"caption\" display=\"block\" color=\"text.secondary\">
                      Key Format: {product.keyFormat || \"Standard\"}
                    </Typography>
                    {product.keyExpiry && (
                      <Typography variant=\"caption\" display=\"block\" color=\"text.secondary\">
                        Validity: {product.keyValidityDays || 365} days
                      </Typography>
                    )}
                  </Box> */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label={product.category}
                      color="default"
                    />
                    <Box>
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
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('admin.imageUrl')}
                      name="imageUrl"
                      defaultValue={editingProduct?.imageUrl || editingProduct?.image || ''}
                      required
                    />
                  </Grid>                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch 
                          name="is_new" 
                          checked={isNewProduct}
                          onChange={e => setIsNewProduct(e.target.checked)}
                        />
                      }
                      label={t('admin.new_tag', 'New Tag')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label={t('admin.percent_off', 'Percent Off (%)')}
                      name="percent_off"
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                      defaultValue={editingProduct?.percent_off || 0}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={<Switch name="best_seller" checked={bestSeller} onChange={e => setBestSeller(e.target.checked)} />}
                      label={t('admin.best_seller', 'Best Seller')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="displayOnHomePage"
                          checked={displayOnHomePage}
                          onChange={e => setDisplayOnHomePage(e.target.checked)}
                        />
                      }
                      label={t('admin.display_on_homepage', 'Display on Home Page')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>                    <FormControlLabel
                      control={
                        <Switch 
                          name="active"
                          checked={isActive}
                          onChange={e => setIsActive(e.target.checked)}
                        />
                      }
                      label={t('admin.active', 'Active')}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Key Management Section */} {/* This whole section in the dialog is removed */}
              {/* <Grid item xs={12}> 
                <Typography variant=\"subtitle1\" sx={{ mt: 2, mb: 1 }}>
                  Key Management
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label=\"Key Format\"
                      name=\"keyFormat\"
                      defaultValue={editingProduct?.keyFormat || \"XXXXX-XXXXX-XXXXX-XXXXX-XXXXX\"}
                      helperText=\"Use X for characters, 0-9 for numbers only\"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label=\"Minimum Stock Alert\"
                      name=\"minStockAlert\"
                      type=\"number\"
                      defaultValue={editingProduct?.minStockAlert || 10}
                      InputProps={{ inputProps: { min: 0 } }}
                      helperText=\"Get notified when available keys fall below this number\"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Key Validation Method</InputLabel>
                      <Select
                        name=\"keyValidation\"
                        defaultValue={editingProduct?.keyValidation || \"format\"}
                      >
                        <MenuItem value=\"format\">Format Only</MenuItem>
                        <MenuItem value=\"api\">External API</MenuItem>
                        <MenuItem value=\"custom\">Custom Validation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name=\"keyReuse\"
                          checked={keyReuse}
                          onChange={e => setKeyReuse(e.target.checked)}
                        />
                      }
                      label=\"Allow key reuse\"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name=\"keyExpiry\"
                          checked={keyExpiry}
                          onChange={e => setKeyExpiry(e.target.checked)}
                        />
                      }
                      label=\"Keys expire\"
                    />
                  </Grid>
                  {keyExpiry && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label=\"Key Validity (days)\"
                        name=\"keyValidityDays\"
                        value={keyValidityDays}
                        onChange={(e) => setKeyValidityDays(parseInt(e.target.value) || 365)}
                        defaultValue={editingProduct?.keyValidityDays || 365}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name=\"autoGenerateKeys\"
                          checked={autoGenerateKeys}
                          onChange={e => setAutoGenerateKeys(e.target.checked)}
                        />
                      }
                      label=\"Auto-generate keys when stock is low\"
                    />
                  </Grid>
                </Grid>
              </Grid> */} 
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

      {/* Key Management Dialog */} {/* Removed KeyBulkManagement component */}
      {/* {selectedProduct && (
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
      )} */}
        {/* Add Keys Dialog using our new component */} {/* Removed KeyDialog component */}
      {/* <KeyDialog 
        open={showKeyDialog}
        onClose={() => {
          setShowKeyDialog(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={loadProducts}
        t={t}
      /> */}

      {/* Analytics Modal */}
      <Dialog open={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {analyticsModalTitle}
          <IconButton onClick={() => setShowAnalyticsModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {analyticsModalContent}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalyticsModal(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
