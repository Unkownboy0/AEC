import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { registerBackButtonHandler } from '../platform/back-button';

/**
 * Hook for page-level modal/drawer back button handling.
 *
 * Uses the centralized registerBackButtonHandler priority queue so handlers are
 * prioritized correctly (modal close > navigation > minimize). Do NOT use
 * App.addListener('backButton') directly — it creates duplicate listeners that race
 * with the global handler registered in AppBootstrap via initAndroidBackButton().
 */
export const useNativeBackButton = (isModalOpen: boolean, closeModal?: () => void) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Register a high-priority handler for modal/drawer closing
    const unregister = registerBackButtonHandler(() => {
      // 1. Close Modal/Drawer if open — highest priority
      if (isModalOpen && closeModal) {
        closeModal();
        return true; // handled
      }

      // 2. Handle Root paths (Exit application) — second priority
      const rootPaths = ['/', '/dashboard', '/student/dashboard', '/hod/dashboard', '/login', '/approval-center'];
      if (rootPaths.includes(location.pathname)) {
        App.minimizeApp();
        return true; // handled
      }

      // 3. Not handled by this hook — let global handler navigate/minimize
      return false;
    });

    return unregister;
  }, [location.pathname, isModalOpen, closeModal, navigate]);
};
