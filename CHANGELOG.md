# Changelog

Guild Ledger uses a three-part version number, `MAJOR.MINOR.PATCH`:

- **MAJOR**: a complete overhaul or redesign of the game.
- **MINOR**: an update (new content, balance changes, new features). Resets PATCH to 0.
- **PATCH**: bug fixes only.

The version lives in `VERSION` near the top of the script in `src/ui.html`. It is shown at the bottom of every screen and sent with every run report, so feedback can be matched to the build that produced it.

## 1.13.0 (2026-10-08)
- Card buttons show only what happens to your health: "Fists: lose 9 health" instead of "Fists: take 9 · +9", and "Drink: heal 6" with no extra points. Contract points still count as before; they're tracked in the contract box.

## 1.12.0 (2026-10-08)
- The game now fits on a phone screen without scrolling (tested at 360x740, 375x667, 390x844 and 412x915). The header is just the emblem and a **More** button; More opens the rules, Top scores, game mode, stats and version in a panel over the game, and tapping outside closes it.
- On phones the status bar is one row of icons, cards sit four across with smaller art, and the buttons use short labels ("Fists −5", "Weapon −2", "Drink +6", "Equip"). The clerk, goal, contracts, shop and end screen are all more compact.
- On very small phones, the busiest shop (a hint, a boss notice, four relics and a dues warning at once) can still scroll a little.
- Laptop: the end screen fits 1280x720 again (Top scores starts closed on short screens).

## 1.11.0 (2026-10-08)
- New title screen before the game starts, on the notice-board art. It has the Guild Ledger logo, the **Guided start** / **Full game** switch, a **Play** button and **Top scores**. Play goes into the training floor as before (you can still skip it), and the mode picked here is the one your first run uses. It fits on laptop, desktop and phone screens, upright or sideways, without scrolling.

## 1.10.0 (2026-10-08)
- When the clerk has something new to say (a training step, a tip, or the result of a floor), the page scrolls up to show it if it's out of view. This mostly matters on phones.

## 1.9.0 (2026-10-08)
- The game always opens on the training floor in Guided start, even for returning players. Skip training goes straight to a run, and you can still switch to Full game from the top bar.

## 1.8.0 (2026-10-08)
- New **Top scores** leaderboard, with separate boards for Guided start and Full game. It sits under How to play during a run and opens on the end screen. It shows each named player's best run (top 10 by points, gold breaks ties), and runs without a name show as Anonymous. Scores come from the run reports in the Google Sheet, through a published Leaderboard tab, and can take about 5 minutes to appear. Runs from before 1.7.0 (no game mode) and impossible scores are left out. The published link is `leaderboard_csv` in `src/config.json`; without one the board is hidden.
- The name box on the end screen now says the name is shown on the public leaderboard.
- Fix: a run that ends in death now counts the points from its last floor, in the run report and on the end screen. A run that strikes out no longer counts its last floor twice on the end screen.

## 1.7.0 (2026-10-07)
- New switch at the top of the screen: **Guided start** (the default) begins with just health, weapons and potions and adds gold, contracts and relics as you go. **Full game** has contracts, gold, strikes, dues and relics from floor 1. Switching starts a new run, and asks first if you're partway through one. Run reports from Full game say "(full game)".
- On laptop and desktop screens (900px wide or more), every screen now fits without scrolling at 100% zoom, including training, contracts and the shop. The clerk, goal, health and contract sit on the left. The room, offers or shop sit on the right, and the cards shrink to fit the height. Relics show as a compact row under the room. The end-of-run log is folded away under "Log". Phones keep the single scrolling column.

## 1.6.0 (2026-10-07)
- Cards no longer show any warning text (weaker weapon, fists would kill you, too strong for your weapon, potion blocked). Each card shows just its name, its type and what each button does, such as "Fists: lose 5 health" or "Discard (no healing)".
- The end screen has one button, New run. Your run report, with your name and note if you typed them, is sent automatically when you tap it, so there is no separate Send report button.

## 1.5.0 (2026-10-07)
- Training now goes: a room, a room of big monsters you flee, then a last room. Fleeing doesn't count as a room, so training needs 2 rooms cleared, and the last room shows you can't flee twice in a row.
- New training steps explain fleeing: you can flee at the start of any room, it doesn't count as a room, and you can't flee 2 rooms in a row.
- Plainer training text: a monster's number is how much health it takes, a weapon's number is how much it blocks, and each fight wears the weapon down to the size of the last monster it beat.
- Every training highlight uses the same pulsing gold glow, including the card to pick. The room-counter step lights up the circles themselves.
- Colons in tips replaced with full stops where a full stop reads better.

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
