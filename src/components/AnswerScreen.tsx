import { useEffect, useRef, useState } from "react";
import { orderHintText, puzzleLead } from "../game/answerCopy.ts";
import { isOrderedSolution } from "../game/run.ts";
import type { Brick as BrickData, GameMap } from "../game/types.ts";
import { Brick, BrickFace } from "./Brick.tsx";
import { useDrag } from "./useDrag.ts";

type AnswerScreenProps = {
  map: GameMap;
  nextName: string | null;
  hearts: number;
  onMiss: () => boolean;
  onClear: () => number;
  onProceed: () => void;
  onPurchaseHint: () => boolean;
};

export function AnswerScreen({
  map,
  nextName,
  hearts,
  onMiss,
  onClear,
  onProceed,
  onPurchaseHint,
}: AnswerScreenProps) {
  const [slots, setSlots] = useState<(string | null)[]>(() => map.order.map(() => null));
  const [held, setHeld] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"ok" | "bad" | null>(null);
  const [healed, setHealed] = useState(0);
  const [orderHintOpen, setOrderHintOpen] = useState(false);
  const [tray] = useState(() => shuffleIds(map.bricks.map((brick) => brick.id)));
  const headRef = useRef<HTMLElement>(null);
  const locked = verdict === "ok";

  useEffect(() => {
    headRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [map.id]);

  useEffect(() => {
    setOrderHintOpen(false);
    setSlots(map.order.map(() => null));
    setVerdict(null);
    setHeld(null);
  }, [map.id]);

  const { bind, ghost } = useDrag(!locked, (brickId, slot) => {
    if (slot >= map.order.length) return;
    place(slot, brickId);
  });

  function brickById(id: string): BrickData | undefined {
    return map.bricks.find((brick) => brick.id === id);
  }

  function place(slot: number, brickId: string) {
    if (locked) return;
    setVerdict(null);
    setSlots((current) => {
      const next = current.map((id) => (id === brickId ? null : id));
      next[slot] = brickId;
      return next;
    });
    setHeld(null);
  }

  function clearSlot(slot: number) {
    if (locked) return;
    setVerdict(null);
    setSlots((current) => current.map((id, index) => (index === slot ? null : id)));
  }

  function openOrderHint() {
    if (locked || orderHintOpen) return;
    if (!onPurchaseHint()) return;
    setOrderHintOpen(true);
  }

  function submit() {
    if (slots.some((id) => id === null)) return;
    if (isOrderedSolution(map.order, slots)) {
      setHealed(onClear());
      setVerdict("ok");
      setHeld(null);
      return;
    }
    const wiped = onMiss();
    setSlots(map.order.map(() => null));
    setHeld(null);
    setVerdict(wiped ? null : "bad");
  }

  const ghostBrick = ghost ? brickById(ghost.id) : undefined;
  const seated = new Set(slots.filter((id): id is string => id !== null));
  const ready = slots.every((id) => id !== null);

  return (
    <section className="answer" ref={headRef}>
      <h2 className="banner problem">{map.problem}</h2>
      <p className="prompt">{puzzleLead(map)}</p>
      <div className="order-hint-panel">
        {orderHintOpen ? (
          <p className="order-hint-text" role="status">
            <span className="order-hint-label">Order hint</span>
            {orderHintText(map)}
          </p>
        ) : (
          <button
            type="button"
            className="game-btn order-hint-btn"
            onClick={openOrderHint}
            disabled={locked || hearts <= 0}
          >
            Open order hint (−1 heart)
          </button>
        )}
        {!orderHintOpen && hearts <= 0 && !locked && (
          <p className="readable hint order-hint-warn">No hearts left to buy a hint.</p>
        )}
      </div>
      <p className="readable hint">Tap a card, then tap a step. Step 1 goes first.</p>
      <div className="verdict-row" aria-live="polite">
        {verdict === "bad" && <Mark kind="bad" label="Wrong order" />}
        {verdict === "ok" &&
          map.order.map((id) => <Mark key={id} kind="ok" label="Correct step" />)}
      </div>
      <p className="section-label">Parts</p>
      <div className="tray">
        {tray.map((id) => {
          const brick = brickById(id);
          if (!brick || seated.has(id)) return null;
          return (
            <Brick
              key={id}
              brick={brick}
              held={held === id}
              locked={locked}
              handlers={bind(id)}
              onTap={() => {
                if (locked) return;
                setVerdict(null);
                setHeld((current) => (current === id ? null : id));
              }}
            />
          );
        })}
      </div>
      <p className="section-label">Order, from first to last</p>
      <div className="slots">
        {slots.map((id, index) => {
          const brick = id ? brickById(id) : undefined;
          if (!brick) {
            return (
              <button
                key={index}
                type="button"
                className="slot empty"
                data-slot={index}
                onClick={() => {
                  if (held) place(index, held);
                }}
              >
                <span className="slot-index">Step {index + 1}</span>
                <span className="slot-name">{stepLabel(index, slots.length)}</span>
              </button>
            );
          }
          return (
            <button
              key={index}
              type="button"
              className="brick slot filled"
              data-slot={index}
              data-color={brick.color}
              onClick={() => clearSlot(index)}
            >
              <span className="slot-index">{index + 1}</span>
              <BrickFace brick={brick} />
            </button>
          );
        })}
      </div>
      {verdict === "ok" ? (
        <p className="readable reason" role="status">
          {map.reason}{" "}
          {healed > 0
            ? `You recovered ${healed === 1 ? "1 heart" : `${healed} hearts`}.`
            : "Your hearts were already full."}
        </p>
      ) : (
        <p className="readable hint">
          {verdict === "bad"
            ? "That order is wrong. You lost a heart, and every part is back in the tray."
            : "Fill every step, then check the order. A correct order lets you enter the portal."}
        </p>
      )}
      <div className="actions">
        {verdict === "ok" ? (
          <button type="button" className="game-btn primary" onClick={onProceed} autoFocus>
            {nextName ? `Enter the portal to ${nextName}` : "Carry this back to the lab"}
          </button>
        ) : (
          <button type="button" className="game-btn primary" onClick={submit} disabled={!ready}>
            Check this order
          </button>
        )}
      </div>
      {ghost && ghostBrick && (
        <div className="brick ghost" data-color={ghostBrick.color} style={{ left: ghost.x, top: ghost.y }}>
          <BrickFace brick={ghostBrick} />
        </div>
      )}
    </section>
  );
}

function stepLabel(index: number, total: number): string {
  const names = ["Happens first", "Happens second", "Happens third", "Happens fourth"];
  if (index === total - 1) return "Happens last";
  return names[index] ?? "Happens next";
}

function Mark({ kind, label }: { kind: "ok" | "bad"; label: string }) {
  return (
    <span className={kind === "ok" ? "mark ok" : "mark bad"} role="img" aria-label={label}>
      {kind === "ok" ? (
        <svg viewBox="0 0 24 24">
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M6 6 18 18M18 6 6 18" />
        </svg>
      )}
    </span>
  );
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = next[i];
    next[i] = next[j] as string;
    next[j] = swap as string;
  }
  return next;
}
