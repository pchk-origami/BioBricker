import type { GameMap } from "./types.ts";
import type { Difficulty } from "./run.ts";

type Lesson = {
  problem: string;
  prompt: string;
  reason: string;
  labels: Record<string, string>;
};

/**
 * Easy mode: kid-level BioBrick stories (snap parts in order). Same brick order as Standard;
 * wording is not a paraphrase of Standard prompts.
 */
const EASY: Record<string, Lesson> = {
  agar: {
    problem: "Scaffy built a BioBrick string, but the cell still will not make the protein.",
    prompt:
      "A working gene BioBrick needs three kinds of piece: one that says GO, one that holds the recipe, and one that says STOP. Pick exactly those three blocks for the string. The other tiles are spare parts.",
    reason: "BioBricks go in one line: go, recipe, stop — like start, middle, end on a bead string.",
    labels: {
      "agar-promoter": "GO brick",
      "agar-coding": "Recipe brick",
      "agar-terminator": "STOP brick",
      "agar-rbs": "Hook brick",
      "agar-primer": "Tiny copy stick",
    },
  },
  cytoplasm: {
    problem: "The BioBrick is inside the cell, but no protein pops out.",
    prompt:
      "Think of two story cards. Card one: make a paper copy of the plan. Card two: build the protein from that copy. Pick the two BioBrick steps that match those cards.",
    reason: "First copy the plan, then build from the copy. You cannot build straight from the vault copy without the paper.",
    labels: {
      "cyto-transcribe": "Copy the plan",
      "cyto-translate": "Build the protein",
      "cyto-direct": "Build from the vault",
      "cyto-reverse": "Undo the protein",
    },
  },
  plasmid: {
    problem: "Scaffy's new BioBrick will not stay inside the bacteria when they split.",
    prompt:
      "You have a circular BioBrick ring. Snap the story in three beats: break the ring open, put the new piece inside, then only keep bacteria that still carry the ring. Pick three tiles that tell that story.",
    reason: "Open ring, insert part, keep the carriers — like loading a bracelet charm and keeping who still wears it.",
    labels: {
      "plasmid-cut": "Snip the ring",
      "plasmid-seal": "Snap gene inside",
      "plasmid-select": "Keep ring wearers",
      "plasmid-nocut": "Snap shut, no snip",
      "plasmid-early": "Sort too soon",
    },
  },
  reactor: {
    problem: "The BioBrick is in the tank, but nothing useful comes out.",
    prompt:
      "Bacteria are tiny factories. Pick three BioBrick steps: give them food, let them work, then scoop up what they made. Skip the tiles that skip food or hurt the cells.",
    reason: "Feed, work, scoop — factories need lunch before they make anything.",
    labels: {
      "reactor-feed": "Food brick",
      "reactor-run": "Work-time brick",
      "reactor-collect": "Scoop-it-up brick",
      "reactor-early": "Scoop before food",
      "reactor-heat": "Too-hot brick",
    },
  },
  membrane: {
    problem: "A BioBrick product is knocking on the cell wall and cannot get in.",
    prompt:
      "Three door BioBricks: one spots the package, one opens the door, one lets the package enter. Pick the three that match that door story.",
    reason: "See the package, open the door, let it in — like a mailbox, latch, and front hall.",
    labels: {
      "membrane-receptor": "Spot the package",
      "membrane-channel": "Open the door",
      "membrane-enter": "Package inside",
      "membrane-any": "Any door",
      "membrane-out": "Send away",
    },
  },
  enzyme: {
    problem: "BioBrick step A must turn into step C, but the middle change is missing.",
    prompt:
      "Two helper BioBricks do the job: one changes A to B, the other changes B to C. Pick the two helpers. Leave out the helper that runs backwards or runs too soon.",
    reason: "A becomes B, then B becomes C — two helpers, two hops, not one giant leap.",
    labels: {
      "enzyme-one": "A-to-B helper",
      "enzyme-two": "B-to-C helper",
      "enzyme-early": "B helper on A",
      "enzyme-back": "Break C apart",
    },
  },
  selection: {
    problem: "Scaffy mixed good bacteria with useless ones on the BioBrick plate.",
    prompt:
      "Pick three BioBrick steps to find the keepers: share the plasmid ring, grow on the plate that kills strangers, then save the dots that still live.",
    reason: "Share, grow on the picky plate, keep survivors — like a game of tag where only tagged players stay.",
    labels: {
      "select-give": "Share the ring",
      "select-grow": "Picky plate grow",
      "select-keep": "Keep live dots",
      "select-early": "Picky plate first",
      "select-all": "Keep every dot",
    },
  },
  pcr: {
    problem: "Scaffy needs more copies of one BioBrick, but the tube stays quiet.",
    prompt:
      "Copying BioBricks in a tube is three moves: unzip the ladder, clip on starter clips, then let the copier run. Pick those three moves.",
    reason: "Unzip, clip starters, copy — like opening a zipper, pinning fabric, then sewing.",
    labels: {
      "pcr-open": "Unzip the ladder",
      "pcr-bind": "Clip starters on",
      "pcr-copy": "Copier runs",
      "pcr-early": "Sew before clips",
      "pcr-dimer": "Copy clip junk",
    },
  },
  gel: {
    problem: "Scaffy cannot tell if the BioBrick is the right size.",
    prompt:
      "A gel is like a race track for DNA BioBricks. Pick three steps: load the sample lane, turn on the race, read which line it finishes on.",
    reason: "Load, race, read the line — like heat, run, check the finish photo.",
    labels: {
      "gel-load": "Load the lane",
      "gel-run": "Start the race",
      "gel-read": "Read the line",
      "gel-early": "Race empty lane",
      "gel-blank": "No sample loaded",
    },
  },
  transform: {
    problem: "New BioBrick DNA keeps bouncing off the bacteria.",
    prompt:
      "Getting a BioBrick into bacteria is three gentle steps: soften the cells, slip in the DNA, let them nap to recover. Pick those three.",
    reason: "Soften, slip DNA in, nap — like opening a door, handing a note, then resting.",
    labels: {
      "tf-ready": "Soften cells",
      "tf-dna": "Slip in DNA",
      "tf-recover": "Nap time",
      "tf-empty": "No DNA note",
      "tf-early": "Nap before note",
    },
  },
};

export function forDifficulty(map: GameMap, difficulty: Difficulty): GameMap {
  if (difficulty !== "easy") return map;
  const lesson = EASY[map.id];
  if (!lesson) return map;
  return {
    ...map,
    problem: lesson.problem,
    prompt: lesson.prompt,
    reason: lesson.reason,
    bricks: map.bricks.map((brick) => ({
      ...brick,
      label: lesson.labels[brick.id] ?? brick.label,
    })),
  };
}

export function easyLessonIds(): string[] {
  return Object.keys(EASY);
}
