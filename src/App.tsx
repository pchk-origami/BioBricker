import { useEffect, useRef, useState } from "react";
import { AnswerScreen } from "./components/AnswerScreen.tsx";
import { BriefScreen } from "./components/BriefScreen.tsx";
import { EndingScreen } from "./components/EndingScreen.tsx";
import { Hud } from "./components/Hud.tsx";
import { Maze } from "./components/Maze.tsx";
import { ControlsTutorial } from "./components/ControlsTutorial.tsx";
import { HomeScreen } from "./components/HomeScreen.tsx";
import { TitleScreen } from "./components/TitleScreen.tsx";
import { forDifficulty } from "./game/easy.ts";
import { mergeLab, readLab } from "./game/lab.ts";
import { MAX_HEARTS, SHIELD_MAX, buildRun, healHearts, rngFromSeed, spendHeart } from "./game/run.ts";
import type { Difficulty } from "./game/run.ts";
import { clearSave, freshSeed, readSave, restoreRun, writeSave } from "./game/save.ts";
import type { SaveGame, SavePhase } from "./game/save.ts";
import type { GameMap, Phase } from "./game/types.ts";

function seedFromLocation(): number | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("seed");
  if (!value) return null;
  const seed = Number(value);
  return Number.isFinite(seed) ? seed : null;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("home");
  const [run, setRun] = useState<GameMap[]>([]);
  const [round, setRound] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [shield, setShield] = useState(SHIELD_MAX);
  const [collected, setCollected] = useState<string[]>([]);
  const [lab, setLab] = useState<string[]>(() => readLab());
  const [mazeKey, setMazeKey] = useState(0);
  const [seed, setSeed] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [saveInfo, setSaveInfo] = useState(() => readSave());
  const heartsRef = useRef(MAX_HEARTS);
  const shieldRef = useRef(SHIELD_MAX);
  const persistRef = useRef({
    phase,
    run,
    round,
    hearts,
    shield,
    collected,
    seed,
    difficulty,
  });

  const map = run[round];
  const shown = map ? forDifficulty(map, difficulty) : undefined;

  useEffect(() => {
    persistRef.current = { phase, run, round, hearts, shield, collected, seed, difficulty };
  }, [phase, run, round, hearts, shield, collected, seed, difficulty]);

  useEffect(() => {
    document.documentElement.classList.remove("home-fullscreen", "setup-fullscreen", "brief-fullscreen");
    if (phase === "home") document.documentElement.classList.add("home-fullscreen");
    if (phase === "setup") document.documentElement.classList.add("setup-fullscreen");
    if (phase === "brief") document.documentElement.classList.add("brief-fullscreen");
    return () => {
      document.documentElement.classList.remove("home-fullscreen", "setup-fullscreen", "brief-fullscreen");
    };
  }, [phase]);

  function syncHearts(next: number) {
    heartsRef.current = next;
    setHearts(next);
  }

  function syncShield(next: number) {
    shieldRef.current = next;
    setShield(next);
  }

  function refillShield() {
    syncShield(SHIELD_MAX);
  }

  function persist(next?: Partial<{
    phase: Phase;
    run: GameMap[];
    round: number;
    hearts: number;
    shield: number;
    collected: string[];
    seed: number;
    difficulty: Difficulty;
  }>) {
    const snap = { ...persistRef.current, ...next };
    if (
      snap.phase === "home" ||
      snap.phase === "setup" ||
      snap.phase === "tutorial" ||
      snap.phase === "ending" ||
      snap.run.length === 0
    ) {
      clearSave();
      setSaveInfo(null);
      return;
    }
    const current = snap.run[snap.round];
    if (!current) {
      clearSave();
      setSaveInfo(null);
      return;
    }
    const save: SaveGame = {
      version: 1,
      seed: snap.seed,
      stages: snap.run.length,
      round: snap.round,
      hearts: snap.hearts,
      shield: snap.shield,
      collected: snap.collected,
      phase: snap.phase as SavePhase,
      mapIds: snap.run.map((item) => item.id),
      mapName: current.name,
      savedAt: Date.now(),
      difficulty: snap.difficulty,
    };
    writeSave(save);
    setSaveInfo(save);
  }

  useEffect(() => {
    if (phase === "home" || phase === "setup" || phase === "tutorial" || phase === "ending" || run.length === 0) {
      return;
    }
    persist();
  }, [phase, round, hearts, shield, collected, run, seed, difficulty]);

  useEffect(() => {
    const flush = () => persist();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    return () => {
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  function beginRun(stages: number, nextDifficulty: Difficulty) {
    clearSave();
    setSaveInfo(null);
    const owned = readLab();
    setLab(owned);
    const fromUrl = seedFromLocation();
    const nextSeed = fromUrl ?? freshSeed();
    const next = buildRun(stages, rngFromSeed(nextSeed), owned);
    setSeed(nextSeed);
    setDifficulty(nextDifficulty);
    setRun(next);
    setRound(0);
    setCollected([]);
    syncHearts(MAX_HEARTS);
    refillShield();
    setMazeKey((key) => key + 1);
    setPhase("tutorial");
  }

  function continueRun() {
    const save = readSave();
    if (!save) {
      setSaveInfo(null);
      return;
    }
    const next = restoreRun(save);
    if (!next) {
      clearSave();
      setSaveInfo(null);
      return;
    }
    setLab(readLab());
    setSeed(save.seed);
    setDifficulty(save.difficulty);
    setRun(next);
    setRound(save.round);
    setCollected(save.collected);
    syncHearts(save.hearts);
    syncShield(save.shield);
    setMazeKey((key) => key + 1);
    setPhase(save.phase === "wipe" ? "wipe" : save.phase);
  }

  function restartGate() {
    syncHearts(MAX_HEARTS);
    refillShield();
    setMazeKey((key) => key + 1);
    setPhase("maze");
  }

  function advance() {
    const gained = map ? [...collected, map.collectible] : collected;
    if (map) setCollected(gained);
    const next = round + 1;
    if (next >= run.length) {
      clearSave();
      setSaveInfo(null);
      setLab(mergeLab(gained));
      setPhase("ending");
      return;
    }
    setRound(next);
    refillShield();
    setMazeKey((key) => key + 1);
    setPhase("brief");
    window.scrollTo(0, 0);
  }

  function miss(): boolean {
    const result = spendHeart(heartsRef.current);
    syncHearts(result.hearts);
    if (result.wipe) setPhase("wipe");
    return result.wipe;
  }

  function purchaseHint(): boolean {
    const result = spendHeart(heartsRef.current);
    syncHearts(result.hearts);
    if (result.wipe) {
      setPhase("wipe");
      return false;
    }
    return true;
  }

  function clearPortal(): number {
    const result = healHearts(heartsRef.current);
    syncHearts(result.hearts);
    return result.gained;
  }

  function backToTitle() {
    clearSave();
    setSaveInfo(null);
    setLab(readLab());
    setPhase("home");
  }

  return (
    <main
      className={
        phase === "maze"
          ? "stage play-maze"
          : phase === "home"
            ? "stage stage-home"
            : phase === "setup"
              ? "stage stage-setup"
              : phase === "brief"
                ? "stage stage-brief"
                : "stage"
      }
    >
      {phase === "home" && (
        <HomeScreen
          hasSave={saveInfo !== null}
          onStart={() => setPhase("setup")}
          onResume={continueRun}
        />
      )}
      {phase === "setup" && (
        <TitleScreen onStart={beginRun} onContinue={continueRun} save={saveInfo} lab={lab} />
      )}
      {phase === "ending" && <EndingScreen lab={lab} haul={collected} onAgain={backToTitle} />}
      {phase === "tutorial" && run.length > 0 && (
        <ControlsTutorial onReady={() => setPhase("brief")} />
      )}
      {phase === "brief" && map && (
        <BriefScreen map={map} index={round + 1} total={run.length} onEnter={() => setPhase("maze")} />
      )}
      {(phase === "maze" || phase === "answer") && shown && (
        <div className={phase === "maze" ? "play-shell" : "play-shell desk"}>
          <Hud hearts={hearts} shield={shield} gate={round + 1} gateCount={run.length} mapName={shown.name} />
          {phase === "maze" && (
            <Maze
              key={mazeKey}
              map={shown}
              round={round}
              stageCount={run.length}
              difficulty={difficulty}
              heartsRef={heartsRef}
              shieldRef={shieldRef}
              onHearts={syncHearts}
              onShield={syncShield}
              onWipe={() => setPhase("wipe")}
              onOpenPortal={() => setPhase("answer")}
            />
          )}
          {phase === "answer" && (
            <AnswerScreen
              map={shown}
              nextName={run[round + 1]?.name ?? null}
              hearts={hearts}
              onMiss={miss}
              onClear={clearPortal}
              onProceed={advance}
              onPurchaseHint={purchaseHint}
            />
          )}
        </div>
      )}
      {phase === "wipe" && (
        <div className="overlay">
          <div className="dialog" role="alertdialog" aria-labelledby="wipe-title">
            <h2 id="wipe-title">Thrown back</h2>
            <p className="readable">
              This room throws you back. Hearts are full, the health bar is full, and the equipment is still on the floor.
            </p>
            <button type="button" className="game-btn primary" onClick={restartGate} autoFocus>
              Back into the room
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
