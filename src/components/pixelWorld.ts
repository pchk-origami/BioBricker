import { TILE } from "../game/grid.ts";
import type { MobKind } from "../game/types.ts";

export const VIEW_COLS = 17;
export const VIEW_ROWS = 13;

const PX = 4;

type Theme = {
  void: string;
  voidAlt: string;
  floor: string;
  floorAlt: string;
  mote: string;
  wall: string;
  wallHi: string;
  wallSh: string;
  rim: string;
  rimHi: string;
  heat: string;
  heatAlt: string;
};

const THEMES: Record<string, Theme> = {
  agar: {
    void: "#241c18",
    voidAlt: "#3a2e26",
    floor: "#f0c98a",
    floorAlt: "#e2b56a",
    mote: "#c9843a",
    wall: "#c4472a",
    wallHi: "#f08a4a",
    wallSh: "#7a2418",
    rim: "#b7c9d4",
    rimHi: "#e7f2f6",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  cytoplasm: {
    void: "#102028",
    voidAlt: "#18303a",
    floor: "#3eafa6",
    floorAlt: "#2f8f8a",
    mote: "#d6fff6",
    wall: "#7a4ea3",
    wallHi: "#c49be0",
    wallSh: "#3d215c",
    rim: "#e0a15a",
    rimHi: "#f6d7a2",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  root: {
    void: "#1a120e",
    voidAlt: "#2a1c14",
    floor: "#e4c27a",
    floorAlt: "#cda15c",
    mote: "#f3e2b0",
    wall: "#5a3824",
    wallHi: "#8a5a38",
    wallSh: "#2c1810",
    rim: "#6b4428",
    rimHi: "#a06a40",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  reactor: {
    void: "#14181c",
    voidAlt: "#1e262c",
    floor: "#2f8f6e",
    floorAlt: "#3cb58a",
    mote: "#d8fff0",
    wall: "#8ea0aa",
    wallHi: "#d5e2e8",
    wallSh: "#4c5c66",
    rim: "#9a6a3a",
    rimHi: "#e0b070",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  plasmid: {
    void: "#100818",
    voidAlt: "#1c1030",
    floor: "#3ec8d8",
    floorAlt: "#ef5bd6",
    mote: "#fff6c8",
    wall: "#24306a",
    wallHi: "#6a78c8",
    wallSh: "#101428",
    rim: "#24306a",
    rimHi: "#8aa0e8",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  thermal: {
    void: "#1a120e",
    voidAlt: "#2a1a14",
    floor: "#d8c4a4",
    floorAlt: "#c2a888",
    mote: "#efe2cc",
    wall: "#6a5348",
    wallHi: "#a08878",
    wallSh: "#3a2c26",
    rim: "#6a5348",
    rimHi: "#c8b4a0",
    heat: "#e23a22",
    heatAlt: "#ffb03a",
  },
  membrane: {
    void: "#101820",
    voidAlt: "#1a2834",
    floor: "#8fd0e8",
    floorAlt: "#f0d0b0",
    mote: "#fff8ea",
    wall: "#e07a32",
    wallHi: "#f6c27a",
    wallSh: "#8a3a18",
    rim: "#e07a32",
    rimHi: "#f6c27a",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  enzyme: {
    void: "#16181c",
    voidAlt: "#22262c",
    floor: "#d7e4df",
    floorAlt: "#c5d5cf",
    mote: "#f7fbf8",
    wall: "#6a5038",
    wallHi: "#c4a070",
    wallSh: "#3a2a1c",
    rim: "#7d8c96",
    rimHi: "#d5e0e6",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  selection: {
    void: "#241c18",
    voidAlt: "#3a2e26",
    floor: "#efe0b4",
    floorAlt: "#e4d09a",
    mote: "#f8f3dc",
    wall: "#f7f4ea",
    wallHi: "#ffffff",
    wallSh: "#d5ccb6",
    rim: "#c5d5de",
    rimHi: "#f3fbff",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  pcr: {
    void: "#1a120e",
    voidAlt: "#2c1c14",
    floor: "#d8c8b0",
    floorAlt: "#c4b094",
    mote: "#f4ead8",
    wall: "#5c4638",
    wallHi: "#a08870",
    wallSh: "#2e221c",
    rim: "#3a3a42",
    rimHi: "#8a8a96",
    heat: "#e23a22",
    heatAlt: "#ffb03a",
  },
  gel: {
    void: "#10141c",
    voidAlt: "#1a2230",
    floor: "#1c3a4a",
    floorAlt: "#245868",
    mote: "#9ae7ff",
    wall: "#c8d0d8",
    wallHi: "#f4f7fa",
    wallSh: "#6a7680",
    rim: "#243044",
    rimHi: "#6a88a8",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  transform: {
    void: "#102028",
    voidAlt: "#16303c",
    floor: "#d7eef6",
    floorAlt: "#b9dce8",
    mote: "#ffffff",
    wall: "#4a6a78",
    wallHi: "#c5dde6",
    wallSh: "#243840",
    rim: "#7eb8c8",
    rimHi: "#e8f7fb",
    heat: "#e25b2a",
    heatAlt: "#ffb15a",
  },
  greenhouse: {
    void: "#87b8e0",
    voidAlt: "#b7d4ef",
    floor: "#8fbe55",
    floorAlt: "#6ea43c",
    mote: "#e6f4b8",
    wall: "#6b4428",
    wallHi: "#c48a4a",
    wallSh: "#3a2414",
    rim: "#d7eee4",
    rimHi: "#f4fffb",
    heat: "#e07a32",
    heatAlt: "#ffd27a",
  },
};

const INK = "#1a1614";

function themeFor(id: string): Theme {
  return THEMES[id] ?? THEMES.agar ?? THEMES.cytoplasm!;
}

function hash(c: number, r: number, n = 0): number {
  return Math.abs((c * 47 + r * 83 + n * 19) % 97);
}

function touches(grid: readonly string[], c: number, r: number, target: string): boolean {
  const steps = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  return steps.some(([dc, dr]) => grid[r + dr]?.[c + dc] === target);
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, PX, PX);
}

function paintTile(ctx: CanvasRenderingContext2D, x: number, y: number, a: string, b: string, mote: string, salt: number) {
  for (let py = 0; py < 8; py++) {
    for (let px = 0; px < 8; px++) {
      block(ctx, x + px * PX, y + py * PX, (px + py + salt) % 2 === 0 ? a : b);
    }
  }
  const mx = (salt % 6) + 1;
  const my = ((salt * 3) % 5) + 1;
  block(ctx, x + mx * PX, y + my * PX, mote);
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  grid: readonly string[],
  mapId: string,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  portal: { x: number; y: number },
  now: number,
) {
  const theme = themeFor(mapId);
  const cols = grid[0]?.length ?? 0;
  const rows = grid.length;
  ctx.fillStyle = theme.void;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.save();
  ctx.translate(-Math.round(camX), -Math.round(camY));
  const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const r0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const c1 = Math.min(cols, Math.ceil((camX + viewW) / TILE) + 1);
  const r1 = Math.min(rows, Math.ceil((camY + viewH) / TILE) + 1);
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      const ch = grid[r]?.[c] ?? "x";
      const x = c * TILE;
      const y = r * TILE;
      const salt = hash(c, r);
      if (ch === "x") {
        paintTile(ctx, x, y, theme.void, theme.voidAlt, theme.void, salt);
        continue;
      }
      if (ch === "#") {
        const rim = touches(grid, c, r, "x");
        const base = rim ? theme.rim : theme.wall;
        const hi = rim ? theme.rimHi : theme.wallHi;
        const sh = rim ? theme.rim : theme.wallSh;
        paintTile(ctx, x, y, base, sh, hi, salt);
        block(ctx, x, y, hi);
        block(ctx, x + PX, y, hi);
        block(ctx, x, y + PX, hi);
        block(ctx, x + 7 * PX, y + 7 * PX, sh);
        continue;
      }
      if (ch === "H") {
        paintTile(ctx, x, y, theme.heat, theme.heatAlt, "#fff1c2", salt + Math.floor(now / 180));
        continue;
      }
      const insideCell = mapId === "membrane" && r > rows / 2;
      const floor = insideCell ? "#f3d2b4" : theme.floor;
      const alt = insideCell ? "#e7c09a" : theme.floorAlt;
      paintTile(ctx, x, y, floor, alt, theme.mote, salt);
      dressFloor(ctx, mapId, c, r, x, y);
    }
  }
  drawPortal(ctx, portal.x, portal.y, now);
  ctx.restore();
}

function dressFloor(ctx: CanvasRenderingContext2D, mapId: string, c: number, r: number, x: number, y: number) {
  if (mapId === "agar" && (r * 2 + c) % 5 === 0) {
    ctx.fillStyle = "#c9843a";
    ctx.fillRect(x + 2, y + 14, 28, 3);
  }
  if (mapId === "agar" && hash(c, r, 4) % 9 === 0) {
    ctx.fillStyle = "#d85a32";
    ctx.fillRect(x + 18, y + 8, 6, 6);
  }
  if (mapId === "selection" && hash(c, r, 3) % 7 === 0) {
    ctx.fillStyle = "#f7f4ea";
    ctx.fillRect(x + 10, y + 12, 5, 5);
    ctx.fillRect(x + 20, y + 8, 3, 3);
  }
  if ((mapId === "cytoplasm" || mapId === "reactor") && hash(c, r, 5) % 8 === 0) {
    ctx.fillStyle = mapId === "reactor" ? "#d8fff0" : "#e7fffb";
    ctx.fillRect(x + 8, y + 10, 4, 4);
    ctx.fillRect(x + 18, y + 18, 3, 3);
  }
  if (mapId === "root" && hash(c, r, 6) % 6 === 0) {
    ctx.fillStyle = "#f4e2b0";
    ctx.fillRect(x + 6, y + 20, 18, 3);
  }
}

function drawPortal(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  const frame = Math.floor(now / 180) % 2;
  const sprite = frame === 0
    ? ["..bbbb..", ".bwwwwb.", "bwkbkbwb", "bwwwwwwb", "bwkbkbwb", ".bwwwwb.", "..bbbb..", "........"]
    : ["..bbbb..", ".bkkkkb.", "bkwwwkwb", "bkwwwwkb", "bkwwwkwb", ".bkkkkb.", "..bbbb..", "........"];
  blit(ctx, sprite, x, y, 3);
}

const HERO = [
  "......oooooo......",
  ".....oowwwwooo....",
  "....oowkwwkwoo....",
  "....oowwwwwwoo....",
  ".....oowwwwoo.....",
  "......oooooo......",
  "...kkccccccccckk..",
  "..kkccccccccccckk.",
  "..kkccccccccccckk.",
  "..kkccccccccccckk.",
  "...kccccccccccck..",
  "...kcccckkkccccck.",
  "...kcc..kk..ccck..",
  ".......kk..kk.....",
  "......kk....kk....",
  ".....kk......kk...",
];

export const MOB_SPRITES: Record<MobKind, string[]> = {
  blob: [
    ".....oooooo.....",
    "...ooookkoooo...",
    "..ookkkkkkkkoo..",
    ".ookkookkookkoo.",
    ".oooooookooooo..",
    "oooooooooooooooo",
    "ooookkoooookkooo",
    ".oooooooooooooo.",
    "..oooooooooooo..",
    "...oooooooooo...",
    "....oooooooo....",
    ".....oooooo.....",
    "......oooo......",
    ".......oo.......",
    "................",
    "................",
  ],
  phage: [
    "......bbbb......",
    ".....bkkkkb.....",
    "....bkwkkwkb....",
    "...bbkkkkkkbb...",
    "..bbkkwwwwkkbb..",
    "...bkkkkkkkkb...",
    "....bbkkkkbb....",
    ".....b.bb.b.....",
    "....b..bb..b....",
    "...b...bb...b...",
    "..b....bb....b..",
    ".b.....bb.....b.",
    ".......bb.......",
    "......b..b......",
    "................",
    "................",
  ],
  spore: [
    "......gggg......",
    "....gggggggg....",
    "...ggkyyykgg....",
    "..ggkyyyyykgg...",
    "..gkyyyyyyykg...",
    ".ggkyyyyyyykgg..",
    ".ggkyyyyyyykgg..",
    "..gkyyyyyyykg...",
    "..ggkyyyyykgg...",
    "...ggkyyykgg....",
    "....gggggggg....",
    "......gggg......",
    ".......gg.......",
    "................",
    "................",
    "................",
  ],
  foam: [
    "...ww....ww.....",
    "..wwww..wwww....",
    ".wwkwwwwwwkww...",
    "wwwwwwwwwwwwww..",
    ".wwwwwwwwwwww...",
    "..wwww..wwww....",
    ".wwww....wwww...",
    "wwkww....wwkww..",
    ".wwww....wwww...",
    "..www....www....",
    "...ww....ww.....",
    "....wwwwww......",
    ".....wwww.......",
    "................",
    "................",
    "................",
  ],
  cutter: [
    "ee..........ee..",
    ".ee........ee...",
    "..ee......ee....",
    "...ee....ee.....",
    "....eeeeee......",
    ".....eeee.......",
    "....eeeeee......",
    "...ee....ee.....",
    "..ee......ee....",
    ".ee........ee...",
    "ee..........ee..",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  dimer: [
    "..yyyy....yyyy..",
    ".ykyyy....yyyky.",
    ".yyyyy....yyyyy.",
    "..yyyy....yyyy..",
    "...yy......yy...",
    "................",
    "..yyyy....yyyy..",
    ".yyyyy....yyyyy.",
    ".ykyyy....yyyky.",
    "..yyyy....yyyy..",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  toxin: [
    "......pppp......",
    "....pppppppp....",
    "...ppwwwwwwpp...",
    "..ppwwkwwkwwpp..",
    "..ppwwwwwwwwpp..",
    ".ppppwwwwwwppp..",
    ".ppppppppppppp..",
    "..pppppppppppp..",
    "...pppppppppp...",
    "....pppppppp....",
    ".....pppppp.....",
    "......pppp......",
    ".......pp.......",
    "................",
    "................",
    "................",
  ],
  protease: [
    ".rrrrrrrrrrrrrr.",
    "rrwwrrrrrrrrwwrr",
    "rrwwrrrrrrrrwwrr",
    "rrrrrrrrrrrrrrrr",
    ".rrrrrrrrrrrrrr.",
    "..rrrrrrrrrrrr..",
    "...rrrrrrrrrr...",
    "....rrrrrrrr....",
    ".....rrrrrr.....",
    "......rrrr......",
    ".......rr.......",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  swarm: [
    ".ggg....ggg.....",
    "gkg......gkg....",
    ".ggg....ggg.....",
    "................",
    "....ggg....ggg..",
    "....gkg....gkg..",
    "....ggg....ggg..",
    "................",
    "ggg....ggg......",
    "gkg....gkg......",
    "ggg....ggg......",
    "................",
    "..gg......gg....",
    "..gk......gk....",
    "................",
    "................",
  ],
  wilt: [
    ".....nnnnnn.....",
    "....nnkwwknn....",
    "...nnkwwwwknn...",
    "...nnnnnnnnnn...",
    "....nnnnnnnn....",
    ".....nnnnnn.....",
    "......nnnn......",
    "......nnnn......",
    ".....nn..nn.....",
    "....nn....nn....",
    "...n......n.....",
    "..n........n....",
    "................",
    "................",
    "................",
    "................",
  ],
  lysate: [
    "....rrrrrrrr....",
    "..rrkkwwwwkkrr..",
    ".rrkwwwwwwwwkrr.",
    "rrkwwkwwwwkwwkrr",
    "rrwwwwwwwwwwwwrr",
    "rrwwwwkwwkwwwwrr",
    ".rrwwwwwwwwwwrr.",
    "..rrkkwwwwkkrr..",
    "...rrrrrrrrrr...",
    "....rr.rr.rr....",
    "...r..r..r..r...",
    "..r....rr....r..",
    "................",
    "................",
    "................",
    "................",
  ],
};

export const PIXEL_PALETTE: Record<string, string> = {
  k: INK,
  w: "#f6f1e6",
  o: "#ff8a1e",
  b: "#3d7ec8",
  g: "#6aaa32",
  r: "#d64532",
  y: "#f0c14a",
  p: "#b45ad4",
  n: "#8d5a32",
  e: "#d5dee4",
  c: "#f7f4ee",
};

function blit(ctx: CanvasRenderingContext2D, sprite: string[], cx: number, cy: number, scale: number, flip = false) {
  const height = sprite.length;
  const width = sprite[0]?.length ?? 0;
  const left = Math.round(cx - (width * scale) / 2);
  const top = Math.round(cy - (height * scale) / 2);
  for (let y = 0; y < height; y++) {
    const row = sprite[y] ?? "";
    for (let x = 0; x < width; x++) {
      const source = flip ? width - 1 - x : x;
      const color = PIXEL_PALETTE[row[source] ?? ""];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(left + x * scale, top + y * scale, scale, scale);
    }
  }
}

export type HeroPose = "idle" | "attack" | "dash";

const HERO_SRC: Record<HeroPose, string> = {
  idle: "/hero/idle.png",
  attack: "/hero/attack.png",
  dash: "/hero/dash.png",
};

const heroCache: Partial<Record<HeroPose, HTMLImageElement>> = {};

function heroImage(pose: HeroPose): HTMLImageElement | null {
  const cached = heroCache[pose];
  if (cached?.complete && cached.naturalWidth > 0) return cached;
  if (!cached) {
    const img = new Image();
    img.decoding = "async";
    img.src = HERO_SRC[pose];
    heroCache[pose] = img;
  }
  return null;
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingX: number,
  pose: HeroPose,
  blink: boolean,
) {
  ctx.globalAlpha = blink ? 0.45 : 1;
  ctx.fillStyle = "rgba(20,16,12,0.35)";
  ctx.fillRect(x - 18, y + 18, 36, 6);
  const img = heroImage(pose) ?? heroImage("idle");
  if (img) {
    const height = pose === "dash" ? 54 : 56;
    const scale = height / img.naturalHeight;
    const width = img.naturalWidth * scale;
    // Idle and attack face right in the art. The dash faces left.
    const flip = pose === "dash" ? facingX > 0 : facingX < 0;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
  } else {
    blit(ctx, HERO, x, y, 3, facingX < 0);
  }
  ctx.globalAlpha = 1;
}

const PICKUP = [
  "..oooo..",
  ".okkkko.",
  ".okyyko.",
  ".okyyko.",
  "..oooko.",
  "...oko..",
  "..oooo..",
  ".oooooo.",
];

export function drawPickup(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  const bob = Math.sin(now / 220) * 3;
  ctx.fillStyle = "rgba(20,16,12,0.28)";
  ctx.fillRect(x - 12, y + 14, 24, 4);
  blit(ctx, PICKUP, x, y + bob, 3);
}

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  kind: MobKind,
  x: number,
  y: number,
  phase: number,
  now: number,
  scale = 3,
) {
  const bob = Math.sin(now / 220 + phase) > 0 ? 0 : 2;
  const shadow = scale * 9;
  ctx.fillStyle = "rgba(20,16,12,0.28)";
  ctx.fillRect(x - shadow / 2, y + scale * 6, shadow, 5);
  blit(ctx, MOB_SPRITES[kind], x, y + bob, scale, Math.sin(phase) < 0);
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  grid: readonly string[],
  player: { x: number; y: number },
  portal: { x: number; y: number },
  loot: { x: number; y: number } | null,
) {
  const cols = grid[0]?.length ?? 1;
  const rows = grid.length || 1;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const sx = width / cols;
  const sy = height / rows;
  ctx.fillStyle = "#1a1614";
  ctx.fillRect(0, 0, width, height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r]?.[c] ?? "x";
      if (ch === "#" || ch === "x") ctx.fillStyle = ch === "x" ? "#100c0a" : "#3a322c";
      else if (ch === "H") ctx.fillStyle = "#e23a22";
      else ctx.fillStyle = "#cbb89a";
      ctx.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy));
    }
  }
  const dot = (x: number, y: number, color: string, size: number) => {
    ctx.fillStyle = color;
    ctx.fillRect((x / TILE) * sx - size / 2, (y / TILE) * sy - size / 2, size, size);
  };
  dot(portal.x, portal.y, "#3aa0e8", 5);
  if (loot) dot(loot.x, loot.y, "#ffb15a", 4);
  dot(player.x, player.y, "#ff8000", 4);
}

export function drawSlash(ctx: CanvasRenderingContext2D, x: number, y: number, facingX: number, facingY: number) {
  const sx = x + facingX * 40;
  const sy = y + facingY * 40;
  blit(
    ctx,
    ["...yyyyyy", "..yyyyyyy", ".yyyyyyyy", "yyyyyyyyy", ".yyyyyyyy", "..yyyyyyy", "...yyyyyy"],
    sx,
    sy,
    3,
    facingX < 0,
  );
}
