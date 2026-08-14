import { z } from 'zod';

export type SettingDefinition = {
  key: string;
  label: string;
  description: string;
  category: 'institution' | 'policy' | 'security' | 'files' | 'modules';
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
  { key: 'COLLEGE_NAME', label: 'Institution name', description: 'Official name used on dashboards and generated documents.', category: 'institution', schema: text(3, 160), defaultValue: 'Geetorus Institute of Technology', impact: ['Dashboard headings', 'Digital ID and PDF branding'] },
  { key: 'COLLEGE_ADDRESS', label: 'Institution address', description: 'Official postal address used on institutional documents.', category: 'institution', schema: text(5, 300), defaultValue: '', impact: ['Certificates and generated reports'] },
  { key: 'COLLEGE_PHONE', label: 'Institution phone', description: 'Published institutional contact number.', category: 'institution', schema: text(5, 30), defaultValue: '', impact: ['Generated reports and contact surfaces'] },
  { key: 'COLLEGE_WEBSITE', label: 'Institution website', description: 'Public HTTPS website used in branding.', category: 'institution', schema: z.string().url().refine((value) => value.startsWith('https://'), 'Website must use HTTPS'), defaultValue: 'https://geetorus.com', impact: ['Generated documents and public verification'] },
  { key: 'BRAND_COLOR', label: 'Brand color', description: 'Primary institutional accent in hexadecimal format.', category: 'institution', schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/), defaultValue: '#4f46e5', impact: ['Dashboard and document branding'] },
  { key: 'COLLEGE_LOGO_URL', label: 'Institution logo', description: 'Absolute or /uploads-relative URL to the institution logo used in generated documents.', category: 'institution', schema: text(0, 500), defaultValue: '', impact: ['Document, report and PDF branding'] },
  { key: 'OD_MIN_ADVANCE_DAYS', label: 'OD advance notice', description: 'Minimum calendar days before a normal OD request.', category: 'policy', schema: integerString(0, 90), defaultValue: '2', impact: ['Student and faculty OD validation', 'Existing drafts may become invalid'] },
  { key: 'ATTENDANCE_RISK_THRESHOLD', label: 'Attendance risk threshold', description: 'Percentage below which an academic attendance warning is generated.', category: 'policy', schema: integerString(1, 100), defaultValue: '75', impact: ['Student risk and mentor/HOD analytics'] },
  { key: 'MAX_UPLOAD_SIZE', label: 'Maximum upload bytes', description: 'Maximum accepted file size in bytes.', category: 'files', schema: integerString(1_048_576, 104_857_600), defaultValue: '26214400', impact: ['All document and evidence uploads', 'Mobile data usage'] },
  { key: 'MODULE_IQAC_ENABLED', label: 'IQAC module', description: 'Controls IQAC navigation and new operations after persistence is available.', category: 'modules', schema: booleanString, defaultValue: 'false', impact: ['IQAC workspaces and evidence workflows'], restartRequired: false },
  { key: 'MODULE_TIMETABLE_ENABLED', label: 'Timetable module', description: 'Controls timetable planning operations after persistence is available.', category: 'modules', schema: booleanString, defaultValue: 'false', impact: ['Faculty, HOD and student timetable surfaces'], restartRequired: false },
  { key: 'MFA_REQUIRED_PRIVILEGED', label: 'MFA for privileged roles', description: 'Policy flag for privileged accounts. Enable only after an MFA provider is configured.', category: 'security', schema: booleanString, defaultValue: 'false', impact: ['Super Admin and executive sign-in'], restartRequired: false },
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
