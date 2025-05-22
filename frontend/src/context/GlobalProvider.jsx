import { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../lib/apiService";

const GlobalContext = createContext();
export const useGlobalProvider = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [openCart, setOpenCart] = useState(false);
  const [notification, setNotification] = useState(null);

  // Ensure apiService always has the latest token
  useEffect(() => {
    apiService.setToken(token);
  }, [token]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await checkToken(localStorage.getItem("token"));
      setIsLoading(false);
    };
    initialize();
    // eslint-disable-next-line
  }, []);

  // Auto-hide notifications after timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const setUserAndToken = (data) => {
    const { access_token, user } = data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    setUser(user);
  };

  const checkToken = async (token) => {
    if (token) {
      apiService.setToken(token); // Ensure apiService has the token
      const { data, error } = await apiService.get("/user/me");
      if (!error && data && data.user) { // Check if data.user is present
        setUser(data.user); // Set user from LoginResponse
        return;
      }
      if (error) { // It's good practice to show error if the call fails
        showError(error.message || "Failed to fetch user details.");
      }
    }
    // If no token, or if /user/me failed and didn't set user, then logout.
    // However, if there was an error but data was somehow set, we might not want to logout immediately.
    // For now, if we reach here means token is invalid or /user/me failed to provide user data.
    if (!user) { // only logout if user wasn't set by a successful /user/me
        await logout();
    }
  };

  /**
   * Display a notification
   * @param {Object} notificationData - The notification data
   * @param {string} notificationData.message - The message to display
   * @param {string} notificationData.type - The type of notification ('error', 'success', 'info', 'warning')
   */
  const notify = (notificationData) => {
    setNotification({
      id: Date.now(), // Unique identifier for notifications
      ...notificationData,
      type: notificationData.type || 'info'
    });
  };

  const showError = (message) => {
    notify({ message, type: 'error' });
  };

  const showSuccess = (message) => {
    notify({ message, type: 'success' });
  };

  /**
   * Add an item to the cart.
   * @param {string|number} id
   * @param {number} count
   * @param {object} item
   */
  const addItemToCart = (id, count, item) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (id in newCart) {
        newCart[id].count += count;
      } else {
        newCart[id] = { ...item, count: count };
      }
      
      // Save cart to localStorage for persistence
      try {
        localStorage.setItem('cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Error saving cart to localStorage', e);
      }
      
      return newCart;
    });
    setOpenCart(true);
  };

  /**
   * Remove a quantity of an item from the cart.
   * @param {string|number} id
   * @param {number} count
   */
  const removeItemFromCart = (id, count) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (!(id in newCart)) return newCart;
      newCart[id].count -= count;
      if (newCart[id].count <= 0) {
        delete newCart[id];
      }
      
      // Save cart to localStorage for persistence
      try {
        localStorage.setItem('cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Error saving cart to localStorage', e);
      }
      
      return newCart;
    });
  };

  /**
   * Delete an item from the cart.
   * @param {string|number} id
   */
  const deleteItemFromCart = (id) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (id in newCart) {
        delete newCart[id];
      }
      
      // Save cart to localStorage for persistence
      try {
        localStorage.setItem('cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Error saving cart to localStorage', e);
      }
      
      return newCart;
    });
  };
  
  /**
   * Clear all items from the cart.
   */
  const clearCart = () => {
    setCartItems({});
    localStorage.removeItem('cart');
  };

  // Load cart from localStorage on initial load
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
    }
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        token,
        setToken,
        user,
        setUser,
        isLoading,
        setIsLoading,
        logout,
        setUserAndToken,
        addItemToCart,
        removeItemFromCart,
        cartItems,
        deleteItemFromCart,
        clearCart,
        openCart,
        setOpenCart,
        notify,
        showError,
        showSuccess,
        notification
      }}
    >
      {children}
      
      {/* Notification Component */}
      {notification && (
        <div 
          className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg shadow-lg p-4 transition-all duration-300 animate-slide-in ${
            notification.type === 'error' 
              ? 'bg-red-600 text-white' 
              : notification.type === 'success' 
              ? 'bg-green-600 text-white'
              : notification.type === 'warning'
              ? 'bg-yellow-500 text-white'
              : 'bg-blue-600 text-white'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center">
            {notification.type === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === 'success' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === 'warning' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
