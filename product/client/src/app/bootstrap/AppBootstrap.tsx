import React, { useEffect, useState } from 'react';
import { isNativePlatform, setAppStatusBar, getNetworkStatus, initAndroidBackButton } from '../../platform';
import { useAuth } from '../../context/AuthContext';
import { AecCinematicLoader } from '../../components/common/AecCinematicLoader';
import { useNavigate } from 'react-router-dom';

export const AppBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Configure status bar theme
        const isDark = document.documentElement.classList.contains('dark');
        await setAppStatusBar(isDark);

        // 2. Check network status
        await getNetworkStatus();

        // 3. Register Android back button handling
        if (isNativePlatform()) {
          initAndroidBackButton(
            () => navigate(-1),
            () => window.location.pathname.includes('/dashboard')
          );
        }
      } catch (err) {
        console.warn('[Bootstrap] App bootstrap error:', err);
      } finally {
        setIsBootstrapped(true);
      }
    }

    bootstrap();
  }, [navigate]);

  const [loaderFinished, setLoaderFinished] = useState(false);

  if (authLoading || !isBootstrapped || !loaderFinished) {
    return <AecCinematicLoader onComplete={() => setLoaderFinished(true)} isReady={!authLoading && isBootstrapped} />;
  }

  return <>{children}</>;
};
