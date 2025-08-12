import React, { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { useGlobalProvider } from "../context/GlobalProvider";
import { getCurrentNonce, verifyPayPalCSP, fixDevelopmentCSP } from "../lib/cspNonce";
import { PAYPAL_CONFIG, debugPayPalConfig, getPayPalErrorMessage } from "../lib/paypalConfig";

export default function Checkout() {
  const { cartItems } = useGlobalProvider();
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

  // Initialize CSP nonce for PayPal security
  useEffect(() => {
    // Fix development CSP issues first
    if (PAYPAL_CONFIG.isDevelopment) {
      fixDevelopmentCSP();
    }
    
    const nonce = getCurrentNonce();
    setCspNonce(nonce);
    
    // Debug PayPal configuration in development
    if (PAYPAL_CONFIG.isDevelopment) {
      debugPayPalConfig();
    }
    
    // Verify PayPal CSP configuration
    const cspValid = verifyPayPalCSP();
    if (!cspValid) {
      console.warn('PayPal CSP configuration may need attention');
      if (!PAYPAL_CONFIG.isDevelopment) {
        setError('Payment security configuration needs attention. Please reload the page.');
      }
    }
    
    // Delay PayPal loading to ensure DOM is ready
    const timer = setTimeout(() => {
      setPaypalLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
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

  const initialOptions = {
    "client-id": PAYPAL_CONFIG.clientId,
    currency: PAYPAL_CONFIG.currency,
    intent: "capture",
    components: "buttons",
    commit: true,
    // CSP nonce for enhanced security (only in production)
    ...(cspNonce && !PAYPAL_CONFIG.isDevelopment && { "data-csp-nonce": cspNonce }),
    // Localization for Israeli users
    locale: PAYPAL_CONFIG.locale,
    // Performance optimization
    ...(PAYPAL_CONFIG.performance.enableLazyLoading && { "data-lazy-load": "true" }),
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
          {(cspNonce || PAYPAL_CONFIG.isDevelopment) && paypalLoaded && (
            <PayPalScriptProvider 
              options={initialOptions}
              onLoadScript={() => {
                console.log("PayPal script loaded successfully");
                setPaypalLoaded(true);
              }}
              onError={(err) => {
                console.error("PayPal script load error:", err);
                const errorInfo = getPayPalErrorMessage(err);
                setError(`PayPal Error: ${errorInfo.message}. ${errorInfo.solution}`);
                
                if (PAYPAL_CONFIG.isDevelopment) {
                  console.group('PayPal Debug Info:');
                  console.log('Error details:', errorInfo);
                  console.log('CSP nonce:', cspNonce);
                  debugPayPalConfig();
                  console.groupEnd();
                }
              }}
            >
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "pill",
              }}
              disabled={processing || !email || !name || !phone || cartArray.length === 0}
              createOrder={async () => {
                setProcessing(true);
                try {
                  // Validate cart items before sending
                  const validatedCart = cartArray.map((i, index) => {
                    const productId = i.id || i.productId;
                    if (!productId) {
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
                try {
                  await axios.post(`/api/paypal/orders/${data.orderID}/capture`);
                  window.location.href = "/success";
                } catch (err) {
                  setError(err.response?.data?.message || "Payment failed");
                  // Mark order as cancelled when capture fails
                  try {
                    await axios.post(`/api/paypal/orders/${data.orderID}/cancel`);
                  } catch {};
                  window.location.href = "/fail";
                } finally {
                  setProcessing(false);
                }
              }}
              onCancel={async (data) => {
                // Mark order as cancelled when user aborts
                await axios.post(`/api/paypal/orders/${data.orderID}/cancel`);
                window.location.href = "/fail";
              }}
              onError={async (err) => {
                console.error("PayPal payment error:", err);
                const errorInfo = getPayPalErrorMessage(err);
                setError(`Payment failed: ${errorInfo.message}`);
                
                if (PAYPAL_CONFIG.isDevelopment) {
                  console.group('PayPal Payment Error:');
                  console.log('Error details:', errorInfo);
                  console.groupEnd();
                }
                
                if (orderID) {
                  try {
                    await axios.post(`/api/paypal/orders/${orderID}/cancel`);
                  } catch (cancelErr) {
                    console.error("Failed to cancel order:", cancelErr);
                  }
                }
              }}
            />
          </PayPalScriptProvider>
          )}
          {!(cspNonce || PAYPAL_CONFIG.isDevelopment) || !paypalLoaded ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading secure payment options...</p>
              <p className="text-sm text-gray-500">
                {PAYPAL_CONFIG.isDevelopment 
                  ? "Development mode: Configuring security..." 
                  : "Ensuring PayPal security compliance..."
                }
              </p>
            </div>
          ) : null}
          {processing && <p className="text-center mt-4">Processing payment…</p>}
        </div>
      </div>
    </div>
  );
}
