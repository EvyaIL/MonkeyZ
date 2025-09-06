import React, { useState, useEffect } from 'react';
import { checkPayPalProductionReadiness } from '../../lib/paypalConfigValidator';
import { performanceMonitor } from '../../lib/monitoring';

const ProductionReadinessChecker = () => {
  const [checks, setChecks] = useState({
    paypal: { status: 'checking', message: '', details: null },
    environment: { status: 'checking', message: '', details: null },
    security: { status: 'checking', message: '', details: null },
    monitoring: { status: 'checking', message: '', details: null }
  });
  
  const [overallStatus, setOverallStatus] = useState('checking');

  useEffect(() => {
    runAllChecks();
  }, []);

  const runAllChecks = async () => {
    setOverallStatus('checking');
    
    // Check PayPal configuration
    try {
      const paypalCheck = await checkPayPalProductionReadiness();
      setChecks(prev => ({
        ...prev,
        paypal: {
          status: paypalCheck.ready ? 'success' : 'error',
          message: paypalCheck.message,
          details: paypalCheck
        }
      }));
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        paypal: {
          status: 'error',
          message: 'PayPal check failed',
          details: { error: error.message }
        }
      }));
    }

    // Check environment configuration
    const envCheck = checkEnvironmentConfig();
    setChecks(prev => ({
      ...prev,
      environment: envCheck
    }));

    // Check security configuration
    const securityCheck = checkSecurityConfig();
    setChecks(prev => ({
      ...prev,
      security: securityCheck
    }));

    // Check monitoring setup
    const monitoringCheck = checkMonitoringConfig();
    setChecks(prev => ({
      ...prev,
      monitoring: monitoringCheck
    }));

    // Calculate overall status
    setTimeout(() => {
      calculateOverallStatus();
    }, 1000);
  };

  const checkEnvironmentConfig = () => {
    const errors = [];
    const warnings = [];
    
    // Check required environment variables
    const requiredVars = [
      'REACT_APP_API_URL',
      'REACT_APP_PAYPAL_CLIENT_ID',
      'REACT_APP_GA_MEASUREMENT_ID'
    ];
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing ${varName}`);
      }
    });
    
    // Check if we're using development URLs in production
    if (process.env.NODE_ENV === 'production') {
      if (process.env.REACT_APP_API_URL?.includes('localhost')) {
        errors.push('Using localhost API URL in production');
      }
    }
    
    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success';
    
    return {
      status,
      message: status === 'success' ? 
        '✅ Environment variables configured correctly' : 
        `❌ ${errors.length} environment issues detected`,
      details: { errors, warnings }
    };
  };

  const checkSecurityConfig = () => {
    const errors = [];
    const warnings = [];
    
    // Check HTTPS in production
    if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
      errors.push('Site not running on HTTPS in production');
    }
    
    // Check for exposed secrets
    if (process.env.REACT_APP_SECRET_KEY) {
      errors.push('Secret key exposed in frontend environment');
    }
    
    // Check CSP headers
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      warnings.push('Content Security Policy headers not detected');
    }
    
    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success';
    
    return {
      status,
      message: status === 'success' ? 
        '✅ Security configuration looks good' : 
        `⚠️ ${errors.length} security issues detected`,
      details: { errors, warnings }
    };
  };

  const checkMonitoringConfig = () => {
    const errors = [];
    const warnings = [];
    
    // Check if Sentry is configured
    if (!process.env.REACT_APP_SENTRY_DSN) {
      warnings.push('Sentry DSN not configured - error tracking disabled');
    }
    
    // Check if performance monitoring is enabled
    try {
      performanceMonitor.trackMetric('readiness_check', 1);
      // If no error, monitoring is working
    } catch (error) {
      warnings.push('Performance monitoring not working correctly');
    }
    
    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success';
    
    return {
      status,
      message: status === 'success' ? 
        '✅ Monitoring configured correctly' : 
        `⚠️ ${warnings.length} monitoring improvements needed`,
      details: { errors, warnings }
    };
  };

  const calculateOverallStatus = () => {
    const checkValues = Object.values(checks);
    const hasErrors = checkValues.some(check => check.status === 'error');
    const hasWarnings = checkValues.some(check => check.status === 'warning');
    
    if (hasErrors) {
      setOverallStatus('error');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('success');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '🔄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'success':
        return '🎉 All systems ready for production deployment!';
      case 'warning':
        return '⚠️ Ready with warnings - review issues before deployment';
      case 'error':
        return '🚨 NOT READY - Critical issues must be resolved';
      default:
        return '🔄 Checking production readiness...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Production Readiness Check</h1>
        <div className={`p-4 rounded-lg border-2 ${getStatusColor(overallStatus)}`}>
          <h2 className="text-xl font-semibold">
            {getStatusIcon(overallStatus)} {getOverallMessage()}
          </h2>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(checks).map(([category, check]) => (
          <div key={category} className={`p-6 rounded-lg border-2 ${getStatusColor(check.status)}`}>
            <h3 className="text-lg font-semibold mb-2 capitalize flex items-center">
              {getStatusIcon(check.status)} {category} Configuration
            </h3>
            
            <p className="mb-4">{check.message}</p>
            
            {check.details && (
              <div className="text-sm">
                {check.details.errors && check.details.errors.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-semibold text-red-700">Errors:</h4>
                    <ul className="list-disc list-inside text-red-600">
                      {check.details.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {check.details.warnings && check.details.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-yellow-700">Warnings:</h4>
                    <ul className="list-disc list-inside text-yellow-600">
                      {check.details.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={runAllChecks}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
        >
          🔄 Re-run All Checks
        </button>
      </div>
    </div>
  );
};

export default ProductionReadinessChecker;
