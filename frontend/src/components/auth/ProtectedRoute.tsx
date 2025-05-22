import { Navigate } from 'react-router-dom';
import { useGlobalProvider } from '../../context/GlobalProvider';
import { Role } from '../../models/user';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isLoading } = useGlobalProvider();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // Redirect to home if trying to access admin route without admin privileges
  if (requireAdmin && user.role !== Role.manager) {
    return <Navigate to="/" replace />;
  }

  return children;
};
