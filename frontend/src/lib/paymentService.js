import axios from "axios";

const GROW_API = "https://lightapi.grow-il.com/regular"; // Update if needed

/**
 * Create a payment via Grow API.
 * @param {object} paymentData
 * @returns {Promise<object>} { url, ... } or { error }
 */
export const createPayment = async (paymentData) => {
  const apiKey = process.env.REACT_APP_GROW_API_KEY;
  if (!apiKey) {
    return { error: "Missing Grow API key." };
  }
  try {
    const response = await axios.post(GROW_API, paymentData, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Grow payment error:", error.response || error);
    return {
      error: error.response?.data?.error || error.message || "Payment error",
    };
  }
};
