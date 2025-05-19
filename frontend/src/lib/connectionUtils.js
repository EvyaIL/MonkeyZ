/**
 * Connection utilities for testing API connectivity
 */

/**
 * Check if the backend server is reachable
 * @returns {Promise<{isConnected: boolean, message: string}>}
 */
export async function checkServerConnection() {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_PATH_BACKEND}/health`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000, // 5 second timeout
      }
    );

    if (response.ok) {
      return { isConnected: true, message: 'Server is online' };
    } else {
      return { 
        isConnected: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error) {
    console.error('Connection check failed:', error);
    return { 
      isConnected: false, 
      message: 'Unable to connect to server. Please check your internet connection.' 
    };
  }
}

/**
 * Check if the database connection is working
 * @returns {Promise<{isConnected: boolean, message: string, details: object|null}>}
 */
export async function checkDatabaseConnection() {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_PATH_BACKEND}/health/db`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000, // 5 second timeout
      }
    );

    const data = await response.json();

    if (data.status === 'ok') {
      return { 
        isConnected: true, 
        message: 'Database is connected',
        details: data.details || null
      };
    } else {
      return { 
        isConnected: false, 
        message: data.message || 'Database connection issue',
        details: null
      };
    }
  } catch (error) {
    console.error('Database connection check failed:', error);
    return { 
      isConnected: false, 
      message: 'Unable to verify database connection',
      details: null
    };
  }
}

/**
 * Retry a failed fetch request with exponential backoff
 * @param {Function} fetchPromise - A function that returns a fetch promise
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise<Response>}
 */
export async function retryFetch(fetchPromise, retries = 3, delay = 500) {
  try {
    return await fetchPromise();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryFetch(fetchPromise, retries - 1, delay * 2);
  }
}
