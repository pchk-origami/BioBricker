import {
  agarGrid,
  cytoplasmGrid,
  enzymeGrid,
  gelGrid,
  membraneGrid,
  pcrGrid,
  plasmidGrid,
  reactorGrid,
  selectionGrid,
  transformGrid,
  widenMap,
} from "./mapcraft.ts";
import { floodReachesPortal } from "./grid.ts";
import { PROPOSAL_MAP_COPY } from "./proposal.ts";
import type { Brick, BrickColor, GameMap, MobKind } from "./types.ts";

function colorFor(id: string): BrickColor {
  const colors: BrickColor[] = ["primary", "secondary", "ink"];
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[sum % colors.length] ?? "primary";
}

function bricks(rows: { id: string; label: string }[]): Brick[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    color: colorFor(row.id),
  }));
}

function reachableFromSpawn(grid: string[][]): Set<string> {
  let sc = 1;
  let sr = 1;
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r]?.indexOf("S") ?? -1;
    if (c >= 0) {
      sc = c;
      sr = r;
    }
  }
  const seen = new Set<string>([`${sc},${sr}`]);
  const queue = [{ c: sc, r: sr }];
  const open = new Set([".", "H", "S", "P", "L"]);
  while (queue.length > 0) {
    const cur = queue.pop();
    if (!cur) break;
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const c = cur.c + dc;
      const r = cur.r + dr;
      if (!open.has(grid[r]?.[c] ?? "")) continue;
      const id = `${c},${r}`;
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push({ c, r });
    }
  }
  return seen;
}

function placeLoot(rows: string[]): string[] {
  const grid = rows.map((row) => row.split(""));
  let pc = 1;
  let pr = 1;
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r]?.indexOf("P") ?? -1;
    if (c >= 0) {
      pc = c;
      pr = r;
    }
  }
  const open = reachableFromSpawn(grid);
  let bestC = -1;
  let bestR = -1;
  let best = -1;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (grid[r]?.[c] !== ".") continue;
      if (!open.has(`${c},${r}`)) continue;
      const dist = Math.hypot(c - pc, r - pr);
      if (dist < 3 || dist > 8) continue;
      if (dist > best) {
        best = dist;
        bestC = c;
        bestR = r;
      }
    }
  }
  if (bestC < 0) {
    let nearest = Infinity;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        if (grid[r]?.[c] !== ".") continue;
        if (!open.has(`${c},${r}`)) continue;
        const dist = Math.hypot(c - pc, r - pr);
        if (dist < nearest) {
          nearest = dist;
          bestC = c;
          bestR = r;
        }
      }
    }
  }
  const row = grid[bestR];
  if (row) row[bestC] = "L";
  return grid.map((line) => line.join(""));
}

function makeMap(input: {
  id: string;
  name: string;
  about?: string;
  layout?: string;
  encounter?: string;
  hazard: string | null;
  collectible?: string;
  problem: string;
  prompt: string;
  reason: string;
  mob: MobKind;
  mobName: string;
  grid: string[];
  order: string[];
  parts: { id: string; label: string }[];
}): GameMap {
  const proposal = PROPOSAL_MAP_COPY[input.id];
  if (!proposal) {
    throw new Error(`Missing proposal copy for ${input.id}`);
  }
  return {
    id: input.id,
    name: input.name,
    about: input.about ?? proposal.description,
    layout: input.layout ?? proposal.layout,
    encounter: input.encounter ?? proposal.mobs,
    hazard: input.hazard,
    collectible: input.collectible ?? proposal.collectible,
    problem: input.problem,
    prompt: input.prompt,
    reason: input.reason,
    mob: input.mob,
    mobName: input.mobName,
    heavy: false,
    grid: placeLoot(widenMap(input.grid)),
    order: input.order,
    bricks: bricks(input.parts),
  };
}

export const REGULAR_MAPS: GameMap[] = [
  makeMap({
    id: "agar",
    name: "Agar plate",
    hazard: null,
    problem: "This colony will not make the protein until the gene is read from start to finish.",
    prompt: "A gene is read in one direction. Step 1 starts the reading. Step 2 is the protein instructions. Step 3 stops the reading.",
    reason: "A gene is read from its promoter, through the coding sequence, and stops at the terminator.",
    mob: "blob",
    mobName: "colony blobs",
    grid: agarGrid(),
    order: ["agar-promoter", "agar-coding", "agar-terminator"],
    parts: [
      { id: "agar-promoter", label: "Promoter" },
      { id: "agar-coding", label: "Coding sequence" },
      { id: "agar-terminator", label: "Terminator" },
      { id: "agar-rbs", label: "RBS before promoter" },
      { id: "agar-primer", label: "A PCR primer" },
    ],
  }),
  makeMap({
    id: "cytoplasm",
    name: "Cytoplasm",
    hazard: null,
    problem: "The cell has the gene and still makes no protein.",
    prompt: "The gene is already in the cell. First the cell makes a working copy. Then it builds the protein from that copy. Two steps.",
    reason: "The cell copies DNA into mRNA, then reads that mRNA into protein.",
    mob: "phage",
    mobName: "phages",
    grid: cytoplasmGrid(),
    order: ["cyto-transcribe", "cyto-translate"],
    parts: [
      { id: "cyto-transcribe", label: "Transcribe to mRNA" },
      { id: "cyto-translate", label: "Translate to protein" },
      { id: "cyto-direct", label: "Translate the DNA" },
      { id: "cyto-reverse", label: "Protein back to DNA" },
    ],
  }),
  makeMap({
    id: "plasmid",
    name: "Plasmid ring",
    hazard: null,
    problem: "The new gene never stays in dividing cells.",
    prompt: "Open the plasmid, close the gene inside it, then keep only the cells that received it. That is the order.",
    reason: "A plasmid is cut, the gene is sealed inside, and only cells that took it are kept.",
    mob: "cutter",
    mobName: "cutters",
    grid: plasmidGrid(),
    order: ["plasmid-cut", "plasmid-seal", "plasmid-select"],
    parts: [
      { id: "plasmid-cut", label: "Cut the plasmid" },
      { id: "plasmid-seal", label: "Seal the gene in" },
      { id: "plasmid-select", label: "Keep cells that took it" },
      { id: "plasmid-nocut", label: "Seal without a cut" },
      { id: "plasmid-early", label: "Select too early" },
    ],
  }),
  makeMap({
    id: "reactor",
    name: "Bioreactor",
    hazard: null,
    problem: "The tank is full of cells and makes no product.",
    prompt: "The cells have nothing to work with. Feed them, let the pathway run, then collect what they made.",
    reason: "Cells need sugar before the pathway can run and the product can be collected.",
    mob: "foam",
    mobName: "foam",
    grid: reactorGrid(),
    order: ["reactor-feed", "reactor-run", "reactor-collect"],
    parts: [
      { id: "reactor-feed", label: "Feed sugar" },
      { id: "reactor-run", label: "Run the pathway" },
      { id: "reactor-collect", label: "Collect the product" },
      { id: "reactor-early", label: "Collect before feeding" },
      { id: "reactor-heat", label: "Heat kills the cells" },
    ],
  }),
  makeMap({
    id: "membrane",
    name: "Membrane lock",
    hazard: null,
    problem: "The cargo is stuck outside the cell.",
    prompt: "Something has to recognize the cargo, then a door in the membrane opens, and only then can the cargo come in.",
    reason: "A receptor recognizes the cargo, a channel opens, and the cargo comes in.",
    mob: "toxin",
    mobName: "toxins",
    grid: membraneGrid(),
    order: ["membrane-receptor", "membrane-channel", "membrane-enter"],
    parts: [
      { id: "membrane-receptor", label: "Receptor sees cargo" },
      { id: "membrane-channel", label: "Channel opens" },
      { id: "membrane-enter", label: "Cargo enters" },
      { id: "membrane-any", label: "Channel for anything" },
      { id: "membrane-out", label: "Pump cargo out" },
    ],
  }),
  makeMap({
    id: "enzyme",
    name: "Enzyme line",
    hazard: null,
    problem: "Molecule A must become C, and the middle step is missing.",
    prompt: "A has to become B before B can become C. Use the two enzymes in that order.",
    reason: "Enzyme 1 turns A into B, then enzyme 2 turns B into C.",
    mob: "protease",
    mobName: "proteases",
    grid: enzymeGrid(),
    order: ["enzyme-one", "enzyme-two"],
    parts: [
      { id: "enzyme-one", label: "Enzyme 1: A to B" },
      { id: "enzyme-two", label: "Enzyme 2: B to C" },
      { id: "enzyme-early", label: "Enzyme 2 too early" },
      { id: "enzyme-back", label: "Break C into A" },
    ],
  }),
  makeMap({
    id: "selection",
    name: "Selection plate",
    hazard: null,
    problem: "The useful cells are buried in the lawn.",
    prompt: "The cells need the plasmid before the antibiotic matters. Grow them on it, then keep the colonies that are still alive.",
    reason: "Cells take the plasmid, grow on antibiotic, and only living colonies are kept.",
    mob: "swarm",
    mobName: "swarms",
    grid: selectionGrid(),
    order: ["select-give", "select-grow", "select-keep"],
    parts: [
      { id: "select-give", label: "Give them the plasmid" },
      { id: "select-grow", label: "Grow on antibiotic" },
      { id: "select-keep", label: "Keep living colonies" },
      { id: "select-early", label: "Antibiotic first" },
      { id: "select-all", label: "Keep every colony" },
    ],
  }),
  makeMap({
    id: "pcr",
    name: "PCR block",
    hazard: null,
    problem: "A copy of the gene never gets made.",
    prompt: "To copy the gene, pull the two strands apart, let the primers attach, then let the enzyme build the copy.",
    reason: "Copying starts only after the strands separate and the primers bind.",
    mob: "dimer",
    mobName: "primer dimers",
    grid: pcrGrid(),
    order: ["pcr-open", "pcr-bind", "pcr-copy"],
    parts: [
      { id: "pcr-open", label: "Separate the strands" },
      { id: "pcr-bind", label: "Primers bind" },
      { id: "pcr-copy", label: "Polymerase copies" },
      { id: "pcr-early", label: "Copy closed strands" },
      { id: "pcr-dimer", label: "Copy primer dimers" },
    ],
  }),
  makeMap({
    id: "gel",
    name: "Gel box",
    hazard: null,
    problem: "The DNA is invisible until the gel is used in order.",
    prompt: "Put the sample in the well, let the current carry it, then read the band. Three steps.",
    reason: "The sample is loaded, the current runs, and the band is read against the ladder.",
    mob: "wilt",
    mobName: "smears",
    grid: gelGrid(),
    order: ["gel-load", "gel-run", "gel-read"],
    parts: [
      { id: "gel-load", label: "Load the sample" },
      { id: "gel-run", label: "Run the current" },
      { id: "gel-read", label: "Read the band" },
      { id: "gel-early", label: "Run before loading" },
      { id: "gel-blank", label: "Read a blank gel" },
    ],
  }),
  makeMap({
    id: "transform",
    name: "Transformation bath",
    hazard: null,
    problem: "The cells never keep the new DNA.",
    prompt: "Ready the cells, give them the DNA, then let them recover. Two of the parts on the bench do not belong.",
    reason: "Competent cells receive the DNA, then they recover before anyone asks them to grow.",
    mob: "spore",
    mobName: "loose cells",
    grid: transformGrid(),
    order: ["tf-ready", "tf-dna", "tf-recover"],
    parts: [
      { id: "tf-ready", label: "Ready the cells" },
      { id: "tf-dna", label: "Give them the DNA" },
      { id: "tf-recover", label: "Let them recover" },
      { id: "tf-empty", label: "Plate with no DNA" },
      { id: "tf-early", label: "Recover before the DNA" },
    ],
  }),
];

export const ALL_MAPS: GameMap[] = REGULAR_MAPS;

const WALK = new Set([".", "H", "S", "P", "L"]);

function checkMap(map: GameMap): void {
  const grid = map.grid;
  const width = grid[0]?.length ?? 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < width; c++) {
      const edge = r === 0 || c === 0 || r === grid.length - 1 || c === width - 1;
      if (edge && WALK.has(grid[r]?.[c] ?? "")) {
        throw new Error(`${map.id} has an open border at ${c},${r}`);
      }
    }
  }
  const chars = grid.join("");
  const spawns = [...chars].filter((ch) => ch === "S").length;
  const portals = [...chars].filter((ch) => ch === "P").length;
  const loot = [...chars].filter((ch) => ch === "L").length;
  if (spawns !== 1 || portals !== 1 || loot !== 1) {
    throw new Error(`${map.id} needs one spawn, one portal, and one piece of equipment`);
  }
  if (!floodReachesPortal(grid)) {
    throw new Error(`${map.id} portal is walled off`);
  }
  const lootCell = (() => {
    for (let r = 0; r < grid.length; r++) {
      const c = grid[r]?.indexOf("L") ?? -1;
      if (c >= 0) return `${c},${r}`;
    }
    return "";
  })();
  if (!reachableFromSpawn(grid.map((row) => row.split(""))).has(lootCell)) {
    throw new Error(`${map.id} equipment is walled off`);
  }
  const ids = map.bricks.map((brick) => brick.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${map.id} repeats a brick id`);
  }
  if (map.order.some((id) => !ids.includes(id))) {
    throw new Error(`${map.id} order uses an unknown brick`);
  }
  if (map.prompt.trim().length < 24) {
    throw new Error(`${map.id} prompt is too thin`);
  }
  const near = map.bricks.length - map.order.length;
  if (near !== 2) {
    throw new Error(`${map.id} has ${near} near-misses`);
  }
}

for (const map of ALL_MAPS) {
  checkMap(map);
}
