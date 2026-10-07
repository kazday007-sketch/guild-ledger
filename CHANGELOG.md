# Changelog

Guild Ledger uses a three-part version number, `MAJOR.MINOR.PATCH`:

- **MAJOR**: a complete overhaul or redesign of the game.
- **MINOR**: an update (new content, balance changes, new features). Resets PATCH to 0.
- **PATCH**: bug fixes only.

The version lives in `VERSION` near the top of the script in `src/ui.html`. It is shown at the bottom of every screen and sent with every run report, so feedback can be matched to the build that produced it.

## 1.4.0 (2026-10-07)
- The contract with an extra rule (from floor 7) is now called the **Wildcard**. Its offer is labelled "Wildcard", and the clerk's tip, the signed contract and the How to play list all use the name.
- The Wildcard pays 2.5× its tier instead of 1.5×, so it always beats the next contract up: on floors 7-9 a Safe Wildcard pays 13 (Bold pays 10), a Bold Wildcard 25 (Reckless pays 20) and a Reckless Wildcard 50.
- Balance: in the simulator, guided win rates move by about a point or less between 1.5× and 3×, whether the bot takes every Wildcard it can or skips Bare Oath.

## 1.3.0 (2026-10-07)
- Training has a third room made up only of monsters, and teaches you to flee it. Training ends when you get away.
- Cleaner screen: removed the floor 1 card reminder, the hints on/off switch, the draw-pile counter, the log, the "No relics yet" line and the survival-floor room panel. The room circles now sit in the goal line, and the shop no longer repeats the floor result.
- Each room is now a framed table: "Room 2 of 4", a line saying to pick 3 of the 4 cards, dots for the cards picked so far, and a dashed "Picked" slot where each chosen card was. Cards keep their places while you pick.
- Cards are dealt: they fly face down from the draw pile to their slots and turn over. When you flee, the cards sweep back onto the pile.
- Card text only appears as a warning (fists would kill you, too strong for your weapon, a potion that won't heal, a weaker weapon).

## 1.2.0 (2026-10-07)
- All of act 1 (floors 1-3) is about staying alive: no contracts, strikes or dues. Each floor pays 6 gold. Contracts (Safe only), strikes and dues begin on floor 4, and the first dues are collected after floor 6. Bold, Reckless and raises open on floor 5, and clauses on floor 7.
- Floor 1 shows a reminder of what monsters, weapons and potions do, with a picture of each.
- The boss on floor 3 gets its own introduction, since there is no contract to sign there.
- Balance: in the simulator, guided runs now win about 32% of the time (balanced bot), up from about 19% in 1.1.0, because act 1 can no longer cost a strike.

## 1.1.0 (2026-10-07)
A much simpler start, from playtest feedback that the tutorial was confusing.
- No contracts, gold, dues or strikes in training or on floor 1. The only goal there is to stay alive, and card buttons only show the health you'd lose.
- Training opens with a tour of the screen (health, weapon, the room, the room counter), highlighting each part as the clerk explains it.
- Surviving floor 1 pays 6 gold, and the Gold box appears. The first shop sells services only and has a short shop lesson. Relics appear from the shop after floor 2, with their own introduction. Dues and Strikes appear on floor 2 with contracts.
- Contracts start on floor 2 (Safe only). Bold, Reckless and raises open on floor 3, and clauses on floor 4. The clerk introduces each one.
- The clerk's dialogue is bigger, sits at the top of the screen, uses shorter sentences, and highlights what it's talking about.
- "How to play" leaves out contracts until floor 2.

## 1.0.0 (2026-10-07)
First numbered version.
- Full art pass: card art, portraits, backgrounds, icons, seals and effects.
- Easier to learn: guided training floor and in-game hints (this was tagged `v4` during development).
- Version number shown in game and included in run reports.

## Before 1.0.0
Run reports from earlier builds carry a short tag instead of a number:
- `v4`: the easier-to-learn tutorial, development only, never on the live link.
- `v3`: the first public playtest build on GitHub Pages.
