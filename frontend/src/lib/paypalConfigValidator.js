import axios from 'axios';

// PayPal environment configuration
export const PAYPAL_CONFIG = {
  development: {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
    mode: 'sandbox',
    currency: 'ILS',
    intent: 'capture'
  },
  production: {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
    mode: 'live',
    currency: 'ILS',
    intent: 'capture'
  }
};

// Get current PayPal configuration
export const getCurrentPayPalConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const config = PAYPAL_CONFIG[env];
  
  console.log(`🔄 PayPal Config for ${env}:`, {
    mode: config.mode,
    clientId: config.clientId ? `${config.clientId.substring(0, 10)}...` : 'NOT_SET',
    currency: config.currency
  });
  
  return config;
};

// Validate PayPal configuration
export const validatePayPalConfig = async () => {
  const config = getCurrentPayPalConfig();
  const validationResults = {
    clientIdPresent: !!config.clientId,
    clientIdValid: false,
    modeCorrect: false,
    apiConnectable: false,
    errors: []
  };

  try {
    // Check if client ID is present
    if (!config.clientId) {
      validationResults.errors.push('PayPal Client ID is missing');
      return validationResults;
    }

    // Validate client ID format
    if (config.clientId.length < 50) {
      validationResults.errors.push('PayPal Client ID appears to be invalid (too short)');
    } else {
      validationResults.clientIdValid = true;
    }

    // Check mode configuration
    const expectedMode = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';
    if (config.mode === expectedMode) {
      validationResults.modeCorrect = true;
    } else {
      validationResults.errors.push(`PayPal mode mismatch: expected ${expectedMode}, got ${config.mode}`);
    }

    // Test API connectivity (backend health check)
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il';
      const response = await axios.get(`${apiUrl}/api/paypal/health`, { timeout: 5000 });
      if (response.status === 200) {
        validationResults.apiConnectable = true;
      }
    } catch (error) {
      validationResults.errors.push('Cannot connect to PayPal API endpoint');
    }

  } catch (error) {
    validationResults.errors.push(`PayPal validation error: ${error.message}`);
  }

  return validationResults;
};

// PayPal readiness checker for production
export const checkPayPalProductionReadiness = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    return {
      ready: true,
      message: 'Development mode - PayPal sandbox configuration'
    };
  }

  const validation = await validatePayPalConfig();
  const errors = validation.errors;

  // Production-specific checks
  const config = getCurrentPayPalConfig();
  
  if (config.mode !== 'live') {
    errors.push('❌ CRITICAL: PayPal is not in LIVE mode for production');
  }
  
  if (config.clientId && config.clientId.includes('sandbox')) {
    errors.push('❌ CRITICAL: Using sandbox PayPal Client ID in production');
  }

  const ready = validation.clientIdPresent && 
                validation.clientIdValid && 
                validation.modeCorrect && 
                errors.length === 0;

  return {
    ready,
    errors,
    validation,
    message: ready ? 
      '✅ PayPal is configured correctly for production' : 
      '❌ PayPal configuration issues detected'
  };
};

// Live mode switcher (for development testing)
export const switchPayPalMode = (mode = 'live') => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Cannot switch PayPal mode in production');
    return false;
  }
  
  // This would typically require a backend configuration change
  console.log(`🔄 Switching PayPal to ${mode} mode`);
  return true;
};

export default {
  getCurrentPayPalConfig,
  validatePayPalConfig,
  checkPayPalProductionReadiness,
  switchPayPalMode
};
