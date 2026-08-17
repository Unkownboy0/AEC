import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Standard CRC32 implementation for PNG chunks
function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}

function generatePngBuffer(width, height, drawFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 for each scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createPngChunk('IDAT', compressedData);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CampusOS Indigo Brand Theme Colors
// Brand Indigo: rgb(79, 70, 229) / #4f46e5
// Dark Indigo: rgb(30, 27, 75) / #1e1b4b
// White: rgb(255, 255, 255)

function drawStandardIcon(x, y, w, h) {
  // Rounded square with gradient and 'C' logo
  const cx = w / 2;
  const cy = h / 2;
  const radius = w * 0.22;
  
  // Normalized distance from center
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  
  // Background rounded box
  const cornerDist = Math.hypot(Math.max(0, dx - (cx - radius)), Math.max(0, dy - (cy - radius)));
  if (cornerDist > radius) {
    return [0, 0, 0, 0]; // transparent
  }

  // Vertical gradient from #4F46E5 to #1E1B4B
  const t = y / h;
  const bgR = Math.round(79 * (1 - t) + 30 * t);
  const bgG = Math.round(70 * (1 - t) + 27 * t);
  const bgB = Math.round(229 * (1 - t) + 75 * t);

  // Draw stylized C glyph in center
  const distFromCenter = Math.hypot(x - cx, y - cy);
  const outerR = w * 0.30;
  const innerR = w * 0.18;

  if (distFromCenter >= innerR && distFromCenter <= outerR) {
    // Cut open right wedge of circle to make a 'C'
    const angle = Math.atan2(y - cy, x - cx); // -PI to PI
    if (angle > -0.6 && angle < 0.6) {
      return [bgR, bgG, bgB, 255];
    }
    return [255, 255, 255, 255]; // Crisp white C
  }

  return [bgR, bgG, bgB, 255];
}

function drawRoundIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.hypot(x - cx, y - cy);
  const maxR = w / 2 - 1;

  if (dist > maxR) {
    return [0, 0, 0, 0]; // Transparent outer
  }

  const t = y / h;
  const bgR = Math.round(79 * (1 - t) + 30 * t);
  const bgG = Math.round(70 * (1 - t) + 27 * t);
  const bgB = Math.round(229 * (1 - t) + 75 * t);

  const outerR = w * 0.30;
  const innerR = w * 0.18;

  if (dist >= innerR && dist <= outerR) {
    const angle = Math.atan2(y - cy, x - cx);
    if (angle > -0.6 && angle < 0.6) {
      return [bgR, bgG, bgB, 255];
    }
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

function drawForegroundIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.hypot(x - cx, y - cy);
  const outerR = w * 0.24;
  const innerR = w * 0.14;

  if (dist >= innerR && dist <= outerR) {
    const angle = Math.atan2(y - cy, x - cx);
    if (angle > -0.6 && angle < 0.6) {
      return [0, 0, 0, 0];
    }
    return [255, 255, 255, 255]; // Crisp white
  }

  return [0, 0, 0, 0]; // Transparent background for adaptive foreground
}

const densities = [
  { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
];

const resDir = path.resolve('android/app/src/main/res');

for (const d of densities) {
  const targetDir = path.join(resDir, d.dir);
  fs.mkdirSync(targetDir, { recursive: true });

  const standardPng = generatePngBuffer(d.size, d.size, drawStandardIcon);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), standardPng);

  const roundPng = generatePngBuffer(d.size, d.size, drawRoundIcon);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), roundPng);

  const fgPng = generatePngBuffer(d.fgSize, d.fgSize, drawForegroundIcon);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fgPng);

  console.log(`✅ Generated valid PNGs for ${d.dir} (size=${d.size}px, fg=${d.fgSize}px)`);
}

console.log('🎉 All Android mipmap launcher icons generated successfully as valid PNGs!');
