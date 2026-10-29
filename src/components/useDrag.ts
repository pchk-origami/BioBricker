import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";
import type { BrickHandlers } from "./Brick.tsx";

export type Ghost = { id: string; x: number; y: number };

export function useDrag(
  enabled: boolean,
  onDrop: (brickId: string, slot: number) => void,
): { bind: (brickId: string) => BrickHandlers; ghost: Ghost | null } {
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<Ghost | null>(null);

  function bind(brickId: string): BrickHandlers {
    return {
      onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
        if (!enabled || event.button !== 0) return;
        drag.current = { id: brickId, x: event.clientX, y: event.clientY, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
        const current = drag.current;
        if (!current || current.id !== brickId) return;
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8) {
          current.moved = true;
          setGhost({ id: brickId, x: event.clientX, y: event.clientY });
        }
      },
      onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
        const current = drag.current;
        if (!current || current.id !== brickId) return;
        drag.current = null;
        setGhost(null);
        if (!current.moved) return;
        suppressClick.current = true;
        window.setTimeout(() => {
          suppressClick.current = false;
        }, 50);
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const slotEl = element?.closest("[data-slot]");
        const slot = Number(slotEl?.getAttribute("data-slot"));
        if (Number.isInteger(slot) && slot >= 0) onDrop(brickId, slot);
      },
      onPointerCancel() {
        drag.current = null;
        setGhost(null);
      },
      onClick(event: ReactMouseEvent<HTMLButtonElement>) {
        if (suppressClick.current) {
          suppressClick.current = false;
          event.preventDefault();
        }
      },
    };
  }

  return { bind, ghost };
}
