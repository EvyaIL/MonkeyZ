import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../lib/apiService';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import { validateKeyFormat, parseKeysFromText } from '../../lib/keyManagement';

interface IKeyBulkManagementProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  keyFormat?: string;
}

interface IKeyDetails {
  value: string;
  status: string;
  issuedAt?: string;
  expiresAt?: string;
  usedAt?: string;
  usedBy?: string;
}

interface IKeyValidationResult {
  valid: boolean;
  key: string;
  error?: string;
}

export default function KeyBulkManagement({ open, onClose, productId, productName, keyFormat = 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX' }: IKeyBulkManagementProps): JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [keys, setKeys] = useState('');
  const [existingKeys, setExistingKeys] = useState<IKeyDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState<IKeyValidationResult[]>([]);
  const [success, setSuccess] = useState('');
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);

  const loadExistingKeys = useCallback(async () => {
    try {
      setIsLoadingKeys(true);
      setError('');
      const response = await apiService.get(`/admin/products/${productId}/keys`);
      if (response.error) {
        throw new Error(response.error);
      }
      setExistingKeys(response.data || []);
    } catch (err) {
      console.error('Error loading keys:', err);
      setError(t('admin.errorLoadingKeys'));
    } finally {
      setIsLoadingKeys(false);
    }
  }, [productId, t]);

  useEffect(() => {
    if (open && activeTab === 1) {
      loadExistingKeys();
    }
  }, [open, activeTab, loadExistingKeys]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const validateKeys = useCallback((inputKeys: string): IKeyValidationResult[] => {
    const keysToValidate = parseKeysFromText(inputKeys);
    return keysToValidate.map(key => {
      const trimmedKey = key.trim();
      const isValid = validateKeyFormat(trimmedKey, keyFormat);
      return {
        valid: isValid,
        key: trimmedKey,
        error: isValid ? undefined : t('admin.invalidKeyFormat')
      };
    });
  }, [keyFormat, t]);

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      // Validate keys
      const results = validateKeys(keys);
      setValidationResults(results);

      const invalidKeys = results.filter(r => !r.valid);
      if (invalidKeys.length > 0) {
        throw new Error(t('admin.someKeysInvalid'));
      }

      // Import valid keys
      const validKeys = results.map(r => r.key);
      const response = await apiService.post(`/admin/products/${productId}/keys`, {
        keys: validKeys,
        format: keyFormat
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess(t('admin.keysImportedSuccess', { count: validKeys.length }));
      setKeys('');
      if (activeTab === 1) {
        loadExistingKeys();
      }
    } catch (err: unknown) {
      console.error('Error importing keys:', err);
      setError(err instanceof Error ? err.message : t('admin.importError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await apiService.get(`/admin/products/${productId}/keys/export`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Create a CSV file
      const csvContent = [
        'Key,Status,Issued At,Expires At,Used At,Used By',
        ...response.data.map((key: IKeyDetails) => 
          `${key.value},${key.status},${key.issuedAt || ''},${key.expiresAt || ''},${key.usedAt || ''},${key.usedBy || ''}`
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `keys-${productName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      console.error('Error exporting keys:', err);
      setError(err instanceof Error ? err.message : t('admin.exportError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {t('admin.keyManagement')} - {productName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={t('admin.importKeys')} />
            <Tab label={t('admin.keyInventory')} />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {activeTab === 0 && (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={keys}
              onChange={(e) => setKeys(e.target.value)}
              placeholder={t('admin.keyImportPlaceholder')}
              disabled={isLoading}
              helperText={`${t('admin.expectedFormat')}: ${keyFormat}`}
            />
            
            {validationResults.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('admin.keyValue')}</TableCell>
                      <TableCell>{t('admin.status')}</TableCell>
                      <TableCell>{t('admin.message')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationResults.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{result.key}</TableCell>
                        <TableCell>
                          {result.valid ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>{result.error || t('admin.valid')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadExistingKeys}
                disabled={isLoadingKeys}
              >
                {t('admin.refresh')}
              </Button>
              <Button
                startIcon={<CloudDownloadIcon />}
                onClick={handleExport}
                disabled={isLoading || existingKeys.length === 0}
              >
                {t('admin.exportKeys')}
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.keyValue')}</TableCell>
                    <TableCell>{t('admin.status')}</TableCell>
                    <TableCell>{t('admin.issuedAt')}</TableCell>
                    <TableCell>{t('admin.expiresAt')}</TableCell>
                    <TableCell>{t('admin.usedAt')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingKeys ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : existingKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {t('admin.noKeysFound')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    existingKeys.map((key, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{key.value}</TableCell>
                        <TableCell>{key.status}</TableCell>
                        <TableCell>{key.issuedAt ? new Date(key.issuedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{key.usedAt ? new Date(key.usedAt).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('common.close')}
        </Button>
        {activeTab === 0 && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={isLoading || !keys.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {isLoading ? t('common.importing') : t('admin.importKeys')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
