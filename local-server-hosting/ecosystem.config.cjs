const path = require('path');

module.exports = {
  apps: [
    {
      name: 'campusos-backend',
      script: path.resolve(__dirname, '../product/server/dist/server.js'),
      cwd: path.resolve(__dirname, '../product/server'),
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: '1G',
      autorestart: true,
      error_file: path.resolve(__dirname, '../product/server/logs/pm2-backend-error.log'),
      out_file: path.resolve(__dirname, '../product/server/logs/pm2-backend-out.log'),
      merge_logs: true,
    },
    {
      name: 'campusos-web',
      script: path.resolve(__dirname, 'scripts/local-web-server.mjs'),
      cwd: path.resolve(__dirname, '.'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 5173,
        BACKEND_URL: 'http://127.0.0.1:5000',
      },
      watch: false,
      autorestart: true,
      error_file: path.resolve(__dirname, '../product/server/logs/pm2-web-error.log'),
      out_file: path.resolve(__dirname, '../product/server/logs/pm2-web-out.log'),
      merge_logs: true,
    },
  ],
};
