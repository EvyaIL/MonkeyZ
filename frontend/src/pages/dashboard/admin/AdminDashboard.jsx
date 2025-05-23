import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import ProductsTable from '../../../components/dashboard/ProductsTable';
import CouponManager from '../../../components/dashboard/CouponManager';
import StockManager from '../../../components/dashboard/StockManager';
import { useAuth } from '../../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  const renderDashboardContent = () => {
    switch (location.pathname) {
      case '/dashboard/admin/products':
        return <ProductsTable />;
      case '/dashboard/admin/coupons':
        return <CouponManager />;
      case '/dashboard/admin/stock':
        return <StockManager />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Active Coupons</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
              <p className="text-3xl font-bold">0</p>
            </div>

            {/* Recent Activity */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white p-6 rounded-lg shadow">
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
    <DashboardLayout isAdmin={true}>
      {renderDashboardContent()}
    </DashboardLayout>
  );
}
