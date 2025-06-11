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
  FormControl,
  InputLabel,
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Grid, 
  Card, 
  CardContent,
  TableSortLabel // Added for sortable table in modal
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material'; // Added CloseIcon
import { useNavigate } from 'react-router-dom'; // For navigation if needed, or for OrderForm
import { useTranslation } from 'react-i18next'; // For i18n

import { apiService } from '../../../lib/apiService'; // Adjusted path
import OrderForm from '../../../components/admin/OrderForm'; // Adjusted path
import { useGlobalProvider } from '../../../context/GlobalProvider'; // For notifications

function AdminOrdersSimple() {
  const { t } = useTranslation();
  const { notify } = useGlobalProvider();
  const navigate = useNavigate(); // Initialize navigate

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState(null);
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null); 
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const [analyticsData, setAnalyticsData] = useState(null); 

  // State for analytics detail modal
  const [showAnalyticsDetailModal, setShowAnalyticsDetailModal] = useState(false);
  const [analyticsDetailTitle, setAnalyticsDetailTitle] = useState('');
  const [analyticsDetailData, setAnalyticsDetailData] = useState(null);
  const [analyticsDetailType, setAnalyticsDetailType] = useState(''); // 'customers' or 'products'

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
    setAnalyticsDetailType('');
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
      setAnalyticsData(null);
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

  const refreshOrders = useCallback(async () => {
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
  }, [notify, t]);

  useEffect(() => {
    refreshOrders();
    loadProducts(); // Load products when component mounts
  }, [refreshOrders, loadProducts]);

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
      await apiService.delete(`/api/orders/${orderToDelete.id || orderToDelete._id}`);
      notify({ message: t('admin.orders.deletedSuccess', 'Order deleted successfully!'), type: 'success' });
      await refreshOrders();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = error.response?.data?.detail || t('admin.orders.deleteError', 'Failed to delete order.');
      notify({ message: errorMessage, type: 'error' });
      setOrderError(errorMessage); // Show error on the main page if needed
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      if (editingOrder?.id || editingOrder?._id) {
        await apiService.patch(`/api/orders/${editingOrder.id || editingOrder._id}`, orderData);
        notify({ message: t('admin.orders.updatedSuccess', 'Order updated successfully!'), type: 'success' });
      } else {
        const payload = { ...orderData };
        if (payload.user_id === '') delete payload.user_id;
        await apiService.post('/api/orders', payload);
        notify({ message: t('admin.orders.createdSuccess', 'Order created successfully!'), type: 'success' });
      }
      await refreshOrders();
      setShowOrderForm(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error.response?.data?.detail || t('admin.orders.saveError', 'Failed to save order.');
      setOrderError(errorMessage); // Set error to be displayed on the form
      notify({ message: errorMessage, type: 'error' });
    } finally {
      setLoadingOrders(false); // Ensure loading is stopped
    }
  };
    const handleOrderStatusUpdate = async (orderId, newStatus, note = null) => {
    setLoadingOrders(true);
    try {
      const payload = { status: newStatus };
      if (note) payload.note = note;
      await apiService.put(`/api/orders/${orderId}/status`, payload);
      await refreshOrders();
      if (selectedOrderDetails && (selectedOrderDetails.id === orderId || selectedOrderDetails._id === orderId)) {
        setSelectedOrderDetails(prev => prev ? { ...prev, status: newStatus } : null);
      }
      notify({ message: t('admin.orders.statusUpdatedSuccess', 'Order status updated!'), type: 'success' });
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.detail || t('admin.orders.statusUpdateError', 'Failed to update order status.');
      notify({ message: errorMessage, type: 'error' });
    }
    setLoadingOrders(false);
  };


  const filteredOrders = orders.filter(order => 
    orderStatusFilter === 'all' ? true : order.status === orderStatusFilter
  );

  if (showOrderForm) {
    return (
      <OrderForm
        order={editingOrder}
        onSubmit={handleOrderSubmit}
        onCancel={() => {
          setShowOrderForm(false);
          setEditingOrder(null);
          setOrderError(null); // Clear errors when cancelling
        }}
        allProducts={products} // Pass all products
        loading={loadingOrders || loadingProducts} // Combined loading state
        error={orderError} // Pass error to be displayed on the form
        // Pass t function for translations within OrderForm if it uses it
        t={t} 
      />
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          {t('admin.manageOrders', 'Manage Orders')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNewOrder}
          disabled={loadingProducts} 
        >
          {t('admin.orders.createNew', 'Create New Order')}
        </Button>
      </Box>

      {/* Analytics Section */}
      {analyticsData && !loadingOrders && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            {t('admin.orders.analyticsTitle', 'Order Analytics')}
          </Typography>
          <Grid container spacing={2}>
            {/* Row 1: Total Orders, Pending, Processing (md=4 each) */}
            <Grid item xs={12} sm={6} md={4}> {/* Changed from md={3} */}
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.totalOrders', 'Total Orders')}</Typography>
                  <Typography variant="h4">{analyticsData.statusCounts.Total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}> {/* Changed from md={3} */}
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.pendingOrders', 'Pending')}</Typography>
                  <Typography variant="h4" color="orange">{analyticsData.statusCounts.Pending || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}> {/* Changed from md={3} */}
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.processingOrders', 'Processing')}</Typography>
                  <Typography variant="h4" color="blue">{analyticsData.statusCounts.Processing || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Row 2: Completed, Cancelled, Unique Customers (md=4 each) */}
            <Grid item xs={12} sm={6} md={4}> {/* Changed from md={3} */}
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.completedOrders', 'Completed')}</Typography>
                  <Typography variant="h4" color="green">{analyticsData.statusCounts.Completed || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}> {/* Changed from md={3} */}
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.cancelledOrders', 'Cancelled')}</Typography>
                  <Typography variant="h4" color="red">{analyticsData.statusCounts.Cancelled || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}> {/* Changed from md={3} */}
              <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => handleOpenAnalyticsDetailModal(t('admin.analytics.customerOrderDetailsTitle', 'Customer Order Details'), analyticsData.customerOrders, 'customers')}>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.uniqueCustomers', 'Unique Customers')}</Typography>
                  <Typography variant="h4">{analyticsData.uniqueCustomersCount}</Typography>
                   <Typography variant="caption">{t('admin.analytics.withNonCancelledOrders', '(with non-cancelled orders)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Row 3: Revenues, Total Units Sold, Unique Products (md=3 each) */}
            <Grid item xs={12} sm={6} md={3}> {/* Was md={3}, kept md={3} and moved to this row */}
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.totalRevenueOriginal', 'Total Revenue (Original)')}</Typography>
                  <Typography variant="h5">₪{analyticsData.totalOriginalAmount.toFixed(2)}</Typography>
                  <Typography variant="caption">{t('admin.analytics.excludingCancelled', '(Excluding Cancelled)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}> {/* Was md={3}, kept md={3} and moved to this row */}
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.totalRevenueFinal', 'Total Revenue (Final)')}</Typography>
                  <Typography variant="h5">₪{analyticsData.totalFinalAmount.toFixed(2)}</Typography>
                  <Typography variant="caption">{t('admin.analytics.excludingCancelled', '(Excluding Cancelled)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* New Card: Total Product Units Sold */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.totalUnitsSold', 'Total Units Sold')}</Typography>
                  <Typography variant="h4">{analyticsData.totalProductUnitsSold}</Typography>
                  <Typography variant="caption">{t('admin.analytics.inNonCancelledOrders', '(in non-cancelled orders)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}> {/* Changed from md={4} */}
              <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => handleOpenAnalyticsDetailModal(t('admin.analytics.productOrderDetailsTitle', 'Product Order Details'), analyticsData.productStats, 'products')}>
                <CardContent>
                  <Typography variant="h6">{t('admin.analytics.uniqueProductsOrdered', 'Unique Products Ordered')}</Typography>
                  <Typography variant="h4">{analyticsData.uniqueProductsOrdered}</Typography>
                   <Typography variant="caption">{t('admin.analytics.inNonCancelledOrders', '(in non-cancelled orders)')}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="order-status-filter-label">{t('admin.filterByStatus', 'Filter by Status')}</InputLabel>
          <Select
            labelId="order-status-filter-label"
            value={orderStatusFilter}
            label={t('admin.filterByStatus', 'Filter by Status')}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
          >
            <MenuItem value="all">{t('admin.statusAll', 'All')}</MenuItem>
            <MenuItem value="Pending">{t('admin.statusPending', 'Pending')}</MenuItem>
            <MenuItem value="Processing">{t('admin.statusProcessing', 'Processing')}</MenuItem>
            <MenuItem value="Completed">{t('admin.statusCompleted', 'Completed')}</MenuItem>
            <MenuItem value="Cancelled">{t('admin.statusCancelled', 'Cancelled')}</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {loadingOrders && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}
      {!loadingOrders && orderError && !showOrderForm && ( // Only show general error if not on form
        <Alert severity="error" sx={{ mb: 2 }}>{orderError}</Alert>
      )}
      
      {!loadingOrders && !orderError && filteredOrders.length === 0 && (
         <Typography sx={{ textAlign: 'center', mt: 3 }}>{t('admin.noOrdersFound', 'No orders found.')}</Typography>
      )}

      {!loadingOrders && filteredOrders.length > 0 && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.orderId', 'Order ID')}</TableCell>
                <TableCell>{t('admin.orderCustomer', 'Customer')}</TableCell>
                <TableCell>{t('admin.orderDate', 'Date')}</TableCell>
                <TableCell>{t('admin.orderOriginalTotal', 'Original Total')}</TableCell>
                <TableCell>{t('admin.orderDiscount', 'Discount')}</TableCell>
                <TableCell>{t('admin.orderTotal', 'Total')}</TableCell>
                <TableCell>{t('admin.orderCoupon', 'Coupon')}</TableCell>
                <TableCell>{t('admin.orderStatus', 'Status')}</TableCell>
                <TableCell align="right">{t('admin.orderActions', 'Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow
                  key={order.id || order._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {order.id || order._id}
                  </TableCell>
                  <TableCell>{order.customerName} ({order.email})</TableCell>
                  <TableCell>{new Date(order.date || order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>₪{order.original_total?.toFixed(2) || order.total?.toFixed(2)}</TableCell>
                  <TableCell>₪{order.discount_amount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>₪{order.total?.toFixed(2)}</TableCell>
                  <TableCell>{order.coupon_code || 'N/A'}</TableCell>
                  <TableCell>
                     <span style={{
                        padding: '0.25em 0.5em',
                        borderRadius: '0.25rem',
                        color: 'white',
                        backgroundColor: 
                          order.status === 'Completed' ? 'green' :
                          order.status === 'Pending' ? 'orange' :
                          order.status === 'Processing' ? 'blue' :
                          order.status === 'Cancelled' ? 'red' :
                          'gray'
                     }}>
                        {t(`admin.status${order.status}`, order.status || 'Unknown')}
                     </span>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEditOrder(order)} color="primary" aria-label={t('admin.editButton', 'Edit')}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => setSelectedOrderDetails(order)} color="secondary" aria-label={t('admin.viewDetailsButton', 'Details')}>
                       <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDeleteDialog(order)} color="error" aria-label={t('admin.deleteButton', 'Delete')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Basic Order Details Modal */}
      {selectedOrderDetails && (
        <Box 
          sx={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', zIndex: 1300 
          }}
          onClick={() => setSelectedOrderDetails(null)} // Close on backdrop click
        >
          <Paper sx={{ p: 3, width: '90%', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}> 
            <Typography variant="h5" gutterBottom>{t('admin.orderDetailsTitle', 'Order Details')} - {selectedOrderDetails.id || selectedOrderDetails._id}</Typography>
            <Typography><strong>{t('admin.orderCustomer', 'Customer')}:</strong> {selectedOrderDetails.customerName} ({selectedOrderDetails.email})</Typography>
            <Typography><strong>{t('admin.orderPhone', 'Phone')}:</strong> {selectedOrderDetails.phone || 'N/A'}</Typography>
            <Typography><strong>{t('admin.orderDate', 'Date')}:</strong> {new Date(selectedOrderDetails.date || selectedOrderDetails.createdAt).toLocaleString()}</Typography>
            
            {/* Coupon and Total Details */}
            <Typography><strong>{t('admin.orderOriginalTotal', 'Original Total')}:</strong> ₪{selectedOrderDetails.original_total?.toFixed(2) || selectedOrderDetails.total?.toFixed(2)}</Typography>
            {selectedOrderDetails.coupon_code && (
              <>
                <Typography><strong>{t('admin.orderCoupon', 'Coupon Code')}:</strong> {selectedOrderDetails.coupon_code}</Typography>
                <Typography><strong>{t('admin.orderDiscountAmount', 'Discount Amount')}:</strong> ₪{selectedOrderDetails.discount_amount?.toFixed(2)}</Typography>
              </>
            )}
            <Typography><strong>{t('admin.orderFinalTotal', 'Final Total')}:</strong> ₪{selectedOrderDetails.total?.toFixed(2)}</Typography>
            
            <Typography><strong>{t('admin.orderStatus', 'Status')}:</strong> {t(`admin.status${selectedOrderDetails.status}`, selectedOrderDetails.status)}</Typography>
            {selectedOrderDetails.user_id && <Typography><strong>{t('admin.orderUserId', 'User ID')}:</strong> {selectedOrderDetails.user_id}</Typography>}
            <Box mt={1}>
              <strong>{t('admin.orderItems', 'Items')}:</strong>
              <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {selectedOrderDetails.items.map((item, index) => (
                  <li key={index}>{item.name || `Product ID: ${item.productId}`} - {t('admin.orderForm.quantity', 'Qty')}: {item.quantity}, {t('admin.orderForm.pricePerItem', 'Price')}: ₪{item.price?.toFixed(2)}</li>
                ))}
              </ul>
            </Box>
            {selectedOrderDetails.notes && <Typography><strong>{t('admin.orderNotes', 'Notes')}:</strong> {selectedOrderDetails.notes}</Typography>}
            
            <Box mt={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('admin.updateStatusPrompt', 'Update Status')}</InputLabel>
                <Select
                  defaultValue={selectedOrderDetails.status} // Changed to defaultValue for uncontrolled component behavior within modal
                  label={t('admin.updateStatusPrompt', 'Update Status')}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    if (window.confirm(t('admin.orders.confirmStatusChange', `Change status to ${newStatus}?`))) {
                       handleOrderStatusUpdate(selectedOrderDetails.id || selectedOrderDetails._id, newStatus, `Status changed via details modal by admin.`);
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

            <Button onClick={() => setSelectedOrderDetails(null)} sx={{ mt: 2 }}>
              {t('admin.closeButton', 'Close')}
            </Button>
          </Paper>
        </Box>
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('admin.orders.confirmDeleteTitle', "Confirm Deletion")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('admin.orders.confirmDeleteText', `Are you sure you want to delete order ${orderToDelete?.id || orderToDelete?._id}? This action cannot be undone.`)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            {t('admin.cancelButton', 'Cancel')}
          </Button>
          <Button onClick={handleDeleteOrder} color="error" autoFocus>
            {t('admin.deleteButton', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Detail Modal */}
      <Dialog open={showAnalyticsDetailModal} onClose={handleCloseAnalyticsDetailModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {analyticsDetailTitle}
          <IconButton
            aria-label="close"
            onClick={handleCloseAnalyticsDetailModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {analyticsDetailData && analyticsDetailType === 'customers' && (
            <TableContainer component={Paper}>
              <Table stickyHeader aria-label="customer analytics table">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.analytics.modal.customerName', 'Customer Name/ID')}</TableCell>
                    <TableCell align="right">{t('admin.analytics.modal.orderCount', 'Order Count')}</TableCell>
                    <TableCell align="right">{t('admin.analytics.modal.totalSpent', 'Total Spent')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(analyticsDetailData).map(([key, value]) => (
                    <TableRow hover key={key}>
                      <TableCell>{value.name}</TableCell>
                      <TableCell align="right">{value.count}</TableCell>
                      <TableCell align="right">₪{value.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {analyticsDetailData && analyticsDetailType === 'products' && (
            <TableContainer component={Paper}>
              <Table stickyHeader aria-label="product analytics table">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.analytics.modal.productName', 'Product Name')}</TableCell>
                    <TableCell>{t('admin.analytics.modal.productId', 'Product ID')}</TableCell>
                    <TableCell align="right">{t('admin.analytics.modal.timesOrdered', 'Times Ordered')}</TableCell>
                    <TableCell align="right">{t('admin.analytics.modal.totalQuantitySold', 'Total Quantity Sold')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(analyticsDetailData).map(([productName, stats]) => (
                    <TableRow hover key={productName}>
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
        <DialogActions>
          <Button onClick={handleCloseAnalyticsDetailModal}>{t('admin.buttons.close', 'Close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminOrdersSimple;
