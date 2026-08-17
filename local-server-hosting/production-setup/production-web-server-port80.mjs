import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production Ports: Port 80 (Standard Web) & Port 443 (HTTPS)
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '80', 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '443', 10);
const HOST = '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
const CLIENT_DIST = path.resolve(__dirname, '../../product/client/dist');
const CERTS_DIR = path.resolve(__dirname, '../nginx/certs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.apk': 'application/vnd.android.package-archive',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function proxyRequest(req, res, targetBase) {
  const targetUrl = new URL(req.url, targetBase);
  const headers = { ...req.headers, host: targetUrl.host };

  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[Proxy Error] ${req.method} ${req.url} -> ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend Gateway Error', details: err.message }));
  });

  req.pipe(proxyReq, { end: true });
}

function handleHttpRequest(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy API & Upload routes directly to backend
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads') || req.url.startsWith('/socket.io')) {
    proxyRequest(req, res, BACKEND_URL);
    return;
  }

  // Serve static files
  let reqPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  let filePath = path.join(CLIENT_DIST, reqPath);

  if (!filePath.startsWith(CLIENT_DIST)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA Routing Fallback
    const indexPath = path.join(CLIENT_DIST, 'index.html');
    fs.readFile(indexPath, (indexErr, content) => {
      if (indexErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('CampusOS Client production build missing! Please run `npm run build` in product/client first.');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(content);
    });
  });
}

// 1. Start HTTP Server on Port 80
const httpServer = http.createServer(handleHttpRequest);
httpServer.listen(HTTP_PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 CampusOS Production Port 80 Web Server Running!`);
  console.log(`=======================================================`);
  console.log(` - Standard Web URL:   http://localhost`);
  console.log(` - Network Intranet:   http://<SERVER_LAN_IP>`);
  console.log(` - Local Domain:       http://campusos.local`);
  console.log(` - Backend Gateway:    ${BACKEND_URL}`);
  console.log(`=======================================================\n`);
});

// 2. Start HTTPS Server on Port 443 if SSL certificates exist
const certFile = path.join(CERTS_DIR, 'cert.pem');
const keyFile = path.join(CERTS_DIR, 'key.pem');

if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  try {
    const sslOptions = {
      cert: fs.readFileSync(certFile),
      key: fs.readFileSync(keyFile),
    };
    const httpsServer = https.createServer(sslOptions, handleHttpRequest);
    httpsServer.listen(HTTPS_PORT, HOST, () => {
      console.log(` 🔒 HTTPS Enabled: https://localhost and https://campusos.local`);
    });
  } catch (sslErr) {
    console.warn(`[SSL Warning] Failed to load HTTPS certificates: ${sslErr.message}`);
  }
}
