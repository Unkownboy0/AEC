import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class HapticsService {
  /**
   * Triggers a subtle tactile impact.
   */
  public static async impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(style === 'heavy' ? 30 : style === 'medium' ? 20 : 10);
      }
      return;
    }

    try {
      const impactStyle =
        style === 'heavy' ? ImpactStyle.Heavy : style === 'light' ? ImpactStyle.Light : ImpactStyle.Medium;
      await Haptics.impact({ style: impactStyle });
    } catch {
      // Ignore unsupported devices
    }
  }

  /**
   * Triggers a semantic notification haptic (success / warning / error).
   */
  public static async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(type === 'error' ? [40, 60, 40] : type === 'warning' ? [30, 40] : 25);
      }
      return;
    }

    try {
      const notifType =
        type === 'error'
          ? NotificationType.Error
          : type === 'warning'
          ? NotificationType.Warning
          : NotificationType.Success;
      await Haptics.notification({ type: notifType });
    } catch {
      // Ignore unsupported devices
    }
  }

  /**
   * Triggers selection change haptic.
   */
  public static async selection(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.selectionChanged();
    } catch {
      // Ignore
    }
  }
}
