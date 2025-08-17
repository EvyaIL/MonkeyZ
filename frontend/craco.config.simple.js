// Temporary fix for chunk loading issues
const path = require('path');

module.exports = {
  webpack: (config, env) => {
    if (env === 'production') {
      // Temporarily disable code splitting to prevent chunk loading errors
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};
