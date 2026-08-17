/**
 * feature_flags_policy.test.ts
 *
 * Validates that:
 * 1. Every MODULE_*_ENABLED flag is registered in the settings catalog.
 * 2. The catalog schema for module flags only accepts 'true' or 'false'.
 * 3. No MODULE_ flag is marked as requiring a server restart (so toggles take
 *    effect at runtime via the in-memory cache).
 * 4. Default values are either 'true' or 'false' (never blank or invalid).
 * 5. Critical modules that must default to ENABLED are correctly set.
 * 6. The AI assistant module (optional / billing-gated) defaults to DISABLED.
 * 7. The SETTING_BY_KEY map doesn't expose any secrets or internal env vars.
 * 8. The validateSettingChanges function correctly accepts/rejects module flag values.
 */
import assert from 'assert';
import { SETTING_BY_KEY, SETTING_DEFINITIONS, validateSettingChanges } from '../modules/settings/settings.catalog';

// ─── 1. All expected MODULE flags are registered ───────────────────────────────
const REQUIRED_MODULE_FLAGS = [
  'MODULE_IQAC_ENABLED',
  'MODULE_TIMETABLE_ENABLED',
  'MODULE_PLACEMENT_ENABLED',
  'MODULE_LIBRARY_ENABLED',
  'MODULE_HOSTEL_ENABLED',
  'MODULE_TRANSPORT_ENABLED',
  'MODULE_SPORTS_ENABLED',
  'MODULE_FEES_ENABLED',
  'MODULE_GOVERNANCE_ENABLED',
  'MODULE_CAMPUS_WORKSPACE_ENABLED',
  'MODULE_COE_ENABLED',
  'MODULE_AI_ASSISTANT_ENABLED',
  'MODULE_PARENT_PORTAL_ENABLED',
  'MODULE_CIRCULARS_ENABLED',
  'MODULE_MENTOR_ENABLED',
  'MODULE_CERTIFICATES_ENABLED',
  'MODULE_LEAVE_OD_ENABLED',
];

for (const flag of REQUIRED_MODULE_FLAGS) {
  assert.ok(SETTING_BY_KEY.has(flag), `Missing required module flag: ${flag}`);
}

// ─── 2. All MODULE flags are in the 'modules' category ────────────────────────
const moduleFlags = SETTING_DEFINITIONS.filter((d) => d.key.startsWith('MODULE_'));
for (const flag of moduleFlags) {
  assert.strictEqual(flag.category, 'modules', `Flag ${flag.key} must be in 'modules' category, got '${flag.category}'`);
}

// ─── 3. No MODULE flag requires a server restart ──────────────────────────────
for (const flag of moduleFlags) {
  assert.ok(
    flag.restartRequired !== true,
    `Flag ${flag.key} must not require a server restart (runtime toggle required)`,
  );
}

// ─── 4. Default values are valid booleans ─────────────────────────────────────
for (const flag of moduleFlags) {
  assert.ok(
    flag.defaultValue === 'true' || flag.defaultValue === 'false',
    `Flag ${flag.key} has invalid default value: '${flag.defaultValue}' (must be 'true' or 'false')`,
  );
}

// ─── 5. Core operational modules default to ENABLED ──────────────────────────
const MUST_DEFAULT_ENABLED = [
  'MODULE_FEES_ENABLED',
  'MODULE_LEAVE_OD_ENABLED',
  'MODULE_CERTIFICATES_ENABLED',
  'MODULE_CIRCULARS_ENABLED',
  'MODULE_PARENT_PORTAL_ENABLED',
  'MODULE_MENTOR_ENABLED',
  'MODULE_COE_ENABLED',
];

for (const key of MUST_DEFAULT_ENABLED) {
  const def = SETTING_BY_KEY.get(key);
  assert.ok(def, `Missing critical module flag: ${key}`);
  assert.strictEqual(
    def.defaultValue,
    'true',
    `Critical module ${key} must default to 'true' (got '${def.defaultValue}')`,
  );
}

// ─── 6. AI assistant defaults to DISABLED (requires external API key) ─────────
const aiFlag = SETTING_BY_KEY.get('MODULE_AI_ASSISTANT_ENABLED');
assert.ok(aiFlag, 'MODULE_AI_ASSISTANT_ENABLED must be registered');
assert.strictEqual(
  aiFlag.defaultValue,
  'false',
  'AI assistant must default to false (requires API key configuration)',
);

// ─── 7. Secrets and env vars are NOT writable through settings ────────────────
const PROTECTED_KEYS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'MINIO_SECRET_KEY',
  'MINIO_ACCESS_KEY',
  'SMTP_PASSWORD',
  'CAMPUS_TENANT_ID',
  'NODE_ENV',
  'PORT',
];

for (const key of PROTECTED_KEYS) {
  assert.ok(!SETTING_BY_KEY.has(key), `Protected key '${key}' must NOT be writable via settings API`);
}

// ─── 8. validateSettingChanges accepts valid module flag values ───────────────
assert.deepStrictEqual(
  validateSettingChanges({ MODULE_LIBRARY_ENABLED: 'true' }),
  { MODULE_LIBRARY_ENABLED: 'true' },
  'Should accept boolean string true',
);
assert.deepStrictEqual(
  validateSettingChanges({ MODULE_AI_ASSISTANT_ENABLED: 'false' }),
  { MODULE_AI_ASSISTANT_ENABLED: 'false' },
  'Should accept boolean string false',
);

// Reject non-boolean values for module flags
assert.throws(
  () => validateSettingChanges({ MODULE_LIBRARY_ENABLED: 'yes' }),
  'Should reject non-boolean string for module flag',
);
assert.throws(
  () => validateSettingChanges({ MODULE_LIBRARY_ENABLED: '1' }),
  'Should reject numeric string for module flag',
);
assert.throws(
  () => validateSettingChanges({ MODULE_LIBRARY_ENABLED: '' }),
  'Should reject empty string for module flag',
);

// ─── 9. All module flags have non-empty impact arrays ─────────────────────────
for (const flag of moduleFlags) {
  assert.ok(
    Array.isArray(flag.impact) && flag.impact.length > 0,
    `Flag ${flag.key} must have at least one impact description`,
  );
}

// ─── 10. All module flags have meaningful labels and descriptions ──────────────
for (const flag of moduleFlags) {
  assert.ok(flag.label.length >= 5, `Flag ${flag.key} label is too short: '${flag.label}'`);
  assert.ok(flag.description.length >= 20, `Flag ${flag.key} description is too short`);
}

console.log(`✅ Feature flags policy: ${moduleFlags.length} module flags validated — all checks passed`);
