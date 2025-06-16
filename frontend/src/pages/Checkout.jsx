import React, { useState } from "react";
import { createPayment } from "../lib/paymentService";
import { trackEvent } from "../lib/analytics";
import { useGlobalProvider } from "../context/GlobalProvider";

const Checkout = () => {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { cartItems } = useGlobalProvider();

  // Track begin_checkout event when component mounts
  React.useEffect(() => {
    const items = Object.values(cartItems).map(item => ({
      item_id: item.id,
      item_name: typeof item.name === 'object' ? item.name.en : item.name,
      price: item.price,
      quantity: item.count,
      currency: 'ILS'
    }));

    // Calculate total from cart items
    let calculatedAmount = 0;
    items.forEach(item => {
      calculatedAmount += item.price * item.quantity;
    });

    // Set initial amount if cart has items
    if (calculatedAmount > 0) {
      setAmount((calculatedAmount * 100).toString()); // Convert to agorot
    }

    // Track checkout initiation
    trackEvent('begin_checkout', {
      ecommerce: {
        items: items,
        value: calculatedAmount,
        currency: 'ILS'
      }
    });
  }, [cartItems]);

  // Validate coupon with backend
  const handleCouponCheck = async () => {
    setCouponMsg("");
    setDiscount(0);
    if (!coupon) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon, amount: parseInt(amount) / 100 })
      });
      const data = await res.json();
      if (res.ok && data.discount > 0) {
        setDiscount(data.discount);
        setCouponMsg(`Coupon applied! Discount: ₪${data.discount}`);
      } else {
        setCouponMsg(data.message || "Invalid coupon");
      }
    } catch (e) {
      setCouponMsg("Coupon validation failed");
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      setErrorMsg("Please enter a valid amount in agorot.");
      return;
    }
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: parseInt(amount), // in agorot (e.g. 1000 = ₪10)
        email: email,
        currency: "ILS",
        coupon_code: coupon,
        successUrl: process.env.REACT_APP_PAYMENT_SUCCESS_URL || "https://monkeyz.co.il/success",
        failUrl: process.env.REACT_APP_PAYMENT_FAIL_URL || "https://monkeyz.co.il/fail",
        description: "CDMonkey Payment",
      };

      // Track payment initiation
      trackEvent('initiate_payment', {
        ecommerce: {
          value: parseInt(amount) / 100, // Convert from agorot to NIS
          currency: 'ILS',
          payment_type: 'credit_card',
          items: Object.values(cartItems).map(item => ({
            item_id: item.id,
            item_name: typeof item.name === 'object' ? item.name.en : item.name,
            price: item.price,
            quantity: item.count
          }))
        }
      });

      const res = await createPayment(payload);

      if (res?.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg("No redirect URL returned.");
      }
    } catch (err) {
      setErrorMsg("Payment error. Please try again.");
      
      // Track payment error
      trackEvent('payment_error', {
        error_message: err.message || "Payment processing error"
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <form
        onSubmit={handlePay}
        className="flex flex-col gap-4 max-w-md mx-auto mt-8 bg-white dark:bg-secondary p-8 rounded-lg shadow-lg border border-base-300 dark:border-gray-700"
        aria-label="Checkout form"
      >
        <h2 className="text-3xl font-bold text-primary dark:text-accent text-center mb-2">
          Checkout
        </h2>
        <p className="text-base-content text-center mb-2">All payments are in <span className="font-bold">NIS (₪)</span>. Enter the amount in <span className="font-bold">agorot</span> (e.g. 1000 = ₪10).</p>
        {errorMsg && (
          <div
            className="text-red-500 text-center"
            role="alert"
            aria-live="polite"
          >
            {errorMsg}
          </div>
        )}
        <label htmlFor="amount" className="text-base-content dark:text-white font-medium text-left">
          Amount (in agorot)
        </label>
        <input
          id="amount"
          type="number"
          placeholder="Amount in agorot (e.g. 1000 = ₪10)"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          className="p-2 border border-base-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-base-content dark:text-white"
          min={1}
          required
          autoFocus
        />
        <label htmlFor="email" className="text-base-content dark:text-white font-medium text-left">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border border-base-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-base-content dark:text-white"
          required
          autoComplete="email"
          pattern="^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$"
        />
        <label htmlFor="coupon" className="text-base-content dark:text-white font-medium text-left">
          Coupon Code (optional)
        </label>
        <div className="flex gap-2">
          <input
            id="coupon"
            type="text"
            placeholder="Enter coupon code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="p-2 border border-base-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-base-content dark:text-white flex-1"
          />
          <button type="button" onClick={handleCouponCheck} className="p-2 bg-primary text-white rounded font-semibold hover:bg-primary/80 transition">
            Apply
          </button>
        </div>
        {couponMsg && (
          <div className={discount > 0 ? "text-green-600" : "text-red-500"} role="alert">{couponMsg}</div>
        )}
        {discount > 0 && (
          <div className="text-green-700 font-bold text-center">Discount: ₪{discount} <br/> New Total: ₪{(parseInt(amount)/100 - discount).toFixed(2)}</div>
        )}
        <button
          type="submit"
          className="p-2 bg-accent text-white rounded font-semibold hover:bg-accent/80 transition"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
