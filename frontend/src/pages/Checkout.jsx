import React, { useState } from 'react';
import { createPayment } from '../lib/paymentService';

const Checkout = () => {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        amount: parseInt(amount), // in agorot (e.g. 1000 = ₪10)
        email: email,
        currency: "ILS",
        successUrl: "https://monkeyz.co.il/success",
        failUrl: "https://monkeyz.co.il/fail",
        description: "CDMonkey Payment",
      };

      const res = await createPayment(payload);

      if (res?.url) {
        window.location.href = res.url;
      } else {
        alert("No redirect URL returned.");
      }
    } catch (err) {
      alert("Payment error.");
    }
  };

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-4 max-w-md mx-auto mt-10">
      <input
        type="number"
        placeholder="Amount in agorot"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-2 border rounded"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-2 border rounded"
        required
      />
      <button type="submit" className="p-2 bg-blue-500 text-white rounded">Pay Now</button>
    </form>
  );
};

export default Checkout;
