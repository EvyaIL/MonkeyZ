import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "../lib/apiService";
import { trackAddToCart, trackEvent } from "../lib/analytics";

const GlobalContext = createContext();
export const useGlobalProvider = () => useContext(GlobalContext);

const GlobalProvider = React.memo(({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [openCart, setOpenCart] = useState(false);
  const [notification, setNotification] = useState(null);
  // Coupon and customer email for checkout
  const [couponCode, setCouponCode] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Theme state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'; // Default to light theme
    }
    return 'light';
  });

  // Memoized cart calculations for performance
  const cartSummary = useMemo(() => {
    const items = Object.values(cartItems);
    const totalItems = items.reduce((sum, item) => sum + item.count, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.count), 0);
    return { items, totalItems, totalPrice, isEmpty: items.length === 0 };
  }, [cartItems]);

  // Memoized theme configuration
  const themeConfig = useMemo(() => ({
    current: theme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }), [theme]);

  // For auto-logout on token expiry
  useEffect(() => {
    if (!token) {
      setUser(null);
    }
  }, [token]);

  const logout = async () => {
    if (user && user.id) {
      trackEvent('logout', {
        user_properties: {
          user_id: user.id,
          user_role: user.role
        }
      });
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    setToken(null);
    setUser(null);
  };

  const setUserAndToken = (data) => {
    if (!data || !data.access_token) {
      console.error('Invalid data passed to setUserAndToken:', data);
      return;
    }
    
    const { access_token, user } = data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    setUser(user);
    
    if (user) {
      const userData = {
        id: user.id,
        created_at: user.created_at,
        role: user.role,
        language: user.language || localStorage.getItem('i18nextLng')
      };
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      trackEvent('login', {
        method: 'credentials',
        user_properties: {
          user_id: user.id,
          user_role: user.role
        }
      });
    }
  };

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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
  const checkToken = async (token) => {
    if (token) {
      apiService.setToken(token); // Ensure apiService has the token
      const { data, error } = await apiService.get("/user/me");
      if (!error && data) { 
        // Backend /user/me now returns SelfResponse directly (user object)
        setUser(data); // Set user from the response data directly
        return;
      }
      if (error) { 
        // Only show error if it's not a 401 (unauthorized) - those are expected when token expires
        if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
          showError(error.message || "Failed to fetch user details.");
        }
      }
    }
    // If no token, or if /user/me failed, then logout
    if (!user) { 
        await logout();
    }
  };

  /**
   * Display a notification - optimized with useCallback
   */
  const notify = useCallback((notificationData) => {
    setNotification({
      id: Date.now(), // Unique identifier for notifications
      ...notificationData,
      type: notificationData.type || 'info'
    });
  }, []);

  const showError = (message) => {
    notify({ message, type: 'error' });
  };

  const showSuccess = (message) => {
    notify({ message, type: 'success' });
  };

  /**
   * Add an item to the cart - optimized with useCallback
   */
  const addItemToCart = useCallback((id, count, item) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      
      // Ensure we have a valid product ID - handle MongoDB _id and regular id
      const productId = id || item?.id || item?.productId || item?._id;
      if (!productId) {
        console.error('Cannot add item to cart: missing product ID', { id, item });
        return prev; // Don't add if no valid ID
      }
      
      if (productId in newCart) {
        newCart[productId].count += count;
      } else {
        // Ensure we have a consistent image field for cart display
        const cartItem = { 
          ...item, 
          count: count,
          // Always ensure productId and id are present for backend compatibility
          productId: productId,
          id: productId,
          // Ensure price is a number
          price: typeof item?.price === 'number' ? item.price : 0,
          // Prioritize imageUrl, then image for cart display
          image: item?.imageUrl || item?.image || item?.images?.[0] || null,
          // Add validation timestamp to prevent aggressive removal
          lastValidated: Date.now()
        };
        newCart[productId] = cartItem;
      }
      
      // Save cart to localStorage for persistence
      try {
        localStorage.setItem('cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Error saving cart to localStorage', e);
      }
      
      return newCart;
    });
    
    // Track the add to cart event for analytics
    if (item) {
      trackAddToCart(item, count);
    }
    
    setOpenCart(true);
  }, []);

  /**
   * Remove a quantity of an item from the cart - optimized with useCallback
   */
  const removeItemFromCart = useCallback((id, count) => {
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
  }, []);

  /**
   * Delete an item from the cart - optimized with useCallback
   */
  const deleteItemFromCart = useCallback((id) => {
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
  }, []);
  
  /**
   * Clear all items from the cart - optimized with useCallback
   */
  const clearCart = useCallback(() => {
    setCartItems({});
    localStorage.removeItem('cart');
  }, []);

  /**
   * Clean and fix cart items that may be missing required fields
   */
  const cleanCartItems = useCallback(() => {
    setCartItems((prev) => {
      const cleanedCart = {};
      let hasChanges = false;

      Object.entries(prev).forEach(([key, item]) => {
        // Ensure each cart item has both productId and id fields
        const productId = item?.productId || item?.id || key;
        
        // Skip items without valid product ID
        if (!productId) {
          console.warn('Removing cart item with no valid product ID:', item);
          hasChanges = true;
          return;
        }
        
        const cleanedItem = {
          ...item,
          productId: productId,
          id: productId,
          // Ensure count is a positive number
          count: typeof item?.count === 'number' && item.count > 0 ? item.count : 1,
          // Ensure price is a number
          price: typeof item?.price === 'number' ? item.price : 0,
          // Add validation timestamp if missing
          lastValidated: item?.lastValidated || Date.now()
        };

        // Check if item was actually cleaned
        if (JSON.stringify(item) !== JSON.stringify(cleanedItem)) {
          hasChanges = true;
          console.log('Cleaned cart item:', { original: item, cleaned: cleanedItem });
        }

        cleanedCart[productId] = cleanedItem;
      });

      if (hasChanges) {
        // Save cleaned cart to localStorage
        try {
          localStorage.setItem('cart', JSON.stringify(cleanedCart));
          console.log('Cart cleaned and saved to localStorage');
        } catch (e) {
          console.error('Error saving cleaned cart to localStorage', e);
        }
      }

      return cleanedCart;
    });
  }, []);

  /**
   * Validate cart items against current products and remove deleted/unavailable items
   */
  const validateCartItems = useCallback(async () => {
    const cartItemIds = Object.keys(cartItems);
    if (cartItemIds.length === 0) return;

    try {
      // Get all current products to validate against
      const { data: allProducts } = await apiService.get('/product/all');
      
      if (!allProducts || !Array.isArray(allProducts)) {
        console.warn('Unable to validate cart items - products not available');
        return;
      }

      const validProductIds = new Set(allProducts.map(p => p.id));
      const itemsToRemove = [];

      // Check each cart item
      cartItemIds.forEach(cartItemId => {
        if (!validProductIds.has(cartItemId)) {
          const cartItem = cartItems[cartItemId];
          // Only remove if product is definitely deleted (not just a temporary API issue)
          if (cartItem && cartItem.lastValidated && (Date.now() - cartItem.lastValidated > 24 * 60 * 60 * 1000)) {
            itemsToRemove.push(cartItemId);
          }
        } else {
          // Mark as validated if product exists
          if (cartItems[cartItemId]) {
            cartItems[cartItemId].lastValidated = Date.now();
          }
        }
      });

      // Remove invalid items only after 24 hours of being invalid
      if (itemsToRemove.length > 0) {
        setCartItems((prev) => {
          const newCart = { ...prev };
          itemsToRemove.forEach(id => {
            delete newCart[id];
          });
          
          // Save updated cart to localStorage
          try {
            localStorage.setItem('cart', JSON.stringify(newCart));
          } catch (e) {
            console.error('Error saving cart to localStorage', e);
          }
          
          return newCart;
        });

        // Notify user about removed items
        if (itemsToRemove.length === 1) {
          notify({
            message: "An item in your cart was no longer available and has been removed.",
            type: "warning"
          });
        } else {
          notify({
            message: `${itemsToRemove.length} items in your cart were no longer available and have been removed.`,
            type: "warning"
          });
        }
      }
    } catch (error) {
      console.error('Error validating cart items:', error);
      // Don't remove items if validation fails due to network issues
    }
  }, [cartItems, notify]);

  // Load cart from localStorage on initial load and validate items
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        
        // Clean cart items after loading to ensure proper structure
        const cleanTimer = setTimeout(() => {
          cleanCartItems();
        }, 1000); // Clean after 1 second
        
        // Validate cart items after a longer delay to allow API to be ready and avoid aggressive validation
        const validateTimer = setTimeout(() => {
          validateCartItems();
        }, 10000); // Increased from 2 seconds to 10 seconds
        
        return () => {
          clearTimeout(cleanTimer);
          clearTimeout(validateTimer);
        };
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
      // Clear corrupted cart data
      localStorage.removeItem('cart');
    }
  }, [cleanCartItems]); // Include cleanCartItems dependency

  // Validate cart items periodically when cart is not empty
  useEffect(() => {
    const cartItemCount = Object.keys(cartItems).length;
    if (cartItemCount === 0) return;

    // Validate cart items less frequently when cart is not empty
    const validationInterval = setInterval(() => {
      validateCartItems();
    }, 15 * 60 * 1000); // Increased from 5 minutes to 15 minutes

    return () => clearInterval(validationInterval);
  }, [Object.keys(cartItems).length]); // Only re-run when cart item count changes

  /**
   * Sync cart items with updated product data (names, prices, availability)
   */
  const syncCartWithProducts = useCallback(async () => {
    const cartItemIds = Object.keys(cartItems);
    if (cartItemIds.length === 0) return;

    try {
      // Get current product data
      const { data: allProducts } = await apiService.get('/product/all');
      
      if (!allProducts || !Array.isArray(allProducts)) {
        console.warn('Unable to sync cart items - products not available');
        return;
      }

      // Create a map for quick product lookup
      const productMap = new Map(allProducts.map(p => [p.id, p]));
      let hasUpdates = false;

      setCartItems((prev) => {
        const newCart = { ...prev };

        Object.entries(prev).forEach(([cartItemId, cartItem]) => {
          const currentProduct = productMap.get(cartItemId);
          
          if (currentProduct) {
            // Check if product data has changed
            const priceChanged = cartItem.price !== currentProduct.price;
            const nameChanged = cartItem.name !== currentProduct.name;
            const imageChanged = cartItem.image !== (currentProduct.imageUrl || currentProduct.image);
            
            if (priceChanged || nameChanged || imageChanged) {
              hasUpdates = true;
              
              // Update cart item with new product data
              newCart[cartItemId] = {
                ...cartItem,
                name: currentProduct.name,
                price: currentProduct.price,
                image: currentProduct.imageUrl || currentProduct.image || currentProduct.images?.[0] || cartItem.image,
                lastUpdated: Date.now()
              };
              
              console.log(`Cart item updated: ${currentProduct.name}`, {
                priceChanged: priceChanged ? `${cartItem.price} → ${currentProduct.price}` : false,
                nameChanged: nameChanged ? `${cartItem.name} → ${currentProduct.name}` : false,
                imageChanged
              });
            }
          }
        });

        if (hasUpdates) {
          // Save updated cart to localStorage
          try {
            localStorage.setItem('cart', JSON.stringify(newCart));
            
            // Notify user about updates
            notify({
              message: "Your cart has been updated with the latest product information.",
              type: "info"
            });
          } catch (e) {
            console.error('Error saving updated cart to localStorage', e);
          }
        }

        return newCart;
      });
    } catch (error) {
      console.error('Error syncing cart with products:', error);
    }
  }, [cartItems, notify]);

  // Sync cart with products periodically
  useEffect(() => {
    const cartItemCount = Object.keys(cartItems).length;
    if (cartItemCount === 0) return;

    // Initial sync after a short delay
    const initialSyncTimer = setTimeout(() => {
      syncCartWithProducts();
    }, 5000);

    // Regular sync every 30 minutes when cart has items
    const syncInterval = setInterval(() => {
      syncCartWithProducts();
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(syncInterval);
    };
  }, [Object.keys(cartItems).length, syncCartWithProducts]);

  /**
   * Update cart items when a product is edited in admin panel
   */
  const updateCartItemForProduct = useCallback((productId, updatedProductData) => {
    console.log('🔄 Checking cart for product to update:', productId, updatedProductData);
    
    // Check if this product exists in the cart
    if (!cartItems[productId]) {
      console.log('✓ Product not in cart, no update needed');
      return;
    }
    
    const currentCartItem = cartItems[productId];
    console.log('🔍 Found product in cart, updating...', currentCartItem);
    
    // Create updated cart item with new product data
    const updatedCartItem = {
      ...currentCartItem, // Keep existing cart data like count
      id: updatedProductData.id,
      productId: updatedProductData.id,
      name: updatedProductData.name,
      price: Number(updatedProductData.price),
      image: updatedProductData.imageUrl || updatedProductData.image,
      imageUrl: updatedProductData.imageUrl,
      lastUpdated: Date.now()
    };
    
    // Update the cart
    setCartItems(prev => {
      const newCart = {
        ...prev,
        [productId]: updatedCartItem
      };
      
      // Save to localStorage
      try {
        localStorage.setItem('cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Error saving updated cart to localStorage', e);
      }
      
      console.log('✅ Cart item updated automatically:', updatedCartItem);
      return newCart;
    });
    
    // Show notification to user
    notify({
      message: `Cart updated! "${typeof updatedProductData.name === 'object' ? updatedProductData.name.en || updatedProductData.name.he : updatedProductData.name}" has been updated with latest information.`,
      type: "info"
    });
    
  }, [cartItems, notify]);

  /**
   * Remove cart items when a product is deleted in admin panel
   */
  const removeCartItemForDeletedProduct = useCallback((productId) => {
    console.log('🗑️ Checking cart for deleted product to remove:', productId);
    
    // Check if this product exists in the cart
    if (!cartItems[productId]) {
      console.log('✓ Deleted product not in cart, no removal needed');
      return;
    }
    
    const deletedCartItem = cartItems[productId];
    console.log('🔍 Found deleted product in cart, removing...', deletedCartItem);
    
    // Remove the item from cart
    setCartItems(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      
      // Save to localStorage
      try {
        localStorage.setItem('cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Error saving updated cart to localStorage', e);
      }
      
      console.log('✅ Deleted product removed from cart:', deletedCartItem.name);
      return newCart;
    });
    
    // Show notification to user
    const productName = typeof deletedCartItem.name === 'object' 
      ? deletedCartItem.name.en || deletedCartItem.name.he 
      : deletedCartItem.name;
    
    notify({
      message: `"${productName}" has been removed from your cart because it's no longer available.`,
      type: "warning"
    });
    
  }, [cartItems, notify]);

  // eslint-disable-next-line no-unused-vars
  const value = {
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
    validateCartItems,
    cleanCartItems,
    openCart,
    setOpenCart,
    notify,
    showError,
    showSuccess,
    notification,
    theme,
    toggleTheme,
    couponCode,
    setCouponCode,
    customerEmail,
    setCustomerEmail
  };
  return (
    <GlobalContext.Provider
      value={{
        token,
        notify,
        user,
        isLoading,
        cartItems,
        openCart,
        setOpenCart,
        notification,
        theme,
        setTheme,
        toggleTheme,
        logout,
        setUserAndToken,
        addItemToCart,
        removeItemFromCart,
        deleteItemFromCart,
        clearCart,
        validateCartItems,
        cleanCartItems,
        syncCartWithProducts,
        updateCartItemForProduct, // Add the new function
        removeCartItemForDeletedProduct, // Add the delete function
        showError,
        showSuccess,
        couponCode,
        setCouponCode,
        customerEmail,
        setCustomerEmail,
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
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 00-1 1v3a1 1 0 102 0V11a1 1 0 00-1-1z" clipRule="evenodd" />
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
});

// Set display name for debugging
GlobalProvider.displayName = 'GlobalProvider';

export default GlobalProvider;
