# Guild Ledger

A dungeon-solitaire roguelike. Each floor you sign a contract (Safe, Bold or Reckless) promising how many monster points you'll slay, then deal with rooms of four cards: monsters hurt you, weapons soften hits, potions heal. Meet the contract for gold, buy rule-bending relics, pay the guild's dues at the end of each act, and survive nine floors.

**Play:** https://kazday007-sketch.github.io/guild-ledger/

## Layout
- `index.html`: the built game (served by GitHub Pages). Don't edit by hand.
- `src/engine.js`: the rules, as pure logic (runs in the browser and Node).
- `src/ui.html`: the game screen, tutorial and hints.
- `src/config.json`: the Google Form that receives run reports.
- `src/sim.js`: balance simulator (`node src/sim.js curve|relics|pairs [runs]`).

Rebuild after any change with `python3 src/build.py`.

## Playtest reports
At the end of each run (or when a player leaves mid-run), the game posts a short report, plus the run's data as JSON, to the Google Form in `src/config.json`. Nothing else is collected.
