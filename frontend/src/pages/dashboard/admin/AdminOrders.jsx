import React, { useEffect, useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, CircularProgress } from '@mui/material';
import { useApi } from '../../../hooks/useApi';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders');
      // Ensure we have an array, even if empty
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}`, { status: newStatus });
      await fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const columns = useMemo(() => [
    { field: 'id', headerName: 'Order ID', width: 130 },
    { field: 'customerName', headerName: 'Customer', width: 180 },
    { field: 'date', headerName: 'Date', width: 130 },
    { field: 'total', headerName: 'Total', width: 100,
      valueFormatter: (params) => `$${params.value?.toFixed(2) || '0.00'}` },
    { field: 'status', headerName: 'Status', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => {
              setSelectedOrder(params.row);
              setOpenDialog(true);
            }}
          >
            View Details
          </Button>
        </Box>
      ),
    },
  ], []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 600, width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Orders Management
      </Typography>
      
      <DataGrid
        rows={orders}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        checkboxSelection
        disableSelectionOnClick
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ p: 2 }}>
              <Typography><strong>Order ID:</strong> {selectedOrder.id}</Typography>
              <Typography><strong>Customer:</strong> {selectedOrder.customerName}</Typography>
              <Typography><strong>Date:</strong> {selectedOrder.date}</Typography>
              <Typography><strong>Status:</strong> {selectedOrder.status}</Typography>
              <Typography><strong>Total:</strong> ${selectedOrder.total?.toFixed(2) || '0.00'}</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminOrders;
