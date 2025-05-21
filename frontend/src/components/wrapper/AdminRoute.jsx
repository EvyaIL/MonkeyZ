import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGlobalProvider } from '../../context/GlobalProvider';

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useGlobalProvider();
  
  // If loading, show nothing
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is admin
  if (!isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // If admin, render the children
  return children;
};

export default AdminRoute;
