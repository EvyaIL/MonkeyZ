import React, { useState, useCallback } from 'react';
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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../lib/apiService';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface IKeyBulkManagementProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  keyFormat?: string;
}

interface IKeyValidationResult {
  valid: boolean;
  key: string;
  error?: string;
}

export default function KeyBulkManagement({ open, onClose, productId, productName, keyFormat }: IKeyBulkManagementProps): JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [keys, setKeys] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState<IKeyValidationResult[]>([]);
  const [success, setSuccess] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const validateKeys = useCallback((inputKeys: string): IKeyValidationResult[] => {
    const lines = inputKeys.split('\\n').filter(line => line.trim());
    return lines.map(key => {
      const trimmedKey = key.trim();
      if (!keyFormat) {
        return { valid: true, key: trimmedKey };
      }

      // Basic format validation - can be extended based on requirements
      const formatRegex = new RegExp(keyFormat.replace(/X/g, '[A-Z0-9]'));
      return {
        valid: formatRegex.test(trimmedKey),
        key: trimmedKey,
        error: formatRegex.test(trimmedKey) ? undefined : 'Invalid format'
      };
    });
  }, [keyFormat]);

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const results = validateKeys(keys);
      setValidationResults(results);

      if (results.some(r => !r.valid)) {
        setError('Some keys are invalid. Please check the validation results.');
        return;
      }      const validKeys = results.map(r => r.key);
      const response = await apiService.post(`/admin/products/${productId}/keys`, {
        keys: validKeys
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess(`Successfully imported ${validKeys.length} keys`);
      setKeys('');    } catch (err: unknown) {
      console.error('Error importing keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to import keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);      setError('');

      const response = await apiService.get(`/admin/products/${productId}/keys`);
      
      if (response.error) {
        throw new Error(response.error);
      }      // Create a CSV file
      const csvContent = [
        'Key,Status,Issued At,Expires At,Used At,Used By',
        ...response.data.map((key: any) => 
          `${key.value},${key.status},${key.issuedAt || ''},${key.expiresAt || ''},${key.usedAt || ''},${key.usedBy || ''}`
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';      a.href = url;
      a.download = `keys-${productName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);    } catch (err: unknown) {
      console.error('Error exporting keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to export keys');
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
            />
            
            {validationResults.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Message</TableCell>
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
                        <TableCell>{result.error || 'Valid'}</TableCell>
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
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                startIcon={<CloudDownloadIcon />}
                onClick={handleExport}
                disabled={isLoading}
              >
                {t('admin.exportKeys')}
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Issued</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Key inventory will be loaded here */}
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
