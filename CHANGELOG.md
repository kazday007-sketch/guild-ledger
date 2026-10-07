# Changelog

Guild Ledger uses a three-part version number, `MAJOR.MINOR.PATCH`:

- **MAJOR**: a complete overhaul or redesign of the game.
- **MINOR**: an update (new content, balance changes, new features). Resets PATCH to 0.
- **PATCH**: bug fixes only.

The version lives in `VERSION` near the top of the script in `src/ui.html`. It is shown at the bottom of every screen and sent with every run report, so feedback can be matched to the build that produced it.

## 1.1.0 (2026-10-07)
A much simpler start, from playtest feedback that the tutorial was confusing.
- No contracts in training or on floor 1. The only goal there is to stay alive. Floor 1 pays a flat 5 gold for surviving it, and card buttons only show the health you'd lose.
- Contracts start on floor 2 (Safe only). Bold, Reckless and raises open on floor 3, and clauses on floor 4. The clerk introduces each one.
- The clerk's dialogue is bigger, sits at the top of the screen, and uses shorter, plainer sentences. The training floor is down to 6 short steps.
- Health and gold are the only status boxes until contracts begin. "How to play" leaves out contracts until floor 2.

## 1.0.0 (2026-10-07)
First numbered version.
- Full art pass: card art, portraits, backgrounds, icons, seals and effects.
- Easier to learn: guided training floor and in-game hints (this was tagged `v4` during development).
- Version number shown in game and included in run reports.

## Before 1.0.0
Run reports from earlier builds carry a short tag instead of a number:
- `v4`: the easier-to-learn tutorial, development only, never on the live link.
- `v3`: the first public playtest build on GitHub Pages.
