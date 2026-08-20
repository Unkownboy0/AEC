import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';

export class CapacitorNativeService {
  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public static getPlatform(): 'web' | 'android' | 'ios' {
    return Capacitor.getPlatform() as 'web' | 'android' | 'ios';
  }

  /**
   * Initializes native app UI (splash screen only).
   *
   * Status bar / system bar styling is intentionally NOT handled here — it is
   * owned exclusively by ThemeContext's applyNativeStatusBar(), which reacts to
   * the actual resolved theme via the modern SystemBars API. Having a second,
   * hardcoded status-bar call here caused a boot-time flicker (this call used to
   * force a dark bar regardless of theme, briefly overriding ThemeContext's
   * correct value on every native launch).
   */
  public static async initNativeAppUI(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await SplashScreen.hide();
    } catch (err) {
      console.warn('Native UI initialization warning:', err);
    }
  }

  /**
   * Secure Native Storage methods (using Android Keystore / iOS Keychain via CampusOSSecureStorage)
   *
   * @deprecated These wrapper methods duplicate auth/token-storage.ts which is the canonical
   * source for auth token storage (with proper migration + error handling). New code should
   * use token-storage.ts directly. These wrappers remain only for backward compatibility with
   * any non-auth secure storage use cases.
   */
  public static async setSecureItem(key: string, value: string): Promise<void> {
    if (this.isNative()) {
      const { CampusOSSecureStorage } = await import('../platform/native-secure-storage');
      await CampusOSSecureStorage.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  public static async getSecureItem(key: string): Promise<string | null> {
    if (this.isNative()) {
      try {
        const { CampusOSSecureStorage } = await import('../platform/native-secure-storage');
        const { value } = await CampusOSSecureStorage.get({ key });
        return value;
      } catch {
        return null;
      }
    }
    return localStorage.getItem(key);
  }

  public static async removeSecureItem(key: string): Promise<void> {
    if (this.isNative()) {
      try {
        const { CampusOSSecureStorage } = await import('../platform/native-secure-storage');
        await CampusOSSecureStorage.remove({ key });
      } catch {}
    } else {
      localStorage.removeItem(key);
    }
  }

  /**
   * Monitor Network Connectivity
   *
   * @note This method does not return a cleanup handle. Use platform/network.ts
   * listenNetworkStatus() directly for subscriptions that need proper cleanup.
   */
  public static listenNetworkStatus(onStatusChange: (isOnline: boolean) => void): void {
    Network.addListener('networkStatusChange', (status) => {
      onStatusChange(status.connected);
    });
  }
}
