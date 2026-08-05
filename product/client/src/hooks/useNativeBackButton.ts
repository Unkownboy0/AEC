import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const useNativeBackButton = (isModalOpen: boolean, closeModal?: () => void) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      // 1. Close Modal/Drawer if open
      if (isModalOpen && closeModal) {
        closeModal();
        return;
      }

      // 2. Handle Root paths (Exit application)
      const rootPaths = ['/', '/dashboard', '/student/dashboard', '/hod/dashboard', '/login', '/approval-center'];
      if (rootPaths.includes(location.pathname)) {
        App.minimizeApp();
        return;
      }

      // 3. Navigate back
      if (canGoBack) {
        navigate(-1);
      } else {
        App.minimizeApp();
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [location.pathname, isModalOpen, closeModal, navigate]);
};
