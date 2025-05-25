import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Card, 
  CardContent, 
  Alert, 
  Button,
  Grid
} from '@mui/material';
import KeyIcon from '@mui/icons-material/VpnKey';

const KeyManagementSection = () => {
  const [stats, setStats] = useState({
    totalKeys: 0,
    usedKeys: 0,
    availableKeys: 0,
    lowStockProducts: []
  });
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // In a real implementation, this would fetch key statistics from your backend
    setStats({
      totalKeys: 1245,
      usedKeys: 875,
      availableKeys: 370,
      lowStockProducts: [
        { id: '1', name: 'Windows 10 Pro', availableKeys: 5, minStockAlert: 10 },
        { id: '2', name: 'Office 365', availableKeys: 3, minStockAlert: 15 }
      ]
    });
  }, []);

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <KeyIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Key Management Overview</Typography>
        </Box>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Keys
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {stats.totalKeys.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Used Keys
                    </Typography>
                    <Typography variant="h4" color="secondary">
                      {stats.usedKeys.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Available Keys
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.availableKeys.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {stats.lowStockProducts.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  Low stock alert for {stats.lowStockProducts.length} product(s)
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                  {stats.lowStockProducts.map(product => (
                    <li key={product.id}>
                      {product.name}: {product.availableKeys} keys available (minimum: {product.minStockAlert})
                    </li>
                  ))}
                </Box>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default KeyManagementSection;
