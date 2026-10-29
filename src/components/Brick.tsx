import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";
import type { Brick as BrickData } from "../game/types.ts";

type BrickProps = {
  brick: BrickData;
  held: boolean;
  locked: boolean;
  handlers: BrickHandlers;
  onTap: () => void;
  className?: string;
};

export type BrickHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: () => void;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

export function Studs() {
  return (
    <span className="studs" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export function BrickFace({ brick }: { brick: BrickData }) {
  return (
    <>
      <Studs />
      <span className="brick-label">{brick.label}</span>
    </>
  );
}

export function Brick({ brick, held, locked, handlers, onTap, className = "" }: BrickProps) {
  return (
    <button
      type="button"
      className={["brick", held ? "held" : "", className].filter(Boolean).join(" ")}
      data-color={brick.color}
      data-brick={brick.id}
      aria-pressed={held}
      disabled={locked}
      {...handlers}
      onClick={(event) => {
        handlers.onClick(event);
        if (!event.defaultPrevented) onTap();
      }}
    >
      <BrickFace brick={brick} />
    </button>
  );
}
