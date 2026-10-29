import type { GameMap } from "../game/types.ts";
import { ChamberBriefMap, ChamberBriefMob } from "./ChamberBriefArt.tsx";

type BriefScreenProps = {
  map: GameMap;
  index: number;
  total: number;
  onEnter: () => void;
};

function stripEmphasis(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1");
}

export function BriefScreen({ map, index, total, onEnter }: BriefScreenProps) {
  return (
    <section className="chamber-brief" data-screen="chamber-brief" aria-labelledby="chamber-brief-title">
      <header className="chamber-brief-ribbon">
        <span className="chamber-brief-ribbon-tag">Room brief</span>
        <span className="chamber-brief-ribbon-room">
          Room {index} of {total}
        </span>
      </header>

      <div className="chamber-brief-body">
        <div className="chamber-brief-showcase">
          <div className="chamber-brief-map-shell">
            <ChamberBriefMap map={map} />
            <span className="chamber-brief-map-label">{map.name}</span>
          </div>

          <div className="chamber-brief-mob-shell">
            <ChamberBriefMob map={map} />
            <div className="chamber-brief-mob-meta">
              <span className="chamber-brief-mob-kicker">Patrolling mob</span>
              <span className="chamber-brief-mob-name">{map.mobName}</span>
            </div>
          </div>
        </div>

        <div className="chamber-brief-copy">
          <h1 id="chamber-brief-title" className="chamber-brief-title">
            {map.name}
          </h1>
          <p className="chamber-brief-about">{stripEmphasis(map.about)}</p>

          <div className="chamber-brief-facts">
            <article className="chamber-brief-fact">
              <h2>Map</h2>
              <p>{stripEmphasis(map.layout)}</p>
            </article>
            <article className="chamber-brief-fact chamber-brief-fact-mob">
              <h2>Mobs</h2>
              <p>{stripEmphasis(map.encounter)}</p>
            </article>
            <article className="chamber-brief-fact chamber-brief-fact-gear">
              <h2>Collectible</h2>
              <p className="chamber-brief-gear">{map.collectible}</p>
              <p className="chamber-brief-gear-note">
                Grab the gear, then reach the blue portal. It will not open until you are carrying it.
              </p>
            </article>
          </div>

          <button type="button" className="chamber-brief-enter" onClick={onEnter} autoFocus>
            Enter {map.name}
          </button>
        </div>
      </div>
    </section>
  );
}
