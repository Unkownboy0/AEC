import { z } from 'zod';

export type SettingDefinition = {
  key: string;
  label: string;
  description: string;
  category: 'institution' | 'policy' | 'security' | 'files' | 'modules' | 'mobile';
  schema: z.ZodTypeAny;
  defaultValue: string;
  impact: string[];
  restartRequired?: boolean;
};

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const booleanString = z.enum(['true', 'false']);
const integerString = (min: number, max: number) => z.string().regex(/^\d+$/).refine((value) => {
  const number = Number(value);
  return number >= min && number <= max;
}, `Value must be between ${min} and ${max}`);

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // ─── Institution Branding ───────────────────────────────────────────────────
  { key: 'COLLEGE_NAME', label: 'Institution name', description: 'Official name used on dashboards and generated documents.', category: 'institution', schema: text(3, 160), defaultValue: 'CampusOS Institution', impact: ['Dashboard headings', 'Digital ID and PDF branding'] },
  { key: 'COLLEGE_ADDRESS', label: 'Institution address', description: 'Official postal address used on institutional documents.', category: 'institution', schema: text(5, 300), defaultValue: '', impact: ['Certificates and generated reports'] },
  { key: 'COLLEGE_PHONE', label: 'Institution phone', description: 'Published institutional contact number.', category: 'institution', schema: text(5, 30), defaultValue: '', impact: ['Generated reports and contact surfaces'] },
  { key: 'COLLEGE_WEBSITE', label: 'Institution website', description: 'Public HTTPS website used in branding.', category: 'institution', schema: z.string().url().refine((v) => v.startsWith('https://'), 'Website must use HTTPS'), defaultValue: 'https://example.ac.in', impact: ['Generated documents and public verification'] },
  { key: 'BRAND_COLOR', label: 'Brand color', description: 'Primary institutional accent in hexadecimal format.', category: 'institution', schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/), defaultValue: '#4f46e5', impact: ['Dashboard and document branding'] },

  // ─── Watermark ───────────────────────────────────────────────────────────────
  { key: 'WATERMARK_ENABLED', label: 'Enable official watermark', description: 'Embeds institutional logo watermark on all exports, PDF documents and print layouts.', category: 'institution', schema: booleanString, defaultValue: 'true', impact: ['All PDF reports', 'Print layouts', 'Official certificates', 'Fee receipts'] },
  { key: 'WATERMARK_LOGO_URL', label: 'Watermark logo URL', description: 'Path or URL of the official logo used as background watermark.', category: 'institution', schema: text(1, 255), defaultValue: '/branding/institution-logo.png', impact: ['Background logo watermark across all generated documents'] },
  { key: 'WATERMARK_OPACITY', label: 'Watermark opacity (%)', description: 'Default visual opacity percentage for background watermark (typically 3-5%).', category: 'institution', schema: integerString(1, 20), defaultValue: '4', impact: ['Document background contrast and readability'] },
  { key: 'WATERMARK_POSITION', label: 'Watermark position', description: 'Placement style of the watermark on generated document pages.', category: 'institution', schema: z.enum(['CENTER', 'TILED', 'DIAGONAL']), defaultValue: 'CENTER', impact: ['Page alignment of background watermark'] },
  { key: 'WATERMARK_APPLY_PDF', label: 'Watermark on PDF exports', description: 'Automatically embed watermark inside all downloadable PDF files.', category: 'institution', schema: booleanString, defaultValue: 'true', impact: ['All downloadable PDF reports, transcripts and statements'] },
  { key: 'WATERMARK_APPLY_PRINT', label: 'Watermark on browser print', description: 'Include background watermark in official browser print layout.', category: 'institution', schema: booleanString, defaultValue: 'true', impact: ['Official browser print preview and physical printouts'] },
  { key: 'WATERMARK_APPLY_CERTIFICATES', label: 'Watermark on certificates', description: 'Apply subtle institution watermark behind certificate body and signatures.', category: 'institution', schema: booleanString, defaultValue: 'true', impact: ['Bonafide, Conduct, Study, and Transfer certificates'] },
  { key: 'WATERMARK_APPLY_RECEIPTS', label: 'Watermark on fee receipts', description: 'Apply high-readability faint watermark (2-3%) on fee payment receipts.', category: 'institution', schema: booleanString, defaultValue: 'true', impact: ['Fee receipts and financial vouchers'] },
  { key: 'WATERMARK_APPLY_DOCS', label: 'Watermark on Campus Office Docs', description: 'Apply watermark on Campus Docs, Sheets, Slides, and Forms PDF exports.', category: 'institution', schema: booleanString, defaultValue: 'true', impact: ['Collaborative office documents and meeting minutes'] },

  // ─── Academic Policy ────────────────────────────────────────────────────────
  { key: 'OD_MIN_ADVANCE_DAYS', label: 'OD advance notice (days)', description: 'Minimum calendar days before a normal OD request.', category: 'policy', schema: integerString(0, 90), defaultValue: '2', impact: ['Student and faculty OD validation', 'Existing drafts may become invalid'] },
  { key: 'ATTENDANCE_RISK_THRESHOLD', label: 'Attendance risk threshold (%)', description: 'Percentage below which an academic attendance warning is generated.', category: 'policy', schema: integerString(1, 100), defaultValue: '75', impact: ['Student risk and mentor/HOD analytics'] },
  { key: 'ACADEMIC_RISK_ARREAR_THRESHOLD', label: 'Academic risk arrear threshold', description: 'Number of published failing (grade F) marks at or above which a student is flagged at risk.', category: 'policy', schema: integerString(1, 20), defaultValue: '1', impact: ['Mentor and HOD academic risk analytics'] },

  // ─── File Storage ───────────────────────────────────────────────────────────
  { key: 'MAX_UPLOAD_SIZE', label: 'Maximum upload (bytes)', description: 'Maximum accepted file size in bytes.', category: 'files', schema: integerString(1_048_576, 104_857_600), defaultValue: '26214400', impact: ['All document and evidence uploads', 'Mobile data usage'] },

  // ─── Security ───────────────────────────────────────────────────────────────
  { key: 'MFA_REQUIRED_PRIVILEGED', label: 'MFA for privileged roles', description: 'Policy flag for privileged accounts. Enable only after an MFA provider is configured.', category: 'security', schema: booleanString, defaultValue: 'false', impact: ['Super Admin and executive sign-in'], restartRequired: false },

  // ─── Core Modules ──────────────────────────────────────────────────────────
  { key: 'MODULE_IQAC_ENABLED', label: 'IQAC module', description: 'Controls IQAC navigation and new operations.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['IQAC workspaces and evidence workflows'], restartRequired: false },
  { key: 'MODULE_TIMETABLE_ENABLED', label: 'Timetable module', description: 'Controls timetable planning operations.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Faculty, HOD and student timetable surfaces'], restartRequired: false },
  { key: 'MODULE_PLACEMENT_ENABLED', label: 'Placement module', description: 'Controls placement cell workspace and drive management.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Placement Officer workspace', 'Student career dashboard', 'Drive and offer letter APIs'], restartRequired: false },
  { key: 'MODULE_LIBRARY_ENABLED', label: 'Library module', description: 'Controls library management — book catalog, issue, and return.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Librarian workspace', 'Student library access portal'], restartRequired: false },
  { key: 'MODULE_HOSTEL_ENABLED', label: 'Hostel module', description: 'Controls hostel room allotment and warden workspace.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Hostel Warden workspace', 'Student hostel portal'], restartRequired: false },
  { key: 'MODULE_TRANSPORT_ENABLED', label: 'Transport module', description: 'Controls bus route management and student transport allocation.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Transport Manager workspace', 'Student transport portal'], restartRequired: false },
  { key: 'MODULE_SPORTS_ENABLED', label: 'Sports module', description: 'Controls sports activity tracking and team management.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Sports admin page', 'Student sports records'], restartRequired: false },
  { key: 'MODULE_FEES_ENABLED', label: 'Fees & Finance module', description: 'Controls fee collection, ledger, and accountant workspace.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Accountant workspace', 'Student fee portal', 'Payment gateway'], restartRequired: false },
  { key: 'MODULE_GOVERNANCE_ENABLED', label: 'Governance & WMCS module', description: 'Controls the Work Management and Governance Suite.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Tasks, approvals, and governance workflows for all roles'], restartRequired: false },
  { key: 'MODULE_CAMPUS_WORKSPACE_ENABLED', label: 'Campus Workspace (Docs/Sheets)', description: 'Controls the integrated Campus Docs, Sheets, Slides, and Drive.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Collaborative document editing for all roles'], restartRequired: false },
  { key: 'MODULE_COE_ENABLED', label: 'COE / Examination Cell module', description: 'Controls the Controller of Examinations workspace.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['COE dashboard, hall seating, invigilation'], restartRequired: false },
  { key: 'MODULE_AI_ASSISTANT_ENABLED', label: 'AI Assistant module', description: 'Controls the CampusOS AI assistant across all portals.', category: 'modules', schema: booleanString, defaultValue: 'false', impact: ['Student AI assistant', 'Faculty workspace AI help', 'Analytics summarization'], restartRequired: false },
  { key: 'MODULE_PARENT_PORTAL_ENABLED', label: 'Parent Portal module', description: 'Controls parent access to student academic data.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Parent workspace and guardian communication'], restartRequired: false },
  { key: 'MODULE_CIRCULARS_ENABLED', label: 'Circulars & Announcements module', description: 'Controls circular creation, publishing, and distribution.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['All role circular pages', 'Push notification dispatch'], restartRequired: false },
  { key: 'MODULE_MENTOR_ENABLED', label: 'Faculty Mentor module', description: 'Controls the faculty-student mentorship workspace.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Mentor workspace', 'HOD mentors dashboard', 'Mentorship sessions'], restartRequired: false },
  { key: 'MODULE_CERTIFICATES_ENABLED', label: 'Digital Certificates module', description: 'Controls automated generation of bonafide, conduct, and study certificates.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Student certificate requests', 'Office certificate issuance'], restartRequired: false },
  { key: 'MODULE_LEAVE_OD_ENABLED', label: 'Leave & OD module', description: 'Controls student and faculty leave/OD request workflows.', category: 'modules', schema: booleanString, defaultValue: 'true', impact: ['Faculty leave desk', 'HOD approvals', 'Student leave portal'], restartRequired: false },

  // ─── Mobile & Device Capabilities (Super Admin Switchboard) ───────────────
  { key: 'DEVICE_PUSH_ENABLED', label: 'Push Notifications (FCM/APNs)', description: 'Master switch for background and killed-state mobile push delivery.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['All mobile devices', 'Background notification banners'] },
  { key: 'DEVICE_CAMERA_ENABLED', label: 'Camera & Photo Capture', description: 'Enables contextual camera capture for profile photos, ID creation, and evidence.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Profile uploads', 'Media capture across portals'] },
  { key: 'DEVICE_QR_SCANNER_ENABLED', label: 'Optical QR Scanner', description: 'Enables real-time camera QR scanning for attendance marking, gate security, and certificates.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['QR Attendance', 'Security gate pass scan', 'Certificate verification'] },
  { key: 'DEVICE_DOC_SCANNER_ENABLED', label: 'Document Scanner & OCR', description: 'Enables camera document scanning, perspective crop, and PDF conversion.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Assignment submissions', 'Office document digitizing'] },
  { key: 'DEVICE_VOICE_NOTES_ENABLED', label: 'Voice Notes & Microphone', description: 'Enables voice note recording for task updates, feedback, and student counseling notes.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Task management', 'Mentor counseling', 'Grievance audio'] },
  { key: 'DEVICE_BIOMETRIC_LOCK_ENABLED', label: 'Biometric App Lock', description: 'Enables hardware biometric lock (Fingerprint / Face ID) option on mobile apps.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Local app security on enrolled devices'] },
  { key: 'DEVICE_LOCATION_ENABLED', label: 'General Location Services', description: 'Controls general device GPS access for campus proximity validation.', category: 'mobile', schema: booleanString, defaultValue: 'false', impact: ['Campus geo-fencing'] },
  { key: 'DEVICE_TRANSPORT_DRIVER_GPS_ENABLED', label: 'Transport Driver Live GPS', description: 'Enables live background vehicle telemetry broadcast for authorized transport drivers.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Live bus fleet tracking on student/parent portal'] },
  { key: 'DEVICE_HAPTICS_ENABLED', label: 'Haptic Feedback Engine', description: 'Enables tactile haptic vibrations for approvals, button clicks, and pull-to-refresh.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Native mobile tactile experience'] },
  { key: 'DEVICE_NATIVE_SHARING_ENABLED', label: 'Native Sharing Sheet', description: 'Enables native OS share dialog for circulars, exam schedules, and grade sheets.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Social sharing', 'Document export'] },
  { key: 'DEVICE_NATIVE_DOWNLOADS_ENABLED', label: 'Native File Downloader', description: 'Enables direct filesystem storage of generated reports, study material, and receipts.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Offline document downloads'] },
  { key: 'DEVICE_NATIVE_PRINTING_ENABLED', label: 'Native Print Manager', description: 'Enables direct wireless printing with official institutional watermarks.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Physical printouts of receipts and bonafides'] },
  { key: 'DEVICE_OFFLINE_CACHE_ENABLED', label: 'Offline Encrypted Cache & Sync', description: 'Enables local caching of timetables, circulars, and attendance with background sync.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Offline access when network is unavailable'] },
  { key: 'DEVICE_DIGITAL_SIGNATURE_ENABLED', label: 'Digital Touch Signature Pad', description: 'Enables touch/pen digital signature capture with cryptographic SHA-256 stamp.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Leave endorsements', 'Executive approvals'] },
  { key: 'DEVICE_CALENDAR_SYNC_ENABLED', label: 'System Calendar Sync (.ics)', description: 'Allows students and faculty to export classes and exams into device calendar.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Google Calendar / Apple Calendar sync'] },
  { key: 'DEVICE_NFC_ENABLED', label: 'NFC Smart Card Support', description: 'Enables NFC reader for student smart cards and gate turnstiles (where hardware is present).', category: 'mobile', schema: booleanString, defaultValue: 'false', impact: ['Physical NFC turnstile integration'] },
  { key: 'DEVICE_BLE_ENABLED', label: 'Bluetooth / BLE Proximity', description: 'Enables BLE beacon proximity sensing for indoor laboratory attendance.', category: 'mobile', schema: booleanString, defaultValue: 'false', impact: ['BLE beacon classroom tracking'] },
  { key: 'DEVICE_SCREEN_SECURITY_ENABLED', label: 'Sensitive Screen Shield (FLAG_SECURE)', description: 'Prevents screenshots and app-switcher previews on confidential grade and exam screens.', category: 'mobile', schema: booleanString, defaultValue: 'true', impact: ['Anti-leak security for exams and finance'] },
];

export const SETTING_BY_KEY = new Map(SETTING_DEFINITIONS.map((definition) => [definition.key, definition]));

export const validateSettingChanges = (changes: unknown): Record<string, string> => {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new z.ZodError([{ code: 'custom', path: ['changes'], message: 'Settings changes must be an object' }]);
  }
  const normalized: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(changes)) {
    const definition = SETTING_BY_KEY.get(key);
    if (!definition) {
      throw new z.ZodError([{ code: 'custom', path: [key], message: 'Unknown or protected configuration key' }]);
    }
    normalized[key] = definition.schema.parse(String(rawValue));
  }
  if (Object.keys(normalized).length === 0) {
    throw new z.ZodError([{ code: 'custom', path: ['changes'], message: 'At least one setting change is required' }]);
  }
  return normalized;
};
