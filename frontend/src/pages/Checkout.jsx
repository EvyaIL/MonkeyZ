import React, { useState } from "react";
import { createPayment } from "../lib/paymentService";

const Checkout = () => {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        successUrl: process.env.REACT_APP_PAYMENT_SUCCESS_URL || "https://monkeyz.co.il/success",
        failUrl: process.env.REACT_APP_PAYMENT_FAIL_URL || "https://monkeyz.co.il/fail",
        description: "CDMonkey Payment",
      };

      const res = await createPayment(payload);

      if (res?.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg("No redirect URL returned.");
      }
    } catch (err) {
      setErrorMsg("Payment error. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handlePay}
      className="flex flex-col gap-4 max-w-md mx-auto mt-32 bg-secondary p-6 rounded-lg shadow"
      aria-label="Checkout form"
    >
      <h2 className="text-2xl font-bold text-accent text-center mb-2">
        Checkout
      </h2>
      <p className="text-gray-400 text-center mb-2">All payments are in <span className="font-bold">NIS (₪)</span>. Enter the amount in <span className="font-bold">agorot</span> (e.g. 1000 = ₪10).</p>
      {errorMsg && (
        <div
          className="text-red-500 text-center"
          role="alert"
          aria-live="polite"
        >
          {errorMsg}
        </div>
      )}
      <label htmlFor="amount" className="text-white font-medium text-left">
        Amount (in agorot)
      </label>
      <input
        id="amount"
        type="number"
        placeholder="Amount in agorot (e.g. 1000 = ₪10)"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
        className="p-2 border rounded bg-gray-900 text-white"
        min={1}
        required
        autoFocus
      />
      <label htmlFor="email" className="text-white font-medium text-left">
        Email
      </label>
      <input
        id="email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-2 border rounded bg-gray-900 text-white"
        required
        autoComplete="email"
        pattern="^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$"
      />
      <button
        type="submit"
        className="p-2 bg-accent text-white rounded font-semibold hover:bg-accent/80 transition"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

export default Checkout;
