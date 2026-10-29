import { REGULAR_MAPS } from "./maps.ts";
import type { GameMap } from "./types.ts";

export const MAX_HEARTS = 5;
export const MIN_STAGES = 3;
export const MAX_STAGES = 10;
export const SHIELD_MAX = 100;
export const HEAL_ON_CLEAR = 2;

const MINUTES = [8, 11, 13, 16, 19, 22, 26, 30];

export type Pressure = {
  smallCount: number;
  bigCount: number;
  speed: number;
  smallHits: number;
  bigHits: number;
  smallDamage: number;
  bigDamage: number;
};

function clampStages(count: number): number {
  if (!Number.isFinite(count)) return MIN_STAGES;
  return Math.min(MAX_STAGES, Math.max(MIN_STAGES, Math.round(count)));
}

function lerp(start: number, end: number, t: number): number {
  return Math.round(start + (end - start) * t);
}

export function stageMinutes(count: number): number {
  const stages = clampStages(count);
  return MINUTES[stages - MIN_STAGES] ?? MINUTES[0] ?? 8;
}

export type Difficulty = "easy" | "standard";

export function pressureForStage(index: number, total: number, difficulty: Difficulty = "standard"): Pressure {
  const span = Math.max(1, total - 1);
  const t = total <= 1 ? 1 : Math.min(1, Math.max(0, index / span));
  if (difficulty === "easy") {
    return {
      smallCount: lerp(1, 4, t),
      bigCount: t < 0.34 ? 0 : 1,
      speed: lerp(26, 62, t),
      smallHits: 1,
      bigHits: lerp(2, 3, t),
      smallDamage: lerp(8, 14, t),
      bigDamage: lerp(18, 32, t),
    };
  }
  return {
    smallCount: lerp(3, 9, t),
    bigCount: lerp(1, 4, t),
    speed: lerp(40, 120, t),
    smallHits: lerp(2, 4, t),
    bigHits: lerp(4, 8, t),
    smallDamage: lerp(16, 34, t),
    bigDamage: lerp(42, 80, t),
  };
}

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const roll = Math.min(0.999999, Math.max(0, rng()));
    const j = Math.floor(roll * (i + 1));
    const swap = next[i];
    next[i] = next[j] as T;
    next[j] = swap as T;
  }
  return next;
}

export function rngFromSeed(seed: number): () => number {
  let state = (Math.floor(seed) + 1) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mix = Math.imul(state ^ (state >>> 15), 1 | state);
    mix = (mix + Math.imul(mix ^ (mix >>> 7), 61 | mix)) ^ mix;
    return ((mix ^ (mix >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildRun(
  count = MIN_STAGES,
  rng: () => number = Math.random,
  ownedCollectibles: readonly string[] = [],
): GameMap[] {
  const stages = clampStages(count);
  const owned = new Set(ownedCollectibles);
  const missing = shuffle(
    REGULAR_MAPS.filter((map) => !owned.has(map.collectible)),
    rng,
  );
  const already = shuffle(
    REGULAR_MAPS.filter((map) => owned.has(map.collectible)),
    rng,
  );
  return [...missing, ...already].slice(0, stages);
}

export function isOrderedSolution(order: readonly string[], slots: readonly (string | null)[]): boolean {
  if (slots.length !== order.length) return false;
  return order.every((id, index) => slots[index] === id);
}

export function spendHeart(hearts: number): { hearts: number; wipe: boolean } {
  const next = hearts - 1;
  if (next <= 0) return { hearts: 0, wipe: true };
  return { hearts: next, wipe: false };
}

export function healHearts(hearts: number, amount = HEAL_ON_CLEAR): { hearts: number; gained: number } {
  const next = Math.min(MAX_HEARTS, Math.max(0, hearts) + amount);
  return { hearts: next, gained: next - hearts };
}
