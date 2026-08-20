import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

/*
  CAMPUSOS THEME SYSTEM v2
  
  Storage key: 'campusos_theme' (matches the flash-prevention script in index.html)
  Supported values: 'light' | 'dark' | 'system'
  
  The .dark class is applied to <html> which drives all CSS tokens.
  On Capacitor, the status bar is updated to match the active theme.
*/

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'campusos_theme';

function getStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  // system
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

// Track whether StatusBar.show() has been called this session to avoid Logcat spam
let _statusBarShownOnce = false;

/**
 * Universal Native System Bars Synchronization Utility
 * Synchronizes Android and iOS status bar & navigation bar styles with the resolved theme.
 */
export async function syncNativeSystemBars(resolved: ResolvedTheme): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const isDark = resolved === 'dark';

    // 1. Ensure status bar is visible
    if (!_statusBarShownOnce) {
      try {
        await StatusBar.show();
        await StatusBar.setOverlaysWebView({ overlay: false });
        _statusBarShownOnce = true;
      } catch (_) {}
    }

    // 2. Modern SystemBars plugin API (Capacitor 8+)
    try {
      // Style describes foreground icon brightness, not the background theme.
      const systemBarStyle = isDark ? SystemBarsStyle.Light : SystemBarsStyle.Dark;
      await SystemBars.setStyle({ bar: SystemBarType.StatusBar, style: systemBarStyle });
      await SystemBars.setStyle({ bar: SystemBarType.NavigationBar, style: systemBarStyle });
    } catch (_) {}

    // 3. StatusBar plugin API for native status bar styling & background color
    try {
      await StatusBar.setStyle({
        style: isDark ? Style.Light : Style.Dark,
      });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({
          color: isDark ? '#020617' : '#F7F8FC',
        });
      }
    } catch (_) {}
  } catch (err) {
    console.warn('[Theme] System bar style update failed:', err);
  }
}

async function applyNativeStatusBar(resolved: ResolvedTheme): Promise<void> {
  return syncNativeSystemBars(resolved);
}

function applyDomTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  // Update theme-color meta for PWA
  const lightMeta = document.querySelector('meta[name="theme-color"][media*="light"]');
  const darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');
  if (lightMeta) lightMeta.setAttribute('content', '#F7F8FC');
  if (darkMeta) darkMeta.setAttribute('content', '#090B10');
}

interface ThemeContextProps {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredPreference()));

  const applyTheme = useCallback(async (pref: ThemePreference) => {
    const res = resolveTheme(pref);
    setResolved(res);
    applyDomTheme(res);
    await applyNativeStatusBar(res);
  }, []);

  // Initial apply
  useEffect(() => {
    applyTheme(preference);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for OS appearance change when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);

    return () => {
      mq.removeEventListener('change', handler);
    };
  }, [preference, applyTheme]);

  // Re-assert the resolved system-bar style after every native resume. OEMs may
  // reset icon contrast even when the user selected an explicit light/dark theme.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => void } | null = null;
    App.addListener('appStateChange', (state) => {
      if (state.isActive) window.setTimeout(() => applyTheme(preference), 100);
    }).then((listener) => { handle = listener; }).catch(() => {});
    return () => { handle?.remove(); };
  }, [preference, applyTheme]);

  const setTheme = useCallback((pref: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {}
    setPreference(pref);
    applyTheme(pref);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = resolved === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolved, setTheme]);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
