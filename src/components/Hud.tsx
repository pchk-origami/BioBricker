import { MAX_HEARTS, SHIELD_MAX } from "../game/run.ts";

type HudProps = {
  hearts: number;
  shield: number;
  gate: number;
  gateCount: number;
  mapName: string;
};

export function Hud({ hearts, shield, gate, gateCount, mapName }: HudProps) {
  const filled = Math.max(0, Math.min(SHIELD_MAX, shield));
  return (
    <header className="hud">
      <div className="vitals">
        <div className="hearts" aria-label={`${hearts} of ${MAX_HEARTS} hearts`}>
          <span className="hud-label">HP</span>
          {Array.from({ length: MAX_HEARTS }, (_, index) => (
            <Heart key={index} filled={index < hearts} />
          ))}
        </div>
        <div className="shield" aria-label={`Health bar ${filled} of ${SHIELD_MAX}`}>
          <span className="hud-label">Bar</span>
          <div className="shield-track">
            <div className="shield-fill" style={{ width: `${filled}%` }} />
          </div>
        </div>
      </div>
      <p className="pathway">
        Room {gate} of {gateCount}
        <span className="map-name">{mapName}</span>
      </p>
    </header>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={filled ? "heart filled" : "heart empty"} aria-hidden="true">
      <path d="M12 20.6s-6.4-4.1-9-7.8C1 10.2 1.4 6.8 4.2 5.4c2.1-1 4.3-.5 5.6 1.1L12 8.8l2.2-2.3c1.3-1.6 3.5-2.1 5.6-1.1 2.8 1.4 3.2 4.8 1.2 7.4-2.6 3.7-9 7.8-9 7.8z" />
    </svg>
  );
}
