import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserFavorites from '../../../components/dashboard/UserFavorites';
import UserOrders from '../../../components/dashboard/UserOrders';
import UserComments from '../../../components/dashboard/UserComments';
import UserProfile from '../../../components/dashboard/UserProfile';
import { useAuth } from '../../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function UserDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    switch (location.pathname) {
      case '/dashboard/user/profile':
        return <UserProfile />;
      case '/dashboard/user/favorites':
        return <UserFavorites />;
      case '/dashboard/user/orders':
        return <UserOrders />;
      case '/dashboard/user/comments':
        return <UserComments />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">{user.username?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{user.username}</h2>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Favorite Items</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Orders</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Comments</h3>
              <p className="text-3xl font-bold">0</p>
            </div>

            {/* Recent Activity */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <p className="text-gray-500">No recent activity</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout isAdmin={false}>
      {renderContent()}
    </DashboardLayout>
  );
}
