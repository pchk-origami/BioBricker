import { describe, expect, it } from "vitest";
import { meleeConnects } from "./combat.ts";
import { easyLessonIds, forDifficulty } from "./easy.ts";
import { PROPOSAL_MAP_COPY } from "./proposal.ts";
import { TILE, floodReachesPortal, slide } from "./grid.ts";
import { ALL_MAPS, REGULAR_MAPS } from "./maps.ts";
import {
  MAX_HEARTS,
  MAX_STAGES,
  MIN_STAGES,
  buildRun,
  healHearts,
  isOrderedSolution,
  pressureForStage,
  rngFromSeed,
  spendHeart,
  stageMinutes,
} from "./run.ts";

describe("maps", () => {
  it("uses proposal map copy verbatim on every room", () => {
    for (const map of ALL_MAPS) {
      const copy = PROPOSAL_MAP_COPY[map.id];
      expect(copy, map.id).toBeTruthy();
      expect(map.about, map.id).toBe(copy!.description);
      expect(map.layout, map.id).toBe(copy!.layout);
      expect(map.encounter, map.id).toBe(copy!.mobs);
      expect(map.collectible, map.id).toBe(copy!.collectible);
    }
  });

  it("keeps ten synthetic-biology maps, each with one piece of equipment", () => {
    expect(REGULAR_MAPS).toHaveLength(10);
    expect(ALL_MAPS).toHaveLength(10);
    expect(new Set(REGULAR_MAPS.map((map) => map.id)).size).toBe(10);
    const banned = ["thermal", "root", "greenhouse"];
    for (const map of ALL_MAPS) {
      expect(banned, map.id).not.toContain(map.id);
      expect(map.heavy, map.id).toBe(false);
      expect(map.collectible.length, map.id).toBeGreaterThan(3);
      expect(map.bricks.length - map.order.length, map.id).toBe(2);
      const loot = map.grid.join("").split("L").length - 1;
      expect(loot, map.id).toBe(1);
    }
  });

  it("keeps every corridor wide enough for a big mob", () => {
    const radius = 13;
    const speed = 120;
    for (const map of ALL_MAPS) {
      const grid = map.grid;
      expect(grid[0]?.length ?? 0, map.id).toBeLessThanOrEqual(32);
      expect(grid.length, map.id).toBeLessThanOrEqual(28);
      const spawn = findSpawn(grid, "S");
      const portal = findSpawn(grid, "P");
      let x = (spawn.c + 0.5) * TILE;
      let y = (spawn.r + 0.5) * TILE;
      let guard = 0;
      while (guard < 1200) {
        guard += 1;
        const here = { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
        if (here.c === portal.c && here.r === portal.r) break;
        const steps = route(grid, here, portal);
        expect(steps.length, map.id).toBeGreaterThan(1);
        const next = steps[1];
        if (!next) break;
        const ix = Math.sign(next.c - here.c);
        const iy = Math.sign(next.r - here.r);
        let moved = false;
        for (let frame = 0; frame < 50; frame++) {
          const step = slide(grid, x, y, radius, ix * speed * 0.02, iy * speed * 0.02);
          if (Math.hypot(step.x - x, step.y - y) > 0.2) moved = true;
          x = step.x;
          y = step.y;
          const tile = { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
          if (tile.c !== here.c || tile.r !== here.r) break;
        }
        expect(moved, `${map.id} wedged at ${here.c},${here.r}`).toBe(true);
      }
      expect(Math.floor(x / TILE), map.id).toBe(portal.c);
      expect(Math.floor(y / TILE), map.id).toBe(portal.r);
    }
  });

  it("lets a player body walk from spawn to the portal", () => {
    const radius = 10;
    const speed = 168;
    for (const map of ALL_MAPS) {
      const grid = map.grid;
      const spawn = findSpawn(grid, "S");
      const portal = findSpawn(grid, "P");
      let x = (spawn.c + 0.5) * TILE;
      let y = (spawn.r + 0.5) * TILE;
      let guard = 0;
      while (guard < 900) {
        guard += 1;
        const here = { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
        if (here.c === portal.c && here.r === portal.r) break;
        const steps = route(grid, here, portal);
        expect(steps.length, map.id).toBeGreaterThan(1);
        const next = steps[1];
        if (!next) break;
        const ix = Math.sign(next.c - here.c);
        const iy = Math.sign(next.r - here.r);
        let moved = false;
        for (let frame = 0; frame < 40; frame++) {
          const step = slide(grid, x, y, radius, ix * speed * 0.02, iy * speed * 0.02);
          x = step.x;
          y = step.y;
          const tile = { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
          if (tile.c !== here.c || tile.r !== here.r) {
            moved = true;
            break;
          }
        }
        expect(moved, `${map.id} at ${here.c},${here.r}`).toBe(true);
      }
      expect(Math.floor(x / TILE), map.id).toBe(portal.c);
      expect(Math.floor(y / TILE), map.id).toBe(portal.r);
    }
  });

  it("flood-fills from spawn to portal on every map", () => {
    const walk = new Set([".", "H", "S", "P", "L"]);
    for (const map of ALL_MAPS) {
      expect(floodReachesPortal(map.grid), map.id).toBe(true);
      const edge = map.grid[0]?.[0] ?? ".";
      expect(["#", "x"].includes(edge), map.id).toBe(true);
      let junctions = 0;
      for (let r = 0; r < map.grid.length; r++) {
        for (let c = 0; c < (map.grid[r]?.length ?? 0); c++) {
          if (!walk.has(map.grid[r]?.[c] ?? "")) continue;
          let n = 0;
          for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (walk.has(map.grid[r + dr]?.[c + dc] ?? "")) n += 1;
          }
          if (n >= 3) junctions += 1;
        }
      }
      expect(junctions, map.id).toBeGreaterThan(8);
    }
  });
});

function findSpawn(grid: readonly string[], ch: string) {
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r]?.indexOf(ch) ?? -1;
    if (c >= 0) return { c, r };
  }
  throw new Error(`Missing ${ch}`);
}

function route(grid: readonly string[], from: { c: number; r: number }, to: { c: number; r: number }) {
  const walk = new Set([".", "H", "S", "P", "L"]);
  const key = (c: number, r: number) => `${c},${r}`;
  const queue = [from];
  const prev = new Map<string, { c: number; r: number } | null>([[key(from.c, from.r), null]]);
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    if (cur.c === to.c && cur.r === to.r) break;
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = { c: cur.c + dc, r: cur.r + dr };
      if (!walk.has(grid[next.r]?.[next.c] ?? "#")) continue;
      const id = key(next.c, next.r);
      if (prev.has(id)) continue;
      prev.set(id, cur);
      queue.push(next);
    }
  }
  const steps: { c: number; r: number }[] = [];
  let cur: { c: number; r: number } | null | undefined = to;
  if (!prev.has(key(to.c, to.r))) return steps;
  while (cur) {
    steps.push(cur);
    cur = prev.get(key(cur.c, cur.r));
  }
  steps.reverse();
  return steps;
}

describe("runs", () => {
  it("draws the number of rooms the player chose, between three and ten", () => {
    expect(buildRun(3, () => 0.2)).toHaveLength(3);
    expect(buildRun(10, () => 0.2)).toHaveLength(10);
    expect(buildRun(1, () => 0.2)).toHaveLength(MIN_STAGES);
    expect(buildRun(40, () => 0.2)).toHaveLength(MAX_STAGES);
    const run = buildRun(4, () => 0.3);
    expect(new Set(run.map((map) => map.id)).size).toBe(4);
  });

  it("can open on every map", () => {
    const firsts = new Set<string>();
    for (let seed = 1; seed <= 160; seed++) firsts.add(buildRun(3, rngFromSeed(seed))[0]?.id ?? "");
    for (const map of REGULAR_MAPS) expect(firsts.has(map.id), map.id).toBe(true);
  });

  it("makes the last room the hardest, whatever the map and however long the run", () => {
    const opening = pressureForStage(0, 10);
    const lastOfThree = pressureForStage(2, 3);
    const lastOfTen = pressureForStage(9, 10);
    expect(lastOfThree).toEqual(lastOfTen);
    expect(lastOfTen).toEqual({
      smallCount: 9,
      bigCount: 4,
      speed: 120,
      smallHits: 4,
      bigHits: 8,
      smallDamage: 34,
      bigDamage: 80,
    });
    expect(opening.bigHits).toBeLessThan(lastOfTen.bigHits);
    expect(opening.smallDamage).toBeLessThan(lastOfTen.smallDamage);
    expect(opening.speed).toBeLessThan(pressureForStage(1, 3).speed);
    expect(pressureForStage(0, 3).bigCount).toBeGreaterThanOrEqual(1);
    expect(pressureForStage(0, 3).smallHits).toBeGreaterThanOrEqual(2);
    const easyOpen = pressureForStage(0, 10, "easy");
    const easyLast = pressureForStage(9, 10, "easy");
    expect(easyOpen.bigCount).toBe(0);
    expect(easyOpen.smallCount).toBeLessThan(opening.smallCount);
    expect(easyOpen.speed).toBeLessThan(opening.speed);
    expect(easyLast.bigCount).toBe(1);
    expect(easyLast.smallHits).toBe(1);
    expect(easyLast.bigDamage).toBeLessThan(lastOfTen.bigDamage);
    expect(stageMinutes(3)).toBe(8);
    expect(stageMinutes(10)).toBe(30);
  });
});

describe("combat", () => {
  it("hits a contaminant in front or touching you, and misses one far to the side", () => {
    expect(meleeConnects(0, 0, 1, 0, 48, 0, 9)).toBe(true);
    expect(meleeConnects(0, 0, 1, 0, -40, 0, 9)).toBe(true);
    expect(meleeConnects(0, 0, 1, 0, 0, 80, 9)).toBe(false);
    expect(meleeConnects(0, 0, 1, 0, 200, 0, 9)).toBe(false);
  });
});

describe("answers", () => {
  it("keeps the same order on easy, in plainer words", () => {
    expect(new Set(easyLessonIds())).toEqual(new Set(ALL_MAPS.map((map) => map.id)));
    for (const map of ALL_MAPS) {
      const easy = forDifficulty(map, "easy");
      const standard = forDifficulty(map, "standard");
      expect(easy.order).toEqual(map.order);
      expect(easy.prompt).not.toBe(map.prompt);
      expect(easy.prompt.length).toBeGreaterThan(40);
      expect(standard.prompt).toBe(map.prompt);
      for (const id of map.order) {
        const plain = easy.bricks.find((item) => item.id === id);
        expect(plain?.label.length).toBeGreaterThan(2);
      }
    }
  });

  it("accepts only the exact brick order", () => {
    for (const map of ALL_MAPS) {
      expect(isOrderedSolution(map.order, map.order)).toBe(true);
      const swapped = [...map.order];
      const first = swapped[0];
      swapped[0] = swapped[1] ?? null;
      swapped[1] = first ?? null;
      expect(isOrderedSolution(map.order, swapped)).toBe(false);
      expect(isOrderedSolution(map.order, map.order.map(() => null))).toBe(false);
    }
  });

  it("wipes the gate when the last heart is spent", () => {
    expect(spendHeart(5)).toEqual({ hearts: 4, wipe: false });
    expect(spendHeart(1)).toEqual({ hearts: 0, wipe: true });
  });

  it("restores up to two hearts after a correct order", () => {
    expect(healHearts(3)).toEqual({ hearts: 5, gained: 2 });
    expect(healHearts(4)).toEqual({ hearts: MAX_HEARTS, gained: 1 });
    expect(healHearts(5)).toEqual({ hearts: MAX_HEARTS, gained: 0 });
  });
});

describe("lab", () => {
  it("keeps gears across salvages and prefers rooms you still need", async () => {
    const { mergeLab, readLab, writeLab, LAB_KEY, LAB_SIZE } = await import("./lab.ts");
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    });
    writeLab([]);
    const first = mergeLab(["Inoculation loop", "Micropipette", "Spin column"]);
    expect(first).toHaveLength(3);
    const second = mergeLab(["Micropipette", "Stir bar"]);
    expect(second).toEqual(["Inoculation loop", "Micropipette", "Spin column", "Stir bar"]);
    expect(readLab()).toHaveLength(4);
    expect(LAB_SIZE).toBe(10);
    const run = buildRun(3, rngFromSeed(9), second);
    for (const map of run) {
      expect(second.includes(map.collectible)).toBe(false);
    }
    expect(store.has(LAB_KEY)).toBe(true);
  });
});

describe("save", () => {
  it("rebuilds the same run from a stored map list", async () => {
    const { restoreRun, writeSave, readSave, clearSave, SAVE_KEY } = await import("./save.ts");
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    });
    const seed = 42;
    const run = buildRun(4, rngFromSeed(seed));
    writeSave({
      version: 1,
      seed,
      stages: 4,
      round: 2,
      hearts: 3,
      shield: 40,
      collected: [run[0]!.collectible, run[1]!.collectible],
      phase: "maze",
      mapIds: run.map((map) => map.id),
      mapName: run[2]!.name,
      savedAt: Date.now(),
      difficulty: "easy",
    });
    const save = readSave();
    expect(save?.round).toBe(2);
    expect(save?.hearts).toBe(3);
    expect(save?.difficulty).toBe("easy");
    expect(restoreRun(save!)?.map((map) => map.id)).toEqual(run.map((map) => map.id));
    clearSave();
    expect(store.has(SAVE_KEY)).toBe(false);
  });
});
