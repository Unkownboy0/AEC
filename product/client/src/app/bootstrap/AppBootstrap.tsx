import React, { useEffect, useState } from 'react';
import { isNativePlatform, getNetworkStatus, initAndroidBackButton, listenAppLifecycle } from '../../platform';
import { useAuth } from '../../context/AuthContext';
import { AecCinematicLoader } from '../../components/common/AecCinematicLoader';
import { useNavigate } from 'react-router-dom';

export const AppBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let removeBackHandler = () => {};
    let removeLifecycleHandler = () => {};
    async function bootstrap() {
      try {
        // Status bar / system bar theming is owned by ThemeContext (SystemBars API) —
        // do not duplicate it here, it previously raced with ThemeContext's call and
        // caused a status-bar flash on native launch. See lib/capacitor-native.ts.

        // 1. Check network status
        await getNetworkStatus();

        // 2. Register Android back button handling
        if (isNativePlatform()) {
          removeBackHandler = initAndroidBackButton(
            () => navigate(-1),
            () => /\/(dashboard)?$/.test(window.location.pathname) || window.location.pathname === '/login'
          );
          removeLifecycleHandler = listenAppLifecycle(
            () => window.dispatchEvent(new CustomEvent('campusos_app_foreground')),
            undefined,
            (rawUrl) => {
              try {
                const url = new URL(rawUrl);
                const path = url.protocol === 'campusos:'
                  ? `/${[url.host, url.pathname.replace(/^\//, '')].filter(Boolean).join('/')}`
                  : `${url.pathname}${url.search}${url.hash}`;
                if (path.startsWith('/') && !path.startsWith('//')) navigate(path);
              } catch { /* Ignore malformed external deep links. */ }
            },
          );
        }
      } catch (err) {
        console.warn('[Bootstrap] App bootstrap error:', err);
      } finally {
        setIsBootstrapped(true);
      }
    }

    bootstrap();
    return () => { removeBackHandler(); removeLifecycleHandler(); };
  }, [navigate]);

  const [loaderFinished, setLoaderFinished] = useState(false);

  if (authLoading || !isBootstrapped || !loaderFinished) {
    return <AecCinematicLoader onComplete={() => setLoaderFinished(true)} isReady={!authLoading && isBootstrapped} />;
  }

  return <>{children}</>;
};
