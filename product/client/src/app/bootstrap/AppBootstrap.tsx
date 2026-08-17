import React, { useEffect, useState } from 'react';
import { isNativePlatform, setAppStatusBar, getNetworkStatus, initAndroidBackButton, listenAppLifecycle } from '../../platform';
import { useAuth } from '../../context/AuthContext';
import { AecCinematicLoader } from '../../components/common/AecCinematicLoader';
import { ForcePasswordChangeGate } from '../../components/auth/ForcePasswordChangeGate';
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
        // 1. Configure status bar theme
        const isDark = document.documentElement.classList.contains('dark');
        await setAppStatusBar(isDark);

        // 2. Check network status
        await getNetworkStatus();

        // 3. Register Android back button handling
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

  // Freshly provisioned accounts (e.g. admission auto-provisioning) start
  // with a known initial password (their phone number) and are flagged
  // forcePasswordChange until the owner sets their own. Block the rest of
  // the app until that happens rather than leaving a guessable password
  // in place indefinitely.
  if (user?.forcePasswordChange) {
    return <ForcePasswordChangeGate />;
  }

  return <>{children}</>;
};
