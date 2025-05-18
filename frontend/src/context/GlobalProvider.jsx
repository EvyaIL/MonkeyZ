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

  const showError = (message) => {
    // You can replace this with a toast/notification system
    console.error("Error:", message);
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
      return newCart;
    });
  };

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
        openCart,
        setOpenCart,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
