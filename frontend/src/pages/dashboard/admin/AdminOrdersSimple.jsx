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
  InputLabel
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material'; // Added icons
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
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null); // For a details modal
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // State for products (needed for OrderForm)
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);


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
      const response = await apiService.get('/admin/orders');
      if (response.data) {
        setOrders(response.data);
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

  const handleOrderSubmit = async (orderData) => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      if (editingOrder?.id || editingOrder?._id) {
        await apiService.patch(`/admin/orders/${editingOrder.id || editingOrder._id}`, orderData);
        notify({ message: t('admin.orders.updatedSuccess', 'Order updated successfully!'), type: 'success' });
      } else {
        const payload = { ...orderData };
        if (payload.user_id === '') delete payload.user_id;
        await apiService.post('/admin/orders', payload);
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
      await apiService.put(`/admin/orders/${orderId}/status`, payload);
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
          disabled={loadingProducts} // Disable if products are still loading for the form
        >
          {t('admin.orders.createNew', 'Create New Order')}
        </Button>
      </Box>

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
            <MenuItem value="Shipped">{t('admin.statusShipped', 'Shipped')}</MenuItem>
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
                <TableCell>{t('admin.orderTotal', 'Total')}</TableCell>
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
                  <TableCell>₪{order.total?.toFixed(2)}</TableCell>
                  <TableCell>
                     <span style={{
                        padding: '0.25em 0.5em',
                        borderRadius: '0.25rem',
                        color: 'white',
                        backgroundColor: 
                          order.status === 'Completed' ? 'green' :
                          order.status === 'Pending' ? 'orange' :
                          order.status === 'Processing' ? 'blue' :
                          order.status === 'Shipped' ? '#17a2b8' : // Bootstrap info color
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Basic Order Details Modal (Example) */}
      {selectedOrderDetails && (
        <Box 
          sx={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', zIndex: 1300 
          }}
          onClick={() => setSelectedOrderDetails(null)} // Close on backdrop click
        >
          <Paper sx={{ p: 3, width: '90%', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
            <Typography variant="h5" gutterBottom>{t('admin.orderDetailsTitle', 'Order Details')} - {selectedOrderDetails.id || selectedOrderDetails._id}</Typography>
            <Typography><strong>{t('admin.orderCustomer', 'Customer')}:</strong> {selectedOrderDetails.customerName} ({selectedOrderDetails.email})</Typography>
            <Typography><strong>{t('admin.orderPhone', 'Phone')}:</strong> {selectedOrderDetails.phone || 'N/A'}</Typography>
            <Typography><strong>{t('admin.orderDate', 'Date')}:</strong> {new Date(selectedOrderDetails.date || selectedOrderDetails.createdAt).toLocaleString()}</Typography>
            <Typography><strong>{t('admin.orderTotal', 'Total')}:</strong> ₪{selectedOrderDetails.total?.toFixed(2)}</Typography>
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
                  <MenuItem value="Shipped">{t('admin.statusShipped', 'Shipped')}</MenuItem>
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
    </Box>
  );
}

export default AdminOrdersSimple;
