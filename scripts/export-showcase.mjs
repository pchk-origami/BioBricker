/**
 * Export standalone map and mob PNGs for marketing / docs.
 * Featured five (scariest, representative): cytoplasm, membrane, plasmid maps + phage, toxin mobs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createCanvas } from "@napi-rs/canvas";
import { deflateSync } from "node:zlib";
import { drawWorld } from "../src/components/pixelWorld.ts";
import { MOB_SPRITES, PIXEL_PALETTE } from "../src/components/pixelWorld.ts";
import { findChar, TILE } from "../src/game/grid.ts";
import { REGULAR_MAPS } from "../src/game/maps.ts";

const OUT = new URL("../public/showcase/", import.meta.url);
const FEATURED_MAPS = ["cytoplasm", "membrane", "plasmid"];
const FEATURED_MOBS = ["phage", "toxin"];
const MOB_SCALE = 5;
const MOB_BG = "#102028";

mkdirSync(OUT, { recursive: true });
mkdirSync(new URL("maps/", OUT), { recursive: true });
mkdirSync(new URL("mobs/", OUT), { recursive: true });
mkdirSync(new URL("featured/", OUT), { recursive: true });

function canvasToPng(canvas) {
  return canvas.toBuffer("image/png");
}

function exportMap(map) {
  const grid = map.grid;
  const cols = grid[0]?.length ?? 1;
  const rows = grid.length;
  const w = cols * TILE;
  const h = rows * TILE;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const portal = findChar(grid, "P");
  const portalPt = {
    x: ((portal?.c ?? 1) + 0.5) * TILE,
    y: ((portal?.r ?? 1) + 0.5) * TILE,
  };
  drawWorld(ctx, grid, map.id, 0, 0, w, h, portalPt, 0);
  const buf = canvasToPng(canvas);
  const path = new URL(`maps/map-${map.id}.png`, OUT);
  writeFileSync(path, buf);
  if (FEATURED_MAPS.includes(map.id)) {
    writeFileSync(new URL(`featured/map-${map.id}.png`, OUT), buf);
  }
  console.log("map", map.id, `${w}x${h}`);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function exportMob(kind) {
  const sprite = MOB_SPRITES[kind];
  const sw = sprite[0]?.length ?? 0;
  const sh = sprite.length;
  const mobW = sw * MOB_SCALE;
  const mobH = sh * MOB_SCALE;
  const pad = MOB_SCALE * 12;
  const w = mobW + pad * 2;
  const h = mobH + pad * 2 + MOB_SCALE * 6;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = MOB_BG;
  ctx.fillRect(0, 0, w, h);
  const left = Math.round(w / 2 - mobW / 2);
  const top = pad;
  for (let y = 0; y < sh; y++) {
    const row = sprite[y] ?? "";
    for (let x = 0; x < sw; x++) {
      const hex = PIXEL_PALETTE[row[x] ?? ""];
      if (!hex) continue;
      ctx.fillStyle = hex;
      ctx.fillRect(left + x * MOB_SCALE, top + y * MOB_SCALE, MOB_SCALE, MOB_SCALE);
    }
  }
  ctx.fillStyle = "rgba(20,16,12,0.45)";
  ctx.fillRect(left, top + mobH + MOB_SCALE * 2, mobW, MOB_SCALE * 3);
  const buf = canvasToPng(canvas);
  writeFileSync(new URL(`mobs/mob-${kind}.png`, OUT), buf);
  if (FEATURED_MOBS.includes(kind)) {
    writeFileSync(new URL(`featured/mob-${kind}.png`, OUT), buf);
  }
  console.log("mob", kind, `${w}x${h}`);
}

for (const map of REGULAR_MAPS) exportMap(map);
for (const kind of Object.keys(MOB_SPRITES)) exportMob(kind);

console.log("Featured (5 scariest picks):");
for (const id of FEATURED_MAPS) console.log(`  featured/map-${id}.png`);
for (const id of FEATURED_MOBS) console.log(`  featured/mob-${id}.png`);
