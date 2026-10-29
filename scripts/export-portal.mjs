import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const INK = "#1a1614";
const COLORS = {
  k: [0x1a, 0x16, 0x14],
  w: [0xf6, 0xf1, 0xe6],
  b: [0x3d, 0x7e, 0xc8],
};

const FRAMES = [
  ["..bbbb..", ".bwwwwb.", "bwkbkbwb", "bwwwwwwb", "bwkbkbwb", ".bwwwwb.", "..bbbb..", "........"],
  ["..bbbb..", ".bkkkkb.", "bkwwwkwb", "bkwwwwkb", "bkwwwkwb", ".bkkkkb.", "..bbbb..", "........"],
];

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function rgbaFromSprite(sprite, scale) {
  const h = sprite.length;
  const w = sprite[0].length;
  const width = w * scale;
  const height = h * scale;
  const out = Buffer.alloc(width * height * 4, 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = sprite[y][x];
      const rgb = COLORS[ch];
      if (!rgb) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = x * scale + dx;
          const py = y * scale + dy;
          const i = (py * width + px) * 4;
          out[i] = rgb[0];
          out[i + 1] = rgb[1];
          out[i + 2] = rgb[2];
          out[i + 3] = 255;
        }
      }
    }
  }
  return { width, height, out };
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const scale = 12;
const gap = 8;
const sprites = FRAMES.map((sprite) => rgbaFromSprite(sprite, scale));
const sheetW = sprites[0].width * 2 + gap;
const sheetH = sprites[0].height;
const sheet = Buffer.alloc(sheetW * sheetH * 4, 0);
for (let i = 0; i < sprites.length; i++) {
  const { width, height, out } = sprites[i];
  const ox = i * (width + gap);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = (y * sheetW + (ox + x)) * 4;
      sheet[di] = out[si];
      sheet[di + 1] = out[si + 1];
      sheet[di + 2] = out[si + 2];
      sheet[di + 3] = out[si + 3];
    }
  }
}

const outDir = new URL("../public/world/", import.meta.url);
writeFileSync(new URL("portal-blue.png", outDir), encodePng(sheetW, sheetH, sheet));
writeFileSync(new URL("portal-blue-frame1.png", outDir), encodePng(sprites[0].width, sprites[0].height, sprites[0].out));
console.log("Wrote public/world/portal-blue.png and portal-blue-frame1.png");
