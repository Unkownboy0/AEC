import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
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
   * Initializes native app UI (Status bar, splash screen)
   */
  public static async initNativeAppUI(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#020617' });
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
          console.log('Push Registration Token:', token.value);
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
   * Secure Native Storage methods (using Preferences)
   */
  public static async setSecureItem(key: string, value: string): Promise<void> {
    if (this.isNative()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  public static async getSecureItem(key: string): Promise<string | null> {
    if (this.isNative()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  }

  public static async removeSecureItem(key: string): Promise<void> {
    if (this.isNative()) {
      await Preferences.remove({ key });
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
