import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { apiService } from '../../../lib/apiService';
import { useNavigate } from 'react-router-dom';

export default function AdminOrderCreate() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  const [order, setOrder] = useState({
    customerName: '',
    email: '',
    phone: '',
    status: 'Pending',
    items: [{ productId: '', name: '', quantity: 1, price: 0 }],
    total: 0
  });

  // Load products for selection
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/admin/products');
        if (response.error) {
          throw new Error(response.error);
        }
        const fetchedProducts = response.data || [];
        console.log("[AdminOrderCreate] Fetched products from API:", fetchedProducts);
        
        const formattedProducts = fetchedProducts.map(p => ({
          id: String(p.id), // Ensure ID is a string
          name: typeof p.name === 'object' ? (p.name.en || p.name.he || 'Unnamed Product') : (p.name || 'Unnamed Product'),
          price: p.price !== undefined && p.price !== null ? p.price : 0, // Default price to 0 if null/undefined
          manages_cd_keys: p.manages_cd_keys 
        }));
        console.log("[AdminOrderCreate] Formatted products for dropdown:", formattedProducts);
        setProducts(formattedProducts);

      } catch (err) {
        console.error('[AdminOrderCreate] Error loading products:', err);
        setError('Failed to load products. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...order.items];
    
    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          // Use the processed name for display
          name: selectedProduct.name, 
          price: selectedProduct.price || 0
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    // Calculate new total
    const newTotal = calculateTotal(newItems);
    
    setOrder({
      ...order,
      items: newItems,
      total: newTotal
    });
  };

  const handleAddItem = () => {
    setOrder({
      ...order,
      items: [
        ...order.items,
        { productId: '', name: '', quantity: 1, price: 0 }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = order.items.filter((_, i) => i !== index);
    const newTotal = calculateTotal(newItems);
    
    setOrder({
      ...order,
      items: newItems,
      total: newTotal
    });
  };

  const handleInputChange = (field, value) => {
    setOrder({ ...order, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate order
      if (!order.customerName.trim()) {
        throw new Error('Customer name is required');
      }
      
      if (!order.email.trim() || !order.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      if (order.items.length === 0) {
        throw new Error('At least one item is required');
      }
      
      for (const item of order.items) {
        if (!item.name || !item.price || item.quantity < 1) {
          throw new Error('All items must have a name, price, and quantity');
        }
      }
      
      const response = await apiService.post('/admin/orders', order);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setSuccess('Order created successfully!');
      // Reset form after success
      setOrder({
        customerName: '',
        email: '',
        phone: '',
        status: 'Pending',
        items: [{ productId: '', name: '', quantity: 1, price: 0 }],
        total: 0
      });
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/dashboard/admin/orders');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Create New Order
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/admin/orders')}
        >
          Back to Orders
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Customer Name"
                value={order.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={order.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Phone"
                value={order.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Order Items
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth>
                            <InputLabel>Product</InputLabel>
                            <Select
                              labelId={`product-select-label-${index}`}
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              fullWidth
                              size="small"
                            >
                              <MenuItem value="" disabled>
                                -- Select Product --
                              </MenuItem>
                              {products.map((product, prodIndex) => {
                                // Log each product being mapped to a MenuItem
                                console.log(`[AdminOrderCreate] Rendering MenuItem ${prodIndex}:`, product);
                                return (
                                  <MenuItem key={product.id || `product-${prodIndex}`} value={product.id}>
                                    {`ID: ${product.id} | Name: ${product.name} | Price: ${product.price}`}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            placeholder="Custom name"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            InputProps={{ inputProps: { min: 1 } }}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          ₪{(item.quantity * item.price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                            disabled={order.items.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Item
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="h6">
                  Total: ₪{order.total.toFixed(2)}
                </Typography>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Order'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
