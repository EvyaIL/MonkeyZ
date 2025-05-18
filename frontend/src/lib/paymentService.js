import axios from 'axios';

const GROW_API = 'https://lightapi.grow-il.com/regular'; // replace if different

export const createPayment = async (paymentData) => {
  try {
    const response = await axios.post(GROW_API, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_GROW_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Grow payment error:', error.response || error);
    throw error;
  }
};
