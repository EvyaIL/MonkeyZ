import React, { useState, useEffect, useRef, useCallback } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useGlobalProvider } from "../context/GlobalProvider";
import { getCurrentNonce, verifyPayPalCSP, fixDevelopmentCSP } from "../lib/cspNonce";
import { PAYPAL_CONFIG, getPayPalErrorMessage, preloadPayPalScript, measurePayPalPerformance } from "../lib/paypalConfig";

export default function Checkout() {
  const { cartItems, validateCartItems } = useGlobalProvider();
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

  // Performance monitoring instance with cleanup tracking
  if (!paypalPerformanceRef.current) {
    paypalPerformanceRef.current = measurePayPalPerformance();
  }
  const paypalPerformance = paypalPerformanceRef.current;

  // Initialize CSP nonce and PayPal performance optimization with cleanup
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    // Validate cart items when checkout page loads
    validateCartItems();
    
    // Initialize CSP nonce and PayPal performance optimization with cleanup
    const nonce = getCurrentNonce();
    setCspNonce(nonce);
    
    // Verify PayPal CSP configuration
    const cspValid = verifyPayPalCSP();
    if (!cspValid && !PAYPAL_CONFIG.isDevelopment) {
      setError('Payment security configuration needs attention. Please reload the page.');
    }

    // Create a unique component key to prevent zoid conflicts
    setComponentKey(Date.now());
    
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
            }, 200);
          } else {
            // Delayed render with minimal delay
            cleanupTimeoutRef.current = setTimeout(() => {
              if (isComponentMountedRef.current) {
                setPaypalLoaded(true);
              }
            }, 500);
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
      }, 500);
    }

    // Cleanup function to prevent memory leaks and zoid conflicts
    return () => {
      isComponentMountedRef.current = false;
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
      
      // Reset PayPal loaded state to prevent stale renders
      setPaypalLoaded(false);
    };
  }, []);

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
    try {
      const res = await axios.post("/api/coupons/validate", {
        code: coupon,
        amount: subtotal,
      });
      if (res.data.discount) {
        setDiscount(res.data.discount);
        setCouponMsg(`Coupon applied - ₪${res.data.discount.toFixed(2)} off`);
      } else {
        setCouponMsg(res.data.message);
      }
    } catch (err) {
      setCouponMsg(err.response?.data?.message || "Invalid coupon");
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
    // CSP nonce for enhanced security (only in production)
    ...(cspNonce && !PAYPAL_CONFIG.isDevelopment && { "data-csp-nonce": cspNonce }),
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
    // Debug mode in development (only with sandbox)
    ...(PAYPAL_CONFIG.isDevelopment && 
        PAYPAL_CONFIG.clientId && 
        (PAYPAL_CONFIG.clientId.startsWith('sb-') || PAYPAL_CONFIG.clientId.startsWith('AYbpBUAq')) && 
        { debug: PAYPAL_CONFIG.scriptConfig.debug }),
    // Add unique identifier to prevent zoid conflicts
    "data-uid": `paypal-${componentKey}`,
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
            {couponMsg && <p className="mt-2 text-sm">{couponMsg}</p>}
          </div>
          {/* Email Input */}
          <div className="mt-6">
            <label className="block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          {(cspNonce || PAYPAL_CONFIG.isDevelopment) && paypalLoaded && (
            <PayPalScriptProvider 
              key={`paypal-provider-${componentKey}`} // Unique key to prevent zoid conflicts
              options={initialOptions}
              onLoadScript={() => {
                if (!isComponentMountedRef.current) return;
              }}
              onError={(err) => {
                if (!isComponentMountedRef.current) return;
                
                console.error("PayPal script load error:", err);
                const errorInfo = getPayPalErrorMessage(err);
                setError(`PayPal Error: ${errorInfo.message}. ${errorInfo.solution}`);
              }}
            >
            <PayPalButtons
              key={`paypal-buttons-${componentKey}`} // Unique key for buttons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "pill",
                height: 50, // Increased height for better icon visibility
                label: "paypal", // Use "paypal" label to show just "PayPal"
                tagline: false, // Remove PayPal tagline
              }}
              disabled={processing || !email || !name || !phone || cartArray.length === 0}
              onInit={() => {
                if (!isComponentMountedRef.current) return;
              }}
              createOrder={async () => {
                if (!isComponentMountedRef.current) return;
                
                setProcessing(true);
                try {
                  // Validate cart items before sending
                  const validatedCart = cartArray.map((i, index) => {
                    const productId = i.id || i.productId;
                    if (!productId) {
                      console.error(`Cart item at position ${index + 1} is missing a product ID:`, i);
                      console.error("Full cart array:", cartArray);
                      throw new Error(`Cart item at position ${index + 1} is missing a product ID. Please refresh the page and try again.`);
                    }
                    
                    return {
                      productId: productId, // Always send productId for backend compatibility
                      id: productId, // Also send id for redundancy
                      name: typeof i.name === "object" ? i.name.en : i.name,
                      quantity: i.count || i.quantity || 1,
                      price: i.price
                    };
                  });

                  const { data } = await axios.post("/api/paypal/orders", {
                    cart: validatedCart,
                    couponCode: coupon,
                    customerEmail: email,
                    customerName: name,
                    phone: phone,
                  });
                  setError("");
                  setOrderID(data.id);
                  return data.id;
                } catch (err) {
                  setProcessing(false);
                  setError(err.message || err.response?.data?.detail || "Failed to create order");
                  throw err;
                }
              }}
              onApprove={async (data) => {
                if (!isComponentMountedRef.current) return;
                
                try {
                  await axios.post(`/api/paypal/orders/${data.orderID}/capture`);
                  window.location.href = "/success";
                } catch (err) {
                  if (!isComponentMountedRef.current) return;
                  
                  setError(err.response?.data?.message || "Payment failed");
                  // Mark order as cancelled when capture fails
                  try {
                    await axios.post(`/api/paypal/orders/${data.orderID}/cancel`);
                  } catch (cancelErr) {
                    console.warn("Failed to cancel order:", cancelErr);
                  }
                  window.location.href = "/fail";
                } finally {
                  if (isComponentMountedRef.current) {
                    setProcessing(false);
                  }
                }
              }}
              onCancel={async (data) => {
                if (!isComponentMountedRef.current) return;
                
                // Mark order as cancelled when user aborts
                try {
                  await axios.post(`/api/paypal/orders/${data.orderID}/cancel`);
                } catch (cancelErr) {
                  console.warn("Failed to cancel order:", cancelErr);
                }
                window.location.href = "/fail";
              }}
              onError={async (err) => {
                if (!isComponentMountedRef.current) return;
                
                console.error("PayPal payment error:", err);
                const errorInfo = getPayPalErrorMessage(err);
                setError(`Payment failed: ${errorInfo.message}`);
                
                // Cancel order if one exists
                if (orderID) {
                  try {
                    await axios.post(`/api/paypal/orders/${orderID}/cancel`);
                  } catch (cancelErr) {
                    console.error("Failed to cancel order:", cancelErr);
                  }
                }
                
                // Reset processing state
                setProcessing(false);
              }}
            />
          </PayPalScriptProvider>
          )}
          {!(cspNonce || PAYPAL_CONFIG.isDevelopment) || !paypalLoaded ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading secure payment options...</p>
            </div>
          ) : null}
          {processing && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-blue-600">Processing payment…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
