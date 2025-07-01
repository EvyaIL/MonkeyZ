import React, { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { useGlobalProvider } from "../context/GlobalProvider";

export default function Checkout() {
  const { cartItems } = useGlobalProvider();
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [orderID, setOrderID] = useState(null);

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
    "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
    currency: "ILS", // use Israeli Shekel
    intent: "capture", // ensure immediate capture intent
    components: "buttons", // load only buttons component
    commit: true, // show Pay Now button
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
              {cartArray.map((item) => {
                const displayName =
                  typeof item.name === "object" ? item.name.en : item.name;
                return (
                  <li key={item.id} className="py-2 flex justify-between">
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
        </div>
        {/* Payment Section */}
        <div className="bg-white p-6 rounded shadow flex flex-col justify-between">
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <PayPalScriptProvider options={initialOptions}>
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "pill",
              }}
              disabled={processing || !email || cartArray.length === 0}
              createOrder={async () => {
                setProcessing(true);
                const { data } = await axios.post("/api/paypal/orders", {
                  cart: cartArray.map((i) => ({
                    id: i.id,
                    quantity: i.count,
                    price: i.price,
                  })),
                  couponCode: coupon,
                  customerEmail: email,
                });
                setError("");
                setOrderID(data.id);
                return data.id;
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
                setError("Payment error");
                console.error(err);
                if (orderID) {
                  await axios.post(`/api/paypal/orders/${orderID}/cancel`);
                }
              }}
            />
          </PayPalScriptProvider>
          {processing && <p className="text-center mt-4">Processing payment…</p>}
        </div>
      </div>
    </div>
  );
}
