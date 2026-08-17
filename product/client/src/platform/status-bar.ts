import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';

/**
 * @deprecated This module is dead code — it has no callers outside its own file.
 * Native status bar styling is owned exclusively by ThemeContext (src/context/ThemeContext.tsx).
 * ThemeContext uses the modern SystemBars API + StatusBar API with proper guards to
 * avoid redundant native calls. Do not call setAppStatusBar() directly.
 */
export async function setAppStatusBar(isDarkTheme: boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Show status bar explicitly
    try {
      await StatusBar.show();
    } catch (_) {}

    // 2. SystemBars API
    try {
      const style = isDarkTheme ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
      await SystemBars.setStyle({ bar: SystemBarType.StatusBar, style });
      await SystemBars.setStyle({ bar: SystemBarType.NavigationBar, style });
    } catch (_) {}

    // 3. StatusBar API
    try {
      await StatusBar.setStyle({
        style: isDarkTheme ? Style.Dark : Style.Light,
      });

      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({
          color: isDarkTheme ? '#020617' : '#ffffff',
        });
      }
    } catch (_) {}
  } catch (err) {
    console.warn('[Platform] StatusBar styling failed:', err);
  }
}
