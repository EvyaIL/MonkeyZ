import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText, // Added
  DialogTitle,
  Grid,
  Card,
  CardContent,
  AlertTitle,
  List, // Added
  ListItem, // Added
  ListItemText, // Added
  InputAdornment, // For icons in select
  Chip, // Added Chip import
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Add as AddIcon, 
  Visibility as VisibilityIcon, 
  Delete as DeleteIcon, 
  Close as CloseIcon,
  AssessmentOutlined as AssessmentOutlinedIcon, // For Analytics Title
  PeopleAltOutlined as PeopleAltOutlinedIcon, // For Unique Customers
  AttachMoneyOutlined as AttachMoneyOutlinedIcon, // For Revenue
  ShoppingCartOutlined as ShoppingCartOutlinedIcon, // For Units Sold
  FilterList as FilterListIcon, // For Filter section
  InfoOutlined as InfoOutlinedIcon, // For info icons or tooltips
  ErrorOutline as ErrorOutlineIcon, // For error messages
  CheckCircleOutline as CheckCircleOutlineIcon, // For success messages
  BarChart as BarChartIcon, // For status breakdown icon
} from '@mui/icons-material'; // Added CloseIcon
import { useTranslation } from 'react-i18next'; // For i18n

import { apiService } from '../../../lib/apiService'; // Adjusted path
import OrderForm from '../../../components/admin/OrderForm'; // Adjusted path
import { useGlobalProvider } from '../../../context/GlobalProvider'; // For notifications

function AdminOrdersSimple() {
  const { t } = useTranslation();
  const { notify, token } = useGlobalProvider(); // Added token
  
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState(null);
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null); 
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const [analyticsData, setAnalyticsData] = useState(null); 
  const [showStatusBreakdownModal, setShowStatusBreakdownModal] = useState(false); // State for status breakdown modal

  // State for analytics detail modal
  const [showAnalyticsDetailModal, setShowAnalyticsDetailModal] = useState(false);
  const [analyticsDetailTitle, setAnalyticsDetailTitle] = useState('');
  const [analyticsDetailData, setAnalyticsDetailData] = useState(null);
  const [analyticsDetailType, setAnalyticsDetailType] = useState(''); // 'customers' or 'products'
  // State for revenue breakdown modal (placeholder for now)
  // Removed unused: showRevenueBreakdownModal, revenueBreakdownType, handleCloseRevenueBreakdownModal


  const handleOpenAnalyticsDetailModal = (title, data, type) => {
    setAnalyticsDetailTitle(title);
    setAnalyticsDetailData(data);
    setAnalyticsDetailType(type);
    setShowAnalyticsDetailModal(true);
  };

  const handleCloseAnalyticsDetailModal = () => {
    setShowAnalyticsDetailModal(false);
    setAnalyticsDetailTitle('');
    setAnalyticsDetailData(null);
    setAnalyticsDetailType('');  };
  
  const handleOpenRevenueBreakdownModal = (type) => {
    // For now, using notify as a placeholder for the actual modal.
    // The modal UI can be implemented in a subsequent step.
    notify({ 
      message: t('admin.analytics.revenueBreakdownClicked', `Revenue breakdown for ${type} revenue clicked. Details view pending.`), 
      type: 'info' 
    });
  };

  const handleOpenStatusBreakdownModal = () => {
    setShowStatusBreakdownModal(true);
  };

  const handleCloseStatusBreakdownModal = () => {
    setShowStatusBreakdownModal(false);
  };
  const handleOrderStatusUpdate = async (orderId, newStatus, note = '') => {
    try {
      setLoadingOrders(true);
      const { error } = await apiService.put(`/orders/${orderId}/status`, {
        status: newStatus,
        note: note
      });
      
      if (error) {
        notify({
          message: error.message || 'Failed to update order status',
          type: 'error'
        });
        return;
      }
      
      // Refresh orders after successful update
      await refreshOrders();
      
      notify({
        message: `Order status updated to ${newStatus}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      notify({
        message: 'Failed to update order status',
        type: 'error'
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const calculateAnalytics = useCallback((ordersData) => {
    if (!ordersData || ordersData.length === 0) {
      return null;
    }

    const statusCounts = {
      Pending: 0,
      Processing: 0,
      Completed: 0,
      Cancelled: 0,
      Total: ordersData.length,
    };
    let totalOriginalAmount = 0;
    let totalFinalAmount = 0;
    const customerOrders = {};
    const productStats = {};
    let totalProductsSoldCount = 0;

    ordersData.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      if (order.status !== 'Cancelled') {
        totalOriginalAmount += order.original_total || order.total || 0;
        totalFinalAmount += order.total || 0;

        const customerIdentifier = order.user_id || order.email || order.customerName;
        if (customerIdentifier) {
          if (!customerOrders[customerIdentifier]) {
            customerOrders[customerIdentifier] = { count: 0, totalValue: 0, name: order.customerName || order.email };
          }
          customerOrders[customerIdentifier].count += 1;
          customerOrders[customerIdentifier].totalValue += order.total || 0;
        }

        order.items.forEach(item => {
          totalProductsSoldCount += item.quantity;
          const productName = item.name || `Product ID: ${item.productId}`;
          if (!productStats[productName]) {
            productStats[productName] = { count: 0, quantity: 0, productId: item.productId };
          }
          productStats[productName].count += 1; // Number of times this product appears in orders
          productStats[productName].quantity += item.quantity; // Total quantity sold of this product
        });
      }
    });

    const uniqueCustomersCount = Object.keys(customerOrders).length;
    const uniqueProductsOrdered = Object.keys(productStats).length;

    return {
      statusCounts,
      totalOriginalAmount,
      totalFinalAmount,
      customerOrders, // Detailed per customer
      uniqueCustomersCount,
      productStats, // Detailed per product
      uniqueProductsOrdered,
      totalProductsSoldCount,
    };
  }, []);

  useEffect(() => {
    if (orders && orders.length > 0) {
      const data = calculateAnalytics(orders);
      setAnalyticsData(data);
    } else {
      setAnalyticsData(null); // Ensure analytics data is cleared if orders are empty
    }
  }, [orders, calculateAnalytics]);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await apiService.get('/product/all'); // Or /admin/products if preferred
      if (response.data) {
        setProducts(response.data);
      } else {
        notify({ message: t('admin.orders.loadProductsError', "Failed to load products for order form."), type: 'error' });
      }
    } catch (err) {
      console.error("Error loading products:", err);
      notify({ message: t('admin.orders.loadProductsError', "Failed to load products for order form."), type: 'error' });
    }
    setLoadingProducts(false);
  }, [notify, t]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await apiService.get('/user/all');
      if (response.data) {
        setUsers(response.data);
      } else {
        notify({ message: t('admin.orders.loadUsersError', "Failed to load users for order form."), type: 'error' });
      }
    } catch (err) {
      console.error("Error loading users:", err);
      notify({ message: t('admin.orders.loadUsersError', "Failed to load users for order form."), type: 'error' });
    }
    setLoadingUsers(false);
  }, [notify, t]);

  const refreshOrders = useCallback(async () => {
    if (!apiService.token && !token) { // Check both apiService.token and context token
      setOrderError(t('admin.orders.loadErrorNotAuthenticated', 'Not authenticated. Please log in.'));
      setLoadingOrders(false);
      setOrders([]); 
      setAnalyticsData(null); // Clear analytics data as well
      return;
    }

    setLoadingOrders(true);
    setOrderError(null);
    try {
      const response = await apiService.get('/api/orders');
      if (response.data) {
        setOrders(response.data);
        // Analytics will be recalculated by useEffect watching 'orders'
      } else {
        setOrderError(response.error || t('admin.orders.loadError', 'Failed to load orders.'));
        notify({ message: t('admin.orders.loadError', 'Failed to load orders.'), type: 'error' });
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      const errorMessage = err.response?.data?.detail || t('admin.orders.loadError', 'Failed to load orders.');
      setOrderError(errorMessage);
      notify({ message: errorMessage, type: 'error' });
    } finally {
      setLoadingOrders(false);
    }
  }, [notify, t, token]); // Added token to dependency array

  useEffect(() => {
    if (token) { 
      refreshOrders();
      loadProducts();
      loadUsers();
    } else {
      setLoadingOrders(false);
      setOrders([]);
      setAnalyticsData(null);
      setOrderError(t('admin.orders.loadErrorNotAuthenticated', 'Not authenticated. Please log in.'));
    }
  }, [refreshOrders, loadProducts, loadUsers, token, t]); // Added t to dependency array

  const handleCreateNewOrder = () => {
    setEditingOrder(null);
    setShowOrderForm(true);
    setOrderError(null); // Clear previous errors
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowOrderForm(true);
    setOrderError(null); // Clear previous errors
  };

  const handleOpenDeleteDialog = (order) => {
    setOrderToDelete(order);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setOrderToDelete(null);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setLoadingOrders(true);
    try {
      await apiService.delete(`/api/orders/${orderToDelete._id}`);
      notify({ message: t('admin.orders.deletedSuccess', 'Order deleted successfully!'), type: 'success', icon: <CheckCircleOutlineIcon /> });
      await refreshOrders();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = error.response?.data?.detail || t('admin.orders.deleteError', 'Failed to delete order.');
      notify({ message: errorMessage, type: 'error', icon: <ErrorOutlineIcon /> });
      setOrderError(errorMessage); // Show error on the main page if needed
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      if (editingOrder?._id) {
        // If only status is being changed, use the status endpoint
        if (orderData.status && Object.keys(orderData).length === 1) {
          await apiService.put(`/api/orders/${editingOrder._id}/status`, { status: orderData.status });
        } else {
          await apiService.patch(`/api/orders/${editingOrder._id}`, orderData);
        }
        notify({ message: t('admin.orders.updatedSuccess', 'Order updated successfully!'), type: 'success', icon: <CheckCircleOutlineIcon /> });
      } else {
        const payload = { ...orderData, autoAssignKeys: true };
        if (payload.user_id === '') delete payload.user_id;
        await apiService.post('/api/orders', payload);
        notify({ message: t('admin.orders.createdSuccess', 'Order created successfully!'), type: 'success', icon: <CheckCircleOutlineIcon /> });
      }
      await refreshOrders();
      setShowOrderForm(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error.response?.data?.detail || t('admin.orders.saveError', 'Failed to save order.');
      setOrderError(errorMessage); // Set error to be displayed on the form
      notify({ message: errorMessage, type: 'error', icon: <ErrorOutlineIcon /> });
    } finally {
      setLoadingOrders(false); // Ensure loading is stopped
    }
  };

  const filteredOrders = orders.filter(order => 
    orderStatusFilter === 'all' ? true : order.status === orderStatusFilter
  );

  // --- Refresh Awaiting Stock Orders ---
  const handleRefreshAwaitingStock = async () => {
    try {
      setLoadingOrders(true);
      const { error } = await apiService.post('/api/orders/retry-failed');
      if (error) {
        notify({ message: t('admin.orders.refreshAwaitingStockError', 'Failed to refresh awaiting stock orders.'), type: 'error' });
      } else {
        notify({ message: t('admin.orders.refreshAwaitingStockSuccess', 'Awaiting stock orders refreshed!'), type: 'success' });
        await refreshOrders();
      }
    } catch (err) {
      notify({ message: t('admin.orders.refreshAwaitingStockError', 'Failed to refresh awaiting stock orders.'), type: 'error' });
    } finally {
      setLoadingOrders(false);
    }
  };

  if (showOrderForm) {
    return (
      <OrderForm
        order={editingOrder}
        allProducts={products}
        allUsers={users}
        // Pass coupons if OrderForm needs them directly
        onSubmit={handleOrderSubmit}
        onCancel={() => {
          setShowOrderForm(false);
          setEditingOrder(null);
        }}
        formError={orderError}
        t={t} // Pass the t function
      />
    );
  }

  return (
    <Box p={3} sx={{ backgroundColor: (theme) => theme.palette.background.default, minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {t('admin.manageOrders', 'Manage Orders')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateNewOrder}
            disabled={loadingProducts}
            sx={{ borderRadius: 2, boxShadow: '0 3px 5px 2px rgba(0, 105, 217, .3)' }}
          >
            {t('admin.orders.createNew', 'Create New Order')}
          </Button>
        </Box>
      </Paper>

      {/* Order Analytics Section */}
      {analyticsData && !loadingOrders && (
        <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'text.primary' }}>
            <AssessmentOutlinedIcon sx={{ mr: 1, color: 'primary.main' }} /> {t('admin.orders.analyticsTitle', 'Order Analytics')}
          </Typography>
          <Grid container spacing={3}> {/* Increased spacing */}
            {/* Total Orders Card - Clickable */}
            <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size to md={4} */}
              <Card 
                onClick={handleOpenStatusBreakdownModal}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' }, transition: '0.2s', height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <BarChartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{t('admin.analytics.totalOrders', 'Total Orders')}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 2 }}> {/* Added mb to compensate for removed button */}
                    {analyticsData.statusCounts.Total}
                  </Typography>
                  {/* Button removed, card is now clickable */}
                </CardContent>
              </Card>
            </Grid>

            {/* Unique Customers Card - Clickable */}
            <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size to md={4} */}
              <Card 
                onClick={() => analyticsData.customerOrders && handleOpenAnalyticsDetailModal(t('admin.analytics.customerOrderDetailsTitle', 'Customer Order Details'), analyticsData.customerOrders, 'customers')}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' }, transition: '0.2s', height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <PeopleAltOutlinedIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{t('admin.analytics.uniqueCustomers', 'Unique Customers')}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'secondary.dark', mb: 0.5 }}>{analyticsData.uniqueCustomersCount}</Typography>
                  {/* Button removed, card is now clickable */}
                  <Typography variant="caption" sx={{ mt: 0, display: 'block', lineHeight: 'normal' }}>{t('admin.analytics.withNonCancelledOrders', '(non-cancelled orders)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Total Revenue (Original) Card - Clickable */}
            <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size to md={4} */}
              <Card 
                onClick={() => analyticsData && handleOpenRevenueBreakdownModal('original')}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' }, transition: '0.2s', height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'warning.lightest' }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <AttachMoneyOutlinedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{t('admin.analytics.totalRevenueOriginal', 'Total Revenue (Original)')}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 0.5 }}>
                    ₪{analyticsData.totalOriginalAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0, display: 'block', lineHeight: 'normal' }}>{t('admin.analytics.excludingCancelled', '(Excluding Cancelled)')}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Revenue (Final) Card - Clickable */}
            <Grid item xs={12} sm={6} md={6}> {/* Adjusted grid size to md={6} */}
              <Card 
                onClick={() => analyticsData && handleOpenRevenueBreakdownModal('final')}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' }, transition: '0.2s', height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'success.lightest' }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <AttachMoneyOutlinedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{t('admin.analytics.totalRevenueFinal', 'Total Revenue (Final)')}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.dark', mb: 0.5 }}>
                    ₪{analyticsData.totalFinalAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0, display: 'block', lineHeight: 'normal' }}>{t('admin.analytics.excludingCancelled', '(Excluding Cancelled)')}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Units Sold Card */}
            <Grid item xs={12} sm={6} md={6}> {/* Adjusted grid size to md={6} */}
              <Card sx={{ height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'info.lightest' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <ShoppingCartOutlinedIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{t('admin.analytics.totalUnitsSold', 'Total Units Sold')}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.dark', mb: 0.5 }}>{analyticsData.totalProductsSoldCount}</Typography>
                  <Typography variant="caption" sx={{ mt: 0, display: 'block', lineHeight: 'normal' }}>{t('admin.analytics.inNonCancelledOrders', '(non-cancelled orders)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Unique Products Ordered Card - Can be added if space allows or combined */}
            {/* 
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' }, transition: '0.2s', height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <CategoryOutlinedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{t('admin.analytics.uniqueProductsOrdered', 'Unique Products')}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>{analyticsData.uniqueProductsOrdered}</Typography>
                  <Button size="small" onClick={() => analyticsData.productStats && handleOpenAnalyticsDetailModal(t('admin.analytics.productOrderDetailsTitle', 'Product Order Details'), analyticsData.productStats, 'products')} sx={{ mt: 1 }}>{t('admin.analytics.viewDetails', 'View Details')}</Button>
                  <Typography variant="caption" sx={{ mt: 0.5 }}>{t('admin.analytics.inNonCancelledOrders', '(non-cancelled orders)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            */}
          </Grid>
        </Paper>
      )}

      {/* Status Filter Dropdown */}
      <Paper elevation={3} sx={{ p: 2, mt: 2, mb: 2, borderRadius: 2 }}>
        <FormControl fullWidth variant="outlined"> {/* Changed to outlined */}
          <InputLabel id="order-status-filter-label">{t('admin.filterByStatus', 'Filter by Status')}</InputLabel>
          <Select
            labelId="order-status-filter-label"
            value={orderStatusFilter}
            label={t('admin.filterByStatus', 'Filter by Status')}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="all">{t('admin.statusAll', 'All')}</MenuItem>
            <MenuItem value="Pending">{t('admin.statusPending', 'Pending')}</MenuItem>
            <MenuItem value="Processing">{t('admin.statusProcessing', 'Processing')}</MenuItem>
            <MenuItem value="Completed">{t('admin.statusCompleted', 'Completed')}</MenuItem>
            <MenuItem value="Cancelled">{t('admin.statusCancelled', 'Cancelled')}</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Refresh Awaiting Stock Orders Button */}
      <Button
        variant="contained"
        color="info"
        onClick={handleRefreshAwaitingStock}
        sx={{ mb: 2 }}
        disabled={loadingOrders}
      >
        {t('admin.orders.refreshAwaitingStock', 'Refresh Awaiting Stock Orders')}
      </Button>

      {loadingOrders && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('common.loadingOrders', 'Loading Orders...')}</Typography>
        </Box>
      )}
      {!loadingOrders && orderError && !showOrderForm && ( // Only show general error if not on form
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} icon={<ErrorOutlineIcon />}>
          <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
          {orderError}
        </Alert>
      )}
      
      {!loadingOrders && !orderError && filteredOrders.length === 0 && (
         <Paper elevation={1} sx={{ p: 3, textAlign: 'center', mt: 3, borderRadius: 2, backgroundColor: 'grey.100' }}>
            <InfoOutlinedIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
            <Typography variant="h6" sx={{ color: 'grey.700' }}>{t('admin.noOrdersFound', 'No orders found.')}</Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
              {orderStatusFilter === 'all' 
                ? t('admin.noOrdersYet', 'There are no orders in the system yet.')
                : t('admin.noOrdersMatchFilter', 'No orders match the current filter.')}
            </Typography>
         </Paper>
      )}

      {/* Orders Table */}
      {!loadingOrders && filteredOrders.length > 0 && (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
          <Table sx={{ minWidth: 750 }} aria-label="simple table">
            <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200]}}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>{t('admin.orderId', 'Order ID')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>{t('admin.orderCustomer', 'Customer')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>{t('admin.orderDate', 'Date')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', color: 'text.primary' }}>{t('admin.orderOriginalTotal', 'Original Total')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', color: 'text.primary' }}>{t('admin.orderDiscount', 'Discount')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', color: 'text.primary' }}>{t('admin.orderTotal', 'Total')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>{t('admin.orderCoupon', 'Coupon')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}>{t('admin.orderStatus', 'Status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{t('admin.orderActions', 'Actions')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>{t('admin.orderAssignedKeys', 'Assigned Keys')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order, index) => (
                <TableRow
                  key={order._id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:nth-of-type(odd)': { backgroundColor: (theme) => theme.palette.action.hover },
                    '&:hover': { backgroundColor: (theme) => theme.palette.action.selected }
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{order._id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.email}</Typography>
                  </TableCell>
                  <TableCell>{new Date(order.date || order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{`₪${order.original_total?.toFixed(2) || order.total?.toFixed(2)}`}</TableCell>
                  <TableCell sx={{ textAlign: 'right', color: order.discount_amount > 0 ? 'error.main' : 'text.secondary' }}>
                    {`-₪${order.discount_amount?.toFixed(2) || '0.00'}`}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>{`₪${order.total?.toFixed(2)}`}</TableCell>
                  <TableCell>{order.coupon_code || 'N/A'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                     <Chip 
                        label={t(`admin.status${order.status}`, order.status || 'Unknown')}
                        size="small"
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            backgroundColor: 
                              order.status === 'Completed' ? 'success.main' :
                              order.status === 'Pending' ? 'warning.main' :
                              order.status === 'Processing' ? 'info.main' :
                              order.status === 'Cancelled' ? 'error.main' :
                              'grey.500'
                        }}
                     />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEditOrder(order)} color="primary" aria-label={t('admin.editButton', 'Edit')} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => setSelectedOrderDetails(order)} color="secondary" aria-label={t('admin.viewDetailsButton', 'Details')} size="small">
                       <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDeleteDialog(order)} color="error" aria-label={t('admin.deleteButton', 'Delete')} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        Array.isArray(item.assigned_keys) && item.assigned_keys.length > 0 ? (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            <span style={{ fontWeight: 500 }}>{item.name || `Product ID: ${item.productId}`}:</span>
                            {item.assigned_keys.map((key, i) => (
                              <span key={i} style={{ fontFamily: 'monospace', background: '#e3f2fd', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>{key}</span>
                            ))}
                          </div>
                        ) : null
                      ))
                    ) : (
                      <span style={{ color: '#aaa' }}>{t('admin.orderForm.noKeys', 'No Keys')}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Order Details Modal (Overlay) - Enhanced */}
      {selectedOrderDetails && (
        <Dialog 
          open={Boolean(selectedOrderDetails)} 
          onClose={() => setSelectedOrderDetails(null)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
            {t('admin.orderDetailsTitle', 'Order Details')} - {selectedOrderDetails._id}
            <IconButton onClick={() => setSelectedOrderDetails(null)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('admin.customerInfo', 'Customer Information')}</Typography>
                <Typography><strong>{t('admin.orderCustomer', 'Customer')}:</strong> {selectedOrderDetails.customerName} ({selectedOrderDetails.email})</Typography>
                <Typography><strong>{t('admin.orderPhone', 'Phone')}:</strong> {selectedOrderDetails.phone || 'N/A'}</Typography>
                {selectedOrderDetails.user_id && <Typography><strong>{t('admin.orderUserId', 'User ID')}:</strong> {selectedOrderDetails.user_id}</Typography>}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('admin.orderSummary', 'Order Summary')}</Typography>
                <Typography><strong>{t('admin.orderDate', 'Date')}:</strong> {new Date(selectedOrderDetails.date || selectedOrderDetails.createdAt).toLocaleString()}</Typography>
                <Typography><strong>{t('admin.orderOriginalTotal', 'Original Total')}:</strong> {`₪${selectedOrderDetails.original_total?.toFixed(2) || selectedOrderDetails.total?.toFixed(2)}`}</Typography>
                {selectedOrderDetails.coupon_code && (
                  <>
                    <Typography><strong>{t('admin.orderCoupon', 'Coupon Code')}:</strong> {selectedOrderDetails.coupon_code}</Typography>
                    <Typography><strong>{t('admin.orderDiscountAmount', 'Discount Amount')}:</strong> <span style={{ color: 'red' }}>{`-₪${selectedOrderDetails.discount_amount?.toFixed(2)}`}</span></Typography>
                  </>
                )}
                <Typography><strong>{t('admin.orderFinalTotal', 'Final Total')}:</strong> <span style={{ fontWeight: 'bold' }}>{`₪${selectedOrderDetails.total?.toFixed(2)}`}</span></Typography>                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span"><strong>{t('admin.orderStatus', 'Status')}:</strong></Typography>
                  <Chip 
                    label={t(`admin.status${selectedOrderDetails.status}`, selectedOrderDetails.status)}
                    size="small"
                    sx={{ ml:1, color: 'white', fontWeight: 'bold', backgroundColor: selectedOrderDetails.status === 'Completed' ? 'success.main' : selectedOrderDetails.status === 'Pending' ? 'warning.main' : selectedOrderDetails.status === 'Processing' ? 'info.main' : selectedOrderDetails.status === 'Cancelled' ? 'error.main' : 'grey.500' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt:1 }}>{t('admin.orderItems', 'Items')}</Typography>
                <List dense sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1, p:1 }}>
                  {selectedOrderDetails.items.map((item, index) => (
                    <ListItem key={index} divider={index < selectedOrderDetails.items.length - 1} alignItems="flex-start">
                      <ListItemText 
                        primary={
                          <>
                            {item.name || `Product ID: ${item.productId}`}
                            {Array.isArray(item.assigned_keys) && item.assigned_keys.length > 0 && (
                              <>
                                <br />
                                <span style={{ color: '#1976d2', fontWeight: 500 }}>
                                  {t('admin.orderForm.assignedKeys', 'Assigned Keys')}:<br />
                                  {item.assigned_keys.map((key, i) => (
                                    <span key={i} style={{ fontFamily: 'monospace', background: '#e3f2fd', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>{key}</span>
                                  ))}
                                </span>
                              </>
                            )}
                          </>
                        }
                        secondary={`${t('admin.orderForm.quantity', 'Qty')}: ${item.quantity} × ₪${item.price?.toFixed(2)} = ₪${(item.quantity * item.price).toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              {selectedOrderDetails.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt:1 }}>{t('admin.orderNotes', 'Notes')}</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedOrderDetails.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
            
            <Box mt={3} borderTop={1} borderColor="divider" pt={2}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{t('admin.updateStatusPrompt', 'Update Status')}</Typography>
              <FormControl fullWidth variant="outlined">
                <InputLabel>{t('admin.updateStatusPrompt', 'Update Status')}</InputLabel>
                <Select
                  defaultValue={selectedOrderDetails.status}
                  label={t('admin.updateStatusPrompt', 'Update Status')}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    // Consider a more user-friendly confirmation, perhaps a small dialog
                    if (window.confirm(t('admin.orders.confirmStatusChange', `Change status to ${newStatus}?`))) {
                       handleOrderStatusUpdate(selectedOrderDetails._id, newStatus, `Status changed via details modal by admin.`);
                    }
                  }}
                  disabled={loadingOrders}
                >
                  <MenuItem value="Pending">{t('admin.statusPending', 'Pending')}</MenuItem>
                  <MenuItem value="Processing">{t('admin.statusProcessing', 'Processing')}</MenuItem>
                  <MenuItem value="Completed">{t('admin.statusCompleted', 'Completed')}</MenuItem>
                  <MenuItem value="Cancelled">{t('admin.statusCancelled', 'Cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
            <Button onClick={() => setSelectedOrderDetails(null)} variant="outlined" color="secondary">
              {t('admin.closeButton', 'Close')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Delete Confirmation Dialog - Enhanced */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{ sx: { borderRadius: 2, p:1 } }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
          {t('admin.orders.confirmDeleteTitle', "Confirm Deletion")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t('admin.orders.confirmDeleteText', `Are you sure you want to delete order ${orderToDelete?._id}? This action cannot be undone.`)}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p:2 }}>
          <Button onClick={handleCloseDeleteDialog} color="secondary" variant="outlined">
            {t('admin.cancelButton', 'Cancel')}
          </Button>
          <Button onClick={handleDeleteOrder} color="error" variant="contained" autoFocus startIcon={<DeleteIcon />}>
            {t('admin.deleteButton', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Detail Modal (for Customers/Products) - Enhanced */}
      <Dialog open={showAnalyticsDetailModal} onClose={handleCloseAnalyticsDetailModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          {analyticsDetailTitle}
          <IconButton
            aria-label="close"
            onClick={handleCloseAnalyticsDetailModal}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {analyticsDetailData && analyticsDetailType === 'customers' && (
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="customer analytics table">
                <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.analytics.modal.customerName', 'Customer Name/ID')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('admin.analytics.modal.orderCount', 'Order Count')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('admin.analytics.modal.totalSpent', 'Total Spent')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(analyticsDetailData)
                    .sort(([, a], [, b]) => b.totalValue - a.totalValue) // Sort by total spent
                    .map(([key, value]) => (
                    <TableRow hover key={key} sx={{ '&:nth-of-type(odd)': { backgroundColor: (theme) => theme.palette.action.hover }}}>
                      <TableCell>{value.name}</TableCell>
                      <TableCell align="right">{value.count}</TableCell>
                      <TableCell align="right">{`₪${value.totalValue.toFixed(2)}`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {analyticsDetailData && analyticsDetailType === 'products' && (
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="product analytics table">
                <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.analytics.modal.productName', 'Product Name')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('admin.analytics.modal.productId', 'Product ID')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('admin.analytics.modal.timesOrdered', 'Times Ordered')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('admin.analytics.modal.totalQuantitySold', 'Total Quantity Sold')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(analyticsDetailData)
                    .sort(([, a], [, b]) => b.quantity - a.quantity) // Sort by quantity sold
                    .map(([productName, stats]) => (
                    <TableRow hover key={productName} sx={{ '&:nth-of-type(odd)': { backgroundColor: (theme) => theme.palette.action.hover }}}>
                      <TableCell>{productName}</TableCell>
                      <TableCell>{stats.productId}</TableCell>
                      <TableCell align="right">{stats.count}</TableCell>
                      <TableCell align="right">{stats.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Button onClick={handleCloseAnalyticsDetailModal} variant="outlined">{t('admin.buttons.close', 'Close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Status Breakdown Modal - Enhanced */}
      <Dialog open={showStatusBreakdownModal} onClose={handleCloseStatusBreakdownModal} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          {t('admin.analytics.statusBreakdownTitle', 'Order Status Breakdown')}
          <IconButton
            aria-label="close"
            onClick={handleCloseStatusBreakdownModal}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {analyticsData && analyticsData.statusCounts ? (
            <List dense>
              {Object.entries(analyticsData.statusCounts)
                .filter(([key]) => key !== 'Total') // Exclude 'Total' from this list
                .map(([status, count]) => (
                <ListItem key={status} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <ListItemText primary={t(`admin.orders.status.${status}`, status)} />
                  <Chip label={count} size="small" sx={{ fontWeight: 'bold' }}/>
                </ListItem>
              ))}
              <ListItem sx={{ display: 'flex', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', mt:1, pt:1 }}>
                <ListItemText primary={t('admin.orders.status.Total', 'Total Orders')} sx={{ fontWeight: 'bold' }} />
                <Chip label={analyticsData.statusCounts.Total} size="small" color="primary" sx={{ fontWeight: 'bold' }}/>
              </ListItem>
            </List>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p:2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>{t('common.loading', 'Loading...')}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Button onClick={handleCloseStatusBreakdownModal} variant="outlined">{t('common.close', 'Close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminOrdersSimple;
