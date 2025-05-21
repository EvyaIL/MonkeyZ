import React, { useState, useEffect } from "react";
import { createPayment, loadGrowSdk, TEST_CARDS } from "../lib/paymentService";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { validateEmail } from "../lib/authUtils";
import { Helmet } from "react-helmet";
import TestProduct from '../components/TestProduct';

// Import IS_PRODUCTION from paymentService
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cartTotal } = useGlobalProvider();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // Load SDK when component mounts
    loadGrowSdk()
      .then(() => {
        console.log('SDK loaded successfully');
        setSdkLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load payment SDK:', err);
        setErrorMsg(t('payment_sdk_load_error') || 'Failed to load payment system');
      });

    // Payment event handlers
    const eventHandlers = {
      paymentSuccess: (e) => {
        console.log('Payment successful:', e.detail);
        navigate('/payment-success');
      },
      paymentFailure: (e) => {
        console.error('Payment failed:', e.detail);
        setErrorMsg(e.detail?.message || t('payment_failed') || 'Payment failed. Please try again.');
        setIsSubmitting(false);
      },
      paymentError: (e) => {
        console.error('Payment error:', e.detail);
        setErrorMsg(e.detail?.message || t('payment_error') || 'An error occurred during payment');
        setIsSubmitting(false);
      },
      paymentTimeout: () => {
        console.error('Payment timeout');
        setErrorMsg(t('payment_timeout') || 'Payment request timed out. Please try again.');
        setIsSubmitting(false);
      },
      paymentCancel: () => {
        console.log('Payment cancelled by user');
        setErrorMsg(t('payment_cancelled_by_user') || 'Payment was cancelled.');
        setIsSubmitting(false);
      },
      walletStateChange: (e) => {
        console.log('Wallet state changed:', e.detail);
        setIsSubmitting(e.detail.state === 'open');
      }
    };

    // Add event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });

    // Cleanup function
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [t, navigate]);

  const handlePay = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!cartTotal || cartTotal <= 0) {
      setErrorMsg(t('cart_empty_error') || "Your cart is empty");
      return;
    }

    if (!fullName || fullName.trim().split(' ').length < 2) {
      setErrorMsg(t('full_name_required') || "Please enter your full name (first and last name)");
      return;
    }

    if (!email || !validateEmail(email)) {
      setErrorMsg(t('invalid_email') || "Please enter a valid email address");
      return;
    }

    if (!phone || !/^05\d{8}$/.test(phone)) {
      setErrorMsg(t('invalid_phone') || "Please enter a valid Israeli phone number (10 digits starting with 05)");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        amount: Math.round(cartTotal * 100), // Convert from NIS to agorot
        fullName,
        email,
        phone,
      };

      console.log('Initiating payment with payload:', payload);
      const res = await createPayment(payload);

      if (res.error) {
        console.error('Payment creation error:', res.error);
        setErrorMsg(res.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setErrorMsg(t('payment_error') || "Payment error. Please try again.");
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Helmet>
        <title>{t("checkout")} - MonkeyZ</title>
        <meta name="description" content={t("checkout_meta_description")} />
      </Helmet>

      {cartTotal > 0 ? (
        // Regular checkout form for cart items
        <form
          onSubmit={handlePay}
          className="flex flex-col gap-4 max-w-md mx-auto mt-8 bg-white dark:bg-secondary p-8 rounded-lg shadow-lg border border-base-300 dark:border-gray-700 w-full"
          aria-label={t("checkout_form")}
        >
          <h2 className="text-3xl font-bold text-primary dark:text-accent text-center mb-2">
            {t("checkout")}
          </h2>

          <div className="text-base-content dark:text-white text-center mb-4">
            <p className="text-xl font-semibold mb-2">
              {t("total")}: ₪{cartTotal ? cartTotal.toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("secure_payment")}
            </p>
            
            {/* SDK loading status indicator */}
            <div className="mt-2 text-xs py-1 px-2 inline-flex items-center rounded-full">
              {sdkLoaded ? (
                <span className="text-green-600 bg-green-100 py-1 px-2 rounded-full">
                  ✓ {t("payment_system_ready")}
                </span>
              ) : (
                <span className="text-yellow-600 bg-yellow-100 py-1 px-2 rounded-full">
                  ⟳ {t("loading_payment_system")}
                </span>
              )}
            </div>
            
            {/* Testing button for developers */}
            {!IS_PRODUCTION && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    loadGrowSdk()
                      .then(() => {
                        setSdkLoaded(true);
                        alert('SDK loaded successfully! Check console for details');
                      })
                      .catch(err => {
                        setErrorMsg('Failed to load SDK: ' + err.message);
                      });
                  }}
                  className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded"
                >
                  Test SDK Load
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded text-center"
              role="alert"
              aria-live="polite"
            >
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("full_name")}
              </label>
              <input
                id="fullName"
                type="text"
                placeholder={t("full_name_placeholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent"
                required
                autoComplete="name"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent"
                required
                autoComplete="email"
                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("phone")}
              </label>
              <input
                id="phone"
                type="tel"
                placeholder={t("phone_placeholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-accent"
                required
                autoComplete="tel"
                pattern="05[0-9]{8}"
                maxLength="10"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full bg-accent text-white py-3 px-6 rounded-md font-semibold hover:bg-accent-dark focus:outline-none focus:ring-4 focus:ring-accent focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={isSubmitting || !cartTotal}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? t("processing") : t("pay_now")}
          </button>

          {/* Payment method icons */}
          <div className="mt-6 flex justify-center space-x-4">
            <img src="/images/visa.svg" alt="Visa" className="h-8" />
            <img src="/images/mastercard.svg" alt="Mastercard" className="h-8" />
            <img src="/images/bit.svg" alt="Bit" className="h-8" />
            <img src="/images/googlepay.svg" alt="Google Pay" className="h-8" />
          </div>

          {process.env.NODE_ENV !== 'production' && TEST_CARDS && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('test_cards')}:
              </h3>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <p>🟢 {t('successful_payment')}: {TEST_CARDS.SUCCESSFUL}</p>
                <p>🔒 {t('3ds_payment')}: {TEST_CARDS.SUCCESSFUL_3DS}</p>
                <p>📅 {t('installments_payment')}: {TEST_CARDS.INSTALLMENTS}</p>
              </div>
            </>
          )}

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            {t("secure_payment_note")}
          </p>
        </form>
      ) : (
        // Show test product when cart is empty
        <TestProduct />
      )}
    </div>
  );
};

export default Checkout;
