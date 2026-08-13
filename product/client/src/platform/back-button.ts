import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export type BackButtonHandler = () => boolean; // return true if handled

const backButtonHandlers: BackButtonHandler[] = [];

/** Register a high-priority modal/drawer back button handler */
export function registerBackButtonHandler(handler: BackButtonHandler): () => void {
  backButtonHandlers.unshift(handler);
  return () => {
    const idx = backButtonHandlers.indexOf(handler);
    if (idx !== -1) backButtonHandlers.splice(idx, 1);
  };
}

/** Initialize global Android back button listener */
export function initAndroidBackButton(navigateBack: () => void, isAtRootPage: () => boolean) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return () => {};

  const listener = App.addListener('backButton', ({ canGoBack }) => {
    // 1. Run modal/sheet/drawer handlers first
    for (const handler of backButtonHandlers) {
      const handled = handler();
      if (handled) return;
    }

    // 2. If at root dashboard/home page, minimize app safely
    if (isAtRootPage()) {
      App.minimizeApp();
      return;
    }

    // 3. Otherwise navigate back in router history
    if (canGoBack) {
      navigateBack();
    } else {
      App.minimizeApp();
    }
  });

  return () => { listener.then((handle) => handle.remove()); };
}
