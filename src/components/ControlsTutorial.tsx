import { useEffect, useState } from "react";

type ControlsTutorialProps = {
  onReady: () => void;
};

function isTouchPlay(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse), (max-width: 840px)").matches;
}

type TutorialTile = {
  keyLabel: string;
  title: string;
  detail: string;
  src: string;
  alt: string;
};

const DESKTOP_TILES: TutorialTile[] = [
  {
    keyLabel: "W A S D",
    title: "Move",
    detail: "Hold to walk through the room.",
    src: "/hero/tutorial-wasd.png",
    alt: "Scaffy above WASD keys",
  },
  {
    keyLabel: "Space",
    title: "Swing",
    detail: "Cas9 slash clears contaminants.",
    src: "/hero/tutorial-swing.png",
    alt: "Scaffy swinging Cas9 at a DNA strand",
  },
  {
    keyLabel: "Q",
    title: "Dash",
    detail: "Quick burst to escape or reposition.",
    src: "/hero/tutorial-dash.png",
    alt: "Scaffy dashing with speed lines",
  },
  {
    keyLabel: "E",
    title: "Portal",
    detail: "Enter when you have the gear and stand at the blue portal.",
    src: "/hero/tutorial-portal-walk.png",
    alt: "Scaffy walking into the blue portal",
  },
];

export function ControlsTutorial({ onReady }: ControlsTutorialProps) {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const sync = () => setTouch(isTouchPlay());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <section className="title-screen controls-tutorial">
      <p className="eyebrow">Before you enter</p>
      <h1 className="banner title-banner">How to play</h1>
      <p className="readable lede tutorial-lede">
        {touch
          ? "Turn your phone sideways. Use the stick and on-screen buttons — then grab the gear and reach the portal."
          : "Use the keys below. Grab the gear in each room, fight contaminants, then reach the blue portal."}
      </p>

      {touch ? (
        <ul className="tutorial-key-guide" aria-label="Touch controls">
          <li>
            <span className="tutorial-key-label">Move</span>
            <span className="tutorial-key-desc">Drag the left stick.</span>
          </li>
          <li>
            <span className="tutorial-key-label">Swing</span>
            <span className="tutorial-key-desc">Hold Swing to attack.</span>
          </li>
          <li>
            <span className="tutorial-key-label">Dash</span>
            <span className="tutorial-key-desc">Tap Dash to burst past mobs.</span>
          </li>
          <li>
            <span className="tutorial-key-label">Portal</span>
            <span className="tutorial-key-desc">Tap Enter the portal when you have the gear.</span>
          </li>
        </ul>
      ) : (
        <div className="tutorial-art-grid" role="list">
          {DESKTOP_TILES.map((tile) => (
            <article className="tutorial-art-card" role="listitem" key={tile.keyLabel}>
              <p className="tutorial-art-key">
                <span className="tutorial-key-label">{tile.keyLabel}</span>
                <span className="tutorial-art-title">{tile.title}</span>
              </p>
              <div className="tutorial-art-frame">
                <img src={tile.src} alt={tile.alt} width={960} height={540} loading="lazy" />
              </div>
              <p className="tutorial-art-detail">{tile.detail}</p>
            </article>
          ))}
        </div>
      )}

      <button type="button" className="game-btn primary" onClick={onReady} autoFocus>
        Got it — enter the lab
      </button>
    </section>
  );
}
