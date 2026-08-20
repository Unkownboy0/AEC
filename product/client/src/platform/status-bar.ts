import { syncNativeSystemBars } from '../context/ThemeContext';

/**
 * Universal Native Status Bar Wrapper
 * Delegates directly to the centralized syncNativeSystemBars in ThemeContext.
 */
export async function setAppStatusBar(isDarkTheme: boolean): Promise<void> {
  return syncNativeSystemBars(isDarkTheme ? 'dark' : 'light');
}
