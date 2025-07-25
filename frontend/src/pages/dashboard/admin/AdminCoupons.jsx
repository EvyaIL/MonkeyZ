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

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expiryDate: '',
    maxUses: '',
    maxUsagePerUser: '', // NEW FIELD
  });
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [selectedCouponAnalytics, setSelectedCouponAnalytics] = useState(null);
  // Fix: Add missing state for analytics loading and error
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  // State for loading and error feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const api = useApi();  const fetchCoupons = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/coupons');
      
      if (response.error) {
        console.error('API error:', response.error);
        setError(`Error loading coupons: ${response.error}`);
        setCoupons([]);
        return;
      }
      
      const couponsData = response.data?.coupons || response.data || [];
      if (!Array.isArray(couponsData)) {
        console.warn('Expected array of coupons but got:', typeof couponsData);
        setCoupons([]);
        return;
      }
      
      const formattedCoupons = couponsData.map(coupon => ({
        id: coupon.id || coupon._id,
        code: coupon.code,
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountType === 'fixed' ? coupon.discountValue : (coupon.discountPercent || 0),
        expiryDate: coupon.expiresAt || coupon.expiryDate,
        maxUses: coupon.maxUses || null,
        maxUsagePerUser: coupon.maxUsagePerUser ?? 0,
        usageCount: coupon.usageCount || 0,
        createdAt: coupon.createdAt,
        active: coupon.active !== undefined ? coupon.active : true
      }));
      
      setCoupons(formattedCoupons);    } catch (error) {      console.error('Error fetching coupons:', error);
      setError(`Failed to load coupons: ${error.message || 'Unknown error'}`);
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: apiService and isLoading are intentionally excluded to avoid infinite re-renders

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);
  
  const handleSaveCoupon = async () => {
    if (!newCoupon.code) {
      setSubmitError('Coupon code is required');
      return;
    }
    if (!newCoupon.discountValue || isNaN(parseFloat(newCoupon.discountValue))) {
      setSubmitError('Valid discount value is required');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // Robust integer-only handling for maxUsagePerUser and maxUses
      let maxUsagePerUser = 0;
      if (
        newCoupon.maxUsagePerUser !== undefined &&
        newCoupon.maxUsagePerUser !== null &&
        String(newCoupon.maxUsagePerUser).trim() !== ''
      ) {
        const parsed = parseInt(newCoupon.maxUsagePerUser, 10);
        maxUsagePerUser = isNaN(parsed) || parsed < 1 ? 0 : parsed;
      }

      let maxUses = 0;
      if (
        newCoupon.maxUses !== undefined &&
        newCoupon.maxUses !== null &&
        String(newCoupon.maxUses).trim() !== ''
      ) {
        const parsed = parseInt(newCoupon.maxUses, 10);
        maxUses = isNaN(parsed) || parsed < 1 ? 0 : parsed;
      }

      // Patch: Always send maxUsagePerUser as a number if valid
      const backendCoupon = {
        code: newCoupon.code.trim(),
        discountType: newCoupon.discountType,
        discountValue: parseFloat(newCoupon.discountValue),
        active: true,
        expiresAt: newCoupon.expiryDate ? new Date(newCoupon.expiryDate).toISOString() : null,
        maxUses,
        maxUsagePerUser: maxUsagePerUser,
      };
      console.log('[DEBUG] Sending coupon payload:', backendCoupon);

      const result = newCoupon.id
        ? await api.patch(`/admin/coupons/${newCoupon.id}`, backendCoupon)
        : await api.post('/admin/coupons', backendCoupon);

      if (result.error) {
        setSubmitError(result.error);
      } else {
        setOpenDialog(false);
        setNewCoupon({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          expiryDate: '',
          maxUses: '',
          maxUsagePerUser: '', // NEW FIELD RESET
        });

        setError('Coupon created successfully!');
        await fetchCoupons();
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      setSubmitError('Failed to save coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await api.delete(`/admin/coupons/${id}`);
      if (result.error) {
        setError(result.error);
      } else {
        setError('Coupon deleted successfully!');
        await fetchCoupons();
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setError('Failed to delete coupon: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine if a coupon is invalid for any reason
  const isCouponInvalid = (coupon) => {
    // Expiry check
    const expired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
    // Max total usage check
    const maxUses = coupon.maxUses ?? 0;
    const usageCount = coupon.usageCount ?? 0;
    const maxUsesExceeded = maxUses > 0 && usageCount >= maxUses;
    // Max per user check (only analytics dialog shows per-user, so just flag if maxUsagePerUser is set)
    // For admin table, we can't know per-user, so just show if maxUsagePerUser is set and is 0 (unlimited) or > 0
    // If you want to show per-user, you need to fetch analytics for each row, which is expensive
    return expired || maxUsesExceeded;
  };

  const columns = [
    {
      field: 'analytics',
      headerName: 'Analytics',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          title="View detailed analytics for this coupon"
          onClick={async () => {
            setAnalyticsDialogOpen(true);
            setSelectedCouponAnalytics(null);
            setAnalyticsLoading(true);
            setAnalyticsError(null);
            try {
              // Fetch analytics from backend
              const res = await api.get(`/admin/coupons/${params.row.code}/analytics`);
              if (res.error) {
                setAnalyticsError(res.error);
                setSelectedCouponAnalytics(null);
              } else {
                setSelectedCouponAnalytics({
                  ...params.row,
                  ...res.data,
                  usageAnalytics: res.data.usageAnalytics || res.data.usage_analytics || {},
                  userUsages: res.data.userUsages || res.data.user_usages || {},
                });
              }
            } catch (err) {
              setAnalyticsError('Failed to load analytics');
              setSelectedCouponAnalytics(null);
            } finally {
              setAnalyticsLoading(false);
            }
          }}
        >
          Analytics
        </Button>
      )
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'primary.contrastText', px: 1, py: 0.5, borderRadius: 1 }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'discountType',
      headerName: 'Type',
      width: 100,
      valueFormatter: (params) => params.value === 'percentage' ? 'Percentage' : 'Fixed',
    },
    {
      field: 'discountValue',
      headerName: 'Value',
      width: 80,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return (
          <Box sx={{ fontWeight: 'medium', color: params.row.discountType === 'percentage' ? 'success.main' : 'info.main' }}>
            {params.row.discountType === 'percentage' ? `${value}%` : `$${value.toFixed(2)}`}
          </Box>
        );
      }
    },
    {
      field: 'maxUses',
      headerName: 'Max Uses',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params) => {
        // Only show ∞ if value is 0 or null, never for undefined or non-numeric
        if (typeof params.value === 'number' && params.value > 0) return params.value;
        if (params.value === 0 || params.value === null || params.value === undefined || isNaN(params.value)) return '—';
        return params.value;
      },
      renderCell: (params) => {
        // Only show ∞ if value is 0, otherwise show the number
        if (typeof params.value === 'number' && params.value > 0) return <Box>{params.value}</Box>;
        return <Box>{params.value === 0 ? <span style={{ fontSize: '1.2rem' }}>∞</span> : (params.value ?? '—')}</Box>;
      }
    },
    {
      field: 'maxUsagePerUser',
      headerName: 'Max/User',
      width: 80,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params) => {
        // Show the number if it's a valid positive integer, otherwise show ∞
        const v = params.value;
        if (v === null || v === undefined || v === '' || v === false) return '∞';
        const parsed = typeof v === 'number' ? v : parseInt(v, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
        return '∞';
      },
      renderCell: (params) => {
        const v = params.value;
        const parsed = typeof v === 'number' ? v : parseInt(v, 10);
        if (!isNaN(parsed) && parsed > 0) return <Box>{parsed}</Box>;
        return <Box><span style={{ fontSize: '1.2rem' }}>∞</span></Box>;
      }
    },
    {
      field: 'usageCount',
      headerName: 'Used',
      width: 60,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params) => params.value || '0',
    },
    {
      field: 'expiryDate',
      headerName: 'Expires',
      width: 110,
      valueFormatter: (params) => {
        if (!params.value) return 'Never';
        const date = new Date(params.value);
        const isExpired = date < new Date();
        return isExpired ? `Expired ${date.toLocaleDateString()}` : date.toLocaleDateString();
      },
      renderCell: (params) => {
        if (!params.value) return <span>Never</span>;
        const date = new Date(params.value);
        const isExpired = date < new Date();
        return (
          <Box sx={{ color: isExpired ? 'error.main' : 'text.primary', fontStyle: isExpired ? 'italic' : 'normal' }}>
            {isExpired ? `Expired ${date.toLocaleDateString()}` : date.toLocaleDateString()}
          </Box>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 110,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button
            color="error"
            variant="outlined"
            size="small"
            sx={{ minWidth: '30px', p: '4px' }}
            title="Delete this coupon"
            onClick={() => handleDeleteCoupon(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  const refreshCoupons = async () => {
    setIsLoading(true);
    try {
      await fetchCoupons();
    } catch (err) {
      setError('Failed to load coupons. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ height: 600, width: '100%', p: 3 }}>
      {error && (
        <Box 
          sx={{ 
            mb: 3, 
            p: 2, 
            borderRadius: 1,
            bgcolor: error.includes('successfully') ? 'success.light' : 'error.light',
            color: error.includes('successfully') ? 'success.dark' : 'error.dark',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography>{error}</Typography>
          <Button 
            size="small" 
            sx={{ minWidth: '30px', color: 'inherit' }} 
            onClick={() => setError('')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Coupons Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={refreshCoupons} 
            startIcon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            }
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setNewCoupon({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                expiryDate: '',
                maxUses: '',
                maxUsagePerUser: '', // NEW FIELD RESET
              });
              setOpenDialog(true);
            }}
            disabled={isLoading}
            startIcon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Create New Coupon
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        height: 'calc(100vh - 200px)',
        width: '100%', 
        '& .MuiDataGrid-root': {
          border: 'none',
          borderRadius: 2,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          backgroundColor: 'background.paper',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #f0f0f0',
          color: 'text.primary', // Ensure cell text uses theme color
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'primary.main',
          color: 'text.primary', // Changed from #fff to theme-aware color
          borderBottom: 'none',
        },
        '& .MuiDataGrid-virtualScroller': {
          backgroundColor: 'background.paper', // Use theme background
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: 'none',
          backgroundColor: 'background.default', // Use theme background
        },
        '& .MuiDataGrid-toolbarContainer .MuiButton-text': {
          color: 'primary.main',
        },
        '& .active-row': {
          backgroundColor: 'rgba(0, 128, 0, 0.1)',
        },
        '& .expired-row': {
          backgroundColor: 'rgba(255, 0, 0, 0.05)',
          color: 'text.secondary',
          textDecoration: 'line-through',
        },
      }}>
        <DataGrid
          rows={coupons || []}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 }
            },
            sorting: {
              sortModel: [{ field: 'createdAt', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          loading={isLoading}
          getRowClassName={(params) => {
            // Red if expired or max usages reached
            if (isCouponInvalid(params.row)) return 'expired-row';
            return '';
          }}
        />
      </Box>
      
      <Dialog 
        open={openDialog} 
        onClose={() => {
          if (!isSubmitting) {
            setOpenDialog(false);
            setSubmitError('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          Create New Coupon
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {submitError && (
            <Box sx={{ 
              bgcolor: 'error.light', 
              color: 'error.dark', 
              p: 2, 
              borderRadius: 1, 
              mb: 2 
            }}>
              {submitError}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Coupon Code"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
              required
              error={Boolean(submitError && !newCoupon.code)}
              helperText={submitError && !newCoupon.code ? "Code is required" : ""}
              disabled={isSubmitting}
            />
            <FormControl required>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={newCoupon.discountType}
                label="Discount Type *"
                onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                disabled={isSubmitting}
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Discount Value"
              type="number"
              value={newCoupon.discountValue}
              onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
              required
              error={Boolean(submitError && (!newCoupon.discountValue || isNaN(parseFloat(newCoupon.discountValue))))}              helperText={
                submitError && (!newCoupon.discountValue || isNaN(parseFloat(newCoupon.discountValue))) 
                  ? "Valid value is required"
                  : newCoupon.discountType === 'fixed' 
                    ? "Enter amount in dollars" 
                    : "Enter percentage value (1-100)"
              }
              disabled={isSubmitting}
              InputProps={{
                endAdornment: newCoupon.discountType === 'percentage' ? '%' : '$',
                inputProps: {
                  min: 0,
                  max: newCoupon.discountType === 'percentage' ? 100 : undefined,
                  step: newCoupon.discountType === 'percentage' ? 1 : 0.01,
                },
              }}
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={newCoupon.expiryDate}
              onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={isSubmitting}
            />
            <TextField
              label="Maximum Uses"
              type="number"
              value={newCoupon.maxUses}
              onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}              helperText="Leave empty for unlimited uses"
              disabled={isSubmitting}
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
            <TextField
              label="Max Uses Per User (by email)"
              type="number"
              value={newCoupon.maxUsagePerUser}
              onChange={(e) => {
                // Only allow positive integers or empty
                const val = e.target.value;
                if (val === '' || (/^\d+$/.test(val) && parseInt(val, 10) > 0)) {
                  setNewCoupon({ ...newCoupon, maxUsagePerUser: val });
                }
              }}
              helperText="Leave empty for unlimited per-user uses"
              disabled={isSubmitting}
              InputProps={{ inputProps: { min: 1, step: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => {
              if (!isSubmitting) {
                setOpenDialog(false);
                setSubmitError('');
              }
            }}
            sx={{ color: 'text.secondary' }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCoupon}
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
            type="submit"
          >            {isSubmitting ? 'Creating...' : 'Create Coupon'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onClose={() => setAnalyticsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Coupon Analytics</DialogTitle>
        <DialogContent>
          {analyticsLoading ? (
            <Box sx={{ p: 2 }}><Typography>Loading analytics...</Typography></Box>
          ) : analyticsError ? (
            <Box sx={{ p: 2, color: 'error.main' }}><Typography>{analyticsError}</Typography></Box>
          ) : selectedCouponAnalytics ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}><strong>Code:</strong> {selectedCouponAnalytics.code}</Typography>
              <Typography variant="body2"><strong>Type:</strong> {selectedCouponAnalytics.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</Typography>
              <Typography variant="body2"><strong>Value:</strong> {selectedCouponAnalytics.discountType === 'percentage' ? `${selectedCouponAnalytics.discountValue}%` : `$${selectedCouponAnalytics.discountValue}`}</Typography>
              <Typography variant="body2"><strong>Expires:</strong> {selectedCouponAnalytics.expiryDate ? new Date(selectedCouponAnalytics.expiryDate).toLocaleDateString() : 'Never expires'}</Typography>
              <Typography variant="body2"><strong>Uses:</strong> {selectedCouponAnalytics.usageCount || 0}</Typography>
              <Typography variant="body2"><strong>Max Uses:</strong> {selectedCouponAnalytics.maxUses || '∞'}</Typography>
              <Typography variant="body2"><strong>Max Uses Per User:</strong> {selectedCouponAnalytics.maxUsagePerUser || '∞'}</Typography>
              <Typography variant="body2"><strong>Created:</strong> {selectedCouponAnalytics.createdAt ? new Date(selectedCouponAnalytics.createdAt).toLocaleDateString() : '-'}</Typography>
              {/* Usage Analytics */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Usage Analytics</Typography>
                <Typography variant="body2">
                  Total: {(() => {
                    const ua = selectedCouponAnalytics.usageAnalytics || {};
                    const completed = Number(ua.completed ?? 0);
                    const cancelled = Number(ua.cancelled ?? 0);
                    const pending = Number(ua.pending ?? 0);
                    const processing = Number(ua.processing ?? 0);
                    const awaitingStock = Number(ua.awaitingStock ?? ua.awaitaining_stock ?? 0);
                    return completed + cancelled + pending + processing + awaitingStock;
                  })()}
                </Typography>
                <Typography variant="body2">Completed: {selectedCouponAnalytics.usageAnalytics?.completed ?? 0}</Typography>
                <Typography variant="body2">Cancelled: {selectedCouponAnalytics.usageAnalytics?.cancelled ?? 0}</Typography>
                <Typography variant="body2">Pending: {selectedCouponAnalytics.usageAnalytics?.pending ?? 0}</Typography>
                <Typography variant="body2">Processing: {selectedCouponAnalytics.usageAnalytics?.processing ?? 0}</Typography>
                <Typography variant="body2">Awaiting Stock: {selectedCouponAnalytics.usageAnalytics?.awaitingStock ?? 0}</Typography>
              </Box>
              {/* Per-User Usage */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Per-User Usage</Typography>
                <Typography variant="body2"><strong>Unique Users:</strong> {selectedCouponAnalytics.unique_users ?? (selectedCouponAnalytics.userUsages ? Object.keys(selectedCouponAnalytics.userUsages).length : 0)}</Typography>
                <Typography variant="body2"><strong>Max Uses Per User:</strong> {selectedCouponAnalytics.maxUsagePerUser || '∞'}</Typography>
                {selectedCouponAnalytics.userUsages && Object.keys(selectedCouponAnalytics.userUsages).length > 0 ? (
                  <Box sx={{ mt: 1 }}>
                    {Object.entries(selectedCouponAnalytics.userUsages).map(([email, count]) => (
                      <Typography key={email} variant="body2">{email}: {count}</Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">No users have used this coupon yet.</Typography>
                )}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialogOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCoupons;
