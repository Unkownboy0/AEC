import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export async function setAppStatusBar(isDarkTheme: boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({
      style: isDarkTheme ? Style.Dark : Style.Light,
    });

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: isDarkTheme ? '#0f172a' : '#ffffff',
      });
    }
  } catch (err) {
    console.warn('[Platform] StatusBar styling failed:', err);
  }
}
