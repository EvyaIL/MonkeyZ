import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "./buttons/PrimaryButton";
import SecondaryButton from "./buttons/SecondaryButton";
import { useEffect, useRef, useState } from "react";
import Role from "./lib/models";
import Cart from "./cart/Cart";

const Navbar = () => {
    const { user, cartItems, openCart, setOpenCart } = useGlobalProvider();
    const navigate = useNavigate();

    const cartRef = useRef(null);

<<<<<<< Updated upstream
    useEffect(() => {
        if(openCart == false) return;
        const handleClickOutside = (event) => {
            if (cartRef.current && !cartRef.current.contains(event.target)) {
=======
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
              <div className="relative group">
                <button 
                  className="gap-2 cursor-pointer rounded-full border-2 border-gray-300 dark:border-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center"
                  aria-label="User menu"
                  aria-expanded="false"
                >
                  <span className="font-medium text-primary dark:text-accent text-sm truncate max-w-24 md:max-w-none">
                    {`${t("welcome_prefix", "Welcome")}${user.username ? `, ${user.username}` : ""}!`}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 hidden group-hover:block z-50">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    {t("profile")}
                  </Link>
                  {/* Admin Panel Link - Only visible for manager role (role = 0) */}
                  {user && user.role === 0 && (
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-accent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium"
                    >
                      {t("admin_panel", "Admin Panel")}
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/');
                    }} 
                    className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
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
              className="relative bg-gray-800 p-2 rounded-lg text-white flex items-center"
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
              className="md:hidden p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
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
            
            {/* Admin Panel Link for mobile - Only visible for manager role (role = 0) */}
            {user && user.role === 0 && (
              <Link 
                to="/admin"
                className="px-4 py-2 hover:bg-gray-700 rounded-md text-accent font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("admin_panel", "Admin Panel")}
              </Link>
            )}
            
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

            {/* User profile and logout for mobile */}
            {user && (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
                <Link 
                  to="/profile"
                  className="px-4 py-2 hover:bg-gray-700 rounded-md flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t("profile")}
                </Link>
                <button 
                  className="px-4 py-2 hover:bg-gray-700 rounded-md text-left flex items-center gap-2"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("logout")}
                </button>
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
>>>>>>> Stashed changes
                setOpenCart(false);
         
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setOpenCart]);

    return (
        <div className="top-0 z-20 sticky ">
            <nav className="p-4 bg-secondary text-white shadow-md flex justify-between items-center w-full">
                <div className="text-2xl font-bold text-accent cursor-pointer" onClick={() => navigate("/")}>
                    KeyShop
                </div>

                <div className="space-x-6 text-lg">
                    <button className="hover:text-accent transition" onClick={() => navigate("/products")}>
                        All Products
                    </button>
                    <button className="hover:text-accent transition" onClick={() => navigate("/about")}>
                        About Us
                    </button>
                </div>

                <div className="flex items-center space-x-4 select-none">
                    {user ? (
                        <div className="flex space-x-5">

                            {user.role == Role.MANAGER &&
                                <div>
                                    <PrimaryButton title="dashboard" onClick={() => navigate("/dashboard")} />
                                </div>
                            }
                            <div
                                className="space-x-3 cursor-pointer rounded-full border-2 border-border p-2"
                                onClick={() => navigate("/profile")}
                            >
                                Welcome back{" "}
                                <span className="text-accent font-semibold">{user?.username}</span>
                            </div>

                        </div>
                    ) : (
                        <div className="space-x-3">
                            <PrimaryButton title="Sign In" onClick={() => navigate("/sign-in")} />
                            <SecondaryButton title="Sign Up" onClick={() => navigate("/sign-up")} />
                        </div>
                    )}

                    <button
                        className="relative bg-gray-800 px-3 py-2 rounded-lg text-white flex items-center"
                        onClick={() => setOpenCart(true)}
                    >
                        🛒
                        {Object.keys(cartItems).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-danger text-xs px-2 py-1 rounded-full text-white">
                                {Object.keys(cartItems).length}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

                <Cart cartRef={cartRef} />
                
        </div>
    );
};

export default Navbar;
