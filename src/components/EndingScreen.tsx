import { LAB_SIZE, labBench, labIsComplete } from "../game/lab.ts";

type EndingScreenProps = {
  /** Lasting lab inventory after this salvage was merged in. */
  lab: string[];
  /** Gears brought home on this run. */
  haul: string[];
  onAgain: () => void;
};

export function EndingScreen({ lab, haul, onAgain }: EndingScreenProps) {
  const whole = labIsComplete(lab);
  const remaining = LAB_SIZE - lab.length;
  const bench = labBench(lab);
  const newFinds = haul.filter((item) => lab.includes(item));

  return (
    <section className="title-screen">
      <p className="eyebrow">{whole ? "Lab restored" : "Bench coming back"}</p>
      <h1 className="banner title-banner">{whole ? "The lab is whole" : "Gear stays on the bench"}</h1>
      <p className="readable lede">
        {whole
          ? "Every tool is back. Short salvages and long ones all feed the same lab, and it is finally complete."
          : `This salvage brought ${haul.length} ${haul.length === 1 ? "piece" : "pieces"}. The lab now holds ${lab.length} of ${LAB_SIZE}. ${remaining} ${remaining === 1 ? "gear is" : "gears are"} still out there — keep salvaging to finish the collection.`}
      </p>
      {newFinds.length > 0 && !whole && (
        <p className="readable continue-copy">
          Kept from earlier runs and this one: {lab.length} unique {lab.length === 1 ? "tool" : "tools"} on the bench.
        </p>
      )}
      <ol className="lab-bench">
        {bench.map((item, index) => (
            <li key={item ?? `empty-${index}`} className={item ? "lab-slot filled" : "lab-slot empty"}>
            <span className="lab-index">{index + 1}</span>
            <span className="lab-name">{item ?? "Still out there"}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="game-btn primary" onClick={onAgain} autoFocus>
        {whole ? "Salvage again" : "Keep collecting"}
      </button>
    </section>
  );
}
