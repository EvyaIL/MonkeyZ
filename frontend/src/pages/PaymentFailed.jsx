import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { trackEvent } from "../lib/analytics";

const PaymentFailed = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Track payment failure event
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorCode = queryParams.get("error_code") || "unknown_error";
    const errorMessage = queryParams.get("error_message") || "Unknown payment error";

    trackEvent('payment_failed', {
      error_code: errorCode,
      error_message: errorMessage
    });
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Helmet>
        <title>{t("payment_failed", "Payment Failed")} | MonkeyZ</title>
      </Helmet>

      <div className="max-w-md w-full bg-white dark:bg-secondary p-8 rounded-lg shadow-lg border border-base-300 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary dark:text-accent mt-4">
            {t("payment_failed", "Payment Failed")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t("payment_error_message", "There was an error processing your payment.")}
          </p>
        </div>

        <div className="mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {t("payment_retry_message", "Please try again or contact customer support if the problem persists.")}
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            to="/checkout"
            className="w-full bg-accent hover:bg-accent/90 text-white py-2 px-4 rounded font-medium text-center transition-colors"
          >
            {t("try_again", "Try Again")}
          </Link>
          <Link
            to="/"
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded font-medium text-center transition-colors"
          >
            {t("back_to_home", "Back to Home")}
          </Link>
          <Link
            to="/contact"
            className="w-full bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-white py-2 px-4 rounded font-medium text-center transition-colors"
          >
            {t("contact_support", "Contact Support")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
