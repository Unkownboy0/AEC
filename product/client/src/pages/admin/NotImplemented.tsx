import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotImplemented: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Try to parse the module name based on path
  const getModuleName = () => {
    const path = location.pathname.replace(/^\//, '');
    if (!path) return 'Requested Module';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="flex h-[75vh] flex-col items-center justify-center text-center p-6 animate-in fade-in-50 duration-200">
      <div className="rounded-full bg-amber-500/10 p-5 mb-4 text-amber-500 border border-amber-500/20">
        <Construction className="h-10 w-10 animate-bounce" />
      </div>
      
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {getModuleName()} Module Pending Integration
      </h2>
      
      <p className="mt-2 text-xs text-muted-foreground max-w-sm leading-relaxed">
        This section is reserved for future integration. GEETORUS CAMPUSOS core business logics for student registration, examinations ledger, and fees billing will be activated in subsequent phases.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5 bg-background">
          <ArrowLeft className="h-3.5 w-3.5" />
          Go Back
        </Button>
        <Button size="sm" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotImplemented;
