type Grid = string[][];

function blank(width: number, height: number, fill = "x"): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

function join(grid: Grid): string[] {
  return grid.map((row) => row.join(""));
}

function inside(grid: Grid, c: number, r: number): boolean {
  return r >= 0 && c >= 0 && r < grid.length && c < (grid[0]?.length ?? 0);
}

function paint(grid: Grid, c: number, r: number, radius: number, ch: string, allow: (cell: string) => boolean) {
  const x0 = Math.floor(c - radius);
  const x1 = Math.ceil(c + radius);
  const y0 = Math.floor(r - radius);
  const y1 = Math.ceil(r + radius);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!inside(grid, x, y)) continue;
      if (Math.hypot(x - c, y - r) > radius) continue;
      const cell = grid[y]?.[x] ?? "x";
      if (!allow(cell)) continue;
      const row = grid[y];
      if (row) row[x] = ch;
    }
  }
}

function plot(grid: Grid, c: number, r: number, ch: string) {
  if (!inside(grid, Math.round(c), Math.round(r))) return;
  const row = grid[Math.round(r)];
  if (row) row[Math.round(c)] = ch;
}

function fillRect(grid: Grid, c: number, r: number, w: number, h: number, ch: string, allow?: (cell: string) => boolean) {
  for (let y = r; y < r + h; y++) {
    for (let x = c; x < c + w; x++) {
      if (!inside(grid, x, y)) continue;
      const cell = grid[y]?.[x] ?? "x";
      if (allow && !allow(cell)) continue;
      plot(grid, x, y, ch);
    }
  }
}

function carve(grid: Grid, from: { c: number; r: number }, to: { c: number; r: number }, radius: number) {
  const steps = Math.max(Math.abs(to.c - from.c), Math.abs(to.r - from.r), 1);
  for (let i = 0; i <= steps; i++) {
    const c = Math.round(from.c + ((to.c - from.c) * i) / steps);
    const r = Math.round(from.r + ((to.r - from.r) * i) / steps);
    paint(grid, c, r, radius + 1.15, "#", (cell) => cell === "x" || cell === "#");
    paint(grid, c, r, radius, ".", (cell) => cell === "#" || cell === "." || cell === "H" || cell === "x");
  }
}

function mark(grid: Grid, c: number, r: number, ch: "S" | "P") {
  let bestC = c;
  let bestR = r;
  let best = 999;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[0]?.length ?? 0); x++) {
      const cell = grid[y]?.[x];
      if (cell !== "." && cell !== "H") continue;
      const dist = Math.hypot(x - c, y - r);
      if (dist < best) {
        best = dist;
        bestC = x;
        bestR = y;
      }
    }
  }
  plot(grid, bestC, bestR, ch);
}

type Room = { c: number; r: number; rad: number };

function chambers(grid: Grid, rooms: Room[]) {
  for (const room of rooms) {
    paint(grid, room.c, room.r, room.rad + 1.05, "#", (cell) => cell === "x");
  }
  for (const room of rooms) {
    paint(grid, room.c, room.r, room.rad, ".", (cell) => cell === "#" || cell === "." || cell === "x" || cell === "H");
  }
}

function door(grid: Grid, a: Room, b: Room, radius = 1.15) {
  carve(grid, { c: a.c, r: a.r }, { c: b.c, r: b.r }, radius);
}

function neck(grid: Grid, a: { c: number; r: number }, b: { c: number; r: number }, radius = 1.2) {
  for (const t of [0.35, 0.5, 0.65]) {
    paint(
      grid,
      a.c + (b.c - a.c) * t,
      a.r + (b.r - a.r) * t,
      radius,
      ".",
      (cell) => cell === "#" || cell === ".",
    );
  }
}

function pillar(grid: Grid, c: number, r: number, w = 2, h = 2) {
  fillRect(grid, c, r, w, h, "#", (cell) => cell === ".");
}

function plate(grid: Grid, cx: number, cy: number, gel: number, rim: number) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[0]?.length ?? 0); c++) {
      const dist = Math.hypot(c - cx, r - cy);
      if (dist <= gel) plot(grid, c, r, ".");
      else if (dist <= rim) plot(grid, c, r, "#");
    }
  }
}

const OPEN = new Set([".", "H", "S", "P"]);

function isOpen(grid: string[][], c: number, r: number): boolean {
  return OPEN.has(grid[r]?.[c] ?? "");
}

function span(grid: string[][], c: number, r: number, dc: number, dr: number): number {
  let count = 1;
  for (let step = 1; isOpen(grid, c + dc * step, r + dr * step); step++) count += 1;
  for (let step = 1; isOpen(grid, c - dc * step, r - dr * step); step++) count += 1;
  return count;
}

/**
 * Keep the original map size. Only one-tile necks grow by a single tile,
 * enough for a big mob without blowing the maze past a phone screen.
 */
export function widenMap(rows: string[]): string[] {
  const grid = rows.map((row) => row.split(""));
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const carve: { c: number; r: number }[] = [];
  const queue = (c: number, r: number) => {
    if (r <= 0 || c <= 0 || r >= height - 1 || c >= width - 1) return;
    if (grid[r]?.[c] !== "#") return;
    carve.push({ c, r });
  };

  for (let r = 1; r < height - 1; r++) {
    for (let c = 1; c < width - 1; c++) {
      if (!isOpen(grid, c, r)) continue;
      const across = span(grid, c, r, 1, 0);
      const along = span(grid, c, r, 0, 1);
      if (across >= 2 && along >= 2) continue;
      if (across < 2) queue(c + 1, r);
      if (along < 2) queue(c, r + 1);
    }
  }

  for (const cell of carve) {
    const row = grid[cell.r];
    if (row && row[cell.c] === "#") row[cell.c] = ".";
  }
  return grid.map((row) => row.join(""));
}

export function agarGrid(): string[] {
  const grid = blank(27, 27);
  const cx = 13;
  const cy = 13;
  plate(grid, cx, cy, 11.15, 12.5);
  for (let r = 0; r < 27; r++) {
    for (let c = 0; c < 27; c++) {
      if (Math.hypot(c - cx, r - cy) <= 8.7 && grid[r]?.[c] === ".") plot(grid, c, r, "#");
    }
  }
  const nw: Room = { c: 9, r: 9, rad: 2.35 };
  const ne: Room = { c: 17, r: 9, rad: 2.35 };
  const sw: Room = { c: 9, r: 17, rad: 2.35 };
  const se: Room = { c: 17, r: 17, rad: 2.35 };
  const hub: Room = { c: 13, r: 13, rad: 1.85 };
  chambers(grid, [nw, ne, sw, se, hub]);
  neck(grid, nw, hub, 1.15);
  neck(grid, ne, hub, 1.15);
  neck(grid, sw, hub, 1.15);
  neck(grid, se, hub, 1.15);
  neck(grid, nw, ne, 1.05);
  neck(grid, sw, se, 1.05);
  const rim = (room: Room) => {
    const dx = room.c - cx;
    const dy = room.r - cy;
    const len = Math.hypot(dx, dy) || 1;
    neck(grid, room, { c: cx + (dx / len) * 10.4, r: cy + (dy / len) * 10.4 }, 1.15);
  };
  rim(nw);
  rim(ne);
  rim(sw);
  rim(se);
  pillar(grid, 8, 10);
  pillar(grid, 16, 7);
  pillar(grid, 12, 16);
  mark(grid, 8, 8, "S");
  mark(grid, 18, 18, "P");
  return join(grid);
}

export function cytoplasmGrid(): string[] {
  const grid = blank(27, 25, "x");
  const cx = 13;
  const cy = 12;
  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 27; c++) {
      const nx = (c - cx) / 12.1;
      const ny = (r - cy) / 10.9;
      const dist = nx * nx + ny * ny;
      if (dist <= 0.7) plot(grid, c, r, ".");
      else if (dist <= 0.9) plot(grid, c, r, "#");
    }
  }
  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 27; c++) {
      const nx = (c - cx) / 12.1;
      const ny = (r - cy) / 10.9;
      if (nx * nx + ny * ny <= 0.4 && grid[r]?.[c] === ".") plot(grid, c, r, "#");
    }
  }
  const mitoL: Room = { c: 7, r: 13, rad: 2.15 };
  const mitoR: Room = { c: 19, r: 11, rad: 2.15 };
  const vesicle: Room = { c: 13, r: 6, rad: 1.7 };
  const golgi: Room = { c: 12, r: 18, rad: 1.7 };
  chambers(grid, [mitoL, mitoR, vesicle, golgi, { c: cx, r: cy, rad: 2.5 }]);
  paint(grid, cx, cy, 2.35, "#", (cell) => cell === ".");
  paint(grid, cx, cy, 1.45, ".", (cell) => cell === "#");
  neck(grid, { c: cx, r: cy + 1.2 }, { c: cx + 1.2, r: cy + 2.6 }, 0.95);
  neck(grid, mitoL, { c: 4, r: 16 }, 1.15);
  neck(grid, mitoR, { c: 22, r: 8 }, 1.15);
  neck(grid, vesicle, { c: 13, r: 3 }, 1.05);
  neck(grid, golgi, { c: 8, r: 20 }, 1.05);
  neck(grid, mitoL, golgi, 1.05);
  neck(grid, mitoR, vesicle, 1.05);
  pillar(grid, 6, 12);
  pillar(grid, 18, 10);
  mark(grid, 7, 14, "S");
  mark(grid, 19, 11, "P");
  return join(grid);
}

export function transformGrid(): string[] {
  const grid = blank(29, 21, "x");
  const baths: Room[] = [
    { c: 7, r: 11, rad: 3.5 },
    { c: 15, r: 6, rad: 2.7 },
    { c: 22, r: 12, rad: 3.3 },
    { c: 14, r: 14, rad: 2.15 },
  ];
  chambers(grid, baths);
  neck(grid, baths[0]!, baths[1]!, 1.15);
  neck(grid, baths[1]!, baths[2]!, 1.15);
  neck(grid, baths[0]!, baths[3]!, 1.1);
  neck(grid, baths[3]!, baths[2]!, 1.1);
  mark(grid, 6, 11, "S");
  mark(grid, 23, 12, "P");
  return join(grid);
}

export function reactorGrid(): string[] {
  const grid = blank(31, 23, "x");
  const tanks: Room[] = [
    { c: 7, r: 12, rad: 4.15 },
    { c: 16, r: 6, rad: 3.55 },
    { c: 24, r: 15, rad: 4.05 },
    { c: 16, r: 15, rad: 2.45 },
  ];
  chambers(grid, tanks);
  door(grid, tanks[0]!, tanks[1]!, 1.15);
  door(grid, tanks[1]!, tanks[2]!, 1.15);
  door(grid, tanks[0]!, tanks[3]!, 1.1);
  door(grid, tanks[3]!, tanks[2]!, 1.1);
  pillar(grid, 6, 11);
  pillar(grid, 15, 5);
  pillar(grid, 23, 16);
  mark(grid, 5, 12, "S");
  mark(grid, 26, 15, "P");
  return join(grid);
}

export function plasmidGrid(): string[] {
  const grid = blank(27, 27, "x");
  const cx = 13;
  const cy = 13;
  const orbit = 7.35;
  const rooms: Room[] = [
    { c: cx - orbit, r: cy, rad: 3.25 },
    { c: cx + orbit, r: cy, rad: 3.25 },
    { c: cx, r: cy - orbit, rad: 3.05 },
    { c: cx, r: cy + orbit, rad: 3.05 },
  ];
  chambers(grid, rooms);
  const arc = (a0: number, a1: number) => {
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const t0 = a0 + ((a1 - a0) * i) / steps;
      const t1 = a0 + ((a1 - a0) * (i + 1)) / steps;
      carve(
        grid,
        { c: cx + Math.cos(t0) * orbit, r: cy + Math.sin(t0) * orbit },
        { c: cx + Math.cos(t1) * orbit, r: cy + Math.sin(t1) * orbit },
        1.15,
      );
    }
  };
  arc(0.55, Math.PI / 2 - 0.55);
  arc(Math.PI / 2 + 0.55, Math.PI - 0.55);
  arc(Math.PI + 0.55, Math.PI * 1.5 - 0.55);
  arc(Math.PI * 1.5 + 0.55, Math.PI * 2 - 0.55);
  pillar(grid, cx - orbit - 1, cy - 1);
  pillar(grid, cx + orbit, cy + 1);
  pillar(grid, cx - 1, cy - orbit);
  mark(grid, cx - orbit, cy, "S");
  mark(grid, cx + orbit, cy, "P");
  return join(grid);
}

export function pcrGrid(): string[] {
  const grid = blank(29, 21, "x");
  fillRect(grid, 1, 1, 27, 19, "#");
  const wells: Room[] = [
    { c: 7, r: 11, rad: 3.15 },
    { c: 15, r: 11, rad: 3.25 },
    { c: 22, r: 11, rad: 3.05 },
    { c: 15, r: 5, rad: 1.9 },
  ];
  chambers(grid, wells);
  door(grid, wells[0]!, wells[1]!, 1.2);
  door(grid, wells[1]!, wells[2]!, 1.2);
  neck(grid, wells[3]!, wells[1]!, 1.05);
  paint(grid, 15, 11, 1.85, "H", (cell) => cell === ".");
  mark(grid, 6, 11, "S");
  mark(grid, 23, 11, "P");
  return join(grid);
}

export function membraneGrid(): string[] {
  const grid = blank(29, 21, "x");
  const cx = 14;
  const cy = 10;
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 29; c++) {
      const nx = (c - cx) / 13.2;
      const ny = (r - cy) / 9.1;
      const dist = nx * nx + ny * ny;
      if (dist <= 0.78) plot(grid, c, r, ".");
      else if (dist <= 0.98) plot(grid, c, r, "#");
    }
  }
  for (let r = 8; r <= 11; r++) {
    for (let c = 2; c <= 26; c++) {
      if (grid[r]?.[c] === ".") plot(grid, c, r, "#");
    }
  }
  for (const gap of [6, 13, 20]) fillRect(grid, gap, 8, 3, 4, ".", (cell) => cell === "#");
  paint(grid, 8, 5, 1.15, "#", (cell) => cell === ".");
  paint(grid, 18, 4, 1.25, "#", (cell) => cell === ".");
  paint(grid, 11, 15, 1.2, "#", (cell) => cell === ".");
  paint(grid, 19, 16, 1.15, "#", (cell) => cell === ".");
  const vesicle: Room = { c: 22, r: 15, rad: 1.7 };
  chambers(grid, [vesicle]);
  carve(grid, { c: 20, r: 12 }, vesicle, 1.05);
  mark(grid, 5, 4, "S");
  mark(grid, 22, 16, "P");
  return join(grid);
}

export function enzymeGrid(): string[] {
  const grid = blank(29, 21, "x");
  fillRect(grid, 1, 1, 27, 19, "#");
  fillRect(grid, 2, 2, 11, 7, ".");
  fillRect(grid, 16, 2, 11, 7, ".");
  fillRect(grid, 2, 12, 11, 7, ".");
  fillRect(grid, 16, 12, 11, 7, ".");
  fillRect(grid, 12, 4, 5, 3, ".");
  fillRect(grid, 12, 14, 5, 3, ".");
  fillRect(grid, 6, 8, 3, 5, ".");
  fillRect(grid, 20, 8, 3, 5, ".");
  fillRect(grid, 4, 2, 6, 2, "#");
  fillRect(grid, 18, 2, 6, 2, "#");
  fillRect(grid, 4, 17, 6, 2, "#");
  fillRect(grid, 18, 16, 5, 2, "#");
  pillar(grid, 7, 5);
  pillar(grid, 21, 13);
  mark(grid, 5, 6, "S");
  mark(grid, 23, 14, "P");
  return join(grid);
}

export function selectionGrid(): string[] {
  const grid = blank(27, 27);
  const cx = 13;
  const cy = 13;
  plate(grid, cx, cy, 11.15, 12.5);
  for (let r = 3; r <= 23; r++) {
    const gap = (r >= 7 && r <= 9) || (r >= 17 && r <= 19) || (r >= 11 && r <= 15);
    if (gap) continue;
    if (grid[r]?.[12] === ".") plot(grid, 12, r, "#");
    if (grid[r]?.[13] === ".") plot(grid, 13, r, "#");
    if (grid[r]?.[14] === ".") plot(grid, 14, r, "#");
  }
  for (let c = 3; c <= 23; c++) {
    const gap = (c >= 6 && c <= 8) || (c >= 18 && c <= 20) || (c >= 11 && c <= 15);
    if (gap) continue;
    if (grid[12]?.[c] === ".") plot(grid, c, 12, "#");
    if (grid[13]?.[c] === ".") plot(grid, c, 13, "#");
    if (grid[14]?.[c] === ".") plot(grid, c, 14, "#");
  }
  const mounds: [number, number][] = [
    [6, 6],
    [17, 5],
    [7, 17],
    [18, 18],
    [8, 10],
    [16, 9],
    [9, 19],
    [19, 11],
  ];
  for (const [c, r] of mounds) pillar(grid, c, r);
  mark(grid, 7, 7, "S");
  mark(grid, 19, 19, "P");
  return join(grid);
}

export function gelGrid(): string[] {
  const grid = blank(27, 23, "x");
  fillRect(grid, 1, 1, 25, 21, "#");
  fillRect(grid, 3, 3, 21, 4, ".");
  fillRect(grid, 3, 16, 21, 4, ".");
  fillRect(grid, 4, 6, 4, 11, ".");
  fillRect(grid, 11, 6, 4, 11, ".");
  fillRect(grid, 18, 6, 4, 11, ".");
  pillar(grid, 4, 8);
  pillar(grid, 12, 9);
  pillar(grid, 19, 8);
  mark(grid, 6, 4, "S");
  mark(grid, 20, 17, "P");
  return join(grid);
}
