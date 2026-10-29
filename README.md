# BioBricker

A browser adventure for iGEM. An outbreak scattered the lab, and you walk the rooms to bring the equipment home. Each room is a maze, then a quiet bench where BioBricks have to sit in the right order.

## Source code

- **Repository:** https://github.com/pchk-origami/BioBricker
- **Clone:** `git clone https://github.com/pchk-origami/BioBricker.git`

## License

BioBricker is released under **[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)**.

You may **use, share, adapt, and build on** this game for **education, iGEM teams, workshops, and other teaching**, including commercial training, as long as you **give credit** (see [LICENSE](./LICENSE)).

Summary: https://creativecommons.org/licenses/by/4.0/

The lesson is synthetic biology as a sequence: a gene is read in order, a cell copies it before it builds a protein, a plasmid is cut before a gene is sealed in, and a PCR block separates strands before primers bind.

## Play

```bash
npm install
npm run dev
```

Open http://127.0.0.1:47321

- Choose 3 to 10 rooms. Each count shows a rough time. Gears you bring home stay on the lab bench on this device until all ten are collected.
- Your progress is remembered on this device. Close the tab and come back to continue the same salvage.
- On a phone, turn sideways for landscape fullscreen: left stick to move, Swing for the Cas9, Dash to burst, and an Enter the portal button when you are at the exit with the equipment.
- On a keyboard, WASD moves, Space swings, and Shift or Q dashes.
- A health bar sits in front of your hearts. Small creatures chip it. Larger ones tear more off and take more swings. An empty bar costs one heart and refills.
- Later rooms in a run are harder. The last room is the hardest, whichever map it is.
- Each room hides one piece of lab equipment. The portal stays shut until you pick it up.
- The bench has no creatures and no clock. A wrong order costs a heart. A correct order restores up to two hearts.
- At zero hearts, that room restarts with full hearts and a full bar.
- The ending bench shows what you carried home. Shorter runs leave empty slots.

Add `?seed=1` to replay the same draw for the room count you pick.

## Rooms

Agar plate, cytoplasm, plasmid ring, bioreactor, membrane lock, enzyme line, selection plate, PCR block, gel box, and transformation bath. The PCR block is the only room with a hot floor, and the briefing says so before you walk in.

## Checks

```bash
npm test
npm run lint
npm run build
```
