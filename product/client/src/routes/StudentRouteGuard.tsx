import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface StudentRouteGuardProps {
  children: React.ReactNode;
}

export const StudentRouteGuard: React.FC<StudentRouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Verifying Student Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ensure active status and Student role
  if (user?.role !== 'Student' || (user as any).status === 'INACTIVE') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Security Alert</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your account status or role does not authorize access to the Student Portal.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
