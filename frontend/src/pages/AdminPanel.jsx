import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { apiService } from "../lib/apiService";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

const AdminPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useGlobalProvider();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  
  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!token) {
      navigate("/sign-in");
      return;
    }
    
    // Check if user is admin (role 0 is manager)
    if (user?.role !== 0) {
      setError("Access denied. Admin privileges required.");
      return;
    }
    
    // Load admin data
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // Get all users
        const { data, error } = await apiService.get("/user/all");
        if (error) {
          setError(error || "Failed to fetch users");
          return;
        }
        setUsers(data || []);
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [token, user, navigate]);

  if (error && error === "Access denied. Admin privileges required.") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-secondary p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-error mb-4">Access Denied</h1>
          <p className="mb-6">You do not have permission to access the admin panel.</p>
          <button 
            onClick={() => navigate("/")}
            className="bg-accent hover:bg-accent-dark text-white py-2 px-6 rounded transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>MonkeyZ - Admin Panel</title>
        <meta name="description" content="Admin panel for MonkeyZ website management" />
      </Helmet>
      <div className="min-h-screen p-6">
        <div className="bg-white dark:bg-secondary p-6 rounded-lg shadow-lg mb-6">
          <h1 className="text-3xl font-bold text-accent mb-6">Admin Panel</h1>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded mb-6">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Management Section */}
              <section className="bg-base-200 dark:bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                
                {users.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-3 whitespace-nowrap">{user.username}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{user.email}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {user.role === 0 ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Admin
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  User
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Other admin sections can be added here */}
              {/* <section className="bg-base-200 dark:bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Product Management</h2>
                // Product management content
              </section> */}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
