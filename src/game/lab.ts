import { ALL_MAPS } from "./maps.ts";

export const LAB_KEY = "biobricker.lab.v1";

/** Every unique gear the lab needs, in catalog order. */
export const LAB_GEARS: readonly string[] = ALL_MAPS.map((map) => map.collectible);

export const LAB_SIZE = LAB_GEARS.length;

export type LabState = {
  version: 1;
  owned: string[];
  updatedAt: number;
};

function normalizeOwned(items: readonly string[]): string[] {
  const allowed = new Set(LAB_GEARS);
  const seen = new Set<string>();
  const owned: string[] = [];
  for (const item of items) {
    if (typeof item !== "string" || !allowed.has(item) || seen.has(item)) continue;
    seen.add(item);
    owned.push(item);
  }
  return owned;
}

export function readLab(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LAB_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Partial<LabState>;
    if (data.version !== 1 || !Array.isArray(data.owned)) return [];
    return normalizeOwned(data.owned);
  } catch {
    return [];
  }
}

export function writeLab(owned: readonly string[]): string[] {
  const next = normalizeOwned(owned);
  if (typeof localStorage === "undefined") return next;
  try {
    const payload: LabState = { version: 1, owned: next, updatedAt: Date.now() };
    localStorage.setItem(LAB_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
  return next;
}

/** Merge haul from a finished salvage into the lasting lab bench. */
export function mergeLab(haul: readonly string[]): string[] {
  return writeLab([...readLab(), ...haul]);
}

export function labMissing(owned: readonly string[] = readLab()): string[] {
  const have = new Set(owned);
  return LAB_GEARS.filter((item) => !have.has(item));
}

export function labIsComplete(owned: readonly string[] = readLab()): boolean {
  return labMissing(owned).length === 0;
}

/** Bench slots in catalog order: owned item or null if still out. */
export function labBench(owned: readonly string[] = readLab()): (string | null)[] {
  const have = new Set(owned);
  return LAB_GEARS.map((item) => (have.has(item) ? item : null));
}
