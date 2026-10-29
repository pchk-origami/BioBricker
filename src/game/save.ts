import { MAX_HEARTS, MAX_STAGES, MIN_STAGES, SHIELD_MAX } from "./run.ts";
import type { Difficulty } from "./run.ts";
import { REGULAR_MAPS } from "./maps.ts";
import type { GameMap, Phase } from "./types.ts";

export const SAVE_KEY = "biobricker.save.v1";

export type SavePhase = Exclude<Phase, "home" | "setup">;

export type SaveGame = {
  version: 1;
  seed: number;
  stages: number;
  round: number;
  hearts: number;
  shield: number;
  collected: string[];
  phase: SavePhase;
  mapIds: string[];
  mapName: string;
  savedAt: number;
  difficulty: Difficulty;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function readSave(): SaveGame | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SaveGame>;
    if (data.version !== 1) return null;
    if (!Number.isFinite(data.seed)) return null;
    const stages = clamp(Number(data.stages), MIN_STAGES, MAX_STAGES);
    const round = clamp(Number(data.round), 0, stages - 1);
    const hearts = clamp(Number(data.hearts), 1, MAX_HEARTS);
    const shield = clamp(Number(data.shield), 0, SHIELD_MAX);
    const collected = Array.isArray(data.collected)
      ? data.collected.filter((item): item is string => typeof item === "string").slice(0, round)
      : [];
    const mapIds = Array.isArray(data.mapIds)
      ? data.mapIds.filter((id): id is string => typeof id === "string")
      : [];
    if (mapIds.length !== stages) return null;
    const phase = data.phase;
    if (phase !== "brief" && phase !== "maze" && phase !== "answer" && phase !== "wipe" && phase !== "ending") {
      return null;
    }
    if (phase === "ending") return null;
    const difficulty: Difficulty = data.difficulty === "easy" ? "easy" : "standard";
    return {
      version: 1,
      seed: Math.floor(Number(data.seed)),
      stages,
      round,
      hearts,
      shield,
      collected,
      phase,
      mapIds,
      mapName: typeof data.mapName === "string" ? data.mapName : "Room",
      savedAt: Number(data.savedAt) || Date.now(),
      difficulty,
    };
  } catch {
    return null;
  }
}

export function writeSave(save: SaveGame): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode or full storage — skip quietly.
  }
}

export function clearSave(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

export function restoreRun(save: SaveGame): GameMap[] | null {
  const byId = new Map(REGULAR_MAPS.map((map) => [map.id, map]));
  const run: GameMap[] = [];
  for (const id of save.mapIds) {
    const map = byId.get(id);
    if (!map) return null;
    run.push(map);
  }
  if (run.length !== save.stages) return null;
  return run;
}

export function freshSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}
