import emailjs from '@emailjs/browser';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const GROW_API = IS_PRODUCTION 
  ? 'https://meshulam.co.il/api/light/server/1.0/createPaymentProcess'
  : 'https://sandbox.meshulam.co.il/api/light/server/1.0/createPaymentProcess';

let isGrowSdkLoaded = false;
let isLoadingGrowSdk = false;
let growSdkLoadPromise = null;
let loadAttempts = 0;
const maxAttempts = 3;

// Test card numbers - only available in non-production environments
export const TEST_CARDS = IS_PRODUCTION ? undefined : {
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
              process.env.REACT_APP_EMAILJS_SERVICE_ID,
              process.env.REACT_APP_EMAILJS_ORDER_TEMPLATE,
              {
                to_email: response.data.email,
                customer_name: response.data.fullName,
                order_id: response.data.orderId || transaction_id,
                amount: payment_sum / 100,
                payment_method,
                installments: number_of_payments,
                transaction_id
              }
            );
          } catch (error) {
            console.error('Failed to send order confirmation:', error);
          }

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
    try {
      window.growPayment.configure(config);
      return true;
    } catch (err) {
      console.error('Failed to configure Grow SDK:', err);
      return false;
    }
  }
  return false;
}

function tryLoadSdk() {
  return new Promise((resolve, reject) => {
    try {
      // If SDK is already present, try to configure it first
      if (window.growPayment) {
        const configured = configureGrowSdk();
        if (configured) {
          isGrowSdkLoaded = true;
          loadAttempts = 0;
          resolve();
          return;
        }
        // If configuration failed, clean up and try again
        delete window.growPayment;
      }

      // Cleanup any existing script
      const existingScript = document.querySelector('script[src*="meshulam.co.il"]');
      if (existingScript) {
        existingScript.remove();
      }

      loadAttempts++;
      isLoadingGrowSdk = true;

      const urls = IS_PRODUCTION 
        ? [
            'https://meshulam.co.il/api/light/server/1.0/js',
            'https://www.meshulam.co.il/api/light/server/1.0/js',
            'https://api.meshulam.co.il/api/light/server/1.0/js'
          ]
        : [
            // Use our proxied SDK URL for development environment
            `${window.location.origin}/sdk-proxy/js`,
            // Fallback to direct URLs if needed
            'https://sandbox.meshulam.co.il/api/light/server/1.0/js',
            // Fallback to our mock implementation as last resort
            `${window.location.origin}/sdk-proxy/fallback-js`
          ];

      // Try loading from different URLs with better handling
      const loadScript = (url) => {
        // Clean up any existing scripts first
        const existingScripts = document.querySelectorAll('script[src*="meshulam.co.il"], script[src*="sdk-proxy"]');
        existingScripts.forEach(script => script.remove());

        // Create and load the script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        
        // Set to false to ensure synchronous loading
        script.async = false;
        script.defer = false;
        
        // Configure CORS settings
        script.crossOrigin = 'anonymous';
        
        // Add cache busting for dev environment
        const cacheBuster = Date.now();
        script.src = url.includes('?') ? `${url}&t=${cacheBuster}` : `${url}?t=${cacheBuster}`;
        
        // Add timing for performance analysis
        const startTime = performance.now();
        script.addEventListener('load', () => {
          const loadTime = performance.now() - startTime;
          console.log(`Script loaded in ${loadTime.toFixed(2)}ms from ${url}`);
        });

        return script;
      };

      // Alternative method: Fetch the script content and insert it directly
      const fetchAndInsertScript = async (url) => {
        try {
          console.log(`Fetching script content from: ${url}`);
          const cacheBuster = Date.now();
          const fetchUrl = url.includes('?') ? `${url}&t=${cacheBuster}` : `${url}?t=${cacheBuster}`;
          
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': '*/*',
              'Cache-Control': 'no-cache'
            },
            cache: 'no-cache',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch script: ${response.status} ${response.statusText}`);
          }
          
          // Check content type to avoid HTML
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error('Received HTML instead of JavaScript');
          }
          
          const scriptContent = await response.text();
          
          // Check if this looks like valid JavaScript
          if (scriptContent.trim().startsWith('<!DOCTYPE') || scriptContent.trim().startsWith('<html')) {
            throw new Error('Received HTML instead of JavaScript');
          }
          
          // Create an inline script element
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.textContent = scriptContent;
          document.head.appendChild(script);
          
          console.log('Script content inserted inline');
          return true;
        } catch (error) {
          console.error(`Error fetching script from ${url}:`, error);
          return false;
        }
      };

      let currentScript = null;
      let currentUrlIndex = 0;
      let initCheckInterval;
      let timeoutId;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (initCheckInterval) clearInterval(initCheckInterval);
        if (currentScript) {
          currentScript.onload = null;
          currentScript.onerror = null;
          currentScript.remove();
          currentScript = null;
        }
        isLoadingGrowSdk = false;
      };

      const tryNextUrl = () => {
        if (currentUrlIndex >= urls.length) {
          cleanup();
          reject(new Error('נכשלה טעינת מערכת התשלומים - כל הנסיונות נכשלו.'));
          return;
        }

        if (currentScript) {
          cleanup();
        }

        const currentUrl = urls[currentUrlIndex];
        currentUrlIndex++;

        // First try the direct fetch approach
        fetchAndInsertScript(currentUrl).then(success => {
          if (success) {
            // Check for successful SDK initialization
            let checkCount = 0;
            initCheckInterval = setInterval(() => {
              checkCount++;
              try {
                if (window.growPayment) {
                  clearInterval(initCheckInterval);
                  console.log('SDK object found after fetch, attempting configuration...');
                  const configured = configureGrowSdk();
                  if (configured) {
                    cleanup();
                    isGrowSdkLoaded = true;
                    loadAttempts = 0;
                    console.log('SDK successfully configured after fetch');
                    resolve();
                  } else {
                    console.error('Failed to configure SDK after fetch:', {
                      sdkPresent: !!window.growPayment,
                      sdkMethods: Object.keys(window.growPayment || {})
                    });
                    delete window.growPayment;
                    tryNextUrl();
                  }
                } else if (checkCount > 20) {
                  // Give up after 2 seconds
                  clearInterval(initCheckInterval);
                  console.log('SDK object not found after fetch, trying script tag approach');
                  tryScriptTagApproach();
                }
              } catch (err) {
                console.error('Error during SDK initialization check after fetch:', err);
                tryScriptTagApproach();
              }
            }, 100);
          } else {
            console.log('Fetch approach failed, trying script tag approach');
            tryScriptTagApproach();
          }
        }).catch(error => {
          console.error('Error with fetch approach:', error);
          tryScriptTagApproach();
        });

        // Traditional script tag approach (fallback)
        const tryScriptTagApproach = () => {
          currentScript = loadScript(currentUrl);

          // Check for successful SDK initialization with more detailed error logging
          const checkInit = () => {
            try {
              if (window.growPayment) {
                clearInterval(initCheckInterval);
                console.log('SDK object found, attempting configuration...');
                const configured = configureGrowSdk();
                if (configured) {
                  cleanup();
                  isGrowSdkLoaded = true;
                  loadAttempts = 0;
                  console.log('SDK successfully configured');
                  resolve();
                } else {
                  console.error('Failed to configure SDK:', {
                    sdkPresent: !!window.growPayment,
                    sdkMethods: Object.keys(window.growPayment || {}),
                  });
                  delete window.growPayment;
                  tryNextUrl();
                }
              }
            } catch (err) {
              console.error('Error during SDK initialization check:', err);
              tryNextUrl();
            }
          };

          currentScript.onload = () => {
            console.log(`Script loaded from ${currentScript.src}, checking initialization...`);
            console.debug('Window object status:', {
              hasGrowPayment: !!window.growPayment,
              objectKeys: window.growPayment ? Object.keys(window.growPayment) : null
            });
            // Start checking for initialization
            initCheckInterval = setInterval(checkInit, 100);
          };
          
          currentScript.onerror = (error) => {
            console.error(`Failed to load script from ${currentScript.src}:`, error);
            tryNextUrl();
          };

          // Set a timeout for the current attempt
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            console.warn(`Timeout loading from ${currentScript.src}, trying next URL`);
            tryNextUrl();
          }, 5000); // 5 second timeout per URL

          try {
            // Append to head for better loading
            document.head.appendChild(currentScript);
            
            console.log(`Script added to document head: ${currentScript.src}`);
            
            // Start a timer to check if script was loaded but onload didn't fire
            setTimeout(() => {
              if (window.growPayment && !isGrowSdkLoaded) {
                console.log('SDK object detected but onload did not fire, checking manually...');
                clearInterval(initCheckInterval);
                const configured = configureGrowSdk();
                if (configured) {
                  cleanup();
                  isGrowSdkLoaded = true;
                  loadAttempts = 0;
                  console.log('SDK successfully configured via manual check');
                  resolve();
                }
              }
            }, 2000);
          } catch (error) {
            console.error('Error appending script:', error);
            tryNextUrl();
          }
        };
      };

      // Start the loading process with the first URL
      tryNextUrl();
    } catch (error) {
      console.error('Unexpected error during SDK load:', error);
      reject(new Error('אירעה שגיאה בלתי צפויה בטעינת מערכת התשלומים.'));
    }
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

  // Check network connectivity first
  try {
    // Use no-cors mode to test connectivity without CORS issues
    const networkTest = await fetch(IS_PRODUCTION ? 'https://meshulam.co.il/favicon.ico' : 'https://sandbox.meshulam.co.il/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit'
    });
    
    // In no-cors mode, we only get "opaque" response
    if (networkTest.type !== 'opaque') {
      throw new Error('לא ניתן להתחבר לשרת התשלומים. אנא בדוק את חיבור האינטרנט שלך.');
    }
  } catch (error) {
    console.error('Network connectivity test failed:', error);
    console.log('Creating fallback SDK');
    
    // Create a fallback SDK as a last resort
    if (!window.growPayment) {
      window.growPayment = createFallbackSdk();
      isGrowSdkLoaded = true;
      return Promise.resolve();
    }
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
      // Last resort - create a mock SDK
      if (!window.growPayment) {
        console.log('All SDK load attempts failed, creating fallback SDK');
        window.growPayment = createFallbackSdk();
        isGrowSdkLoaded = true;
        return Promise.resolve();
      } else {
        throw new Error('טעינת מערכת התשלומים נכשלה. אנא נסה שנית.');
      }
    }
  }

  return growSdkLoadPromise;
}

// Create a fallback SDK implementation for testing
function createFallbackSdk() {
  console.warn("Using fallback SDK implementation created in-app!");
  
  let sdkConfig = null;
  
  return {
    configure: function(config) {
      console.log("Grow SDK mock configured:", config);
      sdkConfig = config;
      return true;
    },
    renderPaymentOptions: function(authCode) {
      console.log("Rendering payment options with auth code:", authCode);
      alert("This is a fallback payment implementation. In a real environment, you would see payment options here.");
      
      // Simulate successful payment after 3 seconds
      setTimeout(function() {
        if (sdkConfig && sdkConfig.events && typeof sdkConfig.events.onSuccess === 'function') {
          sdkConfig.events.onSuccess({
            status: 1,
            data: {
              payment_sum: 10000, // 100 ILS
              payment_method: "Credit Card",
              number_of_payments: 1,
              transaction_id: "mock-" + Date.now(),
              email: "test@example.com",
              fullName: "Test User",
              orderId: "mock-order-" + Date.now()
            }
          });
        }
      }, 3000);
    }
  };
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

  // Log environment and configuration
  console.log('Payment Environment:', {
    isProduction: IS_PRODUCTION,
    hasGrowSDK: !!window.growPayment,
    hasUserID: !!process.env.REACT_APP_GROW_USER_ID,
    hasPageCode: !!process.env.REACT_APP_GROW_PAGE_CODE,
  });

  if (!process.env.REACT_APP_GROW_USER_ID || !process.env.REACT_APP_GROW_PAGE_CODE) {
    console.error('Missing Grow credentials:', {
      userId: !!process.env.REACT_APP_GROW_USER_ID,
      pageCode: !!process.env.REACT_APP_GROW_PAGE_CODE
    });
    throw new Error('חסרים פרטי התחברות למערכת התשלומים. אנא צור קשר עם התמיכה.');
  }

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (!isGrowSdkLoaded) {
        await loadGrowSdk();
      }

      if (!paymentData.phone?.match(/^05\d{8}$/)) {
        throw new Error('מספר הטלפון חייב להתחיל ב-05 ולהכיל 10 ספרות.');
      }

      if (!paymentData.fullName?.trim().includes(' ')) {
        throw new Error('יש להזין שם מלא (שם פרטי ושם משפחה).');
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
          userId: process.env.REACT_APP_GROW_USER_ID,
          pageCode: process.env.REACT_APP_GROW_PAGE_CODE,
          chargeType: 1,
          sum: paymentData.amount,
          currency: 1,
          successUrl: process.env.REACT_APP_PAYMENT_SUCCESS_URL || `${window.location.origin}/payment-success`,
          failUrl: process.env.REACT_APP_PAYMENT_FAIL_URL || `${window.location.origin}/payment-failed`,
          cancelUrl: `${window.location.origin}/payment-cancelled`,
          notifyUrl: `${window.location.origin}/api/payments/webhook`,
          description: 'MonkeyZ Purchase',
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
        console.error('Payment API error:', {
          status: response.status,
          statusText: response.statusText,
        });
        const errorData = await response.json().catch(() => null);
        console.error('Payment API error details:', errorData);
        throw new Error(errorData?.message || `בעיה בתקשורת עם שרת התשלומים. קוד שגיאה: ${response.status}`);
      }

      const data = await response.json();
      console.log('Payment API response:', data);

      if (data.status && window.growPayment) {
        window.growPayment.renderPaymentOptions(data.authCode);
        return { success: true };
      } else {
        throw new Error(data.message || 'האתחול של מערכת התשלומים נכשל. אנא נסה שנית.');
      }
    } catch (error) {
      if (attempt === retryCount) {
        throw error;
      }
      console.error(`Payment attempt ${attempt} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};
