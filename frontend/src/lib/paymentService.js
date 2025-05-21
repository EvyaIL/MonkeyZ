import emailjs from '@emailjs/browser';

const GROW_USER_ID = process.env.REACT_APP_GROW_USER_ID;
const GROW_PAGE_CODE = process.env.REACT_APP_GROW_PAGE_CODE;
const GROW_API_KEY = process.env.REACT_APP_GROW_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const GROW_API = IS_PRODUCTION 
  ? 'https://meshulam.co.il/api/light/server/1.0/createPaymentProcess'
  : 'https://sandbox.meshulam.co.il/api/light/server/1.0/createPaymentProcess';

let isGrowSdkLoaded = false;
let isLoadingGrowSdk = false;
let growSdkLoadPromise = null;
let loadAttempts = 0;
const maxAttempts = 3;

// Test card numbers for development
export const TEST_CARDS = {
  SUCCESSFUL: '4580458045804580', // Regular single payment only
  SUCCESSFUL_3DS: '4580000000000000', // 3D Secure test card
  INSTALLMENTS: '4580111111111121', // Supports installments
};

function configureGrowSdk() {
  const config = {
    environment: IS_PRODUCTION ? 'PRODUCTION' : 'DEV',
    version: 1,
    debug: !IS_PRODUCTION,
    language: document.documentElement.lang || 'he',
    styles: {
      theme: 'light',
      direction: 'rtl',
      buttonColor: '#4F46E5',
      font: 'Rubik, system-ui, sans-serif'
    },
    events: {
      onSuccess: async (response) => {
        console.log('Payment successful:', response);
        if (response.status === 1 && response.data) {
          const { payment_sum, payment_method, number_of_payments, transaction_id } = response.data;
          
          // Send order confirmation email
          try {
            await emailjs.send(
              process.env.REACT_APP_ORDER_CONFIRMATION_SERVICE_ID,
              process.env.REACT_APP_ORDER_CONFIRMATION_TEMPLATE_ID,
              {
                to_email: response.data.email,
                customer_name: response.data.fullName,
                order_id: response.data.orderId || transaction_id,
                amount: payment_sum / 100,
                payment_method,
                installments: number_of_payments,
                transaction_id
              },
              process.env.REACT_APP_EMAILJS_PUBLIC_KEY
            );
          } catch (error) {
            console.error('Failed to send order confirmation:', error);
          }

          // Dispatch success event
          window.dispatchEvent(new CustomEvent('paymentSuccess', { 
            detail: {
              ...response.data,
              transactionId: transaction_id,
              amountPaid: payment_sum / 100,
              paymentMethod: payment_method,
              installments: number_of_payments
            }
          }));
        }
      },
      onFailure: (response) => {
        console.error('Payment failed:', response);
        window.dispatchEvent(new CustomEvent('paymentFailure', { 
          detail: {
            errorCode: response.errorCode,
            message: response.message || 'העסקה נכשלה. אנא נסה שנית.'
          } 
        }));
      },
      onError: (response) => {
        console.error('Payment error:', response);
        window.dispatchEvent(new CustomEvent('paymentError', { 
          detail: {
            message: response.message || 'אירעה שגיאה בעת ביצוע התשלום.'
          }
        }));
      },
      onTimeout: () => {
        console.error('Payment timeout');
        window.dispatchEvent(new CustomEvent('paymentTimeout'));
      },
      onCancel: () => {
        console.log('Payment cancelled by user');
        window.dispatchEvent(new CustomEvent('paymentCancel'));
      },
      onWalletStateChange: (state) => {
        window.dispatchEvent(new CustomEvent('walletStateChange', { detail: { state } }));
      }
    }
  };

  if (window.growPayment) {
    window.growPayment.configure(config);
  }
}

function tryLoadSdk() {
  return new Promise((resolve, reject) => {
    loadAttempts++;
    isLoadingGrowSdk = true;

    const script = document.createElement('script');
    script.src = IS_PRODUCTION 
      ? 'https://meshulam.co.il/api/light/server/1.0/js'
      : 'https://sandbox.meshulam.co.il/api/light/server/1.0/js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (!window.growPayment) {
        reject(new Error('טעינת מערכת התשלומים נכשלה. אנא נסה שנית.'));
        return;
      }
      isGrowSdkLoaded = true;
      isLoadingGrowSdk = false;
      loadAttempts = 0;
      configureGrowSdk();
      resolve();
    };
    
    script.onerror = (error) => {
      isLoadingGrowSdk = false;
      reject(error);
    };
    
    document.body.appendChild(script);
  });
}

export async function loadGrowSdk() {
  if (isGrowSdkLoaded && window.growPayment) {
    return Promise.resolve();
  }

  if (isLoadingGrowSdk && growSdkLoadPromise) {
    return growSdkLoadPromise;
  }

  if (!window.location.protocol.startsWith('https') && !window.location.hostname.includes('localhost')) {
    throw new Error('מערכת התשלומים דורשת חיבור מאובטח (HTTPS) או שרת מקומי.');
  }

  try {
    growSdkLoadPromise = tryLoadSdk();
    await growSdkLoadPromise;
  } catch (error) {
    console.error('Failed to load payment SDK:', error);
    if (loadAttempts < maxAttempts) {
      console.log(`Retrying SDK load attempt ${loadAttempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return loadGrowSdk();
    } else {
      loadAttempts = 0;
      throw new Error('טעינת מערכת התשלומים נכשלה. אנא נסה שנית.');
    }
  }

  return growSdkLoadPromise;
}

function calculateMaxInstallments(amount) {
  const amountInNIS = amount / 100;
  if (amountInNIS >= 2000) return 12;
  if (amountInNIS >= 1000) return 6;
  if (amountInNIS >= 500) return 3;
  return 1;
}

function getEnabledPaymentMethods() {
  const methods = [
    1, // Credit Card
    2, // Bit
    4, // Google Pay
  ];
  
  if (IS_PRODUCTION && window.ApplePaySession?.canMakePayments?.()) {
    methods.push(3); // Apple Pay
  }
  
  return methods;
}

export const createPayment = async (paymentData) => {
  const retryCount = 3;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (!isGrowSdkLoaded) {
        await loadGrowSdk();
      }

      // Validate phone number (Israeli format)
      if (!paymentData.phone?.match(/^05\d{8}$/)) {
        throw new Error('מספר הטלפון חייב להתחיל ב-05 ולהכיל 10 ספרות.');
      }

      // Validate full name (first and last name)
      if (!paymentData.fullName?.trim().includes(' ')) {
        throw new Error('יש להזין שם מלא (שם פרטי ושם משפחה).');
      }

      if (!GROW_USER_ID || !GROW_PAGE_CODE) {
        throw new Error('חסרים פרטי התחברות למערכת התשלומים. אנא צור קשר עם התמיכה.');
      }

      if (!paymentData.amount || paymentData.amount < 100) {
        throw new Error('סכום התשלום חייב להיות לפחות 1 ₪.');
      }

      const response = await fetch(GROW_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          userId: GROW_USER_ID,
          pageCode: GROW_PAGE_CODE,
          chargeType: 1,
          sum: paymentData.amount,
          currency: 1,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancelled`,
          failUrl: `${window.location.origin}/payment-failed`,
          description: 'MonkeyZ Purchase',
          notifyUrl: `${window.location.origin}/api/payments/webhook`,
          pageField: {
            fullName: paymentData.fullName,
            phone: paymentData.phone.replace(/\D/g, ''),
            email: paymentData.email,
            orderId: paymentData.orderId || Date.now().toString()
          },
          maxPaymentNum: calculateMaxInstallments(paymentData.amount),
          language: document.documentElement.lang || 'he',
          sendUpdatesByEmail: true,
          sendUpdatesBySms: true,
          transactionTypes: getEnabledPaymentMethods(),
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
            } : undefined,
            googlePay: {
              buttonType: 'buy'
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `בעיה בתקשורת עם שרת התשלומים. קוד שגיאה: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && window.growPayment) {
        window.growPayment.renderPaymentOptions(data.authCode);
        return { success: true };
      } else {
        throw new Error(data.message || 'האתחול של מערכת התשלומים נכשל. אנא נסה שנית.');
      }
    } catch (error) {
      console.error(`Payment error (attempt ${attempt}/${retryCount}):`, error);

      if (attempt < retryCount && !error.message.includes('Invalid')) {
        console.log(`Retrying payment in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      return {
        error: error.message || "אירעה שגיאה בעת ביצוע התשלום. אנא נסה שנית.",
      };
    }
  }
};
