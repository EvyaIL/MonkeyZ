import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import { apiService } from '../../../src/lib/apiService';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/VpnKey';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const KeyBulkManagement = ({ open, onClose, productId, productName, keyFormat }) => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.get(`/admin/products/${productId}/keys`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setKeys(response.data || []);
      
    } catch (err) {
      console.error('Error loading keys:', err);
      setError('Failed to load product keys');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (open && productId) {
      loadKeys();
    }
  }, [open, productId, loadKeys]);

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this key?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiService.delete(`/admin/products/${productId}/keys/${keyId}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh the key list
      await loadKeys();
      
    } catch (err) {
      console.error('Error deleting key:', err);
      setError('Failed to delete key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key.key)
      .then(() => {
        setCopiedKey(key.id);
        setTimeout(() => setCopiedKey(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy key:', err);
      });
  };

  // Filter keys based on search term
  const filteredKeys = keys.filter(key => 
    key.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (key.activatedBy && key.activatedBy.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <KeyIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Key Management: {productName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={2}>
          <TextField
            fullWidth
            placeholder="Search keys or users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            variant="outlined"
            size="small"
          />
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : keys.length === 0 ? (
          <Alert severity="info">
            No keys found for this product. Add keys to continue.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Activated By</TableCell>
                  <TableCell>Activation Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 'medium',
                        color: key.isActive ? 'success.main' : 'error.main'
                      }}
                    >
                      {key.key}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {key.isActive ? (
                          <>
                            <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                            Active
                          </>
                        ) : (
                          <>
                            <ErrorIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                            Used
                          </>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{key.activatedBy || '-'}</TableCell>
                    <TableCell>
                      {key.activationDate 
                        ? new Date(key.activationDate).toLocaleDateString() 
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyKey(key)}
                        color={copiedKey === key.id ? 'success' : 'default'}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteKey(key.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<KeyIcon />}
          onClick={onClose}
        >
          Add More Keys
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyBulkManagement;
