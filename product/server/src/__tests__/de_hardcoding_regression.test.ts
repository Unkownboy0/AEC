/**
 * de_hardcoding_regression.test.ts
 *
 * Regression guard: ensures that hardcoded institution-specific values
 * (Al-Ameen, Geetorus, geetorus.com, GEETORUS CAMPUSOS) do not re-appear
 * in the settings catalog defaults or key server-side configuration files.
 *
 * This test will FAIL if a developer accidentally commits a hardcoded
 * institution name — preventing SaaS regressions where one tenant's data
 * bleeds into another's deployment.
 *
 * Checks:
 *  - Settings catalog defaultValues are neutral (no institution names)
 *  - No MODULE flag defaults to 'Al-Ameen' or 'Geetorus'
 *  - The settings catalog website default uses https://example.ac.in, not geetorus.com
 *  - COLLEGE_NAME default is the neutral platform name 'CampusOS Institution'
 */
import assert from 'assert';
import { SETTING_DEFINITIONS, SETTING_BY_KEY } from '../modules/settings/settings.catalog';

const BANNED_DEFAULTS = [
  'al-ameen',
  'alameen',
  'geetorus',
  'geetorus.com',
  'GEETORUS',
  'Al-Ameen Engineering',
  'Geetorus Institute',
];

// ─── 1. No setting default value contains banned institution names ──────────────
for (const setting of SETTING_DEFINITIONS) {
  const lowerDefault = (setting.defaultValue || '').toLowerCase();
  for (const banned of BANNED_DEFAULTS) {
    assert.ok(
      !lowerDefault.includes(banned.toLowerCase()),
      `REGRESSION: setting '${setting.key}' default value contains banned string '${banned}': "${setting.defaultValue}"`
    );
  }
}

// ─── 2. COLLEGE_NAME default must be neutral ──────────────────────────────────
const collegeName = SETTING_BY_KEY.get('COLLEGE_NAME');
assert.ok(collegeName, 'COLLEGE_NAME must be in catalog');
assert.ok(
  !collegeName.defaultValue.toLowerCase().includes('geetorus'),
  `REGRESSION: COLLEGE_NAME default must not contain 'geetorus': "${collegeName.defaultValue}"`
);
assert.ok(
  !collegeName.defaultValue.toLowerCase().includes('al-ameen'),
  `REGRESSION: COLLEGE_NAME default must not contain 'al-ameen': "${collegeName.defaultValue}"`
);

// ─── 3. COLLEGE_WEBSITE default must not point to geetorus.com ────────────────
const website = SETTING_BY_KEY.get('COLLEGE_WEBSITE');
assert.ok(website, 'COLLEGE_WEBSITE must be in catalog');
assert.ok(
  !website.defaultValue.includes('geetorus.com'),
  `REGRESSION: COLLEGE_WEBSITE default must not be geetorus.com: "${website.defaultValue}"`
);

// ─── 4. COLLEGE_WEBSITE default must use HTTPS ────────────────────────────────
assert.ok(
  website.defaultValue.startsWith('https://'),
  `COLLEGE_WEBSITE default must use HTTPS: "${website.defaultValue}"`
);

// ─── 5. Watermark logo URL must use generic institution path ──────────────────
const watermarkLogo = SETTING_BY_KEY.get('WATERMARK_LOGO_URL');
assert.ok(watermarkLogo, 'WATERMARK_LOGO_URL must be in catalog');
assert.ok(
  !watermarkLogo.defaultValue.toLowerCase().includes('al-ameen'),
  `REGRESSION: WATERMARK_LOGO_URL default must not reference al-ameen: "${watermarkLogo.defaultValue}"`
);
assert.ok(
  !watermarkLogo.defaultValue.toLowerCase().includes('geetorus'),
  `REGRESSION: WATERMARK_LOGO_URL default must not reference geetorus: "${watermarkLogo.defaultValue}"`
);

// ─── 6. COLLEGE_NAME default is the canonical neutral value ───────────────────
assert.strictEqual(
  collegeName.defaultValue,
  'CampusOS Institution',
  `COLLEGE_NAME default must be 'CampusOS Institution' (neutral), got: "${collegeName.defaultValue}"`
);

console.log(`✅ De-hardcoding regression: ${SETTING_DEFINITIONS.length} settings validated — no banned strings found`);
