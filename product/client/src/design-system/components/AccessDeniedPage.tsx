import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full mb-4">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
      <p className="text-xs text-muted-foreground mt-2 max-w-md">
        You do not have permission to view this resource. Contact your administrator if you believe this is an error.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <Home className="h-3.5 w-3.5" />
          Dashboard
        </button>
      </div>
    </div>
  );
};
