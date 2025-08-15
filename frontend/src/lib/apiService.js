import axios from "axios";

/**
 * ApiService handles HTTP requests with token support and error handling.
 */
class ApiService {  constructor() {
    // In development with proxy (package.json), we use relative URLs
    // In production, we use the environment variable
    const isDev = process.env.NODE_ENV === 'development';
    
    // Always use the API URL from .env if available, otherwise fallback to production URL
    this.endpoint = process.env.REACT_APP_API_URL || process.env.REACT_APP_PATH_BACKEND || 'https://api.monkeyz.co.il';
    
    // In development, we prefer to use the proxy setup in package.json if no explicit API URL is set
    // This helps avoid CORS issues
    if (isDev && !process.env.REACT_APP_API_URL) {
      this.endpoint = '';
    }
    
    // Try to load token from localStorage/sessionStorage on init
    this.token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || null;

    this.httpClient = axios.create({
      baseURL: this.endpoint,
      headers: {
        "Content-Type": "application/json",
      },
      // Ensure cookies are sent with requests when needed
      withCredentials: true,      // Add timeout to prevent hanging requests (30 seconds)
      timeout: 30000,
    });

    // Attach token to every request if available
    this.httpClient.interceptors.request.use(
      (config) => {
        // Always try to get the latest token before each request
        const token = this.token || localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        // Debug logging for token issues (disabled to reduce console spam)
        if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
          console.log('API Request Auth Debug:', {
            url: config.url,
            method: config.method,
            hasToken: !!token,
            tokenSource: token ? 
              (localStorage.getItem('access_token') ? 'access_token' : 
               localStorage.getItem('token') ? 'token' : 
               localStorage.getItem('authToken') ? 'authToken' : 'sessionStorage') : 'none'
          });
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          delete config.headers.Authorization;
        }
        
        // Add CSRF token for admin operations in production
        if (config.url && config.url.includes('/admin/') && config.method !== 'get') {
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  /**
   * Set the JWT token for authenticated requests.
   * @param {string} token
   */
  setToken(token) {
    this.token = token;
  }
  
  /**
   * Get CSRF token from localStorage or cookie
   */
  getCSRFToken() {
    // Check localStorage first, then cookies
    return localStorage.getItem('csrf_token') || this.getCookie('csrf_token');
  }
  
  /**
   * Set CSRF token
   */
  setCSRFToken(token) {
    localStorage.setItem('csrf_token', token);
  }
  
  /**
   * Get cookie value by name
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  /**
   * Generic request method.
   */  async request(
    method,
    url,
    data = null,
    params = null,
    contentType = "application/json",
  ) {
    try {
      // Only log in development mode with debug flag
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log(`API Request: ${method} ${url}`, { data, params });
      }
      
      const response = await this.httpClient({
        method,
        url,
        data,
        params,
        headers: { "Content-Type": contentType },
      });
      
      // Only log in development mode with debug flag
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log(`API Response: ${method} ${url}`, response.data);
      }
      
      return { data: response.data, error: null };
    } catch (error) {
      console.error(`API Error: ${method} ${url}`, error);
      return { data: null, error: this.handleError(error) };
    }
  }
  /**
   * Error handler for API responses.
   */  handleError(error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error("API Error:", error.response.status);
      
      // Extract the most meaningful error message
      const errorMessage = 
        error.response.data?.error || 
        error.response.data?.message || 
        error.response.data?.detail || 
        `Error: ${error.response.status}`;
      
      // Log more details for debugging in development
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log('Error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      return errorMessage;
    } else if (error.request) {
      // No response from server - could be CORS or network issue
      console.error("No Response from Server:", error.request);
      
      // Check if this might be a CORS error
      const isCORSError = error.message && error.message.includes('Network Error');
      if (isCORSError) {
        console.warn("Possible CORS error - check backend CORS configuration");
        return "Connection to API server failed. This may be a CORS or network issue.";
      }
      
      return "No response from the server. Please check your connection.";
    } else {
      // Error setting up the request
      console.error("Request Setup Error:", error.message);
      return `Error: ${error.message}`;
    }
  }

  get(url, params = null, contentType = "application/json") {
    return this.request("GET", url, null, params, contentType);
  }

  post(url, data, contentType = "application/json") {
    return this.request("POST", url, data, null, contentType);
  }

  put(url, data, contentType = "application/json") {
    return this.request("PUT", url, data, null, contentType);
  }
  delete(url, params = null) {
    return this.request("DELETE", url, null, params);
  }

  patch(url, data, contentType = "application/json") {
    return this.request("PATCH", url, data, null, contentType);
  }

  /**
   * Get all orders
   * @returns {Promise} Response from the API
   */  async getOrders(params = null) {
    try {
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log('API Request: GET /api/orders', params);
      }
      const response = await this.httpClient.get('/api/orders', { params });
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log('API Response: GET /api/orders', response.data);
      }
      return response.data;
    } catch (error) {
      console.error('API Error: GET /api/orders', error.message);
      return { error: error.message };
    }
  }

  /**
   * Create a new order
   * @param {Object} orderData Order details
   * @returns {Promise} Response from the API
   */  async createOrder(orderData) {
    try {
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log('API Request: POST /api/orders', orderData);
      }
      const response = await this.httpClient.post('/api/orders', orderData);
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log('API Response: POST /api/orders', response.data);
      }
      return response.data;
    } catch (error) {
      console.error('API Error: POST /api/orders', error.message);
      return { error: error.message };
    }
  }

  /**
   * Update order status
   * @param {string} orderId Order ID
   * @param {Object} updateData Update data
   * @returns {Promise} Response from the API
   */  async updateOrderStatus(orderId, updateData) {
    try {
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log(`API Request: PATCH /api/orders/${orderId}`, updateData);
      }
      const response = await this.httpClient.patch(`/api/orders/${orderId}`, updateData);
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_API === 'true') {
        console.log(`API Response: PATCH /api/orders/${orderId}`, response.data);
      }
      return response.data;
    } catch (error) {
      console.error(`API Error: PATCH /api/orders/${orderId}`, error.message);
      return { error: error.message };
    }
  }
}

export const apiService = new ApiService();
