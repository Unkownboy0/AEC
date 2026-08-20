import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';

const packageVersion = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')).version || 'unknown';
let sourceCommit = process.env.CAMPUSOS_SOURCE_COMMIT || 'unknown';
try {
  sourceCommit = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: __dirname, encoding: 'utf8' }).trim();
} catch {}

const customLogger = createLogger();
const originalLoggerError = customLogger.error;
customLogger.error = (msg, options) => {
  if (typeof msg === 'string' && msg.includes('http proxy error')) {
    return;
  }
  originalLoggerError(msg, options);
};

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_CAMPUSOS_VERSION': JSON.stringify(packageVersion),
    'import.meta.env.VITE_CAMPUSOS_BUILD_CODE': JSON.stringify(process.env.CAMPUSOS_BUILD_CODE || '7'),
    'import.meta.env.VITE_CAMPUSOS_COMMIT': JSON.stringify(sourceCommit),
    'import.meta.env.VITE_CAMPUSOS_BUILT_AT': JSON.stringify(new Date().toISOString()),
  },
  customLogger,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Exclude native platform build directories from file watching.
  // Gradle write-locks .aab/.apk intermediates during Android builds, causing
  // Node FSWatcher to throw EBUSY on Windows and crash the dev server.
  server: {
    watch: {
      ignored: [
        '**/android/**',
        '**/ios/**',
        '**/.git/**',
      ],
    },
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api/rbac/stream': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: false,
        timeout: 0,
        configure: (proxy) => {
          proxy.on('error', (_err: any, _req: any, res: any) => {
            if (res && !res.headersSent && typeof res.end === 'function') {
              try { res.end(); } catch (_) {}
            }
          });
        },
      },
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err: any, _req: any, res: any) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              try {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Backend server unavailable' }));
              } catch (_) {}
            }
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
