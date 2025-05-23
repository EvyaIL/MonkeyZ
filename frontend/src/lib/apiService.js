import axios from "axios";

/**
 * ApiService handles HTTP requests with token support and error handling.
 */
class ApiService {
  constructor() {
    this.endpoint = process.env.REACT_APP_PATH_BACKEND;
    this.token = null;

    this.httpClient = axios.create({
      baseURL: this.endpoint,
      headers: {
        "Content-Type": "application/json",
      },
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
      const response = await this.httpClient({
        method,
        url,
        data,
        params,
        headers: { "Content-Type": contentType },
      });
      return { data: response.data, error: null };
    } catch (error) {
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
      return (
        error.response.data?.error ||
        error.response.data?.message ||
        `Server Error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      // No response from server
      console.error("No Response from Server:", {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
      return `No response from server (${error.config?.baseURL || 'Unknown URL'}). Please check your connection and try again.`;
    } else {
      // Error setting up the request
      console.error("Request Setup Error:", error.message);
      return `Error setting up request: ${error.message}`;
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
}

export const apiService = new ApiService();
