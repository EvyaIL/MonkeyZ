import React from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserFavorites from '../../../components/dashboard/UserFavorites';
import UserOrders from '../../../components/dashboard/UserOrders';
import UserComments from '../../../components/dashboard/UserComments';
import UserProfile from '../../../components/dashboard/UserProfile';
import { useAuth } from '../../../context/AuthContext';

export default function UserDashboard() {  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return (
    <DashboardLayout isAdmin={false}>
      <Routes>
        <Route index element={<UserProfile />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="favorites" element={<UserFavorites />} />
        <Route path="orders" element={<UserOrders />} />
        <Route path="comments" element={<UserComments />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </DashboardLayout>
  );
}
