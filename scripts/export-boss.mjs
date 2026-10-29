/**
 * Renders the final-gate "big" contaminant — Standard difficulty, last room (max HP/damage).
 * Uses the largest in-game mob sprite at big-tier scale (5), matching Maze.tsx.
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { MOB_SPRITES, PIXEL_PALETTE } from "../src/components/pixelWorld.ts";
import { REGULAR_MAPS } from "../src/game/maps.ts";
import { pressureForStage } from "../src/game/run.ts";

/** Big-tier export — phage reads most alien/threatening (virus head + tail fibers). */
const FINAL_GATE_BOSS_MOB = "phage";

const CANVAS_BG = [0xf3, 0xef, 0xe9];
const SCALE = 5;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function bossKind() {
  if (MOB_SPRITES[FINAL_GATE_BOSS_MOB]) return FINAL_GATE_BOSS_MOB;
  return REGULAR_MAPS[0].mob;
}

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

function renderMob(kind, scale) {
  const sprite = MOB_SPRITES[kind];
  const sw = sprite[0]?.length ?? 0;
  const sh = sprite.length;
  const mobW = sw * scale;
  const mobH = sh * scale;
  const pad = scale * 10;
  const width = mobW + pad * 2;
  const height = mobH + pad * 2 + scale * 4;
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = CANVAS_BG[0];
    rgba[i * 4 + 1] = CANVAS_BG[1];
    rgba[i * 4 + 2] = CANVAS_BG[2];
    rgba[i * 4 + 3] = 255;
  }
  const shadowY = pad + mobH + scale * 2;
  const shadowW = scale * 9;
  const shadowH = 5;
  const cx = Math.floor(width / 2);
  for (let dy = 0; dy < shadowH; dy++) {
    for (let dx = -shadowW / 2; dx < shadowW / 2; dx++) {
      const px = cx + dx;
      const py = shadowY + dy;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const i = (py * width + px) * 4;
      rgba[i] = 20;
      rgba[i + 1] = 16;
      rgba[i + 2] = 12;
      rgba[i + 3] = Math.round(72 * (1 - dy / shadowH));
    }
  }
  const left = Math.round(width / 2 - mobW / 2);
  const top = pad;
  for (let y = 0; y < sh; y++) {
    const row = sprite[y] ?? "";
    for (let x = 0; x < sw; x++) {
      const hex = PIXEL_PALETTE[row[x] ?? ""];
      if (!hex) continue;
      const [r, g, b] = hexToRgb(hex);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = left + x * scale + dx;
          const py = top + y * scale + dy;
          if (px < 0 || py < 0 || px >= width || py >= height) continue;
          const i = (py * width + px) * 4;
          rgba[i] = r;
          rgba[i + 1] = g;
          rgba[i + 2] = b;
          rgba[i + 3] = 255;
        }
      }
    }
  }
  return { width, height, rgba, kind };
}

const kind = bossKind();
const peak = pressureForStage(9, 10, "standard");
const { width, height, rgba } = renderMob(kind, SCALE);
const map = REGULAR_MAPS.find((m) => m.mob === kind);
const slug = kind;
const outPath = new URL(`../public/world/final-gate-boss-${slug}.png`, import.meta.url);
writeFileSync(outPath, encodePng(width, height, rgba));
console.log(
  JSON.stringify({
    path: `public/world/final-gate-boss-${slug}.png`,
    kind,
    mapName: map?.name ?? kind,
    mobName: map?.mobName ?? kind,
    scale: SCALE,
    bigHits: peak.bigHits,
    bigDamage: peak.bigDamage,
    bigCountOnLastGate: peak.bigCount,
  }),
);
