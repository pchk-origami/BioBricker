export const TILE = 32;

const WALKABLE = new Set([".", "H", "S", "P", "L"]);

export function blocked(grid: readonly string[], x: number, y: number, radius: number): boolean {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const points = [
    [x - radius, y - radius],
    [x + radius, y - radius],
    [x - radius, y + radius],
    [x + radius, y + radius],
  ];
  for (const [px, py] of points) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (c < 0 || r < 0 || c >= width || r >= height) return true;
    if (!WALKABLE.has(grid[r]?.[c] ?? "")) return true;
  }
  return false;
}

function easeToTileCenter(
  grid: readonly string[],
  x: number,
  y: number,
  radius: number,
  amount: number,
): { x: number; y: number } {
  const column = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (!WALKABLE.has(grid[row]?.[column] ?? "")) return { x, y };
  const midX = (column + 0.5) * TILE;
  const midY = (row + 0.5) * TILE;
  let nx = x;
  let ny = y;
  const stepX = Math.sign(midX - x) * Math.min(amount, Math.abs(midX - x));
  const stepY = Math.sign(midY - y) * Math.min(amount, Math.abs(midY - y));
  if (stepX !== 0 && !blocked(grid, x + stepX, y, radius)) nx = x + stepX;
  if (stepY !== 0 && !blocked(grid, nx, y + stepY, radius)) ny = y + stepY;
  return { x: nx, y: ny };
}

function offCorridorCenter(grid: readonly string[], x: number, y: number): boolean {
  const column = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (!WALKABLE.has(grid[row]?.[column] ?? "")) return false;
  const midX = (column + 0.5) * TILE;
  const midY = (row + 0.5) * TILE;
  return Math.abs(x - midX) > 2.5 || Math.abs(y - midY) > 2.5;
}

function nudgeToCenter(
  grid: readonly string[],
  x: number,
  y: number,
  radius: number,
): { x: number; y: number } {
  if (!offCorridorCenter(grid, x, y)) return { x, y };
  return easeToTileCenter(grid, x, y, radius, 2);
}

export function slide(
  grid: readonly string[],
  x: number,
  y: number,
  radius: number,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  let nx = x;
  let ny = y;
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (sx !== 0) {
      if (!blocked(grid, nx + sx, ny, radius)) nx += sx;
      else {
        const eased = nudgeToCenter(grid, nx, ny, radius);
        nx = eased.x;
        ny = eased.y;
      }
    }
    if (sy !== 0) {
      if (!blocked(grid, nx, ny + sy, radius)) ny += sy;
      else {
        const eased = nudgeToCenter(grid, nx, ny, radius);
        nx = eased.x;
        ny = eased.y;
      }
    }
  }
  if (blocked(grid, nx, ny, radius)) {
    const eased = easeToTileCenter(grid, nx, ny, radius, 2);
    nx = eased.x;
    ny = eased.y;
  }
  return { x: nx, y: ny };
}

export function unstick(
  grid: readonly string[],
  x: number,
  y: number,
  radius: number,
): { x: number; y: number } {
  if (!blocked(grid, x, y, radius)) return { x, y };
  const c0 = Math.floor(x / TILE);
  const r0 = Math.floor(y / TILE);
  for (let reach = 0; reach <= 8; reach++) {
    for (let r = r0 - reach; r <= r0 + reach; r++) {
      for (let c = c0 - reach; c <= c0 + reach; c++) {
        const nx = (c + 0.5) * TILE;
        const ny = (r + 0.5) * TILE;
        if (!blocked(grid, nx, ny, radius)) return { x: nx, y: ny };
      }
    }
  }
  return { x, y };
}

export function findChar(grid: readonly string[], ch: string): { c: number; r: number } | null {
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r].indexOf(ch);
    if (c >= 0) return { c, r };
  }
  return null;
}

export function floodReachesPortal(grid: readonly string[]): boolean {
  const start = findChar(grid, "S");
  const portal = findChar(grid, "P");
  if (!start || !portal || grid.length === 0) return false;
  const height = grid.length;
  const width = grid[0].length;
  const seen = new Set<string>();
  const queue: { c: number; r: number }[] = [start];
  while (queue.length > 0) {
    const cell = queue.pop();
    if (!cell) break;
    const key = `${cell.c},${cell.r}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (cell.c === portal.c && cell.r === portal.r) return true;
    const steps = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dc, dr] of steps) {
      const c = cell.c + dc;
      const r = cell.r + dr;
      if (c < 0 || r < 0 || c >= width || r >= height) continue;
      if (!WALKABLE.has(grid[r][c] ?? "")) continue;
      queue.push({ c, r });
    }
  }
  return false;
}

export function parseGrid(art: string): string[] {
  const rows = art
    .trim()
    .split("\n")
    .map((line) => line.trim());
  const width = rows[0]?.length ?? 0;
  if (width === 0 || rows.length < 3) {
    throw new Error("Grid is empty");
  }
  rows.forEach((row, index) => {
    if (row.length !== width) {
      throw new Error(`Ragged row ${index}: ${row.length} != ${width}`);
    }
  });
  return rows;
}
