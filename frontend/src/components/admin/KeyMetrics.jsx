/**
 * Key Metrics Component
 * Displays key performance indicators and metrics
 */

import React, { useState, useEffect, useRef } from 'react';

// Mock data generator for development
const generateMockMetrics = () => ({
  totalUsers: 1250 + Math.floor(Math.random() * 100),
  activeUsers: 850 + Math.floor(Math.random() * 50),
  totalOrders: 5420 + Math.floor(Math.random() * 200),
  revenue: 125000 + Math.floor(Math.random() * 10000),
  conversionRate: 3.2 + Math.random() * 0.8,
  avgOrderValue: 85.50 + Math.random() * 20,
  bounceRate: 35.2 - Math.random() * 5,
  pageViews: 15420 + Math.floor(Math.random() * 500),
  sessionDuration: 4.5 + Math.random() * 2,
  returnCustomers: 32.1 + Math.random() * 3
});

// Metric card component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  format = 'number',
  icon 
}) => {
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'time':
        return `${val.toFixed(1)}m`;
      default:
        return val.toLocaleString();
    }
  };
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#10B981'; // green
      case 'down': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };
  
  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '20px',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: '500',
            color: '#6B7280'
          }}>
            {title}
          </h3>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            margin: '0'
          }}>
            {formatValue(value)}
          </div>
        </div>
        {icon && (
          <div style={{
            fontSize: '24px',
            opacity: 0.6
          }}>
            {icon}
          </div>
        )}
      </div>
      
      {change !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          marginTop: '12px'
        }}>
          <span style={{
            color: getTrendColor(),
            marginRight: '4px',
            fontWeight: '500'
          }}>
            {getTrendIcon()} {Math.abs(change).toFixed(1)}%
          </span>
          <span style={{ color: '#6B7280' }}>
            from last month
          </span>
        </div>
      )}
    </div>
  );
};

// Chart component (simplified)
const SimpleChart = ({ data, type = 'line', height = 200 }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Simple line chart
    if (type === 'line') {
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;
      
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
  }, [data, type]);
  
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      style={{
        width: '100%',
        height: `${height}px`,
        border: '1px solid #E5E7EB',
        borderRadius: '4px'
      }}
    />
  );
};

// Main KeyMetrics component
const KeyMetrics = ({ 
  refreshInterval = 30000, 
  showCharts = true,
  customMetrics = []
}) => {
  const [metrics, setMetrics] = useState(generateMockMetrics());
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  
  // Refresh metrics
  const refreshMetrics = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from an API
      await new Promise(resolve => setTimeout(resolve, 500));
      const newMetrics = generateMockMetrics();
      setMetrics(newMetrics);
      
      // Update chart data
      setChartData(prev => {
        const newData = [...prev, newMetrics.revenue];
        return newData.slice(-20); // Keep last 20 points
      });
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(refreshMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  // Initialize chart data
  useEffect(() => {
    const initialData = Array.from({ length: 10 }, () => 
      125000 + Math.random() * 20000
    );
    setChartData(initialData);
  }, []);
  
  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      change: 12.5,
      trend: 'up',
      icon: '👥'
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      change: 8.2,
      trend: 'up',
      icon: '🟢'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders,
      change: 15.3,
      trend: 'up',
      icon: '📦'
    },
    {
      title: 'Revenue',
      value: metrics.revenue,
      change: 23.1,
      trend: 'up',
      format: 'currency',
      icon: '💰'
    },
    {
      title: 'Conversion Rate',
      value: metrics.conversionRate,
      change: -2.1,
      trend: 'down',
      format: 'percentage',
      icon: '🎯'
    },
    {
      title: 'Avg Order Value',
      value: metrics.avgOrderValue,
      change: 5.7,
      trend: 'up',
      format: 'currency',
      icon: '💳'
    },
    {
      title: 'Bounce Rate',
      value: metrics.bounceRate,
      change: -3.2,
      trend: 'up',
      format: 'percentage',
      icon: '⚡'
    },
    {
      title: 'Session Duration',
      value: metrics.sessionDuration,
      change: 7.8,
      trend: 'up',
      format: 'time',
      icon: '⏱️'
    }
  ];
  
  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827'
        }}>
          Key Metrics
        </h2>
        <button
          onClick={refreshMetrics}
          disabled={loading}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: showCharts ? '32px' : '0'
      }}>
        {metricCards.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
        
        {/* Custom metrics */}
        {customMetrics.map((metric, index) => (
          <MetricCard key={`custom-${index}`} {...metric} />
        ))}
      </div>
      
      {/* Charts */}
      {showCharts && (
        <div>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Revenue Trend
          </h3>
          <SimpleChart data={chartData} type="line" height={200} />
        </div>
      )}
      
      {/* Last updated */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#6B7280'
      }}>
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default KeyMetrics;
