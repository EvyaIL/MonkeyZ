import { useGlobalProvider } from "../context/GlobalProvider";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "./buttons/PrimaryButton";
import SecondaryButton from "./buttons/SecondaryButton";
import { useState, useEffect, useRef } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const {
    user,
    cartItems,
    removeItemFromCart,
    addItemToCart,
    deleteItemFromCart,
    openCart,
    setOpenCart,
    logout,
  } = useGlobalProvider();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const cartRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Handle clicks outside the cart
  useEffect(() => {
    if (!openCart) return;
    
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
  }, [openCart, setOpenCart]);

  // Handle clicks outside mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Calculate total items in cart for badge
  const totalCartItems = Object.values(cartItems).reduce((acc, item) => acc + item.count, 0);
  
  // Calculate total price
  const cartTotal = Object.values(cartItems).reduce(
    (acc, item) => acc + item.price * item.count, 
    0
  ).toFixed(2);

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

          {/* Language + Auth + Cart Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Auth / User Menu */}
            {user ? (
              <div className="relative">
                <button 
                  className="gap-2 cursor-pointer rounded-full border-2 border-accent/30 dark:border-accent/50 p-2 hover:bg-accent/10 dark:hover:bg-accent/20 transition-all duration-200 flex items-center"
                  aria-label="User menu"
                  aria-expanded="false"
                  onClick={() => document.getElementById('user-dropdown').classList.toggle('hidden')}
                >
                  <span className="font-medium text-primary dark:text-accent text-sm truncate max-w-24 md:max-w-none">
                    {`${t("welcome_prefix", "Welcome")}${user.username ? `, ${user.username}` : ""}!`}
                  </span>
                </button>

                {/* User Dropdown Menu - Using click toggle instead of hover */}
                <div 
                  id="user-dropdown"
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 hidden z-50 transform origin-top-right transition-all duration-150 ease-in-out"
                >
                  <Link 
                    to="/account" 
                    className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-accent/10 rounded-md rtl:text-right"
                  >
                    {t("profile")}
                  </Link>
                  <button 
                    onClick={logout} 
                    className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-accent/10 rounded-md rtl:text-right"
                  >
                    {t("logout")}
                  </button>
                </div>
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
              onClick={() => setOpenCart(true)}
              aria-label={t("cart")}
              title={t("cart")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg"
        >
          <div className="flex flex-col gap-4">
            <Link 
              to="/products"
              className="px-4 py-2 hover:bg-gray-700 rounded-md"
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
            
            <div className="pt-2 border-t border-gray-700">
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
      )}

      {/* Shopping Cart Drawer */}
      <div
        ref={cartRef}
        className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto overflow-x-hidden rounded-l-md w-full max-w-md ${
          openCart ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300`}
        aria-label={t("cart")}
        aria-hidden={!openCart}
        tabIndex={openCart ? 0 : -1}
      >
        {/* Cart Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary dark:text-white">{t("cart")}</h2>
          <button
            className="text-gray-400 hover:text-white p-1"
            onClick={() => setOpenCart(false)}
            aria-label={t("close_cart")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
          <div className="space-y-4 flex flex-col h-[calc(100%-120px)]">
            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {Object.values(cartItems).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-gray-700 pb-4"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/100?text=Product";
                      }}
                    />
                    <div>
                      <h3 className="text-white font-medium">{typeof item.name === "object" ? (item.name[i18n.language] || item.name.en) : item.name}</h3>
                      <p className="text-gray-400 text-sm">
                        ₪{item.price.toFixed(2)} × {item.count}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-700 rounded">
                      <button
                        className="px-2 py-1 text-white hover:bg-gray-700"
                        onClick={() => removeItemFromCart(item.id, 1, item)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 text-white">{item.count}</span>
                      <button
                        className="px-2 py-1 text-white hover:bg-gray-700"
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
                <span>₪{cartTotal}</span>
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
};

export default Navbar;
