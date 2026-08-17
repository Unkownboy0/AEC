/**
 * feature-flags.ts
 *
 * Provides a lightweight, in-process cache for module feature flags stored in
 * the database Settings table. This avoids a DB round-trip on every API request
 * while still being refreshable via the Settings controller after an operator
 * toggles a module.
 *
 * Architecture:
 *  - On first access, `FeatureFlags.load()` fetches all MODULE_* settings.
 *  - Results are cached for TTL_MS milliseconds (default 60 s) and served from
 *    memory for all subsequent requests.
 *  - A cache-busting call is made automatically by the Settings controller after
 *    any write, so changes take effect within seconds without requiring a server
 *    restart.
 *  - The system defaults all unknown flags to `true` (enabled) so new deployments
 *    don't accidentally disable features that haven't been configured yet.
 */
import { prisma } from '../lib/prisma';
import { SETTING_DEFINITIONS } from '../modules/settings/settings.catalog';

const TTL_MS = 60_000; // 1 minute

// Build the default map from catalog: MODULE_ keys default to their catalogued defaultValue
const MODULE_DEFAULTS: Record<string, boolean> = Object.fromEntries(
  SETTING_DEFINITIONS
    .filter((d) => d.key.startsWith('MODULE_'))
    .map((d) => [d.key, d.defaultValue !== 'false'])
);

let cache: Record<string, boolean> | null = null;
let cacheExpiresAt = 0;

/**
 * Load (or return cached) feature flags.
 * This is called by requireFeature() on every API request, but the DB is only
 * queried when the in-memory cache has expired.
 */
async function load(): Promise<Record<string, boolean>> {
  if (cache && Date.now() < cacheExpiresAt) {
    return cache;
  }

  try {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'MODULE_' } },
      select: { key: true, value: true },
    });

    const fresh: Record<string, boolean> = { ...MODULE_DEFAULTS };
    for (const { key, value } of rows) {
      fresh[key] = value === 'true';
    }

    cache = fresh;
    cacheExpiresAt = Date.now() + TTL_MS;
    return cache;
  } catch {
    // Fallback: if the DB is unavailable during startup, allow all features
    return MODULE_DEFAULTS;
  }
}

/**
 * Invalidate the in-memory cache immediately.
 * Call this from SettingsController.update() after writing new values.
 */
function invalidate(): void {
  cache = null;
  cacheExpiresAt = 0;
}

/**
 * Check if a single feature flag is currently enabled.
 * Returns true if the flag is not registered (safe default = open).
 */
async function isEnabled(flagKey: string): Promise<boolean> {
  const flags = await load();
  return flags[flagKey] ?? true;
}

export const FeatureFlags = { load, invalidate, isEnabled };
