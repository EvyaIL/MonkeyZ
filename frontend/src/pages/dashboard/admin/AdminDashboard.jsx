import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import ProductsTable from '../../../components/dashboard/ProductsTable';
import CouponManager from '../../../components/dashboard/CouponManager';
import StockManager from '../../../components/dashboard/StockManager';
import OrderManager from '../../../components/dashboard/OrderManager';
import { useAuth } from '../../../context/AuthContext';

const AdminOverview = () => {
  // Your existing overview component code here
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
        <p className="text-3xl font-bold">0</p>
      </div>
      {/* Add other stats cards */}
    </div>
  );
};

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  
  if (!user || !isAdmin) {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <DashboardLayout isAdmin={true}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<ProductsTable />} />
        <Route path="stock" element={<StockManager />} />
        <Route path="orders" element={<OrderManager />} />
        <Route path="coupons" element={<CouponManager />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<ProductsTable />} />
        <Route path="stock" element={<StockManager />} />
        <Route path="orders" element={<OrderManager />} />
        <Route path="coupons" element={<CouponManager />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </DashboardLayout>
  );
}
