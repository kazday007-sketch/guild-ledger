# Changelog

Scapegrace (called Guild Ledger before 1.20.0) uses a three-part version number, `MAJOR.MINOR.PATCH`:

- **MAJOR**: a complete overhaul or redesign of the game.
- **MINOR**: an update (new content, balance changes, new features). Resets PATCH to 0.
- **PATCH**: bug fixes only.

The version lives in `VERSION` near the top of the script in `src/ui.html`. It is shown at the bottom of every screen and sent with every run report, so feedback can be matched to the build that produced it.

## 2.18.0 (2026-10-16)
Engraved screen icons and crests.

- Every screen icon is redrawn in the deck's engraved style: health, gold, strikes, weapon, draw pile, flee, lock, interest, overkill, raise, the relic slot ring, pause and the three shop services.
- The header goat and the act crests (crypt, sewers, vault, boss, training, victory crown) are now engraved medallions.

## 2.17.0 (2026-10-16)
Azazel in engraved portraits.

- All eight of Azazel's moods are redrawn as small engraved cards to match the deck: neutral, pleased, impressed, worried, disapproving, counting coins, stamping and away.
- Tutorial tips now name the new button icons (the gauntlet, the fist, the potion).

## 2.16.0 (2026-10-16)
New engraved play icons.

- New, clearer icons for every play button: a red potion for Drink, a gauntlet gripping a sword for Equip (with the weapon's value), a sword and a fist. Equip and Drink now use the icon even when they are the only choice.

## 2.15.0 (2026-10-16)
Taller play buttons.

- The buttons under each card are 1.5 times taller with bigger icons, so they are easier to read and tap. When a card has three choices, each icon sits above its number.

## 2.14.1 (2026-10-16)
Fix: floating cards kept shaving their paper edge.

- On phones and smaller screens the card box clipped the face as it floated, so the white paper edge grew and shrank and the corners got cut. The face is no longer clipped, and it moves as one drawn layer so the double border lines stay fixed to the paper.

## 2.14.0 (2026-10-16)
Icon hit buttons and steadier floating cards.

- The Weapon and Fists buttons are now an engraved sword or fist with the damage (−3), and Drink shows a heart with the healing, when a card has more than one way to play it. Twin Blades shows each blade's value beside the sword. On sideways phones the number sits on the icon so nothing gets cut off.
- Cards now float as a whole piece, so the printed borders stay put instead of shifting against the art. The card back rides along when a card flips.

## 2.13.0 (2026-10-16)
Engraved boss tables and contract desk.

- Boss rooms now sit on a darker engraved table for their act: chained crypt, slimed sewers or the gold-strewn vault.
- Choosing a contract now happens on an engraved writing desk with quill, candle and wax seals.

## 2.12.0 (2026-10-16)
Engraved tables for the three acts.

- Each act's room now sits on its own hand-engraved table to match the deck: crypt flagstones (act 1), sewer brick (act 2) and vault stone (act 3).
- Boss rooms keep their old surface for now.

## 2.11.0 (2026-10-16)
Engraved relics, and cards that keep their size.
- **Every relic has an engraved picture** in the same hand-inked style as the cards, all 58 of them. 32 relics only had a coloured symbol before.
- **Cards always stay the same size.** A card no longer shrinks when it offers two choices (weapon or fists): the choices share one row under the card. The slot on the table is now shaped like the card, so cards are bigger.
- **The back turns into the face at exactly the same size.** While a card flips, its back covers just the printed card, and the name and buttons appear once it lands.
- **Cleaner paper.** The card edges no longer look lighter or patched, and the card back has lost the strip of wooden table around it.

## 2.10.1 (2026-10-16)
- **Cards are trimmed evenly.** Many cards showed a strip of the table along the top or bottom edge. Every card now has the same paper margin around its printed border.

## 2.10.0 (2026-10-16)
A new deck: old hand-drawn playing cards.
- **Every card is now a vintage 1800s-style playing card**, drawn by hand on aged paper, with the pips worked into each picture and matching corner numbers at top and bottom.
- **New monsters to match.** Spades are the dead: Rats, Bone Spider, Zombie, Ghost, Skeleton Warrior, Ghoul, Wraith, Mummy, Grave Knight, Headless Page, Bone Bride, Barrow King and Death. Clubs are the beasts: Goblin Scavenger, Cave Bat, Kobold Trapper, Dire Wolf, Hobgoblin, Giant Centipede, Bugbear, Owlbear, Minotaur, Goblin Jester, Harpy Queen, Orc Warlord and Manticore. The elites are the Hydra (15) and the Chimera (17).
- **Weapons** (diamonds) run from a kitchen knife up to a runed greatsword, and **potions** (hearts) each come in their own bottle.
- **A new card back**: an indigo and red lattice with a goat's head in the middle.
- Bosses keep their own pictures for now.

## 2.9.0 (2026-10-16)
Cards that turn like real cards, and a handmade look.
- **A real flip.** Cards fly out of the pile face down, lift, and turn over on their long edge with a little perspective: you see the back until the card is edge-on, then the face, and it settles with a small overshoot. Face down they sit a shade darker. Before, the back just squashed away.
- **The Banshee's face-down cards** now turn over the same way when they are revealed.
- **Placed by hand.** Each card on the table sits at its own slight angle and a little off line, and its number is stamped a touch crooked. A card keeps its angle every time.
- **Paper grain** over the card pictures and, very faintly, the whole screen, so nothing looks machine-flat.
- **Everything moves a little slower** (about a quarter), so you notice it: deals, flips, card exits, relic picks, the payout and the big moments. Hits and shakes stay quick.
- With reduced motion on, cards appear without flying or turning.

## 2.8.0 (2026-10-16)
The relic pick moment.
- **Relics arrive like cards:** the three relics deal in edge-on and turn to face you, one after another, with a soft deal and flip.
- **Rare and boss relics catch the light:** a glint sweeps across them as they turn, with a quiet chime (lower and warmer for boss relics).
- **They float** gently while you decide.
- **Taking one feels like taking it:** the relic you pick lifts and glows, the others fall away, and its picture flies into its slot in your belt, which lights up as it lands.
- With reduced motion on, the pick works as before, without the movement.

## 2.7.0 (2026-10-16)
Tutorial fixes from the second tutorial review (design/tutorial-review-2-6.md):
- **No cliff after floor 1.** If the tutorial's safe floor saved you, the goat patches you up to half health before floor 2, and a tip says the dungeon can kill you from here on.
- **Contracts from floor 2 in Guided start** (floor 4 before), so the game's own twist shows up early. They stay Safe only until floor 5, and the first dues still come after floor 6. Simulator, 2,000 Guided runs per bot: win rates went from 12.4 / 15.5 / 15.5% to 12.6 / 17.2 / 16.4% (cautious / balanced / greedy), with no new wall on floors 2-3.
- **Relic tips.** A first-time tip when a relic gives a card a new button, and one when a relic pick offers a relic with a catch.
- **Shorter tips.** Gold, Relics, Contract met, Boss floor and Endless are down to one idea each.
- `sim.js guided` runs the difficulty curve in Guided start.

## 2.6.0 (2026-10-15)
Small touches.
- **Boss screens wait for you.** The boss intro stays up until you tap it (or press Enter, Space or Esc), instead of fading by itself.
- **Big hits land harder:** striking a monster of 10 or more holds the moment for a split second before the card gives way.
- **The art breathes:** the pictures on the table's cards drift very slightly, each at its own pace.
- **Dust** hangs and drifts in the air of the dungeon.
- **Low health closes in:** below about a third of your health, the screen's edges darken to red, deeper the lower you go. Below a quarter they pulse with a slow heartbeat you can hear.
- All of it is off for players whose device asks for reduced motion (the heartbeat sound stays).
- **Music with a bit more drive:** each dungeon loop now has a low plucked bass walking the chords and a soft, muffled drum keeping a slow pulse, with a few more bell notes and a touch more brightness. The boss loop's heartbeat gets a pulsing bass under it; the hall gets a gentle bass line only.

## 2.5.0 (2026-10-15)
The relic rework, from design/relics-plan-1-47.md and design/engine-review-1-47.md. Relics now change how you play instead of adding points, some grow during a run, some have a real cost, and you can see each one work.
- **22 new relics.** Rule-benders: Stash Pouch (set a card aside for a later room), Spyglass (see the next 3 cards), Bait, Blood Price (pay 1 health to swap a card), Greedy Hands (take all 4 cards of a room), Alchemy Kit (equip a potion as a weapon), Twin Blades (hold two weapons and pick one per fight), Cleave, Cursed Contract, Hourglass (undo a card, twice per floor), Mimic's Tongue (drink little monsters, fight potions), Necromancer's Bell. Growing: Notched Hilt, Hardened Knuckles, Compound Purse, Miser's Purse, Scar Tissue, Trophy Belt. With a cost: Glass Blade, Iron Ball, Pact of Hunger. For fleeing: Escape Artist.
- **17 relics retired**, the "+N points" ones and the dead weight: Blade Oil, Quickdraw, Brawler, Ambush, Trophy Hunter, Down Payment, Crown of Thorns, Bone Crown, Haggler, Quartermaster, Thick Hide, Herbalist, Tithe Box, Scout, Lantern, Loaded Dice, Bounty Ledger. A saved run holding one simply loses it.
- **Rarity matches power**, measured in the simulator: Grindstone, Tip Jar, Fortune Teller, Oathkeeper and Alchemist are rare now; Second Heart, Warden's Keys and Rulebreaker are common.
- **You see relics work.** When a relic does something, its icon pulses with a soft chime and a small number floats up from it. Growing relics show their count on the icon.
- **Raise:** only War Drum gives one now, and a met raised contract pays half its pay again.
- Contract targets are about 4% lower to make up for the retired point relics. Simulator wins: 12 / 15 / 16% (cautious / balanced / greedy), about where they were.

## 2.4.1 (2026-10-15)
Bug fix.
- **No more "the The Warden":** dying to a boss now reads "Slain by the Warden", and the death lines no longer double up the "The" (or say "a The Warden"). Dying to the Broodmother now gets the Broodmother's own line, and the boss who killed you no longer also "watched the whole thing".

## 2.4.0 (2026-10-15)
Music and ambience.
- **A quiet loop for each place:** a low drone, a slow pad and a few far-off bells, with the place's own sounds underneath. The crypt has wind, the sewers have running water and drips, the vault has a deep hum and distant chains, and the guild hall (title, map, payout and shop) is warmer, with candles crackling.
- **Boss floors** get their own tenser loop with a slow heartbeat under it.
- The music fades from one place to the next, and stops when you die so the bell tolls alone.
- **Music has its own slider** in the pause menu next to Sounds. **M** and the title's Sound switch now mute everything, and your choice is kept.
- Music goes quiet while the game's tab is in the background.
- All loops are made by `src/synth_music.py`, about 380 KB each.

## 2.3.0 (2026-10-15)
Big moments: the beats a run is remembered by now land properly.
- **Bosses walk in.** A boss floor opens on the boss: its picture comes out of the dark, its name and rule fill the screen, a bell tolls and the screen shudders. Tap (or any key) to go on, or it fades by itself.
- **Boss cards** pulse red with a low bell as they're dealt onto the table.
- **Bosses fall.** The killing blow freezes the moment for a beat, a white flash bursts from the card, the table shakes, and the card blows apart. The payout then shows the beaten boss's picture with "beaten" across the top.
- **Contract met** mid-floor: the contract glows gold and gets its stamp, with a bell.
- **Strikes land hard:** the strike stamp shakes the screen and flashes its edges red. A met contract's payout glows gold as its stamp comes down.
- **The end of a run.** A win turns slow golden rays behind the screen while gold drifts down. A death drains the colour from the dungeon. Either way the medal spins in last.

## 2.2.0 (2026-10-15)
Quieter, darker sounds that fit a dungeon. Dude found 2.1.0 too sharp and game-like.
- **Every sound remade** low and soft-edged, with the same small stone-room echo behind each one, so they sound like they happen in the dungeon rather than on a screen.
- Blades swing and bite with a dull clink instead of a bright ring, fists and hits are felt more than heard, coins drop into a purse, cards slide like old parchment, and the bell for strikes and deaths sounds far below.
- The bright menu and fanfare sounds from the free pack are gone. Menus open like a heavy wooden lid, a relic hums awake, a met contract rings two low bells, and a win climbs three bells over a low drone.
- Everything plays a little quieter by default.

## 2.1.0 (2026-10-15)
The game has sound.
- **Cards and combat:** cards swish out of the pile and snap over, a weapon slashes and rings, fists thump, every hit you take lands with a low thud (heavier for bigger hits), a weapon being drawn rings out, a potion pops and gulps, and a broken weapon shatters.
- **The guild:** coins clink when you're paid or spend, a contract is stamped when you sign or raise it, a met contract and a beaten boss get a short fanfare, and a strike tolls a bell.
- **Everything else:** buttons click softly, menus open and close with a wooden knock, a relic pick chimes, fleeing whooshes, a win plays a fanfare and a death tolls the bell.
- **Volume** is a slider in the pause menu, **M** mutes and unmutes anywhere, and the title screen has a Sound on/off switch. Your setting is kept in your browser.
- Sounds still play with reduced motion turned on. The card, combat and coin sounds were made for the game (`src/synth_sfx.py`); the menu and fanfare sounds come from the free uisfx pack (public domain).

## 2.0.0 (2026-10-15)
The start of the animation overhaul: the game now moves like one piece instead of jumping between states.
- **Screens slide in.** Each new screen (contracts, the floor, the relic pick, the shop, the map) rises into place part by part, contract offers and relic choices deal in one after another, and the background dips between places. Pause and deck menus fade and lift in.
- **Played cards go somewhere.** An equipped weapon flies into your weapon slot (which pops as it lands), a potion flies into your health, and a monster recoils from your blow and drops off the table.
- **Floating numbers.** Damage floats up red off your health, healing green, gold changes gold, and contract points off the contract.
- **Hits land.** Taking damage shakes your health box and flashes the screen's edges red, harder for bigger hits; hits of 5 or more jolt the table. Lost health leaves a pale chip on the bar that drains a moment later.
- **Numbers count.** Health, gold and contract points count to their new value, and the health and contract bars slide instead of snapping.
- On a mouse, the card you point at lifts off the table.
- All of it is short, never blocks a click, and is switched off for players whose device asks for reduced motion.

## 1.47.0 (2026-10-15)
Relic fixes from the run reports. Dude's Endless run reached floor 19 with 91 flees (30 on one floor), and Executioner was in every deep run.
- **Warden's Keys** heal 2 when you flee, but no longer on back-to-back flees. With the Smoke Bomb they gave endless healing.
- **Smoke Bomb** lets you flee up to three rooms in a row, instead of any number.
- **Executioner:** weapon kills of monsters 12 and up count half again as many points (was: 10 and up count double).
- Simulator (2,000 balanced runs, starting with the relic on top of the usual picks): Executioner went from +27 points of win rate to +16, Smoke Bomb from +9 to +7, and Smoke Bomb with the Keys from +13 to +11. Overall bot wins are 9 / 14 / 12% (cautious / balanced / greedy), down from 15 / 18 / 16%, because the bot leaned on Executioner.

## 1.46.0 (2026-10-15)
- **Your run is saved.** The run in play is kept in your browser after every move, so refreshing the page or closing the tab no longer loses it. The title screen shows **Continue** to pick it up where you left it, next to **New run**, which asks first and ends the saved run.
- The pause menu's Main menu no longer ends your run: it waits under Continue.
- The save is dropped as soon as the run ends (a win, a death or a strike-out), so a lost run can't be reloaded. It also keeps the dungeon's luck, so reloading deals the same cards.
- A refresh no longer sends an "abandoned" report for a run you can still continue; the report goes out when the run ends or you start a new one.

## 1.45.0 (2026-10-15)
- **Main menu button after a run.** The end screen (win, death or struck out) now has Main menu next to New run. It sends your run report, with your name and note, just like New run, then takes you back to the title screen instead of starting a new run.

## 1.44.0 (2026-10-15)
Shop reroll and a bigger skip reward.
- **Reroll the shop's relic.** The relic niche has a Reroll button that swaps the relic for another rare one. The first reroll on a visit costs 2 gold and each one after costs 2 more (2, 4, 6...). The price starts over at your next shop. A relic you already bought can be rerolled too, so you can buy a second one.
- **Skipping the relic pick pays 8 gold** instead of 4.
- Simulator (`node src/sim.js shop`, 2,000 balanced runs): a bot that rerolls weak shelves wins 18.4% against 17.8% without. A bot that skips weak picks wins 16.0% at 4 gold, 18.2% at 8 and 19.0% at 10, so at 8 skipping a weak pick is about as good as taking it, without beating the pick outright.

## 1.43.0 (2026-10-15)
Bosses and Endless.
- **15 bosses of four kinds**, five per act. Each run draws one boss per act, so runs meet different bosses, and no boss is met twice in a run.
  - **Boss fights** (Warden, Vampire Lord, Skeleton King, Dread Dragon, Cave Troll) wait in the floor's last room as a boss card. You can't flee that room, and it isn't over until the boss is dead.
  - **Stalkers** (Goblin King, Broodmother, Dungeon Horror, Forest Wyrm) hide in the pile and haunt every room until you find and kill them.
  - **Boss rules** (Jailer, Mummy, Plague Hag, Bone Golem) change the floor.
  - **Tricks** (Banshee, Lich Auditor): the Banshee turns cards face down; the Lich takes only Reckless contracts and a miss costs two strikes.
- Guided runs always meet the Warden first. Bosses without portraits use their monster card's art for now.
- **Endless:** after winning, tap Keep going. Every act after that makes every monster 1 stronger, adds 3 more elites, raises targets and dues, and brings a boss you haven't met. Top scores already rank depth first, so going deeper beats stopping at the win.
- Simulator (2,000 runs a bot): wins went from 16 / 23 / 19% to 15 / 18 / 16% (cautious / balanced / greedy). In Endless, bots that win usually fall around floor 12, and the best reach floor 21 to 23.

## 1.42.0 (2026-10-15)
Top scores now rank by how deep you got: a win beats everything, then the floor you reached, then points (gold still breaks ties). Each row shows the depth first and the points after it.

## 1.41.0 (2026-10-15)
Tutorial fixes from the tutorial review (design/tutorial-review-1-40.md):
- **Weapon order.** After the Owlbear, the tip explains that your sword now only hits monsters up to 9, which is why you hit the biggest first. The dull-weapon tip says the same for players who skip the tutorial.
- **The run goal.** The tutorial recap ends with "The whole run: get through 9 floors and beat 3 bosses."
- **Contracts in two steps.** First "tap the contract to sign it", then, in the first room, what the target means and how strikes work.
- **Last tip.** The goal box has a small "Last tip" link that brings back the tip you just passed.

## 1.40.0 (2026-10-15)
The first page of the intro tells a little more of Azazel's story: the guild's gold went missing, they needed someone to blame, and they picked the nearest goat and threw him into the dungeon.

## 1.39.0 (2026-10-14)
Two voices. Tips are now told by the dungeon itself: no name, no face, and no love for the goat. It calls him "the goat" and takes the odd jab at him. Azazel only appears on a tip when he answers back, with a short line of his own (5 tips). The tutorial's first two steps and the floor tally are still Azazel's. Death and victory lines now say "the goat".

## 1.38.0 (2026-10-14)
The goat has a name: **Azazel**, after the original scapegoat.

- He introduces himself in the story intro ("I'm Azazel. Years ago, the guild threw me down here to take the blame. Rude."), and the last button reads **Follow Azazel**.
- His tips are labelled "Azazel says", the floor result is "Azazel's tally", and the end screens use his name.
- The title screen still says "the goat", since you haven't met him yet.

## 1.37.0 (2026-10-14)
- The goat now tells the story intro himself, in his own dry voice, with his crest and name over each line.

## 1.36.0 (2026-10-14)
Meet the goat: a short story intro, and a tighter tutorial.

- **Story intro** before the tutorial: three full-screen paintings with one line each. The guild threw a goat into the dungeon to take the blame; it didn't die and now works for the guild; you're the newest recruit, so follow the goat. Tap Next, or Skip.
- **One idea per tutorial step:** "Keep your health above 0. Tap Equip on the sword," then "Monsters hit as hard as their number. Tap Weapon on the Owlbear."
- **The goat says what just happened:** after your first sword fight ("Your sword blocked 7, so you only lost 2") and your first bare-handed fight ("Fists block nothing, so you took the full hit").
- **Skip tutorial** button during the guided moves.
- **Run reports say how the tutorial went:** whether the intro was watched or skipped, how many guided moves were made, whether the tutorial was skipped, whether the recap was reached, and whether the goat had to save you.

## 1.35.0 (2026-10-14)
The tutorial plays on every Guided start run and fills its gaps.

- **Every Guided start run starts with the tutorial**, not just your first. Full game and One deck runs never show it.
- **Floor 1 of a Guided start run can't kill you.** A fatal hit leaves you at 1 health, and the goat tells you how to avoid it next time. Health previews and the fatal skull reflect this. From floor 2 on, the normal rules apply.
- **A "you did it" moment:** clearing the tutorial's rooms gets a stamp and a one-line recap (use 3 cards, weapon on big monsters, drink potions, flee rooms you can't win).
- **Potions are taught:** the first time a potion turns up while you're hurt, the goat says to tap Drink, and that only 1 potion works per room.
- The `?tutorial` address switch is gone, since Guided start always plays it. Replay the tutorial in How to play still works from any mode.

## 1.34.0 (2026-10-14)
The tutorial is now the start of your first run, and you learn by playing.

- **No more training floor.** Your first Guided start run teaches you on floor 1, dealt from a set-up deck: a sword and an easy fight, then a room full of big monsters, then a potion. The rest of the floor, and the run, plays as usual.
- **Only the first two moves are guided:** equip the sword, then use it on the Owlbear. After that you choose, and the goat reacts to what happens in one line: one more card ends the room, these monsters are too big so flee, your weapon is dull so use fists.
- The "too big, flee" tip is new for everyone and shows once, the first time a room has two or more monsters your weapon can't hit.
- **Replay the tutorial** from How to play, or open the game with `?tutorial` at the end of the address.
- The "Training complete" screen is gone.

## 1.33.0 (2026-10-14)
A much simpler training floor.

- Training is **8 short steps** instead of 13. Each one tells you what to tap (Equip, Weapon, Flee room, Fists, Drink) in a sentence or two, with no tour of the screen and no extra explanation steps.
- The "Training complete" reminders are shorter.

## 1.32.0 (2026-10-11)
A bigger, clearer shop.

- The **relic has its own shelf** above the services: a wide niche with a blue rim that shows its rarity, its name and what it does, so you can tell it apart from a service at a glance and don't need to hover to read it.
- **Services** keep their own shelf of three niches, no longer squeezed into tall strips next to the relic.
- Item pictures, prices and Buy buttons are **much bigger** on every screen, the relic's picture most of all.
- Still no scrolling on desktop, laptops, and sideways or upright phones.

## 1.31.0 (2026-10-11)
No more relic families: every relic stands on its own.

- Relics no longer belong to families (Blade, Fist, Blood, Coin, Oath). Tips, the pick screen and the shop show only what a relic does and its rarity. Which relics work well together is for you to find.
- The relics that grew with their family now give a flat bonus: **Blade Oil** weapon kills +2 points, **Brass Knuckles** bare-handed fights 2 less damage, **Bloodstone** potions heal 2 more, **Tip Jar** 1 gold per cleared room, **Oathkeeper** contracts need 4 fewer points, **Lich's Ledger** every kill +1 point.
- Relics without painted art yet each get a mark and colour of their own instead of a shared family seal. Pick cards are edged by rarity.
- Simulator: 16% / 23% / 20% wins for cautious / balanced / greedy.

## 1.30.0 (2026-10-11)
Relics are now your main source of power.

- **A free relic after every floor.** After the payout you choose 1 of 3 relics, or skip for 4 gold. Boss floors offer **boss relics** instead. Meeting a Bold contract guarantees one rare in the three, and meeting a Reckless or Wildcard contract makes all three rare. Guided runs get their first pick after floor 1.
- **54 relics in three rarities** (Common, Rare, Boss), up from 26. New ones include Executioner, Masterwork, Unbreaking Edge, Iron Fist, Haymaker, Giant's Grip, Second Heart, Hag's Heart, Golden Idol, Bribe, Lich's Ledger, Oathkeeper, Rulebreaker, Bone Crown, Smoke Bomb and Warden's Keys.
- **Five families**: Blade, Fist, Blood, Coin and Oath (plus a few with no family). Some relics grow with each relic of their family you hold, for example Blade Oil, Brass Knuckles, Bloodstone, Tip Jar and Oathkeeper. Tips and the pick screen show each relic's rarity, family and how many of that family you hold.
- **You can carry 8 relics** (was 4). When the belt is full, drop one to take a new one.
- **Raise is now a relic.** You can no longer raise a contract on your own. Loaded Dice gives one raise per floor, and War Drum gives one that also counts +6 points.
- **The shop** sells one rare relic beside its services (14 gold in act 2, more later). Services cost more: Bandage 4, Cull 7, Smith 6.
- **A tougher dungeon to match**: contract targets climb faster from act 2 on (floor 9 Safe is now 96), and each new act adds three elites instead of two.
- Relics without painted art yet show their family's mark on a coloured seal.
- Simulator (`node src/sim.js curve`): the bots pick relics and buy the shop's rare. Wins come out at about 18% / 24% / 21% for cautious / balanced / greedy (was 16% / 16% / 12%), so runs end a little more often in a win now that your relics build up.

## 1.29.0 (2026-10-11)
The shop gets a new look.

- The wares now sit in **lit display niches** in a dark wooden cabinet: a dark slot with a thin brass rim and a warm glow behind each item, so the item is the first thing you see. Hovering a niche lights its rim.
- Each row stands on a **solid wooden plank** drawn to fit, replacing the stretched shelf picture whose iron brackets poked out under the wares.
- The torn paper notes, pins and tilts are gone.
- On laptops 600 to 760 pixels tall the shop now fills the board instead of leaving empty space under it, with bigger items.
- No new art: the redesign reuses the wood texture already in the game.

## 1.28.0 (2026-10-11)
A new way to play: One deck. And you can now look inside the pile.

- **One deck** is a third choice on the title screen, next to Guided start and Full game. It has all the Full game rules, but the dungeon deck isn't reshuffled at the start of every floor. Cards you deal stay gone, the card left in your last room comes with you to the next floor, and the deck is only shuffled fresh when a new act starts (or if the pile runs out first, which shuffles the dealt cards back in).
- In One deck, **Cull** removes the strongest monster still in the pile, and **Smith**'s weapon goes into the pile at a random spot, so both change cards you're actually about to meet.
- **Deck view**: tap the pile next to the room's name to see every card in the dungeon, with the ones already dealt dimmed. The shop has a **Deck** button too, to check what Cull and Smith did. Works in every mode.
- **Top scores** has a One deck tab.
- On the smallest phones the Raise button says just "Raise" so the room's name keeps its line (its tip still names the new contract).
- `node src/sim.js onedeck` runs the difficulty curve in One deck. Bots win about as often as in the Full game (15% / 15% / 11% for cautious / balanced / greedy), but die more and strike out less.

## 1.27.1 (2026-10-09)
A lone contract fills the board.

- Fixed: on upright phones a floor with only one contract showed it as a thin strip in the middle of the board. It now shows as a full-size notice.
- One or two contracts now get the whole board on every screen instead of a quarter of it, and three contracts sit in a row of three on wide screens (still 2 by 2 on upright phones and tall boards).

## 1.27.0 (2026-10-09)
A shorter, current Top scores board.

- **Top scores** shows the top 5 for Guided start and the top 5 for Full game (was top 10).
- Only runs from version 1.20.0 onwards count, so scores from older builds with different scoring drop off the board.

## 1.26.0 (2026-10-09)
Step back and forward through training.

- The goat's training box has a **Back** button next to **Next**. Back returns to the previous step exactly as it was, undoing the move you made there, so you can reread a tip or try a move again.
- After going back, **Next** replays the steps you already did, including the moves. On a step that asks you to make a move you haven't made yet, Next stays hidden until you make it.
- Making a move after going back plays the rest of training fresh from there.

## 1.25.0 (2026-10-09)
Tap for explanations on phones, and a payout screen that explains itself.

- On touch screens, **tap** a relic, a stat, a shop notice, the room title, a boss or a payout line to read its tip; tap it again, or anywhere else, to close it. No more press and hold for these.
- Buttons still do their job on a tap, so a tap never plays a card, buys, or signs a contract by mistake. A button's own tip (a Wildcard contract's rule, Raise, Flee, Equip) still shows on a press and hold, which never counts as a tap.
- Phones no longer highlight text or images by accident while you play (typing in the name and feedback boxes still works).
- **Payout screen**: every line explains itself on a tap (or when you point at it with a mouse): the contract, overkill (how many points per extra gold, and how far over you went), interest (1 gold per 5 held, up to the cap), guild dues, the Loan Shark, Blood Pact, and the gold you had. A small hint under the lines says so.

## 1.24.0 (2026-10-09)
A payout screen after every floor.

- When a floor ends, the goat stamps the contract **PAID** or **STRIKE** (or notes that the Insurance Seal covered it), shows how many points you killed against the target, then counts your gold up line by line: the contract's pay, overkill, interest, and anything taken (the loan shark, guild dues). Each gain drops coins; the total ticks up and pops when it's done.
- **To the shop** goes on to the shop as before. Survival floors show the guild's survival pay.
- Dev mode's "End floor" shows the payout screen too, so the count-up is easy to test.
- With reduced motion turned on, the payout shows its result at once.

## 1.23.0 (2026-10-09)
A developer mode, clearer guild dues, and every relic checked.

- **Developer mode**: open the game with `?dev=1` (https://kazday007-sketch.github.io/guild-ledger/?dev=1). A DEV button opens a panel to start a guided or full run, jump to any floor (bosses included) or room, meet the contract, end the floor at once (pays the contract, interest and dues, then opens the shop), open a shop with every relic on sale, set health, max health, gold, strikes and weapon, deal any cards into the room or onto the pile, and give or take away any relic. Dev runs never send run reports, save, or reach the leaderboard.
- **Dues were being collected, but the screen said otherwise**: right after the guild took its dues, the Guild box in the shop still showed the dues you had just paid ("10g due" after paying 10). It now shows the next act's dues, and nothing once the last dues are paid. The Strikes tip names the right amount and floor too.
- **Shop dues warning**: in the shop right before the dues floor, a notice now always says how much the guild will take and how much you have ("Dues 22g after the next floor · you have 37, so keep 22"). It turns red when you're short and shows on every screen size, including the shortest sideways phones.
- **Keen Edge and Whetstone**: the weapon's "hits up to" number now counts them, so a 5-limit weapon with Keen Edge shows 7. Before, the number ignored the relic, so it looked like it did nothing.
- **Loaded Dice**: the Raise tip says twice per floor instead of once.
- `node src/test.js` checks every relic's rule, the dues in both modes and the dev helpers.

## 1.22.1 (2026-10-09)
The shop shows its wares off.

- Relic and service icons in the shop are much bigger and sharper (drawn from 256px art instead of 128px), with a soft lamp glow behind them. They tilt up a little when you point at or focus one.
- On computers each notice leads with a large icon in its middle and the name under it. On upright phones the icon sits on top of the name. On laptops and sideways phones it stands beside the name, as tall as the notice.

## 1.22.0 (2026-10-09)
A cleaner title screen, and every screen sized to fit the window.

- **Title screen**: one centred column under the logo, the same width as the logo, on every screen. On computers and sideways phones it sits in the dark left part of the painting; on upright phones it sits in the middle of the screen. All text is centred, the mode buttons and Play fill the column, and their lettering is sized to the buttons. The playtest note is one short line.
- **Contracts**: on computers the contract board deals its offers 2 by 2 when that makes them bigger, so they fill the board instead of sitting in a thin strip.
- **Shop**: the notices for relics and services keep their torn parchment edges crisp at any size (they used to be stretched and blurry), with the brass pin drawn at its own shape. On computers the notices grow to fill the board, with bigger icons and names.
- **Map, training done and end of run** sit in the middle of the window under the header instead of hugging the top. The end screen is larger on computers.
- **End of run**: the name and feedback boxes show their hint inside the box instead of a label above it, and the "Here lies an adventurer" line is gone. The PAID stamp moved so it no longer covers the name box on sideways phones.
- **Training done** is laid out like the end of a run: the goat and the result on one side, the three tips and the button on the other.
- Sideways phones: the goat's tips get a little more room so the last line no longer runs into the panel's frame.

## 1.21.0 (2026-10-09)
New lettering with a dungeon feel, still easy to read.

- **Titles and headings** use Grenze Gotisch, a gothic face with a carved, old-dungeon look that stays readable at a glance.
- **All other text** (tips, buttons, contracts, the shop, the log) uses Alegreya, an old-book serif made for long reading, in place of the modern sans-serif.
- **Numbers on cards, stamps and plates** use Cinzel, carved Roman capitals with clean upright figures. Every number in the game uses upright figures, so health, points and gold read at a glance.
- The epitaph line on the death screen is in Alegreya italic.
- Sideways phones: the title tagline gets a slightly wider column so it stays on two lines and the title screen still fits without scrolling.
- The fonts now ship with the game (in `assets/fonts`, under the SIL Open Font License) instead of loading from Google Fonts, so they show up even when Google is blocked or slow.

## 1.20.0 (2026-10-09)
The game is now called **Scapegrace**, and an old goat replaces the guild clerk.

- **New name and logo.** Scapegrace (an old word for a reckless rogue, and a nod to Scoundrel, the card game this one grew from). The title screen shows the new logo, the goat over the name, and the book crest in the header and browser tab is now a goat crest.
- **The goat.** Years ago the guild threw a goat into the dungeon to take the blame. It never died. Now it knows the place inside out and shows each new recruit (you) the way. It takes over every place the clerk was: the tips panel, the training, the floor results and the shop, with the same moods (calm, smug, unimpressed, a bit concerned for you, impressed, counting coins, stamping).
- **Its voice.** The training opens with the goat introducing itself, and a few tips get a dry remark from it. Every instruction says the same thing as before. The panel labels read "The goat says" and "The goat's tally".
- **New title, victory, defeat and guild hall backgrounds**, each with the goat in it.
- The guild, contracts, dues, strikes, bosses, monsters, relics, shop and map are unchanged. Run reports now start with "Scapegrace v1.20.0".
- Upright phones: the title background shifts left so the painted goat doesn't sit behind the logo goat.

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
