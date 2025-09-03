import { useGlobalProvider } from "../context/GlobalProvider";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "./buttons/PrimaryButton";
import SecondaryButton from "./buttons/SecondaryButton";
import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { useTranslation } from "react-i18next";

const Navbar = memo(() => {
  const {
    user,
    cartItems,
    removeItemFromCart,
    addItemToCart,
    deleteItemFromCart,
    validateCartItems,
    cleanCartItems,
    openCart,
    setOpenCart,
    logout,
    notify,
  } = useGlobalProvider();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const cartRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Handle clicks outside the cart and validate cart items when opened
  useEffect(() => {
    if (!openCart) return;
    
    // Validate cart items when cart is opened
    validateCartItems();
    
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setOpenCart(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    // Prevent background scroll when cart is open
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [openCart, setOpenCart, validateCartItems]);

  // Handle clicks outside mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const handleClickOutside = (event) => {
      // Don't close if clicking on the mobile menu button itself
      const mobileMenuButton = event.target.closest('[aria-label*="menu"]');
      if (mobileMenuButton) return;
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    
    // Use a small delay to avoid immediate closing when menu opens
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Handle clicks outside user menu
  useEffect(() => {
    if (!userMenuOpen) return;
    
    const handleClickOutside = (event) => {
      // Don't close if clicking on the user menu button itself
      const userMenuButton = event.target.closest('#user-menu-button');
      if (userMenuButton) return;
      
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    
    // Use a small delay to avoid immediate closing when menu opens
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [userMenuOpen]);

  // Close user menu when route changes
  useEffect(() => {
    setUserMenuOpen(false);
  }, [navigate]);

  // Memoize cart calculations to prevent unnecessary re-renders
  const cartStats = useMemo(() => {
    const cartValues = Object.values(cartItems);
    return {
      totalItems: cartValues.reduce((acc, item) => acc + item.count, 0),
      totalPrice: cartValues.reduce((acc, item) => acc + item.price * item.count, 0).toFixed(2)
    };
  }, [cartItems]);

  // Memoize cart toggle handler
  const handleCartToggle = useCallback(() => {
    setOpenCart(!openCart);
  }, [openCart, setOpenCart]);

  // Memoize mobile menu toggle with enhanced event handling
  const handleMobileMenuToggle = useCallback((event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Mobile menu toggle clicked'); // Debug log
    setMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <header className="top-0 z-20 sticky">
      <nav
        className="p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md w-full"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-accent hover:text-accent/80 transition-colors"
            aria-label="MonkeyZ Home"
          >
            MonkeyZ
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex gap-6 text-lg items-center">
            <Link
              to="/products"
              className="hover:text-accent transition-colors"
            >
              {t("all_products")}
            </Link>
            <Link
              to="/about"
              className="hover:text-accent transition-colors"
            >
              {t("about_us")}
            </Link>
            <Link
              to="/contact"
              className="hover:text-accent transition-colors"
            >
              {t("contact")}
            </Link>
            <Link
              to="/faq"
              className="hover:text-accent transition-colors"
            >
              {t("faq")}
            </Link>
            <Link
              to="/blog"
              className="hover:text-accent transition-colors"
            >
              {t("blog")}
            </Link>
          </div>

          {/* Language + Theme + Auth + Cart Controls */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            {/* Auth / User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  id="user-menu-button"
                  className="gap-2 cursor-pointer rounded-full border-2 border-accent/30 dark:border-accent/50 p-2 hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-200 flex items-center"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="font-medium text-primary dark:text-accent text-sm truncate max-w-24 md:max-w-none">
                    {`${t("welcome_prefix", "Welcome")}${user.username ? `, ${user.username}` : ""}!`}
                  </span>
                </button>

                {/* User Dropdown Menu - Using state instead of hidden class */}
                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 z-50 transform origin-top-right transition-all duration-150 ease-in-out"
                  >                  <Link 
                    to="/account" 
                    className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-accent/10 rounded-md rtl:text-right"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {t("profile")}
                  </Link>
                  {user.role === 0 && (
                    <Link 
                      to="/dashboard/admin" 
                      className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-accent/10 rounded-md rtl:text-right"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t("admin")}
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }} 
                    className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-accent/10 rounded-md rtl:text-right"
                  >
                    {t("logout")}
                  </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <PrimaryButton
                  title={t("sign_in")}
                  onClick={() => navigate("/sign-in")}
                />
                <SecondaryButton
                  title={t("sign_up")}
                  onClick={() => navigate("/sign-up")}
                />
              </div>
            )}

            {/* Cart Button */}
            <button
              className="relative bg-accent hover:bg-accent-dark transition-colors duration-200 p-2 rounded-lg text-white flex items-center shadow-sm"
              onClick={handleCartToggle}
              aria-label={t("cart")}
              title={t("cart")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              
              {cartStats.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartStats.totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-200 touch-manipulation"
              onClick={handleMobileMenuToggle}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              type="button"
              style={{ touchAction: 'manipulation' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </nav>          {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg"
        >
          {/* Mobile Menu Header with Close Button */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t("menu", "Menu")}</h3>
            <button
              onClick={handleMobileMenuToggle}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close menu"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            <Link              to="/products"
              className="px-4 py-2 text-gray-800 dark:text-white hover:bg-accent/10 dark:hover:bg-gray-700 rounded-md hover:text-accent dark:hover:text-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("all_products")}
            </Link>
            <Link 
              to="/about"
              className="px-4 py-2 hover:bg-gray-700 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("about_us")}
            </Link>
            <Link 
              to="/contact"
              className="px-4 py-2 hover:bg-gray-700 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("contact")}
            </Link>
            <Link 
              to="/faq"
              className="px-4 py-2 hover:bg-gray-700 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("faq")}
            </Link>
            <Link 
              to="/blog"
              className="px-4 py-2 hover:bg-gray-700 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("blog")}
            </Link>
            
            <div className="pt-2 border-t border-gray-700 flex flex-col gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            
            {!user && (
              <div className="flex flex-col gap-2 pt-2">
                <PrimaryButton
                  title={t("sign_in")}
                  onClick={() => {
                    navigate("/sign-in");
                    setMobileMenuOpen(false);
                  }}
                />
                <SecondaryButton
                  title={t("sign_up")}
                  onClick={() => {
                    navigate("/sign-up");
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}      {/* Shopping Cart Drawer */}
      <div
        ref={cartRef}
        className={`fixed top-0 ${i18n.language === "he" ? "left-0 border-r rounded-r-md" : "right-0 border-l rounded-l-md"} h-full bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700 p-6 overflow-y-auto overflow-x-hidden w-full max-w-md ${
          openCart ? "translate-x-0" : i18n.language === "he" ? "-translate-x-full" : "translate-x-full"
        } transition-transform duration-300`}
        aria-label={t("cart")}
        aria-hidden={!openCart}
        tabIndex={openCart ? 0 : -1}
        dir={i18n.language === "he" ? "rtl" : "ltr"}
      >
        {/* Cart Header */}
        <div className={`flex justify-between items-center mb-4 ${i18n.language === "he" ? "flex-row-reverse" : ""}`}>
          <h2 className="text-xl font-bold text-primary dark:text-white">{t("cart")}</h2>
          <div className="flex items-center gap-2">
            {/* Refresh Cart Button */}
            <button
              onClick={() => validateCartItems()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 transition-colors"
              aria-label="Refresh cart"
              title="Check for product availability"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* Clean Cart Button */}
            <button
              onClick={() => {
                cleanCartItems();
                notify({
                  message: "Cart items cleaned and fixed",
                  type: "success"
                });
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 transition-colors"
              aria-label="Clean cart"
              title="Fix cart item structure"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {/* Close Button */}
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 transition-colors"
              onClick={() => {
                setOpenCart(false);
                setMobileMenuOpen(false);
              }}
              aria-label={t("close_cart")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cart Content */}
        {Object.keys(cartItems).length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16 mx-auto text-gray-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-400 text-lg">{t("cart_empty")}</p>
            <button
              onClick={() => {
                setOpenCart(false);
                navigate("/products");
              }}
              className="mt-4 bg-accent text-white px-4 py-2 rounded hover:bg-accent/80 transition-colors"
            >
              {t("all_products")}
            </button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-[calc(100%-130px)]">
            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">              {Object.values(cartItems).map((item, idx) => (
                <div
                  key={item.id || item.productId || `cart-item-${idx}`}
                  className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 ${i18n.language === "he" ? "flex-row-reverse" : ""}`}
                >                  <div className={`flex items-center gap-3 ${i18n.language === "he" ? "flex-row-reverse" : ""}`}>                    <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <img 
                        src={
                          item.imageUrl || 
                          item.image || 
                          item.images?.[0] || 
                          (typeof item.images === "string" ? item.images : null) ||
                          "/placeholder-product.svg"
                        }
                        alt={typeof item.name === "object" ? (item.name[i18n.language] || item.name.en) : item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Try alternative image sources on error
                          const currentSrc = e.target.src;
                          
                          if (currentSrc.includes("placeholder-product.svg")) {
                            // Already tried placeholder, show a colored background instead
                            e.target.style.display = "none";
                            const productInitial = typeof item.name === "object" ? 
                              (item.name[i18n.language] || item.name.en || "Product").charAt(0) : 
                              (item.name || "P").charAt(0);
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                                ${productInitial}
                              </div>
                            `;
                          } else if (item.image && !currentSrc.includes(item.image)) {
                            // Try the 'image' field if we haven't tried it yet
                            e.target.src = item.image;
                          } else if (item.images?.[0] && !currentSrc.includes(item.images[0])) {
                            // Try the first image from images array
                            e.target.src = item.images[0];
                          } else {
                            // Fallback to placeholder
                            e.target.src = "/placeholder-product.svg";
                          }
                        }}
                        onLoad={() => {
                          // Image loaded successfully, no need for console logging in production
                        }}
                      />
                    </div>
                    <div className={i18n.language === "he" ? "text-right" : "text-left"}>
                      <h3 className="text-gray-800 dark:text-white font-medium">{typeof item.name === "object" ? (item.name[i18n.language] || item.name.en) : item.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        ₪{item.price.toFixed(2)} × {item.count}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${i18n.language === "he" ? "flex-row-reverse" : ""}`}>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                      <button
                        className="px-2 py-1 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => removeItemFromCart(item.id, 1, item)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 text-gray-800 dark:text-white min-w-[2rem] text-center">{item.count}</span>
                      <button
                        className="px-2 py-1 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => addItemToCart(item.id, 1, item)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-400 p-1"
                      onClick={() => deleteItemFromCart(item.id)}
                      aria-label={`${t("remove_prefix", "Remove")} ${item.name} ${t("from_cart_suffix", "from cart")}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Cart Total & Checkout */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between font-bold text-lg mb-4 text-gray-800 dark:text-white">
                <span>{t("total")}:</span>
                <span>₪{cartStats.totalPrice}</span>
              </div>
              <button
                className="w-full bg-accent text-white py-3 rounded font-semibold hover:bg-accent/80 transition-colors"
                onClick={() => {
                  setOpenCart(false);
                  navigate("/checkout");
                }}
              >
                {t("checkout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
