// Рисует иконки расширения без внешних зависимостей: свой минимальный PNG.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // бит на канал
  ihdr[9] = 6;   // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // фильтр строки
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Сглаживание — усреднением по сетке 4×4 внутри пикселя: без него на 16px
// стрелка превращается в лесенку.
const SS = 4;

function shade(size, x, y) {
  const s = size;
  const r = s * 0.235;            // радиус скругления подложки
  const inset = s * 0.055;
  const lo = inset;
  const hi = s - inset;

  const insideRounded = (() => {
    const cx = Math.min(Math.max(x, lo + r), hi - r);
    const cy = Math.min(Math.max(y, lo + r), hi - r);
    if (x < lo || x > hi || y < lo || y > hi) return false;
    return Math.hypot(x - cx, y - cy) <= r + 0.0001;
  })();
  if (!insideRounded) return null;

  const cx = s / 2;
  const stemW = s * 0.085;
  const stemTop = s * 0.235;
  const stemBottom = s * 0.545;

  const inStem = Math.abs(x - cx) <= stemW / 2 && y >= stemTop && y <= stemBottom;

  // Галочка-стрелка вниз: две наклонные полосы от концов к острию.
  const tipY = s * 0.645;
  const armW = s * 0.085;
  const armSpan = s * 0.20;
  const inArm =
    y <= tipY + armW * 0.75 &&
    y >= stemBottom - armSpan * 0.55 &&
    Math.abs(Math.abs(x - cx) - (tipY - y)) <= armW * 0.72 &&
    Math.abs(x - cx) <= armSpan;

  const lineY = s * 0.795;
  const lineH = s * 0.078;
  const lineHalf = s * 0.255;
  const inLine = Math.abs(y - lineY) <= lineH / 2 && Math.abs(x - cx) <= lineHalf;

  return inStem || inArm || inLine ? 'ink' : 'bg';
}

const BG = [216, 69, 63, 255];
const INK = [255, 255, 255, 255];

for (const size of [16, 32, 48, 128]) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let ink = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const r = shade(size, x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
          if (r === 'bg') bg++;
          else if (r === 'ink') ink++;
        }
      }
      const total = SS * SS;
      const cover = (bg + ink) / total;
      const inkShare = ink / total;
      const o = (y * size + x) * 4;
      if (cover === 0) continue;
      const mix = inkShare / cover;
      for (let c = 0; c < 3; c++) {
        pixels[o + c] = Math.round(BG[c] * (1 - mix) + INK[c] * mix);
      }
      pixels[o + 3] = Math.round(255 * cover);
    }
  }
  writeFileSync(join(OUT, `icon${size}.png`), png(size, pixels));
  console.log(`icons/icon${size}.png`);
}
