// This file allows us to customize webpack config without ejecting
const path = require('path');

module.exports = function override(config, env) {
  // Add TypeScript file resolution
  config.resolve.extensions = [...(config.resolve.extensions || []), '.ts', '.tsx'];
  
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        // Your custom middleware setup here if needed
        return middlewares;
      }
    };
  }
  return config;
}
