import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function listenAppLifecycle(
  onForeground?: () => void,
  onBackground?: () => void,
  onUrlOpen?: (url: string) => void
) {
  if (!Capacitor.isNativePlatform()) return () => {};

  const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && onForeground) onForeground();
    if (!isActive && onBackground) onBackground();
  });

  const urlListener = App.addListener('appUrlOpen', (data) => {
    if (onUrlOpen) onUrlOpen(data.url);
  });

  return () => {
    appStateListener.then((l) => l.remove());
    urlListener.then((l) => l.remove());
  };
}
