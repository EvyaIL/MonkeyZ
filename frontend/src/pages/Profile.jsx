import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { apiService } from "../lib/apiService";
import { 
  UserIcon, 
  ClipboardDocumentListIcon, 
  ShoppingBagIcon, 
  ShieldCheckIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CalendarDaysIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon
} from "@heroicons/react/24/outline";

const Profile = () => {
  const { user, logout, isLoading } = useGlobalProvider();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "he";
  const isRTL = lang === "he";
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeProducts: 0
  });

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const response = await apiService.get("/user/me/orders");
          if (response.data) {
            setOrders(response.data);
            // Calculate stats
            const totalSpent = response.data.reduce((sum, order) => sum + (order.total || 0), 0);
            const activeProducts = response.data.reduce((sum, order) => {
              return sum + (order.items?.length || 0);
            }, 0);
            
            setStats({
              totalOrders: response.data.length,
              totalSpent,
              activeProducts
            });
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user, t]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">{t("loading_profile", "Loading your profile...")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheckIcon className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">{t("account_required", "Account Required")}</h1>
          <p className="text-slate-600 mb-6">{t("must_be_signed_in", "You must be signed in to view your profile.")}</p>
          <PrimaryButton 
            title={t("sign_in", "Sign In")} 
            onClick={() => navigate("/sign-in")} 
            otherStyle="w-full py-3 text-lg" 
          />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-slate-200">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    {t("my_account", "My Account")}
                  </h1>
                  <p className="text-slate-600">{t("manage_profile_info", "Welcome back! Manage your account and view your orders.")}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>{t("logout", "Logout")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-800">{stats.totalOrders}</p>
                <p className="text-slate-600">{t("total_orders", "Total Orders")}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <KeyIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-800">${stats.totalSpent.toFixed(2)}</p>
                <p className="text-slate-600">{t("total_spent", "Total Spent")}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-800">{stats.activeProducts}</p>
                <p className="text-slate-600">{t("active_products", "Active Products")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Profile Information */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <div className="flex items-center mb-6">
                <UserIcon className="h-6 w-6 text-slate-600 mr-3" />
                <h2 className="text-xl font-semibold text-slate-800">{t("profile_information", "Profile Information")}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                  <UserIcon className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t("username_label", "Username")}</p>
                    <p className="text-slate-800 font-semibold">{user.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-slate-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t("email_label", "Email")}</p>
                    <p className="text-slate-800 font-semibold">{user.email}</p>
                  </div>
                </div>
                
                {user.phone_number && (
                  <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-slate-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">{t("phone_label", "Phone")}</p>
                      <p className="text-slate-800 font-semibold">{user.phone_number}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-600">{t("account_status", "Account Status")}</p>
                    <p className="text-green-700 font-semibold">{t("verified", "Verified & Active")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-slate-600 mr-3" />
                  <h2 className="text-xl font-semibold text-slate-800">{t("order_history", "Order History")}</h2>
                </div>
                {orders.length > 0 && (
                  <button
                    onClick={() => navigate("/products")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    {t("shop_more", "Shop More")}
                  </button>
                )}
              </div>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="ml-3 text-slate-600">{t("loading_orders", "Loading your orders...")}</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {orders.map((order) => (
                    <div key={order.id || order._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="font-semibold text-slate-800">
                              {t("order_id_label", "Order")} #{order.id || order._id}
                            </p>
                            <p className="text-sm text-slate-500">
                              {new Date(order.createdAt || order.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {t(order.status?.toLowerCase() || 'status_unknown', order.status || 'Unknown')}
                          </span>
                          <span className="font-bold text-slate-800">${order.total?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 mt-3">
                          <p className="text-sm font-medium text-slate-600 mb-2">{t("order_items", "Items")}:</p>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-slate-700">
                                  {item.name} × {item.quantity}
                                  {item.assigned_keys && item.assigned_keys.length > 0 && (
                                    <span className="ml-2 text-green-600 font-mono text-xs">
                                      🔑 {item.assigned_keys.length} key{item.assigned_keys.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </span>
                                <span className="font-medium text-slate-800">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBagIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    {t("no_orders_found", "No orders yet")}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {t("start_shopping_message", "Start shopping to see your orders here!")}
                  </p>
                  <button
                    onClick={() => navigate("/products")}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    {t("browse_products", "Browse Products")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
