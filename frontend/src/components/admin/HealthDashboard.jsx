import React, { useState, useEffect } from 'react';
import { performanceMonitor, reportError } from '../../lib/monitoring';

// Simple health check component for admin monitoring
const HealthDashboard = () => {
  const [healthStatus, setHealthStatus] = useState({
    api: 'checking',
    database: 'checking',
    paypal: 'checking',
    performance: 'checking'
  });
  
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    apiResponseTime: 0,
    errorCount: 0,
    userCount: 0
  });

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      // Check API health
      const apiStart = performance.now();
      const apiResponse = await fetch('/health');
      const apiTime = performance.now() - apiStart;
      
      setHealthStatus(prev => ({
        ...prev,
        api: apiResponse.ok ? 'healthy' : 'error',
        database: apiResponse.ok ? 'healthy' : 'error' // Assume DB is connected if API responds
      }));
      
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: Math.round(apiTime)
      }));
      
      // Track performance
      performanceMonitor.trackMetric('api_response_time', apiTime);
      
    } catch (error) {
      setHealthStatus(prev => ({
        ...prev,
        api: 'error',
        database: 'error'
      }));
      
      reportError(error, { context: 'health_check' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return '✅ Healthy';
      case 'warning': return '⚠️ Warning';
      case 'error': return '❌ Error';
      default: return '🔄 Checking...';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">System Health Dashboard</h2>
      
      {/* System Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(healthStatus).map(([service, status]) => (
          <div key={service} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{service}</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{getStatusText(status)}</p>
          </div>
        ))}
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Page Load</h3>
          <p className="text-2xl font-bold text-blue-600">{metrics.pageLoadTime}ms</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">API Response</h3>
          <p className="text-2xl font-bold text-green-600">{metrics.apiResponseTime}ms</p>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-800">Errors (24h)</h3>
          <p className="text-2xl font-bold text-red-600">{metrics.errorCount}</p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-800">Active Users</h3>
          <p className="text-2xl font-bold text-purple-600">{metrics.userCount}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-6 flex gap-2">
        <button 
          onClick={checkSystemHealth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Status
        </button>
        
        <button 
          onClick={() => window.open('https://app.sentry.io', '_blank')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          View Detailed Logs
        </button>
      </div>
    </div>
  );
};

export default HealthDashboard;
