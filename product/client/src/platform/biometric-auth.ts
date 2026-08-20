import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { BiometricAuth, BiometryError, BiometryErrorType } from '@aparajita/capacitor-biometric-auth';

/*
  CAMPUSOS BIOMETRIC APP LOCK

  Real native biometric re-authentication via @aparajita/capacitor-biometric-auth
  (fingerprint / Face ID / iris, with optional device-credential fallback).

  This is an OPT-IN local app lock layered on top of the existing session/token
  auth — it never replaces backend authorization, and failure always falls back
  to the app's normal password/session flow (see BiometricLockGate's "Log out
  instead" escape hatch). The preference defaults to OFF and is only ever
  surfaced/usable on native platforms with enrolled biometry.
*/

const LOCK_PREF_KEY = 'campusos_biometric_lock_enabled';

type BiometricAuditEvent = 'BIOMETRIC_LOCK_ENABLED' | 'BIOMETRIC_LOCK_DISABLED' | 'APP_UNLOCK_SUCCESS' | 'APP_UNLOCK_FAILED';

async function auditBiometricEvent(event: BiometricAuditEvent): Promise<void> {
  try {
    const { default: api } = await import('../lib/axios');
    await api.post('/security/mobile-events', { event });
  } catch {
    // App-lock enforcement must never depend on audit transport availability.
  }
}

export type BiometricAuthState = 'granted' | 'denied' | 'denied-permanently' | 'unavailable' | 'cancelled';

export interface BiometricAuthResult {
  success: boolean;
  state: BiometricAuthState;
  error?: string;
}

export interface BiometricAvailability {
  isAvailable: boolean;
  reason?: string;
}

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!Capacitor.isNativePlatform()) {
    return { isAvailable: false, reason: 'Biometric app lock is only available in the CampusOS app' };
  }
  try {
    const result = await BiometricAuth.checkBiometry();
    return { isAvailable: result.isAvailable, reason: result.isAvailable ? undefined : result.reason };
  } catch (err) {
    return { isAvailable: false, reason: err instanceof Error ? err.message : 'Biometric hardware check failed' };
  }
}

export async function getBiometricLockEnabled(): Promise<boolean> {
  try {
    const { value } = await Preferences.get({ key: LOCK_PREF_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await Preferences.set({ key: LOCK_PREF_KEY, value: enabled ? 'true' : 'false' });
  void auditBiometricEvent(enabled ? 'BIOMETRIC_LOCK_ENABLED' : 'BIOMETRIC_LOCK_DISABLED');
}

/**
 * Prompt the user for biometric (or device-credential-fallback) re-authentication.
 * Never fabricates success — a rejected/failed native prompt always resolves
 * `success: false` with a state the caller can act on.
 */
export async function authenticateWithBiometrics(
  reason: string = 'Confirm your identity to access CampusOS'
): Promise<BiometricAuthResult> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, state: 'unavailable', error: 'Biometric authentication is only available in the CampusOS app' };
  }

  try {
    const check = await BiometricAuth.checkBiometry();
    if (!check.isAvailable) {
      return { success: false, state: 'unavailable', error: check.reason || 'No biometric authentication is enrolled on this device' };
    }

    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
      iosFallbackTitle: 'Use Passcode',
      androidTitle: 'CampusOS App Lock',
      androidSubtitle: reason,
      androidConfirmationRequired: false,
    });

    void auditBiometricEvent('APP_UNLOCK_SUCCESS');
    return { success: true, state: 'granted' };
  } catch (err) {
    void auditBiometricEvent('APP_UNLOCK_FAILED');
    if (err instanceof BiometryError) {
      switch (err.code) {
        case BiometryErrorType.userCancel:
        case BiometryErrorType.systemCancel:
        case BiometryErrorType.appCancel:
          return { success: false, state: 'cancelled', error: err.message };
        case BiometryErrorType.biometryLockout:
          return {
            success: false,
            state: 'denied-permanently',
            error: 'Too many failed attempts. Biometric authentication is temporarily locked — use your device passcode or wait before trying again.',
          };
        case BiometryErrorType.biometryNotAvailable:
        case BiometryErrorType.biometryNotEnrolled:
        case BiometryErrorType.noDeviceCredential:
        case BiometryErrorType.passcodeNotSet:
          return { success: false, state: 'unavailable', error: err.message };
        default:
          return { success: false, state: 'denied', error: err.message };
      }
    }
    return { success: false, state: 'denied', error: err instanceof Error ? err.message : 'Biometric authentication failed' };
  }
}
