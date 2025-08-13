import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { trackPurchase, trackEvent } from "../lib/analytics";

const PaymentSuccess = () => {
  const { clearCart, cartItems } = useGlobalProvider();
  const { t } = useTranslation();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);
  // Parse URL parameters to get transaction details
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const orderId = queryParams.get("transaction_id");
    if (!orderId) return;
    async function fetchOrder() {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il';
        const res = await fetch(`${apiUrl}/api/orders/${orderId}`);
        if (!res.ok) throw new Error('Failed to fetch order');
        const order = await res.json();
        // Map backend order to local shape
        const items = order.items.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));
        const orderInfo = {
          orderId: order.id,
          items,
          total: order.total,
          currency: order.currency || "ILS",
          timestamp: order.createdAt
        };
        setOrderData(orderInfo);
        // Track purchase event once
        trackPurchase(orderInfo);
        localStorage.setItem('last_purchase_date', new Date().toISOString());
        const funnelData = JSON.parse(sessionStorage.getItem('funnel_data') || '{}');
        if (funnelData?.page_view?.timestamp) {
          const conversionTimeMs = Date.now() - funnelData.page_view.timestamp;
          trackEvent('conversion_metrics', {
            conversion_time_ms: conversionTimeMs,
            conversion_time_minutes: Math.floor(conversionTimeMs / (1000 * 60)),
            funnel_steps_completed: Object.keys(funnelData).length,
            transaction_id: order.id
          });
        }
        // Always clear cart after successful payment, regardless of analytics tracking
        clearCart();
      } catch (err) {
        console.error('Error fetching order details:', err);
        // Still clear cart even if we can't fetch order details
        // since we reached the success page, payment was successful
        clearCart();
      }
    }
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Helmet>
        <title>{t("payment_success", "Payment Successful")} | MonkeyZ</title>
      </Helmet>

      <div className="max-w-md w-full bg-white dark:bg-secondary p-8 rounded-lg shadow-lg border border-base-300 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary dark:text-accent mt-4">
            {t("payment_success", "Payment Successful")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t("order_confirmation", "Your order has been confirmed!")}
          </p>
        </div>

        {orderData && (
          <div className="mb-6 border-t border-b border-gray-200 dark:border-gray-700 py-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("order_id", "Order ID")}:{" "}
              <span className="text-gray-900 dark:text-white">
                {orderData.orderId}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
              {t("amount", "Amount")}:{" "}
              <span className="text-gray-900 dark:text-white">
                ₪{orderData.total.toFixed(2)}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <Link
            to="/"
            className="w-full bg-accent hover:bg-accent/90 text-white py-2 px-4 rounded font-medium text-center transition-colors"
          >
            {t("continue_shopping", "Continue Shopping")}
          </Link>
          <Link
            to="/account"
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded font-medium text-center transition-colors"
          >
            {t("view_account", "View Your Account")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
