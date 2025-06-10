import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { useTranslation } from "react-i18next";
import { apiService } from "../lib/apiService"; // Corrected import
import { toast } from "react-toastify"; // For displaying notifications
import { useEffect, useState } from "react";

const Profile = () => {
  const { user, logout, isLoading } = useGlobalProvider();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return; // Don't fetch if user is not loaded

      setIsLoadingOrders(true);
      setErrorOrders(null);
      try {
        // Use the new endpoint, assuming current_user from token is sufficient for backend
        const response = await apiService.get("/user/my-orders");
        setOrders(response.data || []); // Assuming response.data is the array of orders
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setErrorOrders(err.response?.data?.detail || "Failed to load past orders.");
        toast.error(err.response?.data?.detail || "Failed to load past orders.");
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]); // Refetch if user changes (e.g., on login)

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-accent text-xl">{t("loading_profile", "Loading your profile...")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-accent mb-4">{t("account_required", "Account Required")}</h1>
        <p className="text-gray-300 mb-4">{t("must_be_signed_in", "You must be signed in to view your profile.")}</p>
        <PrimaryButton title={t("sign_in", "Sign In")} onClick={() => navigate("/sign-in")}/>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center py-10">
      <div className="p-6 space-y-8"> {/* Added space-y-8 for spacing between sections */}
        <section className="bg-white dark:bg-secondary p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-accent mb-4" tabIndex={0} aria-label="Profile Page">
            👤 {t("my_account", "My Account")}
          </h1>
          <div className="text-base-content dark:text-white text-left mb-6">
            <div className="mb-2"><span className="font-semibold text-accent">{t("username_label", "Username:")}</span> {user.username}</div>
            <div className="mb-2"><span className="font-semibold text-accent">{t("email_label", "Email:")}</span> {user.email}</div>
            {user.phone_number && (
              <div className="mb-2"><span className="font-semibold text-accent">{t("phone_label", "Phone:")}</span> {user.phone_number}</div>
            )}
          </div>
          <PrimaryButton title={t("logout", "Logout")} onClick={logout} otherStyle="w-full" />
        </section>

        {/* Past Orders Section */}
        <section className="mt-12 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-2xl"> {/* Adjusted max-width for orders */}
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            {t("past_orders", "Past Orders")}
          </h2>
          {isLoadingOrders ? (
            <p className="text-gray-600 dark:text-gray-300">{t("loading_orders", "Loading orders...")}</p>
          ) : errorOrders ? (
            <p className="text-red-500 dark:text-red-400">{errorOrders}</p>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-primary dark:text-accent">
                      {t("order_id", "Order ID")}: {order.id}
                    </h3>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium \
                      ${order.status === "Pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200" :
                        order.status === "Shipped" ? "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200" :
                        order.status === "Delivered" ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200" :
                        order.status === "Canceled" ? "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"}`}>
                      {t(order.status ? order.status.toLowerCase() : 'unknown_status', order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t("date", "Date")}: {new Date(order.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t("total_amount", "Total Amount")}: ${order.total ? order.total.toFixed(2) : '0.00'}
                  </p>
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-1">{t("items", "Items")}:</h4>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                      {order.items && order.items.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          {item.name} - {t("quantity", "Quantity")}: {item.quantity} - ${item.price ? item.price.toFixed(2) : '0.00'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">{t("no_past_orders", "You have no past orders.")}</p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Profile;
