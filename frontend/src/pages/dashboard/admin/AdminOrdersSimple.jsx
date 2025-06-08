import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';

function AdminOrdersSimple() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now
      const mockOrders = [
        {
          id: '1',
          customerName: 'John Doe',
          email: 'john@example.com',
          total: 49.99,
          status: 'completed',
          date: new Date().toISOString(),
          items: [{ name: 'Test Product', quantity: 1, price: 49.99 }]
        }
      ];
      
      setOrders(mockOrders);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Orders
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Orders ({orders.length})
        </Typography>
        
        {orders.length === 0 ? (
          <Typography>No orders found</Typography>
        ) : (
          <Box>
            {orders.map((order) => (
              <Box key={order.id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                <Typography><strong>Order #{order.id}</strong></Typography>
                <Typography>Customer: {order.customerName}</Typography>
                <Typography>Email: {order.email}</Typography>
                <Typography>Total: ${order.total}</Typography>
                <Typography>Status: {order.status}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default AdminOrdersSimple;
