import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

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
   * Registers native device push notifications
   */
  public static async registerPushNotifications(
    onTokenReceived?: (token: string) => void,
    onNotificationOpened?: (notification: any) => void
  ): Promise<void> {
    if (!this.isNative()) return;

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === 'granted') {
        await PushNotifications.register();

        await PushNotifications.addListener('registration', (token) => {
          // SECURITY: never log full FCM token — masked prefix only
          console.log('[Push] FCM registration OK (token masked for security)');
          if (onTokenReceived) onTokenReceived(token.value);
        });

        await PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error:', err);
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received:', notification);
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push action performed:', action);
          if (onNotificationOpened) onNotificationOpened(action.notification);
        });
      }
    } catch (err) {
      console.warn('Push notification setup failed:', err);
    }
  }

  /**
   * Schedules a local notification
   */
  public static async scheduleLocalNotification(title: string, body: string, id: number = 1): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 500) },
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (err) {
      console.warn('Local notification schedule error:', err);
    }
  }

  /**
   * Secure Native Storage methods (using Android Keystore / iOS Keychain via CampusOSSecureStorage)
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
   */
  public static listenNetworkStatus(onStatusChange: (isOnline: boolean) => void): void {
    Network.addListener('networkStatusChange', (status) => {
      onStatusChange(status.connected);
    });
  }
}
