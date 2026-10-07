# Guild Ledger

A dungeon-solitaire roguelike. Each floor you sign a contract (Safe, Bold or Reckless) promising how many monster points you'll slay, then deal with rooms of four cards: monsters hurt you, weapons soften hits, potions heal. Meet the contract for gold, buy rule-bending relics, pay the guild's dues at the end of each act, and survive nine floors.

**Play:** https://kazday007-sketch.github.io/guild-ledger/

## Layout
- `index.html`: the built game (served by GitHub Pages). Don't edit by hand.
- `src/engine.js`: the rules, as pure logic (runs in the browser and Node).
- `src/ui.html`: the game screen, tutorial and hints.
- `src/config.json`: the Google Form that receives run reports, and the published CSV the leaderboard reads (`leaderboard_csv`).
- `src/sim.js`: balance simulator (`node src/sim.js curve|relics|pairs [runs]`).
- `assets/`: card art, portraits, icons, seals, stamps, textures, backgrounds and effects as web-sized WebP.
- `src/import_art.py`: rebuilds `assets/` from the art folder (`python3 src/import_art.py /path/to/art`). It cuts icons and seals out of their slate squares and never crops card art.

Rebuild after any change with `python3 src/build.py`.

## Versions
The game uses `MAJOR.MINOR.PATCH` (overhaul or redesign / update / bug fix). Bump `VERSION` in `src/ui.html` with each change and add an entry to `CHANGELOG.md`.

## Playtest reports
At the end of each run (or when a player leaves mid-run), the game posts a short report, plus the run's data as JSON, to the Google Form in `src/config.json`. Nothing else is collected.

## Leaderboard
The Top scores board reads a CSV published from the Sheet that collects the run reports. A "Leaderboard" tab in that Sheet pulls mode, name, points, floor, outcome, gold, version and date out of each report, and only that tab is published (File → Share → Publish to web → Leaderboard tab → CSV). Put the published link in `leaderboard_csv` in `src/config.json` and rebuild. Notes and run details are never published. To remove a score, delete its row in the Form Responses tab.
