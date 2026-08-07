import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleDefaultDashboard } from '../navigation/route-resolver';
import { AppIcon } from '../design-system/icons/AppIcon';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-xl shadow-indigo-500/10">
        <AppIcon name="Search" size={40} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mb-8">
        The page or record you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate(getRoleDefaultDashboard(role))}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};
