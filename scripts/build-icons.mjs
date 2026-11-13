// Genera los íconos de la app (PNG) sin dependencias: fondo turquesa y un plato hondo blanco.
// Uso: node scripts/build-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const TINT = [14, 124, 147];
const TOP = [24, 150, 172];
const WHITE = [255, 255, 255];
const SS = 4; // supermuestreo para bordes suaves

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

// Forma en coordenadas normalizadas 0..1: plato hondo (media elipse) con borde, y vapor sutil.
function inBowl(x, y) {
  const cx = 0.5, rimY = 0.5, rx = 0.3, ry = 0.22;
  const insideBowl = y >= rimY && ((x - cx) / rx) ** 2 + ((y - rimY) / ry) ** 2 <= 1;
  const rim = Math.abs(y - rimY) <= 0.022 && Math.abs(x - cx) <= 0.345;
  const foot = y >= 0.7 && y <= 0.74 && Math.abs(x - cx) <= 0.11;
  return insideBowl || rim || foot;
}
function inSteam(x, y) {
  for (const sx of [0.42, 0.5, 0.58]) {
    if (y < 0.26 || y > 0.43) continue;
    const wave = sx + 0.022 * Math.sin((y - 0.26) * 38);
    if (Math.abs(x - wave) <= 0.014) return true;
  }
  return false;
}

function icon(size, file) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let w = 0, s = 0;
      for (let i = 0; i < SS; i++) for (let j = 0; j < SS; j++) {
        const x = (px + (i + 0.5) / SS) / size, y = (py + (j + 0.5) / SS) / size;
        if (inBowl(x, y)) w++; else if (inSteam(x, y)) s++;
      }
      const n = SS * SS, t = py / size;
      const bg = TOP.map((c, k) => Math.round(c + (TINT[k] - c) * t));
      const a = w / n, b = (s / n) * 0.55;
      const o = py * (size * 3 + 1) + 1 + px * 3;
      for (let k = 0; k < 3; k++) raw[o + k] = Math.round(bg[k] * (1 - a - b) + WHITE[k] * (a + b));
    }
  }
  const hdr = Buffer.alloc(13); hdr.writeUInt32BE(size, 0); hdr.writeUInt32BE(size, 4); hdr[8] = 8; hdr[9] = 2;
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', hdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

icon(180, 'public/icons/apple-touch-icon.png');
icon(192, 'public/icons/icon-192.png');
icon(512, 'public/icons/icon-512.png');
console.log('íconos generados');
