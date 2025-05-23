import { Navigate, useLocation } from 'react-router-dom';
import { useGlobalProvider } from '../../context/GlobalProvider';
import { Role } from '../../models/user.ts';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isLoading, isAuthenticated } = useGlobalProvider();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated || !user) {
    // Save the attempted URL
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Redirect to home if trying to access admin route without admin privileges
  if (requireAdmin && user.role !== Role.manager) {
    return <Navigate to="/dashboard/user" replace />;
  }

  return children;
};
