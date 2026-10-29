import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { MELEE_REACH, meleeConnects } from "../game/combat.ts";
import { TILE, blocked, findChar, slide, unstick } from "../game/grid.ts";
import { SHIELD_MAX, pressureForStage } from "../game/run.ts";
import type { Difficulty } from "../game/run.ts";
import type { GameMap, MobKind } from "../game/types.ts";
import {
  VIEW_COLS,
  VIEW_ROWS,
  drawCreature,
  drawHero,
  drawMinimap,
  drawPickup,
  drawWorld,
} from "./pixelWorld.ts";
import type { HeroPose } from "./pixelWorld.ts";

const PLAYER_SPEED = 208;
const PLAYER_R = 10;
const ATTACK_COOLDOWN = 0.3;
const HURT_IFRAME = 0.85;
const HEAT_LIMIT = 0.9;
const HEAT_DAMAGE = 48;
const PORTAL_REACH = 84;
const LOOT_REACH = 36;
const SMALL_R = 8;
const BIG_R = 13;
const DASH_SPEED = 460;
const DASH_TIME = 0.18;
const DASH_COOLDOWN = 0.8;
const STICK_DEADZONE = 0.18;

type Tier = "small" | "big";

type Mob = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  max: number;
  r: number;
  kind: MobKind;
  phase: number;
  tier: Tier;
  damage: number;
  scale: number;
  stuck: number;
  detour: number;
};

type Stick = { x: number; y: number };

type MazeProps = {
  map: GameMap;
  round: number;
  stageCount: number;
  difficulty: Difficulty;
  heartsRef: { current: number };
  shieldRef: { current: number };
  onHearts: (hearts: number) => void;
  onShield: (shield: number) => void;
  onWipe: () => void;
  onOpenPortal: () => void;
};

function tileAt(grid: readonly string[], x: number, y: number): string {
  const c = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return grid[row]?.[c] ?? "#";
}

function settle(grid: readonly string[], mob: Mob) {
  if (!blocked(grid, mob.x, mob.y, mob.r)) return;
  const spot = unstick(grid, mob.x, mob.y, mob.r);
  mob.x = spot.x;
  mob.y = spot.y;
}

function isTouchPlay(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse), (max-width: 840px)").matches;
}

function isLandscape(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(orientation: landscape)").matches || window.innerWidth > window.innerHeight;
}

function spawnMobs(map: GameMap, round: number, stageCount: number, difficulty: Difficulty): Mob[] {
  const pressure = pressureForStage(round, stageCount, difficulty);
  const spawn = findChar(map.grid, "S");
  const portal = findChar(map.grid, "P");
  const loot = findChar(map.grid, "L");
  const cells: { c: number; r: number }[] = [];
  for (let r = 0; r < map.grid.length; r++) {
    for (let c = 0; c < map.grid[r].length; c++) {
      const ch = map.grid[r][c];
      if (ch !== "." && ch !== "H") continue;
      if (spawn && Math.hypot(c - spawn.c, r - spawn.r) < 3) continue;
      if (portal && Math.hypot(c - portal.c, r - portal.r) < 2) continue;
      if (loot && Math.hypot(c - loot.c, r - loot.r) < 2) continue;
      cells.push({ c, r });
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = cells[i];
    cells[i] = cells[j] as { c: number; r: number };
    cells[j] = swap as { c: number; r: number };
  }
  const mobs: Mob[] = [];
  let cursor = 0;
  const make = (tier: Tier, cell: { c: number; r: number }): Mob | null => {
    const radius = tier === "big" ? BIG_R : SMALL_R;
    const spot = unstick(map.grid, (cell.c + 0.5) * TILE, (cell.r + 0.5) * TILE, radius);
    if (blocked(map.grid, spot.x, spot.y, radius)) return null;
    const hits = tier === "big" ? pressure.bigHits : pressure.smallHits;
    const speed = pressure.speed * (tier === "big" ? 0.82 : 1);
    let vx = 0;
    let vy = 0;
    if (map.mob === "cutter") {
      if (Math.random() < 0.5) vx = Math.random() < 0.5 ? speed : -speed;
      else vy = Math.random() < 0.5 ? speed : -speed;
    }
    return {
      x: spot.x,
      y: spot.y,
      vx,
      vy,
      hp: hits,
      max: hits,
      r: radius,
      kind: map.mob,
      phase: Math.random() * Math.PI * 2,
      tier,
      damage: tier === "big" ? pressure.bigDamage : pressure.smallDamage,
      scale: tier === "big" ? 5 : 3,
      stuck: 0,
      detour: Math.random() < 0.5 ? 1 : -1,
    };
  };
  const take = (tier: Tier, count: number) => {
    for (let i = 0; i < count; i++) {
      const cell = cells[cursor % Math.max(1, cells.length)];
      cursor += 1;
      if (!cell) break;
      const mob = make(tier, cell);
      if (mob) mobs.push(mob);
    }
  };
  take("small", pressure.smallCount);
  take("big", pressure.bigCount);
  return mobs;
}

export function Maze({
  map,
  round,
  stageCount,
  difficulty,
  heartsRef,
  shieldRef,
  onHearts,
  onShield,
  onWipe,
  onOpenPortal,
}: MazeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef(new Set<string>());
  const stickRef = useRef<Stick>({ x: 0, y: 0 });
  const attackRef = useRef(false);
  const interactRef = useRef(false);
  const dashRef = useRef(false);
  const onHeartsRef = useRef(onHearts);
  const onShieldRef = useRef(onShield);
  const onWipeRef = useRef(onWipe);
  const onOpenRef = useRef(onOpenPortal);
  const [near, setNear] = useState(false);
  const [lootReady, setLootReady] = useState(false);
  const [touch, setTouch] = useState(() => isTouchPlay());
  const [landscape, setLandscape] = useState(() => isLandscape());

  useEffect(() => {
    onHeartsRef.current = onHearts;
    onShieldRef.current = onShield;
    onWipeRef.current = onWipe;
    onOpenRef.current = onOpenPortal;
  });

  useEffect(() => {
    const sync = () => {
      setTouch(isTouchPlay());
      setLandscape(isLandscape());
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    const media = window.matchMedia("(orientation: landscape)");
    media.addEventListener?.("change", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      media.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!touch) return;
    document.documentElement.classList.add("maze-fullscreen");
    document.body.classList.add("maze-fullscreen");
    const root = document.documentElement;
    const ask = root.requestFullscreen?.bind(root) ?? document.body.requestFullscreen?.bind(document.body);
    ask?.().catch(() => undefined);
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (type: string) => Promise<void>;
    };
    orientation?.lock?.("landscape").catch(() => undefined);

    const blockGesture = (event: Event) => {
      event.preventDefault();
    };
    let lastTap = 0;
    const blockDoubleTap = (event: TouchEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("button, .joystick, .touch-portal, .touch-btn")) return;
      const now = Date.now();
      if (now - lastTap < 350) event.preventDefault();
      lastTap = now;
    };
    document.addEventListener("gesturestart", blockGesture, { passive: false });
    document.addEventListener("gesturechange", blockGesture, { passive: false });
    document.addEventListener("gestureend", blockGesture, { passive: false });
    document.addEventListener("touchend", blockDoubleTap, { passive: false });

    return () => {
      document.documentElement.classList.remove("maze-fullscreen");
      document.body.classList.remove("maze-fullscreen");
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
      orientation?.unlock?.();
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("gestureend", blockGesture);
      document.removeEventListener("touchend", blockDoubleTap);
    };
  }, [touch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mini = miniRef.current;
    const frame = frameRef.current;
    if (!canvas || !mini || !frame) return;
    const context = canvas.getContext("2d");
    const miniContext = mini.getContext("2d");
    if (!context || !miniContext) return;
    const ctx = context;
    const grid = map.grid;
    const pressedKeys = keysRef.current;
    const cols = grid[0]?.length ?? 0;
    const rows = grid.length;
    const viewW = VIEW_COLS * TILE;
    const viewH = VIEW_ROWS * TILE;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = viewW * dpr;
    canvas.height = viewH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    mini.width = 148;
    mini.height = 112;
    miniContext.imageSmoothingEnabled = false;

    const spawn = findChar(grid, "S");
    const portalCell = findChar(grid, "P");
    const lootCell = findChar(grid, "L");
    const player = {
      x: ((spawn?.c ?? 1) + 0.5) * TILE,
      y: ((spawn?.r ?? 1) + 0.5) * TILE,
    };
    const portal = {
      x: ((portalCell?.c ?? 1) + 0.5) * TILE,
      y: ((portalCell?.r ?? 1) + 0.5) * TILE,
    };
    const loot = lootCell
      ? { x: (lootCell.c + 0.5) * TILE, y: (lootCell.r + 0.5) * TILE, taken: false }
      : { x: portal.x, y: portal.y, taken: true };
    const facing = { x: 1, y: 0 };
    const mobs = spawnMobs(map, round, stageCount, difficulty);
    const pressure = pressureForStage(round, stageCount, difficulty);
    shieldRef.current = SHIELD_MAX;
    onShieldRef.current(SHIELD_MAX);
    let cooldown = 0;
    let flash = 0;
    let iframe = 0;
    let heat = 0;
    let dashLeft = 0;
    let dashCool = 0;
    let dashDir = { x: 1, y: 0 };
    let down = false;
    let nearNow = false;
    let lootNow = false;
    let last = performance.now();
    let frameId = 0;
    let alive = true;

    const chip = (amount: number) => {
      if (down || amount <= 0 || dashLeft > 0) return;
      let shield = shieldRef.current - amount;
      while (shield <= 0 && !down) {
        shield += SHIELD_MAX;
        const next = Math.max(0, heartsRef.current - 1);
        heartsRef.current = next;
        onHeartsRef.current(next);
        if (next <= 0) {
          down = true;
          shield = SHIELD_MAX;
          onWipeRef.current();
        }
      }
      shieldRef.current = Math.min(SHIELD_MAX, Math.max(0, shield));
      onShieldRef.current(shieldRef.current);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const steered =
        event.code === "Space" ||
        event.code.startsWith("Arrow") ||
        event.code === "KeyW" ||
        event.code === "KeyA" ||
        event.code === "KeyS" ||
        event.code === "KeyD" ||
        event.code === "KeyE" ||
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight" ||
        event.code === "KeyQ";
      if (steered) event.preventDefault();
      if (event.repeat) return;
      const keys = keysRef.current;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.delete("KeyD");
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.delete("KeyA");
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.delete("KeyS");
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.delete("KeyW");
      keys.add(event.code);
      if (event.code === "Space") attackRef.current = true;
      if (event.code === "KeyE") interactRef.current = true;
      if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyQ") {
        dashRef.current = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };
    const onBlur = () => {
      pressedKeys.clear();
      stickRef.current = { x: 0, y: 0 };
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      let ix = 0;
      let iy = 0;
      const stick = stickRef.current;
      const stickLen = Math.hypot(stick.x, stick.y);
      if (stickLen > STICK_DEADZONE) {
        ix = stick.x / stickLen;
        iy = stick.y / stickLen;
      } else {
        const keys = keysRef.current;
        if (keys.has("KeyW") || keys.has("ArrowUp")) iy -= 1;
        if (keys.has("KeyS") || keys.has("ArrowDown")) iy += 1;
        if (keys.has("KeyA") || keys.has("ArrowLeft")) ix -= 1;
        if (keys.has("KeyD") || keys.has("ArrowRight")) ix += 1;
        const input = Math.hypot(ix, iy);
        if (input > 0) {
          ix /= input;
          iy /= input;
        }
      }
      const input = Math.hypot(ix, iy);
      if (input > 0) {
        facing.x = ix;
        facing.y = iy;
      }

      dashCool = Math.max(0, dashCool - dt);
      if (dashRef.current && dashCool <= 0 && dashLeft <= 0 && !down) {
        dashRef.current = false;
        const dx = input > 0 ? ix : facing.x;
        const dy = input > 0 ? iy : facing.y;
        const len = Math.hypot(dx, dy) || 1;
        dashDir = { x: dx / len, y: dy / len };
        facing.x = dashDir.x;
        facing.y = dashDir.y;
        dashLeft = DASH_TIME;
        dashCool = DASH_COOLDOWN;
        iframe = Math.max(iframe, DASH_TIME + 0.05);
      } else {
        dashRef.current = false;
      }

      if (dashLeft > 0) {
        const step = slide(grid, player.x, player.y, PLAYER_R, dashDir.x * DASH_SPEED * dt, dashDir.y * DASH_SPEED * dt);
        player.x = step.x;
        player.y = step.y;
        dashLeft = Math.max(0, dashLeft - dt);
      } else if (input > 0) {
        const moved = slide(grid, player.x, player.y, PLAYER_R, ix * PLAYER_SPEED * dt, iy * PLAYER_SPEED * dt);
        player.x = moved.x;
        player.y = moved.y;
      }

      if (!loot.taken && Math.hypot(player.x - loot.x, player.y - loot.y) < LOOT_REACH) {
        loot.taken = true;
      }
      if (loot.taken !== lootNow) {
        lootNow = loot.taken;
        setLootReady(loot.taken);
      }

      if (tileAt(grid, player.x, player.y) === "H") {
        heat += dt;
        if (heat >= HEAT_LIMIT) {
          heat = 0;
          chip(HEAT_DAMAGE);
        }
      } else {
        heat = 0;
      }

      cooldown = Math.max(0, cooldown - dt);
      flash = Math.max(0, flash - dt);
      iframe = Math.max(0, iframe - dt);
      if ((keysRef.current.has("Space") || attackRef.current) && cooldown <= 0 && !down) {
        attackRef.current = false;
        cooldown = ATTACK_COOLDOWN;
        let aimX = facing.x;
        let aimY = facing.y;
        let nearest = Infinity;
        for (const mob of mobs) {
          if (mob.hp <= 0) continue;
          const dx = mob.x - player.x;
          const dy = mob.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist > MELEE_REACH + mob.r || dist >= nearest) continue;
          nearest = dist;
          aimX = dx / (dist || 1);
          aimY = dy / (dist || 1);
        }
        facing.x = aimX;
        facing.y = aimY;
        flash = 0.16;
        for (const mob of mobs) {
          if (mob.hp <= 0) continue;
          if (!meleeConnects(player.x, player.y, aimX, aimY, mob.x, mob.y, mob.r)) continue;
          mob.hp -= 1;
          const dx = mob.x - player.x;
          const dy = mob.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          const knocked = slide(grid, mob.x, mob.y, mob.r, (dx / dist) * 18, (dy / dist) * 18);
          mob.x = knocked.x;
          mob.y = knocked.y;
          settle(grid, mob);
        }
      }

      for (const mob of mobs) {
        if (mob.hp <= 0) continue;
        const speed = pressure.speed * (mob.tier === "big" ? 0.82 : 1);
        if (mob.kind === "cutter") {
          const nextX = slide(grid, mob.x, mob.y, mob.r, mob.vx * dt, 0);
          if (Math.abs(nextX.x - mob.x) < 0.2) mob.vx *= -1;
          else mob.x = nextX.x;
          const nextY = slide(grid, mob.x, mob.y, mob.r, 0, mob.vy * dt);
          if (Math.abs(nextY.y - mob.y) < 0.2) mob.vy *= -1;
          else mob.y = nextY.y;
        } else {
          let tx = player.x - mob.x;
          let ty = player.y - mob.y;
          if (mob.kind === "swarm" || mob.kind === "spore") {
            tx += Math.sin(mob.phase + now / 220) * 16;
            ty += Math.cos(mob.phase + now / 260) * 16;
          }
          const dist = Math.hypot(tx, ty) || 1;
          const beforeX = mob.x;
          const beforeY = mob.y;
          const moved = slide(grid, mob.x, mob.y, mob.r, (tx / dist) * speed * dt, (ty / dist) * speed * dt);
          const delta = Math.hypot(moved.x - beforeX, moved.y - beforeY);
          if (delta < 0.35) {
            mob.stuck += dt;
            if (mob.stuck > 0.35) {
              mob.detour *= -1;
              mob.stuck = 0;
            }
            const side = mob.detour;
            const nudged = slide(
              grid,
              mob.x,
              mob.y,
              mob.r,
              (-ty / dist) * side * speed * dt,
              (tx / dist) * side * speed * dt,
            );
            if (Math.hypot(nudged.x - mob.x, nudged.y - mob.y) > 0.05) {
              mob.x = nudged.x;
              mob.y = nudged.y;
            }
          } else {
            mob.stuck = 0;
            mob.x = moved.x;
            mob.y = moved.y;
          }
        }
        settle(grid, mob);
      }

      for (let i = 0; i < mobs.length; i++) {
        for (let j = i + 1; j < mobs.length; j++) {
          const a = mobs[i];
          const b = mobs[j];
          if (!a || !b || a.hp <= 0 || b.hp <= 0) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (dist <= 0 || dist >= min) continue;
          const push = (min - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const left = slide(grid, a.x, a.y, a.r, -nx * push, -ny * push);
          const right = slide(grid, b.x, b.y, b.r, nx * push, ny * push);
          a.x = left.x;
          a.y = left.y;
          b.x = right.x;
          b.y = right.y;
        }
      }
      for (const mob of mobs) {
        if (mob.hp > 0) settle(grid, mob);
      }

      if (iframe <= 0 && !down) {
        for (const mob of mobs) {
          if (mob.hp <= 0) continue;
          if (Math.hypot(mob.x - player.x, mob.y - player.y) < mob.r + PLAYER_R) {
            iframe = HURT_IFRAME;
            chip(mob.damage);
            break;
          }
        }
      }

      const tileC = Math.floor(player.x / TILE);
      const tileR = Math.floor(player.y / TILE);
      const besidePortal =
        portalCell !== null && Math.abs(tileC - portalCell.c) <= 1 && Math.abs(tileR - portalCell.r) <= 1;
      const close = besidePortal || Math.hypot(player.x - portal.x, player.y - portal.y) < PORTAL_REACH;
      if (close !== nearNow) {
        nearNow = close;
        setNear(close);
      }
      if (close && loot.taken && interactRef.current && !down) {
        interactRef.current = false;
        onOpenRef.current();
      } else if (!close) {
        interactRef.current = false;
      }

      const live = mobs.filter((mob) => mob.hp > 0);
      frame.dataset.x = player.x.toFixed(1);
      frame.dataset.y = player.y.toFixed(1);
      frame.dataset.mobs = String(live.length);
      frame.dataset.mobx = live[0] ? live[0].x.toFixed(1) : "";
      frame.dataset.shield = String(Math.round(shieldRef.current));
      frame.dataset.loot = loot.taken ? "1" : "0";
      frame.dataset.big = String(live.filter((mob) => mob.tier === "big").length);

      const focusX = Math.round(player.x);
      const focusY = Math.round(player.y);
      const camX = Math.round(Math.max(0, Math.min(Math.max(0, cols * TILE - viewW), focusX - viewW / 2)));
      const camY = Math.round(Math.max(0, Math.min(Math.max(0, rows * TILE - viewH), focusY - viewH / 2)));
      drawWorld(ctx, grid, map.id, camX, camY, viewW, viewH, portal, now);
      ctx.save();
      ctx.translate(-camX, -camY);
      if (!loot.taken) drawPickup(ctx, loot.x, loot.y, now);
      for (const mob of mobs) {
        if (mob.hp > 0) drawCreature(ctx, mob.kind, Math.round(mob.x), Math.round(mob.y), mob.phase, now, mob.scale);
      }
      let pose: HeroPose = "idle";
      if (dashLeft > 0) pose = "dash";
      else if (flash > 0 || cooldown > ATTACK_COOLDOWN * 0.35) pose = "attack";
      drawHero(
        ctx,
        focusX,
        focusY,
        facing.x,
        pose,
        dashLeft <= 0 && iframe > 0 && Math.floor(now / 80) % 2 === 0,
      );
      frame.dataset.pose = pose;
      frame.dataset.dash = dashCool.toFixed(2);
      ctx.restore();
      drawMinimap(miniContext, grid, player, portal, loot.taken ? null : loot);
      frameId = window.requestAnimationFrame(loop);
    };
    frameId = window.requestAnimationFrame(loop);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      pressedKeys.clear();
      stickRef.current = { x: 0, y: 0 };
    };
  }, [difficulty, heartsRef, map, round, shieldRef, stageCount]);

  useEffect(() => {
    frameRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [map.id]);

  const canEnter = near && lootReady;

  return (
    <section className={touch ? "maze-wrap maze-mobile" : "maze-wrap"} data-landscape={landscape ? "1" : "0"}>
      {touch && !landscape && (
        <div className="rotate-gate" role="dialog" aria-label="Rotate your phone">
          <p className="rotate-title">Turn your phone</p>
          <p className="readable">Hold it sideways. The maze plays in landscape, edge to edge.</p>
          <div className="rotate-phone" aria-hidden="true" />
        </div>
      )}
      <div
        className="maze-frame"
        ref={frameRef}
        data-round={round}
        data-map={map.id}
        data-grid={map.grid.join("|")}
        hidden={touch && !landscape}
      >
        <canvas
          ref={canvasRef}
          className="maze-canvas"
          aria-label={`${map.name}. Explore the rooms, collect the ${map.collectible}, and reach the portal.`}
        />
        <canvas ref={miniRef} className="minimap" aria-hidden="true" />
        {touch && landscape && (
          <div className="touch-controls" aria-label="Touch controls">
            <p className="touch-status" role="status">
              {canEnter
                ? "Portal ready"
                : lootReady
                  ? `Find the portal · ${map.collectible} secured`
                  : `Find the ${map.collectible}`}
            </p>
            <VirtualJoystick stickRef={stickRef} />
            <div className="touch-actions">
              <ActionButton label="Dash" tone="secondary" onTap={() => { dashRef.current = true; }} />
              <ActionButton
                label="Swing"
                tone="primary"
                hold
                onHold={(down) => {
                  if (down) {
                    keysRef.current.add("Space");
                    attackRef.current = true;
                  } else {
                    keysRef.current.delete("Space");
                  }
                }}
              />
            </div>
            {canEnter && (
              <button type="button" className="game-btn primary touch-portal" onClick={onOpenPortal}>
                Enter the portal
              </button>
            )}
          </div>
        )}
      </div>
      {!touch && (
        <>
          <p className={canEnter ? "portal-hint ready" : "portal-hint"} role="status">
            {canEnter
              ? "You have the gear and you are at the portal. Press E to enter, or use the button below."
              : near
                ? `The ${map.collectible} is still in these rooms.`
                : `Find the ${map.collectible}, then the blue portal.`}
          </p>
          <button type="button" className="game-btn primary portal-enter" onClick={onOpenPortal} disabled={!canEnter}>
            Enter the portal
          </button>
        </>
      )}
    </section>
  );
}

function VirtualJoystick({ stickRef }: { stickRef: { current: Stick } }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  function setStick(nx: number, ny: number, kx: number, ky: number) {
    stickRef.current = { x: nx, y: ny };
    setKnob({ x: kx, y: ky });
  }

  function moveTo(clientX: number, clientY: number) {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = rect.width / 2 - 12;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setStick(dx / max, dy / max, dx, dy);
  }

  function release() {
    active.current = null;
    setStick(0, 0, 0, 0);
  }

  return (
    <div
      className="joystick"
      ref={baseRef}
      aria-label="Move"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        active.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (active.current !== event.pointerId) return;
        event.preventDefault();
        moveTo(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (active.current !== event.pointerId) return;
        release();
      }}
      onPointerCancel={release}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

function ActionButton({
  label,
  tone,
  hold = false,
  onTap,
  onHold,
}: {
  label: string;
  tone: "primary" | "secondary";
  hold?: boolean;
  onTap?: () => void;
  onHold?: (down: boolean) => void;
}) {
  function press(event: ReactPointerEvent<HTMLButtonElement>, down: boolean) {
    event.preventDefault();
    if (down) {
      event.currentTarget.setPointerCapture(event.pointerId);
      if (hold) onHold?.(true);
      else onTap?.();
    } else if (hold) {
      onHold?.(false);
    }
  }

  return (
    <button
      type="button"
      className={`touch-btn ${tone}`}
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => press(event, true)}
      onPointerUp={(event) => press(event, false)}
      onPointerCancel={(event) => press(event, false)}
      onPointerLeave={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) press(event, false);
      }}
    >
      {label}
    </button>
  );
}
