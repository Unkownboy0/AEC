import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  React.useEffect(() => {
    (window as any).__campusos_is_access_denied__ = true;
    return () => {
      (window as any).__campusos_is_access_denied__ = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <ShieldOff className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">{t('errors.accessDenied.title')}</h1>
      <p className="mt-3 text-base text-gray-500 max-w-sm">
        {t('errors.accessDenied.description')}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="rtl-mirror w-4 h-4" />
          {t('navigation.goBack')}
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          {t('navigation.goHome')}
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
