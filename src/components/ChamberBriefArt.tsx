import { useEffect, useRef } from "react";
import { drawCreature, drawPickup, drawWorld } from "./pixelWorld.ts";
import { findChar, TILE } from "../game/grid.ts";
import type { GameMap } from "../game/types.ts";

export function ChamberBriefMap({ map }: { map: GameMap }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const grid = map.grid;
    const cols = grid[0]?.length ?? 1;
    const rows = grid.length;
    const w = cols * TILE;
    const h = rows * TILE;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const portal = findChar(grid, "P");
    const portalPt = {
      x: ((portal?.c ?? 1) + 0.5) * TILE,
      y: ((portal?.r ?? 1) + 0.5) * TILE,
    };
    const loot = findChar(grid, "L");
    const lootPt = loot
      ? { x: (loot.c + 0.5) * TILE, y: (loot.r + 0.5) * TILE }
      : null;

    let frame = 0;
    const tick = (now: number) => {
      drawWorld(ctx, grid, map.id, 0, 0, w, h, portalPt, now);
      if (lootPt) drawPickup(ctx, lootPt.x, lootPt.y, now);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [map]);

  return (
    <canvas
      ref={ref}
      className="chamber-brief-map-canvas"
      role="img"
      aria-label={`${map.name} map preview`}
    />
  );
}

export function ChamberBriefMob({ map }: { map: GameMap }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const tick = (now: number) => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#f3efe9";
      ctx.fillRect(0, 0, size, size);
      drawCreature(ctx, map.mob, size / 2, size / 2 + 8, map.mob.length * 0.7, now, 4);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [map]);

  return (
    <canvas
      ref={ref}
      className="chamber-brief-mob-canvas"
      role="img"
      aria-label={map.mobName}
    />
  );
}
