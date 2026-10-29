export type BrickColor = "primary" | "secondary" | "ink";

export type Brick = {
  id: string;
  label: string;
  color: BrickColor;
};

export type MobKind =
  | "blob"
  | "phage"
  | "spore"
  | "foam"
  | "cutter"
  | "dimer"
  | "toxin"
  | "protease"
  | "swarm"
  | "wilt"
  | "lysate";

export type GameMap = {
  id: string;
  name: string;
  /** Proposal "Descriptions" — shown at the top of the room brief. */
  about: string;
  /** Proposal "Map" layout copy. */
  layout: string;
  /** Proposal "Mobs" copy. */
  encounter: string;
  hazard: string | null;
  collectible: string;
  problem: string;
  prompt: string;
  reason: string;
  mob: MobKind;
  mobName: string;
  heavy: boolean;
  grid: string[];
  order: string[];
  bricks: Brick[];
};

export type Phase = "home" | "setup" | "tutorial" | "brief" | "maze" | "answer" | "wipe" | "ending";
