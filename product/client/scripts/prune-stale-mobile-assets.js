import { existsSync, statSync, unlinkSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const distPath = resolve('dist');

function pruneDirectory(dir) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      pruneDirectory(fullPath);
    } else {
      const lower = entry.toLowerCase();
      // Exclude installer binaries and source maps that inflate mobile APK size
      if (lower.endsWith('.apk') || lower.endsWith('.aab') || lower.endsWith('.zip') || lower.endsWith('.map')) {
        try {
          unlinkSync(fullPath);
          console.log(`[Prune Mobile Assets] Removed stale asset: ${fullPath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
        } catch (err) {
          console.error(`[Prune Mobile Assets] Failed to delete ${fullPath}:`, err.message);
        }
      }
    }
  }
}

console.log(`[Prune Mobile Assets] Scanning build output directory: ${distPath}`);
pruneDirectory(distPath);
console.log(`[Prune Mobile Assets] Asset pruning complete.`);
