import React, { useState, useEffect, useRef, useCallback } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useGlobalProvider } from "../context/GlobalProvider";
import { getCurrentNonce, verifyPayPalCSP, fixDevelopmentCSP } from "../lib/cspNonce";
import { PAYPAL_CONFIG, getPayPalErrorMessage, preloadPayPalScript, measurePayPalPerformance } from "../lib/paypalConfig";

export default function Checkout() {
  const { cartItems, validateCartItems, cleanCartItems, clearCart, user } = useGlobalProvider();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderID, setOrderID] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [cspNonce, setCspNonce] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [componentKey, setComponentKey] = useState(0); // Key for PayPal component isolation

  // Refs for cleanup
  const paypalPerformanceRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);
  const isComponentMountedRef = useRef(true);
  const validateTimerRef = useRef(null); // Fix: Add missing validateTimer ref

  // Performance monitoring instance with cleanup tracking
  if (!paypalPerformanceRef.current) {
    paypalPerformanceRef.current = measurePayPalPerformance();
  }
  const paypalPerformance = paypalPerformanceRef.current;

  // Initialize CSP nonce and PayPal performance optimization with cleanup
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    // Suppress PayPal console warnings that are not critical
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.warn = (...args) => {
      // Filter out specific PayPal warnings that don't affect functionality
      const message = args.join(' ');
      if (message.includes('global_session_not_found') || 
          message.includes('prebuild') ||
          message.includes('sessionId') ||
          message.includes('csnwCorrelationId') ||
          message.includes('PayPal SDK')) {
        return; // Suppress these warnings
      }
      originalConsoleWarn.apply(console, args);
    };
    
    console.error = (...args) => {
      // Filter out specific PayPal errors that are warnings, not actual errors
      const message = args.join(' ');
      if (message.includes('global_session_not_found') ||
          message.includes('PayPal SDK')) {
        return; // Suppress this error as it's just a warning
      }
      originalConsoleError.apply(console, args);
    };
    
    // Also suppress window errors for PayPal
    const originalWindowError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (typeof message === 'string' && 
          (message.includes('global_session_not_found') || 
           message.includes('PayPal'))) {
        return true; // Suppress the error
      }
      if (originalWindowError) {
        return originalWindowError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Just clean cart items structure without removing items
    // This ensures the checkout page can be directly navigated to or refreshed
    cleanCartItems();
    
    // Set user email if available from context
    if (user?.email && !email) {
      setEmail(user.email);
    }
    
    // Set user name if available from context
    if (user?.name && !name) {
      setName(user.name);
    }
    
    return () => {
      if (validateTimerRef.current) {
        clearTimeout(validateTimerRef.current);
        validateTimerRef.current = null;
      }
    };
    
    // Initialize CSP nonce and PayPal performance optimization with cleanup
    const nonce = getCurrentNonce();
    setCspNonce(nonce);
    
    // Verify PayPal CSP configuration
    // In production, CSP is set via HTTP headers, not meta tags
    const isProduction = PAYPAL_CONFIG.isDevelopment;
    const cspValid = verifyPayPalCSP();
    
    // Only show CSP error if we're in production AND there's actually a CSP issue
    // In production, CSP headers are set by the server, so missing meta tag is normal
    if (!cspValid && isProduction) {
      // Check if we're actually in a production environment where CSP matters
      const hasCSPHeaders = document.location.protocol === 'https:';
      if (hasCSPHeaders) {
        console.warn('CSP configuration may need attention, but PayPal should still work with server-side CSP headers');
        // Don't set error - let PayPal try to load, server CSP headers should handle it
      }
    }

    // Create a unique component key to prevent zoid conflicts
    const uniqueKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setComponentKey(uniqueKey);
    
    // Performance Optimization: Preload PayPal script (PayPal Best Practice)
    if (PAYPAL_CONFIG.performance.enablePreload) {
      preloadPayPalScript()
        .then(() => {
          if (!isComponentMountedRef.current) return;
          
          // Instant render strategy (PayPal Best Practice) with delay to prevent zoid conflicts
          if (PAYPAL_CONFIG.performance.renderStrategy === 'instant') {
            // Small delay to prevent React StrictMode conflicts
            cleanupTimeoutRef.current = setTimeout(() => {
              if (isComponentMountedRef.current) {
                setPaypalLoaded(true);
              }
            }, 300);
          } else {
            // Delayed render with minimal delay
            cleanupTimeoutRef.current = setTimeout(() => {
              if (isComponentMountedRef.current) {
                setPaypalLoaded(true);
              }
            }, 800);
          }
        })
        .catch((error) => {
          if (!isComponentMountedRef.current) return;
          console.error('PayPal script preload failed:', error);
          setError('Unable to load payment services. Please check your internet connection.');
        });
    } else {
      // Fallback: Standard loading with performance timing
      cleanupTimeoutRef.current = setTimeout(() => {
        if (!isComponentMountedRef.current) return;
        
        setPaypalLoaded(true);
      }, 800);
    }

    // Cleanup function to prevent memory leaks and zoid conflicts
    return () => {
      isComponentMountedRef.current = false;
      
      // Restore original console methods
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      window.onerror = originalWindowError;
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
      
      // Reset PayPal loaded state to prevent stale renders
      setPaypalLoaded(false);
    };
  }, []); // Empty dependency array to run only once

  const cartArray = Object.values(cartItems);
  const subtotal = cartArray.reduce(
    (sum, item) => sum + item.price * item.count,
    0
  );
  const total = subtotal - discount;

  // Apply coupon
  const handleCoupon = async () => {
    setCouponMsg("");
    setDiscount(0);
    if (!coupon) return setCouponMsg("Enter a coupon code");
    
    // Debug logging for environment differences
    const apiUrl = process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il';
    console.log('Coupon validation - API URL:', apiUrl);
    console.log('Coupon validation - Environment:', process.env.NODE_ENV);
    console.log('Coupon validation - Current host:', window.location.host);
    
    try {
      const requestData = {
        code: coupon,
        amount: subtotal,
        email: email || user?.email || null, // Include user email for per-user validation
      };
      
      console.log('Coupon validation request:', requestData);
      
      const res = await axios.post(`${apiUrl}/api/coupons/validate`, requestData);
      
      console.log('Coupon validation response:', res.data);
      
      // Check if coupon validation was successful
      if (res.data.valid === false || res.data.error) {
        // Handle specific error cases
        const errorMessage = res.data.message || res.data.error || "Invalid coupon";
        setCouponMsg(errorMessage);
        setDiscount(0);
        
        // Explicitly display a message about user-specific usage limits
        if (res.data.alreadyUsed) {
          setCouponMsg(`You have already used this coupon (max ${res.data.maxUsagePerUser || 1} use(s) per user).`);
        }
        return;
      }
      
      // Check if this user has exceeded their usage limit
      if (res.data.coupon && res.data.coupon.userLimitExceeded) {
        // User has exceeded their limit - ensure no discount is applied
        setDiscount(0);
        setCouponMsg(`You've already used this coupon ${res.data.coupon.userUsageCount} time(s). Maximum allowed is ${res.data.coupon.maxUsagePerUser}.`);
      } 
      // Normal discount handling if limit not exceeded and discount is positive
      else if (res.data.discount && res.data.discount > 0) {
        setDiscount(res.data.discount);
        setCouponMsg(`Coupon applied - ₪${res.data.discount.toFixed(2)} off`);
        
        // Check if coupon is near its usage limit
        if (res.data.coupon) {
          const { usageCount, maxUses, userHasUsedCoupon, maxUsagePerUser, userUsageCount } = res.data.coupon;
          
          // Check for global usage limits
          if (maxUses && usageCount && maxUses > 0) {
            const remainingUses = maxUses - usageCount;
            const usagePercentage = (usageCount / maxUses) * 100;
            
            // Show notification when coupon is over 70% used
            if (usagePercentage >= 70) {
              setCouponMsg(prev => `${prev} (${remainingUses} global uses left)`);
            }
            
            // Show warning when coupon is almost fully used (over 90%)
            if (usagePercentage >= 90) {
              setCouponMsg(prev => `${prev} - This coupon is almost fully used!`);
            }
          }
          
          // Check for per-user usage limits for approaching limits
          if (maxUsagePerUser > 0 && userUsageCount > 0) {
            const remainingUserUses = maxUsagePerUser - userUsageCount;
            
            if (remainingUserUses === 1) {
              setCouponMsg(prev => `${prev} (This is your last use of this coupon)`);
            }
          }
        }
      } else {
        setCouponMsg(res.data.message || "Coupon is not applicable");
        setDiscount(0);
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Always ensure discount is reset to 0 on any error
      setDiscount(0);
      
      // Check if error is specifically about user limits
      if (err.response?.data?.alreadyUsed) {
        setCouponMsg(`You've already used this coupon ${err.response?.data?.userUsageCount || ''} time(s). No additional discounts available.`);
      } else {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Invalid coupon";
        setCouponMsg(errorMessage);
      }
    }
  };

  // Performance-optimized PayPal configuration with zoid conflict prevention
  const initialOptions = {
    "client-id": PAYPAL_CONFIG.clientId,
    currency: PAYPAL_CONFIG.currency,
    intent: "capture",
    // Only load required components for performance
    components: PAYPAL_CONFIG.scriptConfig.components,
    commit: PAYPAL_CONFIG.scriptConfig.commit,
    // CSP nonce for enhanced security (only in development with meta tags)
    ...(cspNonce && PAYPAL_CONFIG.isDevelopment && { "data-csp-nonce": cspNonce }),
    // Localization for Israeli users
    locale: PAYPAL_CONFIG.locale,
    // Performance optimization: disable unused funding
    "disable-funding": PAYPAL_CONFIG.scriptConfig['disable-funding'],
    // Buyer country for optimization (only in development/sandbox - not allowed in production)
    // Only add buyer-country when using sandbox client ID, NOT with live client ID
    ...(PAYPAL_CONFIG.isDevelopment && 
        PAYPAL_CONFIG.clientId && 
        (PAYPAL_CONFIG.clientId.startsWith('sb-') || PAYPAL_CONFIG.clientId.startsWith('AYbpBUAq')) && 
        { "buyer-country": PAYPAL_CONFIG.scriptConfig['buyer-country'] }),
    // Debug mode in development (only with sandbox) - disabled to reduce console warnings
    ...(PAYPAL_CONFIG.isDevelopment && 
        PAYPAL_CONFIG.clientId && 
        (PAYPAL_CONFIG.clientId.startsWith('sb-') || PAYPAL_CONFIG.clientId.startsWith('AYbpBUAq')) && 
        { debug: false }), // Set to false to reduce console warnings
    // Add data-namespace to prevent conflicts
    "data-namespace": "MonkeyZPayPal",
    "data-uid": `paypal-checkout-${componentKey}`
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {cartArray.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <ul className="divide-y">
              {cartArray.map((item, idx) => {
                const displayName =
                  typeof item.name === "object" ? item.name.en : item.name;
                // Use a fallback key if item.id is missing
                const key = item.id || item.productId || `cart-item-${idx}`;
                return (
                  <li key={key} className="py-2 flex justify-between">
                    <span>
                      {displayName} x{item.count}
                    </span>
                    <span>₪{(item.price * item.count).toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₪{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="text-green-600">- ₪{discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₪{total.toFixed(2)}</span>
            </div>
          </div>
          {/* Coupon Input */}
          <div className="mt-6">
            <label className="block mb-1">Coupon Code</label>
            <div className="flex">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="flex-1 border p-2 rounded-l"
              />
              <button
                onClick={handleCoupon}
                className="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className={`mt-2 text-sm ${
                couponMsg.includes('applied') || couponMsg.includes('off') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {couponMsg}
              </p>
            )}
          </div>
          {/* Email Input */}
          <div className="mt-6">
            <label className="block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                
                // If coupon is already applied, re-validate with new email
                if (coupon && discount > 0) {
                  // Re-validate after short delay to avoid too many API calls
                  if (validateTimerRef.current) {
                    clearTimeout(validateTimerRef.current);
                  }
                  validateTimerRef.current = setTimeout(() => {
                    handleCoupon();
                  }, 1000);
                }
              }}
              placeholder="you@example.com"
              className="w-full border p-2 rounded"
            />
          </div>
          {/* Name Input */}
          <div className="mt-6">
            <label className="block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full border p-2 rounded"
            />
          </div>
          {/* Phone Input */}
          <div className="mt-6">
            <label className="block mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+972512345678"
              className="w-full border p-2 rounded"
            />
          </div>
        </div>
        {/* Payment Section */}
        <div className="bg-white p-6 rounded shadow flex flex-col justify-between">
          {error && <div className="text-red-600 mb-4">{error}</div>}
          
          {/* Payment Methods Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-2">
              {i18n.language === 'he' ? 'אמצעי תשלום מקובלים:' : 'Accepted Payment Methods:'}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-700">
                {i18n.language === 'he' ? 'כרטיסי אשראי:' : 'Credit Cards:'}
              </span>
              {/* Credit Card Icons */}
              <div className="flex gap-2">
                <div className="bg-white px-2 py-1 rounded border text-xs font-bold text-blue-900">VISA</div>
                <div className="bg-white px-2 py-1 rounded border text-xs font-bold text-red-600">MC</div>
                <div className="bg-white px-2 py-1 rounded border text-xs font-bold text-blue-800">AMEX</div>
              </div>
              <span className="text-sm text-gray-700">+</span>
              <div className="bg-white px-2 py-1 rounded border text-xs font-bold text-blue-600">PayPal</div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {i18n.language === 'he' 
                ? 'לחץ על הכפתור למטה כדי לשלם עם כרטיס אשראי או חשבון PayPal'
                : 'Click the button below to pay with credit card or PayPal account'
              }
            </p>
          </div>

          {(PAYPAL_CONFIG.clientId) && (
            <div key={`paypal-container-${componentKey}`}>
              <PayPalScriptProvider 
                options={initialOptions}
                onLoadScript={() => {
                  if (!isComponentMountedRef.current) return;
                  console.log("PayPal script loaded successfully");
                }}
                onError={(err) => {
                  if (!isComponentMountedRef.current) return;
                  console.error("PayPal script load error:", err);
                  const errorInfo = getPayPalErrorMessage(err);
                  setError(`PayPal Error: ${errorInfo.message}. ${errorInfo.solution}`);
                }}
              >
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "pill",
                    height: 50,
                    label: "paypal",
                    tagline: false,
                  }}
                  disabled={processing || !email || !name || !phone || cartArray.length === 0}
                  onInit={(data, actions) => {
                    if (!isComponentMountedRef.current) return;
                    console.log("PayPal buttons initialized");
                    if (!email || !name || !phone || cartArray.length === 0) {
                      actions.disable();
                    } else {
                      actions.enable();
                    }
                  }}
                onClick={(data, actions) => {
                  if (!email || !name || !phone) {
                    setError("Please fill in all required fields before proceeding with payment.");
                    return actions.reject();
                  }
                  if (cartArray.length === 0) {
                    setError("Your cart is empty. Please add items before proceeding.");
                    return actions.reject();
                  }
                  setError("");
                  return actions.resolve();
                }}
                createOrder={async () => {
                  if (!isComponentMountedRef.current) return Promise.reject(new Error("Component unmounted"));
                  setProcessing(true);
                  setError("");
                  try {
                    if (!email || !name || !phone) {
                      throw new Error("Please fill in all required fields (email, name, phone)");
                    }
                    if (cartArray.length === 0) {
                      throw new Error("Your cart is empty");
                    }
                    const validatedCart = cartArray
                      .map((i, index) => {
                        const productId = i.id || i.productId || i._id || Object.keys(cartItems)[index];
                        if (!productId || productId === 'undefined' || productId === 'null' || productId.toString().trim() === '') {
                          console.error(`Cart item at position ${index + 1} has invalid product ID:`, productId, i);
                          return null;
                        }
                        const itemPrice = typeof i.price === 'number' ? i.price : 0;
                        if (itemPrice <= 0) {
                          console.error(`Cart item at position ${index + 1} has invalid price:`, itemPrice, i);
                          return null;
                        }
                        const quantity = i.count || i.quantity || 1;
                        if (quantity <= 0) {
                          console.error(`Cart item at position ${index + 1} has invalid quantity:`, quantity, i);
                          return null;
                        }
                        return {
                          productId: productId.toString(),
                          id: productId.toString(),
                          name: typeof i.name === "object" ? i.name.en : i.name,
                          quantity: quantity,
                          price: itemPrice
                        };
                      })
                      .filter(item => item !== null);
                    if (validatedCart.length === 0) {
                      console.error("No valid items in cart after validation:", cartArray);
                      throw new Error("Your cart contains no valid items. Please refresh the page and add items again.");
                    }
                    const finalValidatedCart = validatedCart.filter(item => {
                      if (!item.productId || item.productId === 'undefined' || item.productId === 'null') {
                        console.error("Removing cart item with invalid productId in final check:", item);
                        return false;
                      }
                      return true;
                    });
                    if (finalValidatedCart.length === 0) {
                      console.error("No valid items in cart after final validation:", validatedCart);
                      throw new Error("Cart validation failed. Please refresh the page and try again.");
                    }
                    if (coupon && discount > 0) {
                      try {
                        const couponValidation = await axios.post(`${process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il'}/api/coupons/validate`, {
                          code: coupon,
                          amount: subtotal,
                          email: email || user?.email || null,
                        });
                        if (couponValidation.data.valid === false || couponValidation.data.error || !couponValidation.data.discount) {
                          setDiscount(0);
                          setCouponMsg(couponValidation.data.message || couponValidation.data.error || "Coupon is no longer valid");
                          throw new Error("Coupon validation failed: " + (couponValidation.data.message || couponValidation.data.error || "Coupon is no longer valid"));
                        }
                        if (couponValidation.data.discount !== discount) {
                          setDiscount(couponValidation.data.discount);
                          setCouponMsg(`Coupon applied - ₪${couponValidation.data.discount.toFixed(2)} off`);
                        }
                      } catch (couponErr) {
                        console.error("Coupon re-validation failed:", couponErr);
                        setDiscount(0);
                        setCouponMsg("Coupon validation failed");
                        throw new Error("Coupon validation failed. Please remove the coupon and try again.");
                      }
                    }
                    console.log("Creating PayPal order with data:", {
                      cart: finalValidatedCart,
                      couponCode: coupon,
                      customerEmail: email,
                      customerName: name,
                      phone: phone,
                    });
                    const response = await axios.post(`${process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il'}/api/paypal/orders`, {
                      cart: finalValidatedCart,
                      couponCode: coupon,
                      customerEmail: email,
                      customerName: name,
                      phone: phone,
                    });
                    const orderId = response.data?.id;
                    if (!orderId) {
                      console.error("No order ID returned from server:", response.data);
                      throw new Error("Invalid response from payment service");
                    }
                    console.log("PayPal order created successfully:", orderId);
                    setOrderID(orderId);
                    return orderId;
                  } catch (err) {
                    console.error("PayPal createOrder error:", err);
                    setProcessing(false);
                    let errorMessage = "Failed to create order";
                    if (err.response?.data?.detail) {
                      errorMessage = err.response.data.detail;
                      if (errorMessage.toLowerCase().includes('coupon') || 
                          errorMessage.toLowerCase().includes('usage limit') ||
                          errorMessage.toLowerCase().includes('max uses') ||
                          errorMessage.toLowerCase().includes('exceed') ||
                          errorMessage.toLowerCase().includes('invalid')) {
                        setDiscount(0);
                        setCouponMsg(errorMessage);
                        errorMessage = "Coupon validation failed. Please try again without the coupon or use a different coupon.";
                      }
                    } else if (err.response?.data?.message) {
                      errorMessage = err.response.data.message;
                      if (errorMessage.toLowerCase().includes('coupon') || 
                          errorMessage.toLowerCase().includes('usage limit') ||
                          errorMessage.toLowerCase().includes('max uses') ||
                          errorMessage.toLowerCase().includes('exceed') ||
                          errorMessage.toLowerCase().includes('invalid')) {
                        setDiscount(0);
                        setCouponMsg(errorMessage);
                        errorMessage = "Coupon validation failed. Please try again without the coupon or use a different coupon.";
                      }
                    } else if (err.message) {
                      errorMessage = err.message;
                      if (errorMessage.toLowerCase().includes('coupon')) {
                        errorMessage = "Coupon validation failed. Please try again without the coupon or use a different coupon.";
                      }
                    }
                    setError(errorMessage);
                    return Promise.reject(new Error(errorMessage));
                  }
                }}
                onApprove={async (data) => {
                  if (!isComponentMountedRef.current) return;
                  try {
                    console.log("PayPal payment approved, capturing order:", data.orderID);
                    const response = await axios.post(`${process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il'}/api/paypal/orders/${data.orderID}/capture`);
                    console.log("PayPal order captured successfully:", response.data);
                    clearCart();
                    window.location.href = "/success";
                  } catch (err) {
                    console.error("PayPal capture error:", err);
                    if (!isComponentMountedRef.current) return;
                    let errorMessage = "Payment capture failed";
                    if (err.response?.data?.detail) {
                      errorMessage = err.response.data.detail;
                    } else if (err.response?.data?.message) {
                      errorMessage = err.response.data.message;
                    }
                    setError(errorMessage);
                    try {
                      await axios.post(`${process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il'}/api/paypal/orders/${data.orderID}/cancel`);
                    } catch (cancelErr) {
                      console.warn("Failed to cancel order:", cancelErr);
                    }
                    setTimeout(() => {
                      window.location.href = "/fail";
                    }, 2000);
                  } finally {
                    if (isComponentMountedRef.current) {
                      setProcessing(false);
                    }
                  }
                }}
                onCancel={async (data) => {
                  if (!isComponentMountedRef.current) return;
                  console.log("PayPal payment cancelled by user:", data.orderID);
                  try {
                    await axios.post(`${process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il'}/api/paypal/orders/${data.orderID}/cancel`);
                  } catch (cancelErr) {
                    console.warn("Failed to cancel order:", cancelErr);
                  }
                  window.location.href = "/fail";
                }}
                onError={async (err) => {
                  if (!isComponentMountedRef.current) return;
                  console.error("PayPal payment error:", err);
                  const errorInfo = getPayPalErrorMessage(err);
                  let errorMessage = `Payment failed: ${errorInfo.message}`;
                  if (err.toString().includes("Expected an order id to be passed")) {
                    errorMessage = "Payment setup failed. Please refresh the page and try again.";
                  } else if (err.toString().includes("INSTRUMENT_DECLINED")) {
                    errorMessage = "Your payment method was declined. Please try a different payment method.";
                  } else if (err.toString().includes("INSUFFICIENT_FUNDS")) {
                    errorMessage = "Insufficient funds. Please try a different payment method.";
                  }
                  setError(errorMessage);
                  if (orderID) {
                    try {
                      await axios.post(`${process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il'}/api/paypal/orders/${orderID}/cancel`);
                    } catch (cancelErr) {
                      console.error("Failed to cancel order:", cancelErr);
                    }
                  }
                  setProcessing(false);
                }}
              />
              </PayPalScriptProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
