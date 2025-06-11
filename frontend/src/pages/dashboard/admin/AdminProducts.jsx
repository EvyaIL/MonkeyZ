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
  Divider,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// import KeyIcon from '@mui/icons-material/VpnKey'; // No longer used directly here
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import AssessmentIcon from '@mui/icons-material/Assessment'; // For analytics
import InfoIcon from '@mui/icons-material/Info'; // For info icons on cards
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // For Add Product button
import SearchIcon from '@mui/icons-material/Search'; // For Search Bar
import FilterListIcon from '@mui/icons-material/FilterList'; // For Filter Dropdowns
import NewReleasesIcon from '@mui/icons-material/NewReleases'; // For New Tag
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // For Active status
import HighlightOffIcon from '@mui/icons-material/HighlightOff'; // For Inactive status
import StarIcon from '@mui/icons-material/Star'; // For Best Seller
import HomeIcon from '@mui/icons-material/Home'; // For Display on Homepage
import CategoryIcon from '@mui/icons-material/Category'; // For Category icon
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For error messages
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For success messages

export default function AdminProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productError, setProductError] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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
    <Box p={3} sx={{ backgroundColor: (theme) => theme.palette.background.default, minHeight: '100vh' }}>
      {/* Header section with actions */}      
      <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {t('admin.products', 'Manage Products')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => {
              setEditingProduct(null);
              setShowDialog(true);
            }}
            sx={{ borderRadius: 2, boxShadow: '0 3px 5px 2px rgba(0, 105, 217, .3)' }}
          >
            {t('admin.addProduct', 'Add New Product')}
          </Button>
        </Box>

        {showSuccessMessage && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 1.5 }} icon={<CheckCircleOutlineIcon />}>
            <AlertTitle>{t('common.success', 'Success')}</AlertTitle>
            {t('admin.operationSuccess', 'Operation completed successfully.')}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 1.5 }} icon={<ErrorOutlineIcon />}>
            <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Product Analytics Section */}
      {analyticsData && (
        <Paper elevation={3} sx={{ p:2, mb: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} /> {t('admin.products.analyticsTitle', 'Product Analytics')}
          </Typography>
          <Grid container spacing={3}>
            {/* General Stats Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column', backgroundColor: '#e3f2fd' /* Light blue */ }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#0d47a1' /* Darker blue */}}>
                    <InfoIcon sx={{ mr: 0.5 }} /> {t('admin.analytics.generalStats', 'General Stats')}
                  </Typography>
                  <Typography variant="body1">{t('admin.analytics.totalProducts', 'Total Products')}: <strong>{analyticsData.totalProducts}</strong></Typography>
                  <Typography variant="body1">{t('admin.analytics.newProducts', 'New Products')}: <strong>{analyticsData.newProducts}</strong></Typography>
                  <Typography variant="body1">{t('admin.analytics.discountedProducts', 'Discounted')}: <strong>{analyticsData.discountedProducts}</strong></Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Status & Visibility Card (Clickable) */}
            <Grid item xs={12} md={4}>
              <Card onClick={() => handleOpenAnalyticsModal(t('admin.analytics.statusVisibilityTitle', 'Product Status & Visibility'), renderStatusVisibilityAnalytics)} sx={{ cursor: 'pointer', height: '100%', borderRadius: 2, '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }, transition: '0.2s', backgroundColor: '#e8f5e9' /* Light green */ }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#1b5e20' /* Darker green */}}>
                    <CheckCircleIcon sx={{ mr: 0.5 }} /> {t('admin.analytics.statusVisibility', 'Status & Visibility')}
                  </Typography>
                  <Typography variant="body1">{t('admin.analytics.active', 'Active')}: <strong>{analyticsData.activeProducts}</strong> / {t('admin.analytics.inactive', 'Inactive')}: <strong>{analyticsData.inactiveProducts}</strong></Typography>
                  <Typography variant="body1">{t('admin.analytics.bestSellers', 'Best Sellers')}: <strong>{analyticsData.bestSellerProducts}</strong></Typography>
                  <Typography variant="body1">{t('admin.analytics.onHomepage', 'On Homepage')}: <strong>{analyticsData.onHomepageProducts}</strong></Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{t('common.clickToViewDetails', 'Click to see details')}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Category Breakdown Card (Clickable) */}
            <Grid item xs={12} md={4}>
              <Card onClick={() => handleOpenAnalyticsModal(t('admin.analytics.categoryBreakdownTitle', 'Products by Category'), renderCategoryAnalytics)} sx={{ cursor: 'pointer', height: '100%', borderRadius: 2, '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }, transition: '0.2s', backgroundColor: '#fff3e0' /* Light orange */ }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#e65100' /* Darker orange */}}>
                    <CategoryIcon sx={{ mr: 0.5 }} /> {t('admin.analytics.categoryBreakdown', 'Category Breakdown')}
                  </Typography>
                  {analyticsData.categoriesCount && Object.keys(analyticsData.categoriesCount).length > 0 ? (
                    <>
                      {Object.entries(analyticsData.categoriesCount)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .slice(0, 2)
                        .map(([category, count]) => (
                          <Typography key={category} variant="body1">
                            {category}: <strong>{count}</strong>
                          </Typography>
                        ))}
                      {Object.keys(analyticsData.categoriesCount).length > 2 && (
                        <Typography variant="body2" color="text.secondary">+ {Object.keys(analyticsData.categoriesCount).length - 2} {t('common.more', 'more')}</Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body1">{t('admin.analytics.noCategoryData', 'No category data')}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{t('common.clickToViewAll', 'Click to see all categories')}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Filters and search */}
      <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label={t('admin.searchProducts', 'Search Products')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3.5}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>{t('admin.category', 'Category')}</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label={t('admin.category', 'Category')}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">{t('admin.allCategories', 'All Categories')}</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3.5}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>{t('admin.sort', 'Sort By')}</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                label={t('admin.sort', 'Sort By')}
                 startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="newest">{t('admin.newest', 'Newest First')}</MenuItem>
                <MenuItem value="oldest">{t('admin.oldest', 'Oldest First')}</MenuItem>
                <MenuItem value="price-high">{t('admin.priceHigh', 'Price: High to Low')}</MenuItem>
                <MenuItem value="price-low">{t('admin.priceLow', 'Price: Low to High')}</MenuItem>
                <MenuItem value="name-asc">{t('admin.nameAsc', 'Name: A-Z')}</MenuItem>
                <MenuItem value="name-desc">{t('admin.nameDesc', 'Name: Z-A')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" my={4} minHeight="200px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('common.loadingProducts', 'Loading Products...')}</Typography>
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center', mt: 3, borderRadius: 2, backgroundColor: 'grey.100' }}>
            <InfoIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
            <Typography variant="h6" sx={{ color: 'grey.700' }}>{t('admin.noProductsFound', 'No products found.')}</Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
              {searchTerm || filterCategory !== 'all'
                ? t('admin.noProductsMatchFilter', 'No products match your current search or filter criteria.')
                : t('admin.noProductsYet', 'There are no products in the system yet. Try adding some!')}
            </Typography>
         </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}> {/* Added lg breakpoint */}
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out', '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' } }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '75%' // Aspect ratio for product images (e.g., 4:3)
                  }}
                >
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/300x225.png?text=No+Image'} // Fallback image
                    alt={typeof product.name === "object" ? (product.name.en || Object.values(product.name)[0] || "Product") : product.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {product.is_new && (
                    <Chip 
                      icon={<NewReleasesIcon />}
                      label={t('admin.newTag', 'NEW')}
                      color="secondary"
                      size="small"
                      sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 'bold' }}
                    />
                  )}
                  {product.percent_off > 0 && (
                     <Chip 
                      label={`${product.percent_off}% OFF`}
                      color="error"
                      size="small"
                      sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 'bold' }}
                    />
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>                  
                  <Box flexGrow={1}>
                    <Typography variant="h6" component="div" noWrap gutterBottom sx={{ fontWeight: 'medium' }}>
                      {typeof product.name === "object" ? (product.name.en || Object.values(product.name)[0] || t('common.untitled', 'Untitled Product')) : product.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '40px', // Ensure consistent height for description area
                        mb: 1,
                      }}
                    >
                      {typeof product.description === "object" ? (product.description.en || Object.values(product.description)[0] || t('common.noDescription', 'No description available.')) : product.description}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1} mb={1.5}>
                    <Chip 
                      icon={<CategoryIcon fontSize="small"/>}
                      label={product.category || t('common.uncategorized', 'Uncategorized')}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      ₪{product.price.toFixed(2)}
                    </Typography>
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 1.5 }}>
                    {product.best_seller && (
                      <Grid item>
                        <Tooltip title={t('admin.bestSellerTooltip', 'This product is a best seller')}>
                          <Chip icon={<StarIcon />} label={t('admin.bestSellerShort', 'Best Seller')} size="small" color="warning" variant="outlined" />
                        </Tooltip>
                      </Grid>
                    )}
                    {product.displayOnHomePage && (
                      <Grid item>
                        <Tooltip title={t('admin.onHomepageTooltip', 'Displayed on home page')}>
                          <Chip icon={<HomeIcon />} label={t('admin.onHomepageShort', 'Homepage')} size="small" color="info" variant="outlined" />
                        </Tooltip>
                      </Grid>
                    )}
                  </Grid>
                  
                  <Divider sx={{ my: 1 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                     <Chip 
                        icon={product.active ? <CheckCircleIcon /> : <HighlightOffIcon />}
                        label={product.active ? t('admin.activeStatus', 'Active') : t('admin.inactiveStatus', 'Inactive')}
                        color={product.active ? "success" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    <Box>
                      <Tooltip title={t('admin.editProductTooltip', 'Edit Product')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowDialog(true);
                          }}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('admin.deleteProductTooltip', 'Delete Product')}>
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

      {/* Product Edit/Create Dialog - Enhanced */}
      <Dialog open={showDialog} onClose={() => { setShowDialog(false); setEditingProduct(null); setError(""); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          {editingProduct?.id ? t('admin.editProduct', 'Edit Product') : t('admin.newProduct', 'Create New Product')}
          <IconButton onClick={() => { setShowDialog(false); setEditingProduct(null); setError(""); }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleProductSubmit}>
          <DialogContent dividers>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} icon={<ErrorOutlineIcon />}>
                {error}
              </Alert>
            )}
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                  {t('admin.dialog.basicInfo', 'Basic Information')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('admin.productNameEn', 'Product Name (English)')}
                      name="name_en"
                      defaultValue={editingProduct?.name?.en || editingProduct?.name || ''}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('admin.productNameHe', 'Product Name (Hebrew)')}
                      name="name_he"
                      defaultValue={editingProduct?.name?.he || ''}
                      dir="rtl"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('admin.descriptionEn', 'Description (English)')}
                      name="description_en"
                      multiline
                      rows={3}
                      defaultValue={editingProduct?.description?.en || editingProduct?.description || ''}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('admin.descriptionHe', 'Description (Hebrew)')}
                      name="description_he"
                      multiline
                      rows={3}
                      defaultValue={editingProduct?.description?.he || ''}
                      dir="rtl"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label={t('admin.price', 'Price')}
                      name="price"
                      type="number"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                        inputProps: { min: 0, step: "0.01" }
                      }}
                      defaultValue={editingProduct?.price || 0}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>{t('admin.category', 'Category')}</InputLabel>
                      <Select
                        name="category"
                        defaultValue={editingProduct?.category || ''}
                        label={t('admin.category', 'Category')}
                        required
                      >
                        <MenuItem value=""></MenuItem> {/* Allow unselecting or prompt selection */}
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
                   <Grid item xs={12} sm={12} md={4}>
                    <TextField
                      fullWidth
                      label={t('admin.percent_off', 'Discount (%)')}
                      name="percent_off"
                      type="number"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 1 }
                      }}
                      defaultValue={editingProduct?.percent_off || 0}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('admin.imageUrl', 'Image URL')}
                      name="imageUrl"
                      defaultValue={editingProduct?.imageUrl || editingProduct?.image || ''}
                      required
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Attributes & Visibility */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                  {t('admin.dialog.attributesVisibility', 'Attributes & Visibility')}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6} sm={4} md={3}>
                    <FormControlLabel
                      control={
                        <Switch 
                          name="is_new" 
                          checked={isNewProduct}
                          onChange={e => setIsNewProduct(e.target.checked)}
                          color="secondary"
                        />
                      }
                      label={t('admin.new_tag', 'New Tag')}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <FormControlLabel
                      control={<Switch name="best_seller" checked={bestSeller} onChange={e => setBestSeller(e.target.checked)} color="warning" />}
                      label={t('admin.best_seller', 'Best Seller')}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="displayOnHomePage"
                          checked={displayOnHomePage}
                          onChange={e => setDisplayOnHomePage(e.target.checked)}
                          color="info"
                        />
                      }
                      label={t('admin.display_on_homepage', 'On Homepage')}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>                    
                    <FormControlLabel
                      control={
                        <Switch 
                          name="active"
                          checked={isActive} // This should be isActive from state
                          onChange={e => setIsActive(e.target.checked)} // This should update isActive state
                          color="success"
                        />
                      }
                      label={t('admin.active', 'Active')}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
            <Button onClick={() => { setShowDialog(false); setEditingProduct(null); setError(""); }} variant="outlined" color="secondary" startIcon={<CancelIcon />}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {editingProduct?.id ? t('admin.saveChanges', 'Save Changes') : t('admin.addProduct', 'Add Product')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Analytics Modal - Enhanced */}
      <Dialog open={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          {analyticsModalTitle}
          <IconButton onClick={() => setShowAnalyticsModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p:2 }}>
          {analyticsModalContent}
        </DialogContent>
        <DialogActions sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Button onClick={() => setShowAnalyticsModal(false)} variant="outlined">{t('common.close', 'Close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
