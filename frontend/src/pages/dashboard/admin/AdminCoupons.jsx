import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useApi } from '../../../hooks/useApi';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expiryDate: '',
    maxUses: '',
  });  const api = useApi();
  const fetchCoupons = useCallback(async () => {
    try {
      const response = await api.get('/api/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async () => {
    try {
      await api.post('/api/coupons', newCoupon);
      setOpenDialog(false);
      fetchCoupons();
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        expiryDate: '',
        maxUses: '',
      });
    } catch (error) {
      console.error('Error creating coupon:', error);
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await api.delete(`/api/coupons/${id}`);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const columns = [
    { field: 'code', headerName: 'Code', width: 130 },
    { field: 'discountType', headerName: 'Type', width: 130 },
    { field: 'discountValue', headerName: 'Value', width: 130,
      valueFormatter: (params) => 
        params.row.discountType === 'percentage' ? `${params.value}%` : `$${params.value}` },
    { field: 'expiryDate', headerName: 'Expires', width: 130 },
    { field: 'usageCount', headerName: 'Uses', width: 100 },
    { field: 'maxUses', headerName: 'Max Uses', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      renderCell: (params) => (
        <Button
          color="error"
          size="small"
          onClick={() => handleDeleteCoupon(params.row.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Coupons Management</Typography>
        <Button variant="contained" onClick={() => setOpenDialog(true)}>
          Create New Coupon
        </Button>
      </Box>

      <DataGrid
        rows={coupons}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Coupon</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Coupon Code"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
            />
            <FormControl>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={newCoupon.discountType}
                label="Discount Type"
                onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Discount Value"
              type="number"
              value={newCoupon.discountValue}
              onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={newCoupon.expiryDate}
              onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Maximum Uses"
              type="number"
              value={newCoupon.maxUses}
              onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCoupon} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCoupons;
