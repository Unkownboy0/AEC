export type FlagCategory = 'module' | 'feature' | 'addon';
export type FlagStatus = 'STABLE' | 'BETA' | 'EXPERIMENTAL' | 'DEPRECATED';

export type FlagDefinition = {
  key: string;
  name: string;
  description: string;
  category: FlagCategory;
  status: FlagStatus;
  defaultEnabled: boolean;
};

// Seed registry. Super Admin can add further flags at runtime from the
// Platform Control Center — this list only bootstraps the well-known ones
// that already gate real modules/features in the codebase.
export const FLAG_DEFINITIONS: FlagDefinition[] = [
  { key: 'module.iqac', name: 'IQAC module', description: 'IQAC workspaces and evidence workflows.', category: 'module', status: 'STABLE', defaultEnabled: true },
  { key: 'module.timetable', name: 'Timetable module', description: 'Faculty, HOD and student timetable surfaces.', category: 'module', status: 'STABLE', defaultEnabled: true },
  { key: 'feature.parent.portal', name: 'Parent portal', description: 'Parent access to child attendance, marks, fees and circulars.', category: 'feature', status: 'STABLE', defaultEnabled: true },
];

export const FLAG_BY_KEY = new Map(FLAG_DEFINITIONS.map((definition) => [definition.key, definition]));
