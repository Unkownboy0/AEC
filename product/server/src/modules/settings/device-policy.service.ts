import { prisma } from '../../lib/prisma';
import { SETTING_DEFINITIONS } from './settings.catalog';

export interface DeviceCapabilityPolicy {
  push: boolean;
  camera: boolean;
  qrScanner: boolean;
  docScanner: boolean;
  voiceNotes: boolean;
  biometricLock: boolean;
  location: boolean;
  transportDriverGps: boolean;
  haptics: boolean;
  nativeSharing: boolean;
  nativeDownloads: boolean;
  nativePrinting: boolean;
  offlineCache: boolean;
  digitalSignature: boolean;
  calendarSync: boolean;
  nfc: boolean;
  ble: boolean;
  screenSecurity: boolean;
}

export class DevicePolicyService {
  /**
   * Reads raw settings from database with default fallbacks from catalog.
   */
  public static async getGlobalSettings(): Promise<Record<string, boolean>> {
    const rawSettings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'DEVICE_' } },
    });

    const settingsMap = new Map<string, string>();
    for (const s of rawSettings) {
      settingsMap.set(s.key, s.value);
    }

    const result: Record<string, boolean> = {};
    for (const def of SETTING_DEFINITIONS) {
      if (def.category === 'mobile') {
        const val = settingsMap.get(def.key) ?? def.defaultValue;
        result[def.key] = val === 'true';
      }
    }
    return result;
  }

  /**
   * Resolves effective capabilities for an authenticated user role.
   * Super Admin global toggle MUST be enabled AND the role must be permitted.
   */
  public static async resolvePolicyForUser(roleCode?: string | null): Promise<DeviceCapabilityPolicy> {
    const globalFlags = await this.getGlobalSettings();
    const role = (roleCode || '').toUpperCase();

    const isStudent = role === 'STUDENT';
    const isDriver = role === 'TRANSPORT_DRIVER' || role === 'DRIVER';
    const isSecurity = role === 'SECURITY';
    const isAccounts = ['ACCOUNTANT', 'ACCOUNTS_OFFICER', 'ACCOUNTS_STAFF', 'FINANCE_OFFICER'].includes(role);
    const isFaculty = ['FACULTY', 'TEACHER'].includes(role);
    const isMentor = role === 'MENTOR';
    const isLeadership = ['HOD', 'DEAN', 'ACADEMIC_DEAN', 'VICE_PRINCIPAL', 'VP', 'PRINCIPAL', 'SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(role);

    return {
      // 1. Push: Enabled for all roles if global switch is ON
      push: !!globalFlags.DEVICE_PUSH_ENABLED,

      // 2. Camera: Student (profile/doc), Faculty, Mentor, Leadership, Security
      camera: !!globalFlags.DEVICE_CAMERA_ENABLED && (isStudent || isFaculty || isMentor || isLeadership || isSecurity || isAccounts),

      // 3. QR Scanner: Student (attendance), Faculty (verify/attendance), Security (gate verify), Leadership
      qrScanner: !!globalFlags.DEVICE_QR_SCANNER_ENABLED && (isStudent || isFaculty || isMentor || isLeadership || isSecurity),

      // 4. Document Scanner: Student (assignment), Faculty (eval), Leadership, Accounts
      docScanner: !!globalFlags.DEVICE_DOC_SCANNER_ENABLED && (isStudent || isFaculty || isMentor || isLeadership || isAccounts),

      // 5. Voice Notes: Faculty (task/updates), Mentor (counseling notes), Leadership, Student (grievance)
      voiceNotes: !!globalFlags.DEVICE_VOICE_NOTES_ENABLED && (isFaculty || isMentor || isLeadership || isStudent),

      // 6. Biometric Lock: Available to all enrolled mobile users
      biometricLock: !!globalFlags.DEVICE_BIOMETRIC_LOCK_ENABLED,

      // 7. General Location: Only if global flag is true (default false for privacy)
      location: !!globalFlags.DEVICE_LOCATION_ENABLED,

      // 8. Driver GPS: STRICTLY Driver and Super Admin/Transport role
      transportDriverGps: !!globalFlags.DEVICE_TRANSPORT_DRIVER_GPS_ENABLED && (isDriver || isLeadership),

      // 9. Haptics: All mobile users
      haptics: !!globalFlags.DEVICE_HAPTICS_ENABLED,

      // 10. Native Sharing: All permitted roles
      nativeSharing: !!globalFlags.DEVICE_NATIVE_SHARING_ENABLED,

      // 11. Native Downloads: All permitted roles
      nativeDownloads: !!globalFlags.DEVICE_NATIVE_DOWNLOADS_ENABLED,

      // 12. Native Printing: Accounts, Leadership, Faculty, Student (receipts/bonafides)
      nativePrinting: !!globalFlags.DEVICE_NATIVE_PRINTING_ENABLED && (isAccounts || isLeadership || isFaculty || isStudent),

      // 13. Offline Encrypted Cache: Student, Faculty, Mentor, Leadership
      offlineCache: !!globalFlags.DEVICE_OFFLINE_CACHE_ENABLED,

      // 14. Digital Touch Signature: Leadership (approvals), Faculty (leave/eval), Mentor, Accounts
      digitalSignature: !!globalFlags.DEVICE_DIGITAL_SIGNATURE_ENABLED && (isLeadership || isFaculty || isMentor || isAccounts),

      // 15. System Calendar Sync: Student (classes/exams), Faculty (teaching timetable), Leadership
      calendarSync: !!globalFlags.DEVICE_CALENDAR_SYNC_ENABLED && (isStudent || isFaculty || isLeadership),

      // 16. NFC: Security, Driver, Super Admin (hardware-dependent)
      nfc: !!globalFlags.DEVICE_NFC_ENABLED && (isSecurity || isLeadership),

      // 17. BLE: Faculty (classroom proximity), Security, Leadership
      ble: !!globalFlags.DEVICE_BLE_ENABLED && (isFaculty || isLeadership),

      // 18. Screen Security: Applied to sensitive portals
      screenSecurity: !!globalFlags.DEVICE_SCREEN_SECURITY_ENABLED,
    };
  }
}
