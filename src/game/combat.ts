export const MELEE_TOUCH = 58;
export const MELEE_REACH = 90;
export const MELEE_DOT = 0.15;

export function meleeConnects(
  px: number,
  py: number,
  fx: number,
  fy: number,
  mx: number,
  my: number,
  mr: number,
): boolean {
  const dx = mx - px;
  const dy = my - py;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist <= MELEE_TOUCH + mr) return true;
  if (dist > MELEE_REACH + mr) return false;
  return (dx * fx + dy * fy) / dist >= MELEE_DOT;
}
