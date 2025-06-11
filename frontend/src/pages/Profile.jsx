import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { apiService } from "../lib/apiService";

const Profile = () => {
  const { user, logout, isLoading } = useGlobalProvider();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const response = await apiService.get("/user/me/orders"); // Changed to /user/me/orders
          if (response.data) {
            setOrders(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user, t]); // Added t to dependency array as it's used in t() calls for order status

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
        <div className="animate-pulse text-center">
          <svg className="mx-auto h-12 w-12 text-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-accent dark:text-sky-300 text-xl font-semibold">{t("loading_profile", "Loading your profile...")}</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-2xl max-w-md w-full transform transition-all hover:scale-105 duration-300">
          <svg className="mx-auto h-16 w-16 text-red-500 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-3xl font-bold text-accent dark:text-sky-400 mb-4">{t("account_required", "Account Required")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">{t("must_be_signed_in", "You must be signed in to view your profile.")}</p>
          <PrimaryButton title={t("sign_in", "Sign In")} onClick={() => navigate("/sign-in")} otherStyle="w-full py-3 text-lg" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-120px)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Profile Details Section */}
        <section className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-accent rounded-full p-3 text-white mr-0 sm:mr-5 mb-4 sm:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-white">
                {t("my_account", "My Account")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t("manage_profile_info", "View and manage your profile information.")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-gray-700 dark:text-gray-300 mb-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="font-medium text-gray-500 dark:text-gray-400 block mb-1 text-sm">{t("username_label", "Username:")}</span>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{user.username}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="font-medium text-gray-500 dark:text-gray-400 block mb-1 text-sm">{t("email_label", "Email:")}</span>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{user.email}</p>
            </div>
            {user.phone_number && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg md:col-span-2">
                <span className="font-medium text-gray-500 dark:text-gray-400 block mb-1 text-sm">{t("phone_label", "Phone:")}</span>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{user.phone_number}</p>
              </div>
            )}
          </div>
          <div className="mt-10 flex justify-end">
            <PrimaryButton title={t("logout", "Logout")} onClick={logout} otherStyle="px-8 py-3 text-base" />
          </div>
        </section>

        {/* Past Orders Section */}
        <section className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
             <div className="bg-accent rounded-full p-3 text-white mr-0 sm:mr-5 mb-4 sm:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary dark:text-white">
                {t("past_orders", "Past Orders")}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t("view_order_history", "Review your previous purchases.")}</p>
            </div>
          </div>
          {ordersLoading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              <svg className="mx-auto h-10 w-10 text-accent animate-spin mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg font-medium">{t("loading_orders", "Loading your orders...")}</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id || order._id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <h3 className="font-semibold text-lg text-accent dark:text-sky-400 mb-2 sm:mb-0">{t("order_id_label", "Order ID:")} {order.id || order._id}</h3>
                    <span className={`px-4 py-1.5 text-xs font-semibold rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                      {t(order.status?.toLowerCase() || 'status_unknown', order.status || 'Unknown Status')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">{t("order_date_label", "Date:")}</span> {new Date(order.createdAt || order.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">{t("order_total_label", "Total:")}</span> ${order.total?.toFixed(2) || 'N/A'}</p> {/* Changed totalAmount to total */}
                  </div>
                  {/* Display Order Items */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("order_items_label", "Items:")}</h4>
                    {order.items && order.items.length > 0 ? (
                      <ul className="space-y-2">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              {item.name} (x{item.quantity})
                            </span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("no_items_in_order", "No items found in this order.")}</p>
                    )}
                  </div>
                  {/* You could add a button/link here to view order details if you have a separate order details page */}
                  {/* e.g., <PrimaryButton title={t("view_details", "View Details")} onClick={() => navigate(`/order/${order.id}`)} otherStyle="mt-4 text-sm py-1.5 px-3" /> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                {t("no_orders_found", "You have no past orders.")}
              </p>
              <PrimaryButton title={t("shop_now_cta", "Shop Now")} onClick={() => navigate("/products")} otherStyle="mt-6 py-2.5 px-6" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Profile;
