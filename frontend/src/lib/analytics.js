/**
 * Analytics service for MonkeyZ
 * This service provides methods to interact with Google Analytics and Google Tag Manager
 */

// Initialize data layer for Google Tag Manager
window.dataLayer = window.dataLayer || [];

// Client ID for cross-device tracking
let clientId = localStorage.getItem('ga_client_id');

// Parse UTM parameters and store them
const storeUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  let hasUtmParams = false;
  utmKeys.forEach(key => {
    if (urlParams.has(key)) {
      utmParams[key] = urlParams.get(key);
      hasUtmParams = true;
    }
  });
  
  if (hasUtmParams) {
    // Store for session duration
    sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    // Also store the landing page
    sessionStorage.setItem('landing_page', window.location.pathname);
    // Store the initial referrer
    if (!sessionStorage.getItem('initial_referrer')) {
      sessionStorage.setItem('initial_referrer', document.referrer || 'direct');
    }
  }
  
  return utmParams;
};

// Get stored UTM parameters
const getUtmParams = () => {
  try {
    return JSON.parse(sessionStorage.getItem('utm_params') || '{}');
  } catch (e) {
    console.error('Error parsing UTM params from sessionStorage', e);
    return {};
  }
};

// Initialize the analytics service
export const initAnalytics = () => {
  // Store UTM parameters
  storeUtmParams();
  
  // Set up client ID for cross-device tracking if not already set
  if (!clientId) {
    clientId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 16)}`;
    localStorage.setItem('ga_client_id', clientId);
  }
  
  // Send initial client ID to Google Analytics
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'set_client_id',
      client_id: clientId
    });
  }
};

/**
 * Send a page view event to Google Analytics
 * @param {string} path - The path of the page
 * @param {string} title - The title of the page
 */
export const pageView = (path, title) => {
  if (!window.dataLayer) return;
  
  // Get UTM parameters and other attribution data
  const utmParams = getUtmParams();
  const landingPage = sessionStorage.getItem('landing_page') || path;
  const initialReferrer = sessionStorage.getItem('initial_referrer') || document.referrer || 'direct';
  
  window.dataLayer.push({
    event: 'page_view',
    page: {
      path,
      title
    },
    client_id: clientId,
    user_properties: getUserProperties(),
    ...utmParams,
    landing_page: landingPage,
    referrer: initialReferrer
  });
  
  console.log(`[Analytics] Page view: ${path} - ${title}`);
};

/**
 * Get user properties for segmentation
 * @returns {Object} User properties
 */
const getUserProperties = () => {
  // Get user data from localStorage or context if available
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  
  // Build user segments based on behavioral and demographic data
  const segments = [];
  const lastPurchaseDate = localStorage.getItem('last_purchase_date');
  const visitCount = parseInt(localStorage.getItem('visit_count') || '0');
  const cartValue = getCartValue();
  
  // Recency segments
  if (lastPurchaseDate) {
    const daysSinceLastPurchase = Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastPurchase < 30) segments.push('recent_purchaser');
    else if (daysSinceLastPurchase < 90) segments.push('active_customer');
    else segments.push('lapsed_customer');
  } else {
    segments.push('new_visitor');
  }
  
  // Frequency segments
  if (visitCount > 10) segments.push('frequent_visitor');
  else if (visitCount > 5) segments.push('returning_visitor');
  else segments.push('new_visitor');
  
  // Cart value segments
  if (cartValue > 500) segments.push('high_value_cart');
  else if (cartValue > 200) segments.push('medium_value_cart');
  else if (cartValue > 0) segments.push('low_value_cart');
  
  // Login status
  if (userData.id) segments.push('logged_in_user');
  
  return {
    user_id: userData.id || null,
    segments: segments,
    visit_count: visitCount,
    days_since_first_visit: localStorage.getItem('first_visit') 
      ? Math.floor((Date.now() - parseInt(localStorage.getItem('first_visit'))) / (1000 * 60 * 60 * 24))
      : 0,
    language_preference: localStorage.getItem('i18nextLng') || navigator.language
  };
};

/**
 * Calculate cart value from cart items
 * @returns {number} Total cart value
 */
const getCartValue = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    return Object.values(cart).reduce((total, item) => total + (item.price * item.count), 0);
  } catch (e) {
    console.error('Error calculating cart value', e);
    return 0;
  }
};

/**
 * Track a custom event in Google Analytics
 * @param {string} eventName - The name of the event
 * @param {Object} params - Additional parameters for the event
 */
export const trackEvent = (eventName, params = {}) => {
  if (!window.dataLayer) return;
  
  // Get UTM parameters for attribution
  const utmParams = getUtmParams();
  
  window.dataLayer.push({
    event: eventName,
    client_id: clientId,
    user_properties: getUserProperties(),
    ...utmParams,
    ...params
  });
  
  console.log(`[Analytics] Event: ${eventName}`, params);
  
  // Update funnel step tracking
  updateFunnelStep(eventName, params);
};

/**
 * Track funnel progress
 * @param {string} eventName - The name of the event
 * @param {Object} params - Event parameters
 */
const updateFunnelStep = (eventName, params) => {
  // Define funnel steps in order
  const funnelSteps = [
    'page_view',      // Viewing the site
    'view_item',      // Viewing a product
    'add_to_cart',    // Adding to cart
    'begin_checkout', // Starting checkout
    'initiate_payment', // Payment initiated
    'purchase'        // Purchase completed
  ];
  
  // Map additional events to funnel steps
  const eventToFunnel = {
    'payment_error': 'initiate_payment',
    'payment_failed': 'initiate_payment',
    'click_product': 'page_view',
    'search': 'page_view'
  };
  
  // Determine current funnel step
  let currentStep = eventName;
  if (eventToFunnel[eventName]) {
    currentStep = eventToFunnel[eventName];
  }
  
  // Only process if it's a funnel step
  if (!funnelSteps.includes(currentStep)) return;
  
  // Get current session funnel data
  let funnelData = {};
  try {
    funnelData = JSON.parse(sessionStorage.getItem('funnel_data') || '{}');
  } catch (e) {
    console.error('Error parsing funnel data', e);
  }
  
  // Update funnel data with timestamp
  funnelData[currentStep] = {
    timestamp: Date.now(),
    path: window.location.pathname
  };
  
  // For ecommerce events, store additional data
  if (['view_item', 'add_to_cart', 'purchase'].includes(eventName) && params.ecommerce) {
    funnelData[currentStep].ecommerce = params.ecommerce;
  }
  
  // Store updated funnel data
  sessionStorage.setItem('funnel_data', JSON.stringify(funnelData));
  
  // Calculate time between funnel steps
  const funnelProgress = analyzeFunnelProgress(funnelData, funnelSteps);
  
  // Send funnel progress for analysis
  if (Object.keys(funnelProgress).length > 0) {
    window.dataLayer.push({
      event: 'funnel_progress',
      funnel_name: 'purchase_funnel',
      funnel_step: currentStep,
      funnel_progress: funnelProgress,
      client_id: clientId
    });
  }
};

/**
 * Analyze funnel progression metrics
 * @param {Object} funnelData - Funnel step data
 * @param {Array} funnelSteps - Ordered list of funnel steps
 * @returns {Object} Funnel progress metrics
 */
const analyzeFunnelProgress = (funnelData, funnelSteps) => {
  const progress = {
    current_step: null,
    steps_completed: 0,
    total_steps: funnelSteps.length,
    time_in_funnel: 0,
    step_times: {}
  };
  
  let previousStepTime = null;
  let firstStepTime = null;
  let lastStepIndex = -1;
  
  // Go through each funnel step in order
  funnelSteps.forEach((step, index) => {
    if (funnelData[step]) {
      progress.steps_completed++;
      lastStepIndex = index;
      progress.current_step = step;
      
      const currentStepTime = funnelData[step].timestamp;
      
      // Record first step time
      if (firstStepTime === null) {
        firstStepTime = currentStepTime;
      }
      
      // Calculate time between steps
      if (previousStepTime !== null) {
        const timeBetweenSteps = currentStepTime - previousStepTime;
        progress.step_times[step] = timeBetweenSteps;
      }
      
      previousStepTime = currentStepTime;
    }
  });
  
  // Calculate total time in funnel
  if (firstStepTime !== null && lastStepIndex >= 0) {
    const lastStep = funnelSteps[lastStepIndex];
    progress.time_in_funnel = funnelData[lastStep].timestamp - firstStepTime;
  }
  
  return progress;
};

/**
 * Track an ecommerce view event (viewing a product)
 * @param {Object} product - Product data
 */
export const trackProductView = (product) => {
  if (!product || !product.id) return;
  
  trackEvent('view_item', {
    ecommerce: {
      items: [{
        item_id: product.id,
        item_name: typeof product.name === 'object' ? product.name.en : product.name,
        price: product.price,
        currency: 'ILS',
        category: product.category || 'unknown'
      }]
    }
  });
};

/**
 * Track adding an item to cart
 * @param {Object} product - Product data
 * @param {number} quantity - Quantity added
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product || !product.id) return;
  
  trackEvent('add_to_cart', {
    ecommerce: {
      items: [{
        item_id: product.id,
        item_name: typeof product.name === 'object' ? product.name.en : product.name,
        price: product.price,
        quantity: quantity,
        currency: 'ILS'
      }]
    }
  });
};

/**
 * Track a purchase event
 * @param {Object} orderData - Order data including products and transaction details
 */
export const trackPurchase = (orderData) => {
  if (!orderData || !orderData.orderId) return;
  
  const items = orderData.items.map(item => ({
    item_id: item.id,
    item_name: typeof item.name === 'object' ? item.name.en : item.name,
    price: item.price,
    quantity: item.quantity,
    currency: 'ILS'
  }));
  
  trackEvent('purchase', {
    ecommerce: {
      transaction_id: orderData.orderId,
      value: orderData.total,
      currency: 'ILS',
      items: items
    }
  });
};

const analytics = {
  pageView,
  trackEvent,
  trackProductView,
  trackAddToCart,
  trackPurchase
};

export default analytics;
