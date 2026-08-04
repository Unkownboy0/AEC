import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  customLogger,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
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
