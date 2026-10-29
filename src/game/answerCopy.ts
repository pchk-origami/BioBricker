import type { GameMap } from "./types.ts";

/** Shown on the answer screen before the player pays for an order hint. No step order. */
const PUZZLE_LEAD: Record<string, string> = {
  agar: "Which BioBrick parts belong in the gene string? Use three, from first step to last.",
  cytoplasm: "Which two BioBrick steps turn a gene into protein? Order matters.",
  plasmid: "Which three steps keep a new gene inside dividing bacteria?",
  reactor: "Which three steps get the bioreactor from fed cells to collected product?",
  membrane: "Which three BioBrick steps move cargo from outside the cell to inside?",
  enzyme: "Which two enzyme BioBricks complete the A → B → C pathway?",
  selection: "Which three steps find bacteria that kept the plasmid on a selective plate?",
  pcr: "Which three steps copy one gene in a PCR tube?",
  gel: "Which three steps run a gel and read whether the DNA size looks right?",
  transform: "Which three gentle steps get new DNA to stay inside bacteria?",
};

export function puzzleLead(map: GameMap): string {
  return PUZZLE_LEAD[map.id] ?? "Pick the BioBricks that belong in this protocol, first step to last.";
}

/** Costs one heart to reveal — may spell out step order (Standard or Easy). */
export function orderHintText(map: GameMap): string {
  return map.prompt;
}
