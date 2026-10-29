import { useState } from "react";
import { LAB_SIZE } from "../game/lab.ts";
import { MAX_STAGES, MIN_STAGES, stageMinutes } from "../game/run.ts";
import type { Difficulty } from "../game/run.ts";
import type { SaveGame } from "../game/save.ts";

type TitleScreenProps = {
  onStart: (stages: number, difficulty: Difficulty) => void;
  onContinue: () => void;
  save: SaveGame | null;
  lab: string[];
};

function toneClass(index: number): "orange" | "blue" {
  return index % 2 === 0 ? "orange" : "blue";
}

export function TitleScreen({ onStart, onContinue, save, lab }: TitleScreenProps) {
  const [stages, setStages] = useState(MIN_STAGES);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const choices = Array.from({ length: MAX_STAGES - MIN_STAGES + 1 }, (_, index) => MIN_STAGES + index);
  const remaining = LAB_SIZE - lab.length;
  const labDone = remaining <= 0;

  return (
    <section className="salvage-setup" aria-labelledby="salvage-setup-title">
      <div className="salvage-setup-scene" aria-hidden="true">
        <img
          className="salvage-setup-art"
          src="/branding/salvage-agar-road.png"
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
        />
        <div className="salvage-setup-scrim" />
      </div>

      <div className="salvage-setup-panel">
        <p className="salvage-setup-eyebrow">The road back</p>
        <h1 id="salvage-setup-title" className="salvage-setup-title">
          Chart your salvage
        </h1>
        <p className="salvage-setup-lede">
          The outbreak blew the lab apart. The tools are still out there—one chamber at a time, down the only path
          left.
        </p>

        <div className="salvage-setup-bench">
          <span className="salvage-setup-bench-label">Bench restored</span>
          <div className="salvage-setup-lanterns" role="img" aria-label={`${lab.length} of ${LAB_SIZE} gears on the bench`}>
            {Array.from({ length: LAB_SIZE }, (_, i) => (
              <span key={i} className={i < lab.length ? `lantern lit ${toneClass(i)}` : "lantern"} />
            ))}
          </div>
          <p className="salvage-setup-bench-copy">
            {labDone
              ? `All ${LAB_SIZE} gears are home. Run again for the story, or start fresh salvages.`
              : lab.length === 0
                ? `The bench is dark. Find all ${LAB_SIZE} gears across as many runs as you need.`
                : `${lab.length} of ${LAB_SIZE} on the bench · ${remaining} still out on the road.`}
          </p>
        </div>

        {save && (
          <div className="salvage-setup-resume">
            <p>
              Saved run · {save.difficulty === "easy" ? "Easy" : "Standard"} · Chamber {save.round + 1} of{" "}
              {save.stages} · {save.hearts} hearts
            </p>
            <button type="button" className="salvage-chip tone-blue on" onClick={onContinue} autoFocus>
              Continue journey
            </button>
          </div>
        )}

        <div className="salvage-setup-controls">
          <div className="salvage-setup-control-block">
            <p className="salvage-setup-block-label">Difficulty</p>
            <div className="stage-picker difficulty salvage-chip-grid-2" role="group" aria-label="Difficulty">
              <button
                type="button"
                className={`salvage-chip tone-orange ${difficulty === "easy" ? "on" : ""}`}
                aria-pressed={difficulty === "easy"}
                onClick={() => setDifficulty("easy")}
              >
                <span className="stage-count">Easy</span>
                <span className="stage-unit">BioBrick stories</span>
              </button>
              <button
                type="button"
                className={`salvage-chip tone-blue ${difficulty === "standard" ? "on" : ""}`}
                aria-pressed={difficulty === "standard"}
                onClick={() => setDifficulty("standard")}
              >
                <span className="stage-count">Standard</span>
                <span className="stage-unit">Lab wording</span>
              </button>
            </div>
          </div>

          <div className="salvage-setup-control-block">
            <p className="salvage-setup-block-label">Mile markers · chambers this run</p>
            <div className="stage-picker salvage-mile-picker" role="group" aria-label="How many rooms">
              {choices.map((count, index) => (
                <button
                  key={count}
                  type="button"
                  className={`salvage-chip ${toneClass(index)} ${count === stages ? "on" : ""}`}
                  aria-pressed={count === stages}
                  onClick={() => setStages(count)}
                >
                  <span className="stage-count">{count}</span>
                  <span className="stage-time">~{stageMinutes(count)}m</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="salvage-chip tone-orange on salvage-setup-start"
          onClick={() => onStart(stages, difficulty)}
        >
          {save ? "Walk a new road" : "Walk the road"}
        </button>
        <p className="salvage-setup-footnote">Next: a short picture guide for movement, dash, and swing.</p>
      </div>
    </section>
  );
}
