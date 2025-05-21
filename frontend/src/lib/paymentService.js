const GROW_USER_ID = process.env.REACT_APP_GROW_USER_ID;
const GROW_PAGE_CODE = process.env.REACT_APP_GROW_PAGE_CODE;
const GROW_API_KEY = process.env.REACT_APP_GROW_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const GROW_API = IS_PRODUCTION 
  ? 'https://meshulam.co.il/api/light/server/1.0/createPaymentProcess'
  : 'https://sandbox.meshulam.co.il/api/light/server/1.0/createPaymentProcess';

// Keep track of SDK loading state
let isGrowSdkLoaded = false;
let isLoadingGrowSdk = false;
let growSdkLoadPromise = null;

// Test card numbers and their behaviors
export const TEST_CARDS = {
  SUCCESSFUL: '4580458045804580', // Regular successful payment
  SUCCESSFUL_3DS: '4580000000000000', // Requires 3D Secure validation
  INSTALLMENTS: '4580111111111121', // Test installments
  FAILURE: '4580111111111113', // Payment will fail
  TIMEOUT: '4580111111111105', // Payment will timeout
  ERROR: '4580111111111097', // Will trigger an error
};

export function configureGrowSdk() {
  const config = {
    environment: IS_PRODUCTION ? 'PRODUCTION' : 'DEV',
    version: 1,
    debug: !IS_PRODUCTION, // Enable debug logs in development
    language: document.documentElement.lang || 'he',
    styles: {
      theme: 'light',
      direction: 'rtl',
      buttonColor: '#4F46E5', // Match your accent color
    },
    events: {
      onSuccess: (response) => {
        console.log('Payment successful:', response);
        if (response.status === 1 && response.data) {
          const { payment_sum, full_name, payment_method, number_of_payments, confirmation_number, transaction_id } = response.data;
          // Track analytics here if needed
          window.dispatchEvent(new CustomEvent('paymentSuccess', { 
            detail: {
              ...response.data,
              transactionId: transaction_id,
              amountPaid: payment_sum / 100, // Convert agorot to NIS
              paymentMethod: payment_method,
              installments: number_of_payments
            }
          }));
        }
      },
      onFailure: (response) => {
        console.error('Payment failed:', response);
        window.dispatchEvent(new CustomEvent('paymentFailure', { detail: response }));
      },
      onError: (response) => {
        console.error('Payment error:', response);
        window.dispatchEvent(new CustomEvent('paymentError', { detail: response }));
      },
      onTimeout: (response) => {
        console.error('Payment timeout:', response);
        window.dispatchEvent(new CustomEvent('paymentTimeout', { detail: response }));
      },
      onCancel: () => {
        console.log('Payment cancelled by user');
        window.dispatchEvent(new CustomEvent('paymentCancel'));
      },
      onWalletStateChange: (state) => {
        console.log('Wallet state changed:', state);
        window.dispatchEvent(new CustomEvent('walletStateChange', { detail: { state } }));
      }
    }
  };

  if (window.growPayment) {
    window.growPayment.configure(config);
  }
}

export function loadGrowSdk() {
  // If already loaded, return resolved promise
  if (isGrowSdkLoaded && window.growPayment) {
    return Promise.resolve();
  }

  // If currently loading, return existing promise
  if (isLoadingGrowSdk && growSdkLoadPromise) {
    return growSdkLoadPromise;
  }

  isLoadingGrowSdk = true;
  growSdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = IS_PRODUCTION 
    ? 'https://meshulam.co.il/api/light/server/1.0/js'
    : 'https://sandbox.meshulam.co.il/api/light/server/1.0/js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (!window.growPayment) {
        reject(new Error('Grow SDK loaded but growPayment object not found'));
        return;
      }
      isGrowSdkLoaded = true;
      isLoadingGrowSdk = false;
      configureGrowSdk();
      resolve();
    };
    
    script.onerror = (error) => {
      isLoadingGrowSdk = false;
      reject(new Error('Failed to load Grow Payment SDK'));
    };
    
    document.body.appendChild(script);
  });

  return growSdkLoadPromise;
}

// Helper function to calculate max installments based on amount
function calculateMaxInstallments(amount) {
  const amountInNIS = amount / 100;
  if (amountInNIS >= 2000) return 12;
  if (amountInNIS >= 1000) return 6;
  if (amountInNIS >= 500) return 3;
  return 1;
}

// Helper function to get enabled payment methods
function getEnabledPaymentMethods() {
  const methods = [
    1, // Credit Card (always enabled)
    2, // Bit
    4, // Google Pay
  ];
  
  // Only enable Apple Pay in production and on supported devices
  if (IS_PRODUCTION && window.ApplePaySession?.canMakePayments?.()) {
    methods.push(3); // Apple Pay
  }
  
  return methods;
}

/**
 * Create a payment via Grow SDK
 * @param {object} paymentData - Payment information
 * @param {number} paymentData.amount - Amount in agorot
 * @param {string} paymentData.fullName - Customer full name
 * @param {string} paymentData.email - Customer email
 * @param {string} paymentData.phone - Customer phone (must start with 05 and be 10 digits)
 * @returns {Promise<object>} Response from Grow API
 */
export const createPayment = async (paymentData) => {
  try {
    // Ensure SDK is loaded
    if (!isGrowSdkLoaded) {
      await loadGrowSdk();
    }

    // Validate phone number (required by Grow)
    if (!paymentData.phone?.match(/^05\d{8}$/)) {
      throw new Error('Invalid phone number. Must start with 05 and be 10 digits.');
    }

    if (!GROW_USER_ID || !GROW_PAGE_CODE || !GROW_API_KEY) {
      throw new Error('Missing required Grow API credentials. Please check your environment variables.');
    }

    if (!paymentData.amount || paymentData.amount < 100) { // Minimum 1 NIS
      throw new Error('Invalid payment amount. Amount must be at least 1 NIS.');
    }

    // Create payment process
    const response = await fetch(GROW_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        userId: GROW_USER_ID,
        pageCode: GROW_PAGE_CODE,
        apiKey: GROW_API_KEY,
        chargeType: 1, // Regular charge
        sum: paymentData.amount,
        currency: 1, // 1 = NIS
        successUrl: window.location.origin + '/payment-success',
        cancelUrl: window.location.origin + '/payment-cancelled',
        failUrl: window.location.origin + '/payment-failed',
        description: 'MonkeyZ Purchase',
        pageField: {
          fullName: paymentData.fullName,
          phone: paymentData.phone.replace(/\D/g, ''), // Strip non-digits
          email: paymentData.email,
          orderId: paymentData.orderId || Date.now().toString()
        },
        maxPaymentNum: calculateMaxInstallments(paymentData.amount),
        language: document.documentElement.lang || 'he',
        sendUpdatesByEmail: true,
        sendUpdatesBySms: true,
        // Payment methods configuration
        transactionTypes: getEnabledPaymentMethods(),
        // Optional configuration for specific payment methods
        paymentOptions: {
          creditCard: {
            requireCvv: true,
            support3ds: true,
          },
          bit: {
            displayQR: true,
          },
          applePay: IS_PRODUCTION ? {
            merchantIdentifier: process.env.REACT_APP_APPLE_PAY_MERCHANT_ID
          } : undefined
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status && window.growPayment) {
      window.growPayment.renderPaymentOptions(data.authCode);
      return { success: true };
    } else {
      throw new Error(data.message || 'Failed to initialize payment');
    }
  } catch (error) {
    console.error("Payment error:", error);
    return {
      error: error.message || "Payment initialization failed",
    };
  }
};
