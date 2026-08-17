import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Bell,
  Camera,
  QrCode,
  FileText,
  Mic,
  Fingerprint,
  MapPin,
  Truck,
  Activity,
  Share2,
  Download,
  Printer,
  HardDrive,
  PenTool,
  Calendar,
  Radio,
  Bluetooth,
  Shield,
  Save,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { HapticsService } from '../../platform/haptics';

interface CapabilityItem {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultVal: boolean;
  impactRoles: string[];
}

const CAPABILITIES_LIST: CapabilityItem[] = [
  {
    key: 'DEVICE_PUSH_ENABLED',
    label: 'Push Notifications (FCM/APNs)',
    description: 'Background & killed-state native push alert delivery across mobile devices.',
    icon: Bell,
    defaultVal: true,
    impactRoles: ['ALL ROLES'],
  },
  {
    key: 'DEVICE_CAMERA_ENABLED',
    label: 'Camera & Photo Capture',
    description: 'Contextual camera access for profile photos, document scans, and evidence.',
    icon: Camera,
    defaultVal: true,
    impactRoles: ['Student', 'Faculty', 'Leadership', 'Security'],
  },
  {
    key: 'DEVICE_QR_SCANNER_ENABLED',
    label: 'Optical QR Scanner',
    description: 'Real-time camera QR scanning for attendance marking, gate security, and certificates.',
    icon: QrCode,
    defaultVal: true,
    impactRoles: ['Student', 'Faculty', 'Security', 'Leadership'],
  },
  {
    key: 'DEVICE_DOC_SCANNER_ENABLED',
    label: 'Document Scanner & OCR',
    description: 'Camera document scanning, edge detection, and PDF conversion.',
    icon: FileText,
    defaultVal: true,
    impactRoles: ['Student', 'Faculty', 'Accounts', 'Leadership'],
  },
  {
    key: 'DEVICE_VOICE_NOTES_ENABLED',
    label: 'Voice Notes & Microphone',
    description: 'Audio recording for task updates, student counseling notes, and feedback.',
    icon: Mic,
    defaultVal: true,
    impactRoles: ['Faculty', 'Mentor', 'Leadership', 'Student'],
  },
  {
    key: 'DEVICE_BIOMETRIC_LOCK_ENABLED',
    label: 'Biometric App Lock',
    description: 'Native Fingerprint / Face ID lock for mobile app security.',
    icon: Fingerprint,
    defaultVal: true,
    impactRoles: ['ALL ROLES'],
  },
  {
    key: 'DEVICE_LOCATION_ENABLED',
    label: 'General Location Services',
    description: 'General GPS access for campus proximity and geofencing validation.',
    icon: MapPin,
    defaultVal: false,
    impactRoles: ['Policy Dependent'],
  },
  {
    key: 'DEVICE_TRANSPORT_DRIVER_GPS_ENABLED',
    label: 'Transport Driver Live GPS',
    description: 'Live background vehicle telemetry broadcast for authorized transport drivers.',
    icon: Truck,
    defaultVal: true,
    impactRoles: ['Transport Driver', 'Transport Manager'],
  },
  {
    key: 'DEVICE_HAPTICS_ENABLED',
    label: 'Haptic Feedback Engine',
    description: 'Tactile vibration feedback on approvals, button clicks, and pull-to-refresh.',
    icon: Activity,
    defaultVal: true,
    impactRoles: ['ALL ROLES'],
  },
  {
    key: 'DEVICE_NATIVE_SHARING_ENABLED',
    label: 'Native Sharing Sheet',
    description: 'Native OS sharing dialog for circulars, exam schedules, and grade sheets.',
    icon: Share2,
    defaultVal: true,
    impactRoles: ['ALL ROLES'],
  },
  {
    key: 'DEVICE_NATIVE_DOWNLOADS_ENABLED',
    label: 'Native File Downloader',
    description: 'Direct filesystem storage for generated reports, study material, and receipts.',
    icon: Download,
    defaultVal: true,
    impactRoles: ['ALL ROLES'],
  },
  {
    key: 'DEVICE_NATIVE_PRINTING_ENABLED',
    label: 'Native Print Manager',
    description: 'Wireless direct printing with official institutional watermarks.',
    icon: Printer,
    defaultVal: true,
    impactRoles: ['Accounts', 'Leadership', 'Faculty', 'Student'],
  },
  {
    key: 'DEVICE_OFFLINE_CACHE_ENABLED',
    label: 'Offline Encrypted Cache & Sync',
    description: 'Local caching of timetables, circulars, and attendance with background sync.',
    icon: HardDrive,
    defaultVal: true,
    impactRoles: ['Student', 'Faculty', 'Mentor', 'Leadership'],
  },
  {
    key: 'DEVICE_DIGITAL_SIGNATURE_ENABLED',
    label: 'Digital Touch Signature Pad',
    description: 'Touch/pen signature capture pad with cryptographic SHA-256 stamp.',
    icon: PenTool,
    defaultVal: true,
    impactRoles: ['Leadership', 'Faculty', 'Mentor', 'Accounts'],
  },
  {
    key: 'DEVICE_CALENDAR_SYNC_ENABLED',
    label: 'System Calendar Sync (.ics)',
    description: 'Export classes, exam schedules, and academic events into device calendar.',
    icon: Calendar,
    defaultVal: true,
    impactRoles: ['Student', 'Faculty', 'Leadership'],
  },
  {
    key: 'DEVICE_NFC_ENABLED',
    label: 'NFC Smart Card Support',
    description: 'NFC reader for student smart cards and gate turnstiles (where hardware is present).',
    icon: Radio,
    defaultVal: false,
    impactRoles: ['Security', 'Leadership'],
  },
  {
    key: 'DEVICE_BLE_ENABLED',
    label: 'Bluetooth / BLE Proximity',
    description: 'BLE beacon proximity sensing for indoor laboratory attendance.',
    icon: Bluetooth,
    defaultVal: false,
    impactRoles: ['Faculty', 'Leadership'],
  },
  {
    key: 'DEVICE_SCREEN_SECURITY_ENABLED',
    label: 'Sensitive Screen Shield (FLAG_SECURE)',
    description: 'Prevents screenshots and app-switcher previews on confidential grade screens.',
    icon: Shield,
    defaultVal: true,
    impactRoles: ['COE', 'Finance', 'Leadership'],
  },
];

export const MobileCapabilitiesSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data?.data) {
        const mapped: Record<string, boolean> = {};
        for (const item of CAPABILITIES_LIST) {
          const val = res.data.data[item.key];
          mapped[item.key] = val !== undefined ? val === 'true' : item.defaultVal;
        }
        setSettings(mapped);
      }
    } catch {
      toast.error('Failed to load mobile capability settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    HapticsService.impact('light');
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    HapticsService.impact('medium');
    try {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(settings)) {
        payload[k] = v ? 'true' : 'false';
      }

      await api.post('/settings', { changes: payload });
      HapticsService.notification('success');
      toast.success('Mobile & Device Capabilities updated successfully.');
    } catch {
      HapticsService.notification('error');
      toast.error('Failed to save capability settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 p-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Mobile & Device Capabilities</h2>
            <p className="text-xs text-slate-400 mt-1">
              Super Admin master switchboard for hardware sensors, document processors, and role policies.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Policy Changes</span>
        </button>
      </div>

      {/* Capabilities Switchboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES_LIST.map((cap) => {
          const Icon = cap.icon;
          const isEnabled = !!settings[cap.key];

          return (
            <div
              key={cap.key}
              className={`flex flex-col justify-between rounded-3xl border p-5 transition-all ${
                isEnabled
                  ? 'border-indigo-500/30 bg-slate-900/80 shadow-lg'
                  : 'border-slate-800 bg-slate-900/40 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isEnabled ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(cap.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <h4 className="text-sm font-extrabold text-white">{cap.label}</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{cap.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Permitted:</span>
                <div className="flex flex-wrap gap-1">
                  {cap.impactRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-md bg-slate-800 px-1.5 py-0.5 font-bold text-indigo-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
