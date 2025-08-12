// Advanced bundle optimization configuration
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  // Webpack configuration for Create React App
  webpack: (config, env) => {
    // Production optimizations
    if (env === 'production') {
      // Add bundle analyzer (run only when needed)
      if (process.env.ANALYZE) {
        config.plugins.push(new BundleAnalyzerPlugin());
      }

      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // 244KB max chunk size for better caching
          cacheGroups: {
            // React core libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
              name: 'react',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
              chunks: 'initial',
            },
            // Admin components
            admin: {
              test: /[\\/]src[\\/]pages[\\/]dashboard[\\/]admin[\\/]/,
              name: 'admin',
              priority: 20,
              minChunks: 1,
            },
            // Common components
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Tree shaking for unused imports
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Enable module concatenation for better minification
      config.optimization.concatenateModules = true;
      
      // Add performance hints
      config.performance = {
        maxAssetSize: 300000,
        maxEntrypointSize: 300000,
        hints: 'warning'
      };
    }

    // Resolve optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@lib': path.resolve(__dirname, 'src/lib'),
    };

    return config;
  },
};
