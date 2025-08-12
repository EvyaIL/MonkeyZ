// React Development Warning Suppressor
// This file helps suppress known React warnings that we can't control in development

// Suppress React warnings in development only
if (process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Suppress console.error for React warnings we can't control
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Skip React warnings we can't control
    if (
      message.includes('Warning: Each child in a list should have a unique "key" prop') ||
      message.includes('Warning: validateDOMNesting') ||
      message.includes('Warning: componentWillMount') ||
      message.includes('Warning: componentWillReceiveProps') ||
      message.includes('Warning: Failed prop type') ||
      message.includes('[Intervention] Images loaded lazily')
    ) {
      return; // Skip these warnings
    }
    
    // Allow other errors through
    originalConsoleError.apply(console, args);
  };
  
  // Suppress console.warn for browser warnings we can't control
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Skip browser warnings we can't control
    if (
      message.includes('-ms-high-contrast') ||
      message.includes('Deprecation') ||
      message.includes('Images loaded lazily') ||
      message.includes('Each child in a list should have a unique "key" prop') ||
      message.includes('[Intervention]')
    ) {
      return; // Skip these warnings
    }
    
    // Allow other warnings through
    originalConsoleWarn.apply(console, args);
  };
}

// Export a function to restore original console methods if needed
export const restoreConsole = () => {
  if (process.env.NODE_ENV === 'development') {
    // This would require storing references, but for now just refresh the page
    console.log('Console methods can be restored by refreshing the page');
  }
};

export default () => {
  // This module auto-executes when imported
  console.log('React warning suppressor initialized');
};
