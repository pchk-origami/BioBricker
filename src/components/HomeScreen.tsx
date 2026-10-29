const SOURCE_URL = "https://github.com/pchk-origami/BioBricker";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";

type HomeScreenProps = {
  onStart: () => void;
  hasSave: boolean;
  onResume: () => void;
};

export function HomeScreen({ onStart, hasSave, onResume }: HomeScreenProps) {
  return (
    <section className="home-screen">
      <img
        className="home-background"
        src="/branding/home-background.png"
        alt=""
        width={1920}
        height={1080}
        fetchPriority="high"
      />
      <header className="home-license">
        <a className="home-license-qr-link" href={SOURCE_URL} aria-label="Source code on GitHub">
          <img
            className="home-license-qr"
            src="/branding/source-qr.svg"
            alt="QR code for the BioBricker source repository on GitHub"
            width={148}
            height={148}
          />
        </a>
        <div className="home-license-copy">
          <p className="home-license-kicker">Creative Commons</p>
          <p className="home-license-title">CC BY 4.0</p>
          <p>
            This game and its source code are licensed under Creative Commons Attribution 4.0 International. The
            repository is public. Anyone can use and adapt the game for education as long as they give credit.
          </p>
          <p className="home-license-links">
            <a href={SOURCE_URL}>Source code</a>
            <a href={LICENSE_URL}>License summary</a>
          </p>
        </div>
      </header>
      <div className="home-overlay">
        <img
          className="home-logo"
          src="/branding/biobricker-logo.png"
          alt="BioBricker"
          width={640}
          height={200}
        />
        <div className="home-actions">
          <button type="button" className="home-start-btn" onClick={onStart} autoFocus>
            Start
          </button>
          {hasSave && (
            <button type="button" className="home-continue-btn" onClick={onResume}>
              Continue salvage
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
