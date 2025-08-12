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

      // Optimize chunks for better caching and loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 200000, // Reduced from 244KB to 200KB for better performance
          cacheGroups: {
            // React core libraries - highest priority
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
              name: 'react',
              priority: 40,
              reuseExistingChunk: true,
              enforce: true,
            },
            // PayPal SDK - separate chunk for payment functionality
            paypal: {
              test: /[\\/]node_modules[\\/](@paypal)[\\/]/,
              name: 'paypal',
              priority: 35,
              reuseExistingChunk: true,
            },
            // UI libraries - Material-UI, Heroicons, etc.
            ui: {
              test: /[\\/]node_modules[\\/](@mui|@heroicons|@headlessui)[\\/]/,
              name: 'ui',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Charts - Chart.js and react-chartjs-2
            charts: {
              test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
              name: 'charts',
              priority: 25,
              reuseExistingChunk: true,
            },
            // React Query - data management
            query: {
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              name: 'query',
              priority: 22,
              reuseExistingChunk: true,
            },
            // Vendor libraries - all other node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
              chunks: 'initial',
            },
            // Admin components - lazy loaded admin functionality
            admin: {
              test: /[\\/]src[\\/](pages[\\/]dashboard[\\/]admin|components[\\/]admin)[\\/]/,
              name: 'admin',
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Common components used across the app
            common: {
              name: 'common',
              minChunks: 3, // Only create chunk if used in 3+ places
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
      
      // Add performance hints and budgets
      config.performance = {
        maxAssetSize: 200000, // Reduced from 300KB to 200KB
        maxEntrypointSize: 250000, // Reduced from 300KB to 250KB
        hints: 'warning',
        assetFilter: function (assetFilename) {
          // Only warn about JS and CSS files, not images
          return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
        }
      };

      // Optimize asset handling
      config.module.rules.push({
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024, // Reduced from 8KB to 4KB for better performance
          },
        },
      });
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
