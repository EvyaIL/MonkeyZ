import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  Alert,
  AlertTitle,
  InputAdornment,
  Divider,
  CircularProgress
} from '@mui/material';
import KeyIcon from '@mui/icons-material/VpnKey';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { apiService } from '../../lib/apiService';

const KeyDialog = ({ 
  open, 
  onClose, 
  product, 
  onSuccess, 
  t 
}) => {
  const [newKeys, setNewKeys] = useState('');
  const [keyCount, setKeyCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const parts = [];
    for (let i = 0; i < 5; i++) {
      let part = '';
      for (let j = 0; j < 5; j++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      parts.push(part);
    }
    return parts.join('-');
  };

  const generateKeys = () => {
    let keys = '';
    for (let i = 0; i < keyCount; i++) {
      keys += generateRandomKey() + '\n';
    }
    setNewKeys(keys.trim());
  };

  const handleClose = () => {
    setNewKeys('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleAddKeys = async () => {
    if (!product || !newKeys.trim()) return;

    try {
      setIsLoading(true);
      setError("");

      // Split keys by newlines and filter empty ones
      const keysList = newKeys
        .split('\n')
        .map(key => key.trim())
        .filter(key => key.length > 0);

      if (keysList.length === 0) {
        setError('Please enter at least one valid key');
        return;
      }

      // Validate key format (example: W269N-WFGWX-YVC9B-4J6C9-T83GX)
      const keyFormatRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
      const invalidKeys = keysList.filter(key => !keyFormatRegex.test(key));
      
      if (invalidKeys.length > 0) {
        setError(`Invalid key format detected. Keys should be in format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX\nFirst invalid key: ${invalidKeys[0]}`);
        return;
      }      // Added debugging to track request
      console.log(`Sending ${keysList.length} keys to backend for product ID: ${product.id}`);
      
      // First, validate that the product exists by checking with the backend
      try {
        const productCheck = await apiService.get(`/admin/products`);
        if (productCheck.error) {
          throw new Error('Unable to verify product existence. Backend may be unavailable.');
        }
        
        const productExists = productCheck.data && productCheck.data.some(p => p.id === product.id);
        if (!productExists) {
          throw new Error(`Product with ID ${product.id} not found in database. Please refresh the page to sync with the latest data.`);
        }
      } catch (validationError) {
        console.warn('Product validation failed:', validationError);
        // Continue with the request anyway, let the backend handle the error
      }
        // Ensure we're sending the correct product ID and keys format
      console.log(`Sending keys to: /admin/products/${product.id}/keys`);
      const response = await apiService.post(`/admin/products/${product.id}/keys`, {
        keys: keysList
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      setSuccess(true);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 2000);
        } catch (error) {
      console.error('Error adding keys:', error);
      
      // Handle specific error cases
      let errorMessage = error.message || 'Failed to add keys';
      
      if (error.message && error.message.includes('not found')) {
        errorMessage = `Product not found in database. This might be a synchronization issue. Please refresh the page and try again.`;
        
        // Clear any cached data to force refresh
        localStorage.removeItem('adminStockData');
        localStorage.removeItem('adminStockDataTimestamp');
        localStorage.removeItem('adminProducts');
        localStorage.removeItem('adminProductsTimestamp');
        
        // Suggest refresh to parent component
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(); // This will trigger a refresh in the parent component
          }, 3000);
        }
      } else if (error.message && error.message.includes('404')) {
        errorMessage = `The backend service is not responding properly. Please check if the server is running and refresh the page.`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <KeyIcon className="mr-2 text-accent" />
            <span>{t('admin.addKeysTo')} {product?.name?.en || product?.name}</span>
          </div>
          <IconButton 
            onClick={handleClose}
            size="small"
            className="text-gray-500 hover:text-gray-700"
          >
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1" className="font-medium mb-2">
            {t('admin.enterKeysInstructions')}
          </Typography>
          <Divider className="mb-3" />
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={newKeys}
              onChange={(e) => setNewKeys(e.target.value)}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              variant="outlined"
              className="bg-gray-50 dark:bg-gray-800"
              helperText="One key per line in the format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
            />
          </Box>
          
          <Box className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 mb-3">
            <Typography variant="subtitle1" className="font-medium mb-2 flex items-center">
              <AutoAwesomeIcon className="mr-1 text-yellow-500" />
              {t('admin.orGenerateRandomKeys')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                type="number"
                label={t('admin.numberOfKeys')}
                value={keyCount}
                onChange={(e) => setKeyCount(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ 
                  inputProps: { min: 1 },
                  startAdornment: <InputAdornment position="start">#</InputAdornment>,
                }}
                size="small"
                sx={{ width: 150, mr: 2 }}
              />
              <Button 
                variant="contained"
                onClick={generateKeys}
                startIcon={<KeyIcon />}
                color="secondary"
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {t('admin.generateKeys')}
              </Button>
            </Box>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} variant="filled">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} variant="filled">
              <AlertTitle>Success</AlertTitle>
              Keys have been added successfully!
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions className="bg-gray-50 dark:bg-gray-800 p-3">
        <Button 
          onClick={handleClose}
          variant="outlined"
          startIcon={<CancelIcon />}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          variant="contained"
          color="primary"
          onClick={handleAddKeys}
          disabled={isLoading || !newKeys.trim() || success}
          className="bg-accent hover:bg-accent/80"
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {isLoading ? t('common.saving') : t('admin.saveKeys')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyDialog;
