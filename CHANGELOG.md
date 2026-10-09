# Changelog

Guild Ledger uses a three-part version number, `MAJOR.MINOR.PATCH`:

- **MAJOR**: a complete overhaul or redesign of the game.
- **MINOR**: an update (new content, balance changes, new features). Resets PATCH to 0.
- **PATCH**: bug fixes only.

The version lives in `VERSION` near the top of the script in `src/ui.html`. It is shown at the bottom of every screen and sent with every run report, so feedback can be matched to the build that produced it.

## 1.19.2 (2026-10-09)
Sharper batch 3 art, with the large pieces redrawn.

- The table surfaces for each place were small tiles stretched to 360 px squares, which blurred and squashed them. They now show at the size they were painted, with no stretching.
- The boss and training backgrounds no longer get a sharpening pass, which left halos around edges.
- Backgrounds are saved at WebP quality 86 instead of 72, table surfaces at 90 instead of 72, and atmosphere layers at 85 instead of 70. The map medallions are kept at 240 px instead of 160 px, so they stay sharp on high-density screens.
- The boss and training backgrounds and all six table surfaces are redrawn at full size: each background is its own 1376x768 painting, and each surface is about 600-690 px, shown without stretching.
- The Crypt's fog layer is redrawn larger. The other atmosphere layers are unchanged.

## 1.19.1 (2026-10-09)
Contracts and cards sized to the screen, with no scrolling.
- **Contracts and cards are as big as the table allows, at their own shape.** The table and the contract board take all the height that's left, and each card or contract gets the largest size that fits both the width and the height, keeping its proportions. So nothing stretches (like the tall, thin cards in the old row of 4) and nothing makes the page scroll, whatever else is on screen (a boss, a long clerk line, relics, the dues reminder).
- On a laptop the contracts were stuck at 170px wide. They now grow with the board (about 210 to 230px on common laptop sizes), and the text and seals grow with them.
- Sideways phones: cards and contracts keep a readable width even on boss floors, and the clerk, contract and side gaps are tighter so the side column doesn't scroll.
- Upright phones: the clerk's portrait is hidden, the boss panel is slimmer, and the signed contract fits on one line (name, bar, points, pay), so the 2 by 2 cards get more height. With three offers, the third sits centered under the other two.
- Laptop windows between 821 and 1000px tall put How to play and Top scores behind More, and show the end screen side by side, so the side column and the end screen don't scroll.
- Short laptop windows (under 660px): the act map's crest and gaps shrink so Start stays in view. Under 580px, the shop sign, the status labels and the boss rule step aside (the icons and hold tips still say what they are).
- Checked at 16 screen sizes, from 360x640 to 1920x1080, sideways phones and 900x520 laptop windows included. On the very smallest phone (375x553), a boss floor with a long clerk line still scrolls the table a little rather than hiding buttons.

## 1.19.0 (2026-10-09)
Every place in the dungeon looks like its own place (batch 3 art).
- **Each act has its own table.** The cards sit on crypt flagstones framed in bone and skulls in act 1, damp sewer brick in copper pipes in act 2, and a banker's green felt in gold filigree in act 3. Boss floors get scorched stone bound in chains and wax seals, the training floor straw-strewn planks lashed with rope, and the contract board a cork notice board in dark oak.
- **Boss floors and training have their own backgrounds**: the Warden's gate hall, the Plague Hag's cistern, the Lich Auditor's vault of ledgers, and a guild training yard.
- **Atmosphere:** fog drifts through the Crypt, mist and drips in the Sewers, dust glints in the Vault, embers rise on boss floors, candlelight flickers in the shop and on the contract board. Off when the device asks for reduced motion.
- **Crests** for each act, boss floors and training, in the header, the room's title and over the act map.
- **The act map** uses brass medallions for survival and contract floors, a footprint trail between floors, and shows each boss beaten once you're past them. The pause menu's Map button has a map icon.
- **The shop** hangs its name on a carved sign, sets wares on shelf planks, puts ribbons on Relics and Services, marks sold wares with a wax seal, and shows your gold in a coin purse.
- **Each ending has its own picture**: a closed ledger with a laurel when you win, a gravestone beside the card that killed you, a torn license when you're struck out. A medal shows how far you got: copper in act 1, bronze in act 2, silver in act 3, gold for a win.
- **New effects** for the big moments: contract met, a strike, a boss beaten, dues paid, a raise signed, a new act starting, fleeing a room, and your old weapon breaking when you equip a new one.
- **The clerk reacts more**: impressed when you meet a contract, worried when your health is low, counting coins when you get paid, and stamping a strike.

## 1.18.1 (2026-10-09)
Bug fixes for phone layouts.
- **Cards stay 2 by 2 on upright phones.** The room used to switch between a 2 by 2 grid and a row of 4 depending on how much height was left, so a long clerk line, a boss or a dues warning could flip it mid-floor. Upright phones now always use 2 by 2.
- **Contract offers are 2 by 2 on upright phones too**, with bigger seals and text. Three offers put the third in the middle of the second row.
- When a card can be fought with your weapon or your fists, the two buttons sit side by side on upright phones, so the art keeps its height.
- On short upright screens (most phones with the browser bars showing), the boss panel, clerk and signed contract are slimmer, and the dues reminder is left to the red "due" in the Guild box (as on sideways phones and short desktop windows). If the room still runs short, the card's name sits on its art so its number stays visible, and on the very smallest screens the table scrolls a little rather than hiding the buttons.
- The Weapon box reads "7 max 12" on phones instead of wrapping "hits up to" over three lines, and can no longer run into the strikes.
- The Lantern's "Next:" line shortens with "…" instead of pushing your relics onto a second row.
- The act map fits a 375x553 screen (an iPhone SE with Safari's bars) without scrolling.
- On short desktop windows, the clerk's "Goal" line hides while a signed contract shows the same target, and on the shortest ones the clerk's portrait hides, so the contract stays in view on boss floors.
- Holding a relic or a tip on an iPhone no longer brings up the "Save image" menu.

## 1.18.0 (2026-10-09)
A cleaner screen, and a proper death.
- **Relics are just their pictures.** Hover over one (or press and hold on a phone) to see its name and what it does. Your relics take one short row in a room, and in the shop they sit next to Leave shop.
- **Hold or hover to read.** Details that don't need to sit on screen moved into tips: what a shop item does, a Wildcard's rule, what a raise asks and pays, why you can't flee, the room's "pick 3 of 4" reminder, what each status box means, the boss rule on very short sideways screens, and the game modes and training note on the title. On a phone, holding something only shows its tip; it never also taps it, so holding a contract or a card's button won't play it. Keyboard focus shows tips too.
- **Less writing elsewhere.** Gone: the contract board's explanation, "+ overkill", "fresh" under Weapon, the "rooms" label, "Next: floor N" in the shop, the mode line under the side column, "Contract: kill this many points" on the map. Dues read "22g due". The dues reminder only shows when you're short. Equip buttons just say Equip, and the Lantern line reads "Next: Owlbear 9" next to your relics. Headings, card and monster names, numbers and the clerk stay.
- **Death has its own screen.** "What happened" and "Try next time" are gone. Instead the card that killed you drops onto a blood-red tombstone panel with a claw slash, under "Slain by the Owlbear", with a short funny epitaph. Each monster has its own line, plus lines for dying bare-handed, with a weapon, on a boss floor or on floor 1, so they vary. The screen shakes and flashes red as you fall.
- **Losing your license looks different too:** a torn license with a STRIKE stamp and its own lines (unpaid dues or missed contracts). Winning keeps the PAID ledger.
- End screens put Top scores and Log side by side, so every ending fits without scrolling (checked on desktop, upright and sideways phones, with every epitaph).
- Trophy Hunter now says "monsters of 11 and up", matching the card numbers.
- Art: sheet 21 in `art/polish-art.md` (end-victory, end-died gravestone, end-revoked torn license) would replace the CSS tombstone and license when generated.

## 1.17.1 (2026-10-09)
Bug fixes from Dude's playtest of 1.17.0.
- **Shop prices are easy to read.** Price tags are bright gold numbers on a dark plaque, bigger than before. A price you can't afford turns red instead of greying out.
- **The map's gold outline marks where you are.** The next floor gets the gold frame and a "You are here" tag. The boss floor is marked in red (red frame line, red portrait ring), so it no longer looks like your position.
- **A Wildcard just says Wildcard.** The contract choice, the signed contract, the raise button and the log no longer name the Safe/Bold/Reckless tier a Wildcard is built on. Its own seal and rule show instead.
- **Choosing a contract no longer shows the first room.** You sign first, then see the room. The boss card and the dues warning move into the space it left, so nothing gets squashed.
- **Fortune Teller** used to redraw that first room before you signed, so it now works in play instead: once per floor, redraw a room before you pick any of its cards. (Sim: Fortune Teller now adds about 8 points of win rate, mid-pack among relics; it added about 1.)
- **No scrolling on any screen** at desktop (1280x800, 1366x680, 1280x720), upright phone (390x844, 390x664, 375x667, 360x640) and sideways phone (844x390, 844x340, 667x375), checked in a headless browser on the title, training, map, contract choice with tips and a boss, rooms (Wildcard, boss floor, raise, lantern), full shop, first relic shop, pause, map from pause, and end screens. To get there:
  - The map scales its medallions to the screen height, stacks tighter on upright phones, and puts the title on one line and the dues next to Start on sideways phones.
  - The clerk's floor summary moved from the shop to the side column. On phones the shop sign is gone (your gold is in the status bar) and a shop tip hides the goal line until it retires.
  - On shorter desktop windows, How to play and Top scores sit behind the More button, as on phones, and the goal box hides while a contract shows the same target.
  - The dues reminder only shows in a room when you're short, and the Guild box shows the dues in red when you are. Sideways, wares, the boss card and the contract are tighter.
  - The title screen fits sideways phones (the name stays on one line).

## 1.17.0 (2026-10-09)
Act map, pause menu, a real shop, and one loop from screen to screen: **map, floor, shop, map**.
- **Act map.** Shows the floors of the current act side by side, like Balatro's blind select: the two regular floors and the boss floor, with the boss's portrait, name and rule. Each floor shows what it asks of you (survive 4 rooms, or the Safe/Bold/Reckless contract targets and whether a Wildcard can turn up), and whether it's done (stamped PAID or STRIKE), in progress, up next or ahead. The act's guild dues are shown underneath. On phones held upright the floors stack top to bottom.
- **Every run starts on the map**, and so does training: the training floor is shown first, before act 1's floors. **Start training** or **Start floor N** takes you to the table. After a floor comes the shop, and **Leave shop** goes back to the map.
- **Pause menu.** A pause button in the top right corner (or Esc) opens a short menu: Resume, Map and Main menu. The Main menu link moved here from How to play. The map opened from here has a Back button.
- **The shop looks like a shop.** The Guild Shop is a wooden board: the clerk reads out your floor at the counter, wares hang as pinned parchment notices on shelves with brass price tags (greyed when you can't afford them), and your purse is on the sign. The next-boss card moved off the shop, since the map shows it.
- Regular floors use a contract seal or room candle as their medallion until map art exists; see `art/map-art.md` in the project files for the map and shop art prompts.

## 1.16.0 (2026-10-09)
Painted UI, so the whole screen matches the card art.
- Cards have painted frames (iron corners for monsters, steel for weapons, red glass for potions, gold filigree for elites) and their number is set in inked numerals on an enamel plate in the card's colour.
- Buttons are painted plates: brass for main actions, slate for the rest, leather on cards, and red lacquer with a skull when a fight would kill you. Disabled buttons are cracked grey stone. The Guided start / Full game switch on the title screen uses wood and brass.
- Panels (stats, shop, How to play, Top scores, end screen) have iron-bound slate frames, and the clerk's panel a gilded one. Text fields are carved slots.
- The health and contract bars are brass casings filled with red and green ink (gold once the contract is met). Strikes are wax seals that crack when you take one, and rooms on a survival floor are candles that light up.
- A picked card leaves a chalk outline, the How to play and Top scores arrows are brass, and the title and end screens get a brass flourish.
- All new art is in `assets/ui` and `assets/cards/frame-*`, made from the batch 2 sheets by `src/import_art.py`.

## 1.15.0 (2026-10-09)
A simpler screen.
- The clerk and the goal share one panel. With no tip, the clerk's line is your goal. A tip shows above the goal and goes away after your next move, so there's no "Got it" button. On phones the goal panel is hidden while your contract is on screen, since the contract shows the same numbers.
- Room progress shows in one place, "Room 2 of 4" at the top of the room. The circles on the goal line, the contract and the picked-card dots are gone.
- Cards show plain numbers: 11 to 14 instead of J, Q, K and A, with no suit symbols and no Monster/Weapon/Potion label. The art and border colour show what each card is. The weapon box says "hits up to 9", and the end-of-run log uses plain numbers too.
- Contracts say "Kill 28 points" instead of "Slay 28", and the signed contract shows "12 / 28 points" above its bar. The raise button uses the same wording.
- Strikes and dues share one Guild box, with brighter strike circles. Phones show the circles and "10g due".
- The Guided start / Full game switch is only on the title screen. During a run, How to play (or More on phones) has a **Main menu** link back to the title, which asks first if you're partway through a run.
- Health preview: point at (or press) a card's button and the health bar shows what you'd lose in flashing red, or what you'd heal in green, with "→ 8" next to your health.
- Contract offers are shorter on laptops, and on phones the room you're bidding on shows its card art, so you can see what you're bidding on.
- The training and the first shop tip were reworded to match (the three first-shop tips are now one).

## 1.14.0 (2026-10-08)
- Phones held sideways get their own layout: health, the clerk and the contract on the left, and the room on the right with the cards filling the height. Title, training, bids, rooms and the end screen fit without scrolling (tested at 667x375 to 915x412). The guild hall shop scrolls inside the right column, with the Descend button always in view.
- Bigger cards on upright phones: the room fills the rest of the screen, and when there's space the cards go 2 by 2 with much larger art. Smaller phones keep 4 across.

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
