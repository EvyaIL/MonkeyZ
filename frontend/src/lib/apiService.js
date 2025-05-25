import axios from "axios";

/**
 * ApiService handles HTTP requests with token support and error handling.
 */
class ApiService {  constructor() {
    // In development with proxy (package.json), we use relative URLs
    // In production, we use the environment variable
    const isDev = process.env.NODE_ENV === 'development';
    
    // Always use the API URL from .env if available
    this.endpoint = process.env.REACT_APP_PATH_BACKEND || '';
      // In development, we prefer to use the proxy setup in package.json
    // This helps avoid CORS issues
    if (isDev) {
      this.endpoint = '';
    }
    
    console.log('API Endpoint:', this.endpoint || 'Using proxy');
    this.token = null;

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
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        } else {
          delete config.headers.Authorization;
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
   * Generic request method.
   */
  async request(
    method,
    url,
    data = null,
    params = null,
    contentType = "application/json",
  ) {
    try {
      console.log(`API Request: ${method} ${url}`, { data, params });
      const response = await this.httpClient({
        method,
        url,
        data,
        params,
        headers: { "Content-Type": contentType },
      });
      console.log(`API Response: ${method} ${url}`, response.data);
      return { data: response.data, error: null };
    } catch (error) {
      console.error(`API Error: ${method} ${url}`, error);
      return { data: null, error: this.handleError(error) };
    }
  }
  /**
   * Error handler for API responses.
   */
  handleError(error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error("API Error:", error.response.data);
      
      // Extract the most meaningful error message
      const errorMessage = 
        error.response.data?.error || 
        error.response.data?.message || 
        error.response.data?.detail || 
        `Error: ${error.response.status}`;
      
      // Log more details for debugging in development
      if (process.env.NODE_ENV === 'development') {
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
   */
  async getOrders(params = null) {
    try {
      console.log('API Request: GET /api/orders', params);
      const response = await this.httpClient.get('/api/orders', { params });
      console.log('API Response: GET /api/orders', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error: GET /api/orders', error);
      return { error: error.message };
    }
  }

  /**
   * Create a new order
   * @param {Object} orderData Order details
   * @returns {Promise} Response from the API
   */
  async createOrder(orderData) {
    try {
      console.log('API Request: POST /api/orders', orderData);
      const response = await this.httpClient.post('/api/orders', orderData);
      console.log('API Response: POST /api/orders', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error: POST /api/orders', error);
      return { error: error.message };
    }
  }

  /**
   * Update order status
   * @param {string} orderId Order ID
   * @param {Object} updateData Update data
   * @returns {Promise} Response from the API
   */
  async updateOrderStatus(orderId, updateData) {
    try {
      console.log(`API Request: PATCH /api/orders/${orderId}`, updateData);
      const response = await this.httpClient.patch(`/api/orders/${orderId}`, updateData);
      console.log(`API Response: PATCH /api/orders/${orderId}`, response.data);
      return response.data;
    } catch (error) {
      console.error(`API Error: PATCH /api/orders/${orderId}`, error);
      return { error: error.message };
    }
  }
}

export const apiService = new ApiService();
