/** Map copy from pcgem26 Video Game Proposal — must match the document exactly. */
export type ProposalMapCopy = {
  layout: string;
  mobs: string;
  description: string;
  collectible: string;
};

export const PROPOSAL_MAP_COPY: Record<string, ProposalMapCopy> = {
  agar: {
    layout:
      "Round culture plate — warm agar floor, red dish walls, silver rim. Four colony pockets around a hub, with short necks between them. Streak marks on the floor.",
    mobs: "Colony blobs (orange blobs). Small ones chip the bar; a larger blob hits harder and takes more swings.",
    description:
      "An agar plate is a Petri dish with nutrients for culturing bacterial colonies. It provides a stable and solid environment for microbial growth.",
    collectible: "Inoculation loop",
  },
  cytoplasm: {
    layout:
      "Oval cell interior — teal cytosol, purple membrane wall. Chambers like mitochondria / vesicle / Golgi linked by necks around a denser center.",
    mobs: "Phages (legged virus shapes). Small ones nick the bar; a large phage tears more and lasts longer.",
    description:
      "Cytoplasm is the cellular fluid where metabolic interactions occur. It takes up 70% of the cell volume and contains structures such as mitochondria and endoplasmic reticulum, as well as dissolved content such as ions, salts and organic molecules.",
    collectible: "Micropipette",
  },
  plasmid: {
    layout:
      "Ring corridor around a void core — cyan / magenta floor, dark blue walls. Orbit rooms on the ring; spawn and portal on opposite sides.",
    mobs: "Cutters (restriction-style). Bounce along axes. Small cutters are quick; a large cutter is tougher and costs more bar.",
    description:
      "A plasmid ring is a circular DNA molecule that carries genetic materials into host cells. It is separate from the main chromosome and is found naturally in bacteria, as well as some yeasts and plants.",
    collectible: "Spin column",
  },
  reactor: {
    layout: "Tank rooms — green process fluid, steel walls. Connected vessel chambers and pipe necks.",
    mobs: "Foam (bubbly white). Small foam is a nuisance; a large foam mass soaks hits and bites more of the bar.",
    description:
      "A bioreactor is a vessel that maintains controlled conditions for growing microorganisms. It regulates temperature, pH, oxygen levels, and nutrient supply to optimize growth.",
    collectible: "Stir bar",
  },
  membrane: {
    layout:
      "Oval membrane — cool outer floor, warmer inner floor past the midline. A barred belt across the middle with three channel gaps; a vesicle pocket near the portal.",
    mobs: "Toxins. Small toxins leak damage; a large toxin has more health and hits harder.",
    description:
      "A membrane lock refers to the selective barrier mechanism of the cell membrane that regulates the transport of molecules into and out of the cell. Proteins are embedded in the membrane to serve as different functions.",
    collectible: "Syringe filter",
  },
  enzyme: {
    layout: "Bench layout — pale lab floor, wood-tone walls. Four rectangular bays linked by corridors (A→B→C style path).",
    mobs: "Proteases. Small ones nip the bar; a large protease survives several swings.",
    description:
      "An enzyme line is a setup configured to execute multi-step catalytic reactions. Synthetic biologists carefully design enzyme lines to produce complex molecules from simple raw materials, or vice versa.",
    collectible: "Enzyme tube",
  },
  selection: {
    layout:
      "Round plate like agar, but cross walls divide it into quadrants with gap doors (colony lawn / antibiotic grid feel). Pale floor, white dish walls.",
    mobs: "Swarms. Small swarms scatter damage; a large swarm is tougher.",
    description:
      "A selection plate is an agar dish containing selective agents to isolate transformed cells. This allows synthetic biologists to study only the transformed cells separately.",
    collectible: "Antibiotic vial",
  },
  pcr: {
    layout:
      "Rectangular thermal block — sandy floor, metal walls. Three wells in a row plus a small top well. **Center well is orange hot-block tiles (H)** that drain the health bar if you stand on them.",
    mobs: "Primer dimers (fast yellow pairs). Small dimers nip; a large dimer soaks hits. Clear them before crossing the hot well.",
    description:
      "A PCR block is a thermal cycler that rapidly heats and cools reaction mixtures to amplify target DNA. It can precisely control and rapidly cycle temperatures so that DNA can be separated, bound to primers, and copied over and over again.",
    collectible: "PCR rack",
  },
  gel: {
    layout:
      "Electrophoresis box — dark blue gel floor, pale plastic walls. Top loading bench, three vertical lanes, bottom readout hall, small pillars.",
    mobs: "Smears (use the wilt sprite). Small smears drift in the lanes; a large smear is slower to finish and costs more health.",
    description:
      "A gel box is the electrophoresis chamber used to separate and analyze DNA, RNA, or proteins based on size and charge. It uses an electric current to separate charged nucleic acid fragments by size across a porous matrix.",
    collectible: "Gel tray",
  },
  transform: {
    layout:
      "Four circular ice baths linked by necks — icy blue floor, cool metal walls. Spawn in the left bath, portal in the right.",
    mobs: "Loose cells (spore-like). Small ones bump the bar; a large clump takes several swings and hits hard.",
    description:
      "A transformation bath provides precise temperature shifts to induce temporary membrane pores. These pores alter the cell membrane permeability, allowing foreign DNA to enter the cell.",
    collectible: "Ice bucket",
  },
};
