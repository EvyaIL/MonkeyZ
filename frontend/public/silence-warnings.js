// Advanced Console Warning Blocker
// This script must be loaded as early as possible to catch all warnings

(function() {
  'use strict';
  
  // Only run in development
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Store original methods immediately
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
  // Comprehensive warning patterns to suppress
  const suppressedPatterns = [
    // Microsoft Edge deprecation warnings - EXACT MATCHES
    'ms-high-contrast is in the process of being deprecated',
    'process of being deprecated',
    'Forced Colors Mode standard',
    'blogs.windows.com/msedgedev/2024/04/29/deprecating-ms-high-contrast',
    'msedgedev/2024/04/29',
    '[Deprecation]',
    'Deprecation',
    '-ms-high-contrast',
    
    // Edge UI elements - EXACT MATCHES
    '[NEW] Explain Console errors by using Copilot in Edge: click',
    'NEW] Explain Console errors by using Copilot in Edge',
    'Learn more',
    "Don't show again",
    'click to explain an error',
    'to explain an error',
    
    // Browser interventions - EXACT MATCHES
    '[Intervention] Images loaded lazily and replaced with placeholders',
    'Images loaded lazily and replaced with placeholders',
    'Load events are deferred',
    'go.microsoft.com/fwlink/?linkid=2048113',
    'go.microsoft.com/fwlink',
    '[Intervention]',
    'Intervention',
    
    // Trustpilot errors
    'trustpilot.com',
    'widget.trustpilot.com',
    'trustbox-data',
    'Bad Request',
    'businessUnitId',
    
    // React warnings
    'Warning: Each child',
    'Warning: validateDOMNesting',
    'unique "key" prop',
    
    // CSP and security warnings (development only)
    'Content Security Policy',
    'CSP meta tag not found',
    'PayPal and Google OAuth integration may be blocked',
    'Refused to load',
    'Refused to frame',
    
    // Performance warnings in development
    'Slow route load'
  ];
  
  // Check if message should be suppressed
  function shouldSuppress(message) {
    if (typeof message !== 'string') {
      message = String(message);
    }
    return suppressedPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  // Create suppressed console method
  function createSuppressedMethod(originalMethod) {
    return function(...args) {
      const message = args.join(' ');
      if (!shouldSuppress(message)) {
        originalMethod.apply(console, args);
      }
    };
  }
  
  // Override all console methods immediately
  console.error = createSuppressedMethod(originalError);
  console.warn = createSuppressedMethod(originalWarn);
  console.log = createSuppressedMethod(originalLog);
  console.info = createSuppressedMethod(originalInfo);
  console.debug = createSuppressedMethod(originalDebug);
  
  // Block Trustpilot widget completely in development
  if (typeof window !== 'undefined') {
    // Intercept CSS property access to prevent deprecation warnings
    if (window.getComputedStyle) {
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = function(element, pseudoElement) {
        const style = originalGetComputedStyle.apply(this, arguments);
        
        // Override deprecated properties to prevent warnings
        const originalGetPropertyValue = style.getPropertyValue;
        style.getPropertyValue = function(property) {
          if (property === '-ms-high-contrast' || property.includes('-ms-high-contrast')) {
            return 'none'; // Return a safe value without triggering warning
          }
          return originalGetPropertyValue.apply(this, arguments);
        };
        
        return style;
      };
    }
    
    // Override CSSStyleDeclaration to prevent deprecation warnings
    if (window.CSSStyleDeclaration && window.CSSStyleDeclaration.prototype) {
      const originalSetProperty = window.CSSStyleDeclaration.prototype.setProperty;
      window.CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
        if (property === '-ms-high-contrast' || property.includes('-ms-high-contrast')) {
          return; // Silently ignore deprecated properties
        }
        return originalSetProperty.apply(this, arguments);
      };
    }
    
    // Override XMLHttpRequest to block Trustpilot
    const OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new OriginalXMLHttpRequest();
      const originalOpen = xhr.open;
      
      xhr.open = function(method, url, ...args) {
        if (typeof url === 'string' && url.includes('trustpilot.com')) {
          // Block the request by doing nothing
          return;
        }
        return originalOpen.apply(this, [method, url, ...args]);
      };
      
      return xhr;
    };
    
    // Override fetch to block Trustpilot
    const originalFetch = window.fetch;
    window.fetch = function(url, ...args) {
      if (typeof url === 'string' && url.includes('trustpilot.com')) {
        // Return a successful empty response
        return Promise.resolve(new Response('{}', { status: 200 }));
      }
      return originalFetch.apply(this, [url, ...args]);
    };
    
    // Block external script loading for Trustpilot
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'SCRIPT' && node.src && node.src.includes('trustpilot.com')) {
              node.remove();
            }
            if (node.tagName === 'IFRAME' && node.src && node.src.includes('trustpilot.com')) {
              node.remove();
            }
          }
        });
      });
    });
    
    // Start observing when DOM is available
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }
  
  // Remove Trustpilot GTM floating widget
  function removeTrustpilotGTMWidget() {
    const trustpilotWrapper = document.getElementById('trustpilot-gtm-floating-wrapper');
    if (trustpilotWrapper) {
      trustpilotWrapper.remove();
      console.log('🗑️ Removed Trustpilot GTM floating widget');
    }
    
    // Also remove any trustpilot widgets that might be dynamically created
    const trustpilotWidgets = document.querySelectorAll('[id*="trustpilot-gtm"], [class*="trustpilot-widget"]');
    trustpilotWidgets.forEach(widget => {
      if (widget.id !== 'our-custom-trustpilot-button') { // Preserve our custom button
        widget.remove();
      }
    });
  }
  
  // Run removal on page load and periodically
  document.addEventListener('DOMContentLoaded', removeTrustpilotGTMWidget);
  window.addEventListener('load', removeTrustpilotGTMWidget);
  
  // Set up interval to remove any dynamically added widgets
  setInterval(removeTrustpilotGTMWidget, 2000);
  
  console.log('🚫 Console spam blocker activated - warnings suppressed');
})();
