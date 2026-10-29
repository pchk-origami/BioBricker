import type { MobKind } from "./types.ts";

export function mapShowcaseSrc(mapId: string): string {
  return `/showcase/maps/map-${mapId}.png`;
}

export function mobShowcaseSrc(kind: MobKind): string {
  return `/showcase/mobs/mob-${kind}.png`;
}
