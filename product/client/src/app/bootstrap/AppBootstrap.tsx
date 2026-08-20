import React, { useEffect, useRef, useState } from 'react';
import { isNativePlatform, getNetworkStatus, initAndroidBackButton, listenAppLifecycle } from '../../platform';
import { useAuth } from '../../context/AuthContext';
import { AecCinematicLoader } from '../../components/common/AecCinematicLoader';
import { AppProductTour, ONBOARDING_STORAGE_KEY } from '../../components/common/AppProductTour';
import { RoleAwareProductTour, isTourCompleted } from '../../components/common/RoleAwareProductTour';
import { useNavigate } from 'react-router-dom';
import { consumePendingDeepLink } from '../../platform/pending-deep-link';

export const AppBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [loaderFinished, setLoaderFinished] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  // Role-aware tour state — shown once after generic onboarding, per userId+role
  const [showRoleTour, setShowRoleTour] = useState(false);
  const roleTourChecked = useRef(false);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const capabilitiesLoadedRef = useRef(false);

  useEffect(() => {
    let removeBackHandler = () => {};
    let removeLifecycleHandler = () => {};
    async function bootstrap() {
      try {
        const storedScale = localStorage.getItem('campusos_font_scale') || 'default';
        document.documentElement.setAttribute('data-font-size', storedScale);
        await getNetworkStatus();
        if (isNativePlatform()) {
          removeBackHandler = initAndroidBackButton(
            () => navigate(-1),
            () => /\/(dashboard)?$/.test(window.location.pathname) || window.location.pathname === '/login'
          );
          removeLifecycleHandler = listenAppLifecycle(
            () => window.dispatchEvent(new CustomEvent('campusos_app_foreground')),
            () => window.dispatchEvent(new CustomEvent('campusos_app_background')),
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

  useEffect(() => {
    if (!user || capabilitiesLoadedRef.current) return;
    capabilitiesLoadedRef.current = true;
    import('../../platform/device-capabilities.manager').then(({ deviceCapabilities }) => {
      deviceCapabilities.loadEffectivePolicy().catch(() => {});
    });
    const pending = consumePendingDeepLink();
    if (pending) {
      navigate(pending, { replace: false });
    }
  }, [user, navigate]);

  // When AecCinematicLoader completes, check if onboarding tour should be shown
  const handleLoaderComplete = () => {
    setLoaderFinished(true);
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    if (!completed) {
      setShowTour(true);
    } else {
      setTourDismissed(true);
      if (user && !roleTourChecked.current) {
        roleTourChecked.current = true;
        const role = typeof user.role === 'object' ? (user.role as any)?.name || '' : user.role || '';
        if (!isTourCompleted(user.id, role)) {
          setShowRoleTour(true);
        }
      }
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    setTourDismissed(true);
    // After generic tour, check if role tour is needed
    if (user && !roleTourChecked.current) {
      roleTourChecked.current = true;
      const role = typeof user.role === 'object' ? (user.role as any)?.name || '' : user.role || '';
      if (!isTourCompleted(user.id, role)) {
        setShowRoleTour(true);
      }
    }
  };

  // 1. Initial loading animation layer
  if (!loaderFinished) {
    return <AecCinematicLoader onComplete={handleLoaderComplete} isReady={!authLoading && isBootstrapped} />;
  }

  // 2. Onboarding Product Tour (if eligible and not yet dismissed)
  if (showTour && !tourDismissed) {
    return <AppProductTour isOpen={true} onComplete={handleTourComplete} />;
  }

  // 3. Role-Aware Product Tour (shown once per user/role after initial onboarding)
  if (showRoleTour && user) {
    const role = typeof user.role === 'object' ? (user.role as any)?.name || '' : user.role || '';
    return (
      <>
        {children}
        <RoleAwareProductTour
          isOpen={showRoleTour}
          userRole={role}
          userId={user.id}
          onComplete={() => setShowRoleTour(false)}
        />
      </>
    );
  }

  // 4. Post-onboarding: render children (AppRouter)
  return <>{children}</>;
};
