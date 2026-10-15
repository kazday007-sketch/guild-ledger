// Guild Ledger: game rules. Pure logic, no DOM. Works in the browser (window.Engine) and Node (require).
(function (root) {
  const MAX_HP = 20;
  const ROOMS_PER_FLOOR = 4;
  const FLOORS = 9; // 3 acts x 3 floors, a boss rule on floors 3, 6, 9
  const MAX_RELICS = 8;
  const ELITES = 3; // elites each new act adds to the dungeon
  const TIERS = ['Safe', 'Bold', 'Reckless'];
  const TIER_MULT = [1, 2, 4];
  // [Safe, Bold, Reckless] monster points to slay on each floor. Tuned with sim.js.
  // Targets climb steeply after act 1, because by then your relics add points of their own.
  const TARGETS = [
    [28, 38, 48], [34, 44, 54], [40, 50, 60],
    [50, 60, 70], [61, 71, 81], [72, 82, 92],
    [81, 91, 101], [90, 100, 110], [96, 106, 116],
  ];
  // Guild dues, paid at the end of each act (after floors 3, 6, 9). Failing to pay is a strike.
  const DUES = [10, 22, 34];
  // Bosses rule the last floor of each act (floors 3, 6, 9, and every third floor in Endless). Each act draws one
  // boss from its pool, so runs meet different bosses, and no boss is met twice in a run. Endless acts draw from
  // every boss not yet met. Four kinds: a fight (a boss card in the floor's last room that must die before you leave),
  // a rule for the floor, a stalker (hides in the pile and haunts every room until you kill it), and a trick.
  // `v` is the boss card's value in its own act; it grows by 2 for every act later than that. {v} in a rule is that value.
  const BOSSES = {
    warden: { name: 'The Warden', type: 'fight', act: 0, v: 11, rule: 'Waits in the last room as a {v}, and you can\'t flee him. Fleeing earlier costs 4 health.' },
    goblinking: { name: 'The Goblin King', type: 'stalker', act: 0, v: 13, rule: 'Hides in the pile as a {v} and steals 5 gold every room. Kill him to get double back.' },
    jailer: { name: 'The Jailer', type: 'rule', act: 0, rule: 'You can flee only once on this floor.' },
    mummy: { name: 'The Mummy', type: 'rule', act: 0, rule: 'Every weapon you equip this floor is 3 weaker.' },
    banshee: { name: 'The Banshee', type: 'trick', act: 0, rule: 'Two cards in every room are face down until you take another card.' },
    vampire: { name: 'The Vampire Lord', type: 'fight', act: 1, v: 15, rule: 'Waits in the last room as a {v}. Every potion you drink this floor makes him 2 stronger.' },
    broodmother: { name: 'The Broodmother', type: 'stalker', act: 1, v: 14, rule: 'Hides in the pile as a {v}. Until she dies, every room gets a spiderling you must kill before you leave.' },
    hag: { name: 'The Plague Hag', type: 'rule', act: 1, rule: 'Potions heal half, and every new room costs 1 health.' },
    skeletonking: { name: 'The Skeleton King', type: 'fight', act: 1, v: 14, rule: 'Waits in the last room as a {v}. Kill him and he rises once more, at half strength.' },
    golem: { name: 'The Bone Golem', type: 'rule', act: 1, rule: 'Weapons dull faster: after a kill, they only hit monsters 3 lower.' },
    dragon: { name: 'The Dread Dragon', type: 'fight', act: 2, v: 20, rule: 'Waits in the last room as a {v}. Its breath weakens your weapon by 1 every room.' },
    horror: { name: 'The Dungeon Horror', type: 'stalker', act: 2, v: 17, rule: 'Hides in the pile as a {v}. Until it dies, every room\'s new monsters are 2 stronger than the last.' },
    lich: { name: 'The Lich Auditor', type: 'trick', act: 2, rule: 'Only Reckless contracts, and a missed one costs two strikes.' },
    troll: { name: 'The Cave Troll', type: 'fight', act: 2, v: 18, rule: 'Waits in the last room as a {v}. Its hide takes 3 off your weapon.' },
    wyrm: { name: 'The Forest Wyrm', type: 'stalker', act: 2, v: 16, rule: 'Hides in the pile as a {v}. Every room it lives costs you 3 max health, back only if you kill it.' },
  };
  const BOSS_TYPES = { fight: 'Boss fight', rule: 'Boss rule', stalker: 'Stalker', trick: 'Trick' };
  const isBossFloor = f => f % 3 === 2;
  // Guided runs unlock systems gradually (floor indices, 0-based). Act 1 (floors 1-3) has no contracts, strikes
  // or dues: you only have to survive, and the guild pays SURVIVAL_PAY per floor (no interest). Relic picks start
  // after floor 1, as in a full game. Contracts (Safe only) start on
  // floor 4, Bold, Reckless and raises on floor 5, and clauses on floor 7 (the start of act 3).
  const UNLOCK = { contracts: 3, relics: 0, tiers: 4, raise: 4, clauses: 6 };
  const SURVIVAL_PAY = 6;
  const locked = (s, k) => s.guided && s.floor < UNLOCK[k];
  // Clauses (shown to players as the "Wildcard" contract): one offer per floor carries one. It pays
  // WILDCARD_MULT times its tier and bends a rule for that floor. 2.5 makes a Wildcard pay more than the
  // next tier up, while the simulator's guided win rate stays within about 1 point (tuned with sim.js).
  const WILDCARD_MULT = 2.5;
  const CLAUSES = {
    sworn: { name: 'Sworn', text: 'You cannot flee this floor.' },
    abstain: { name: 'Abstinent', text: 'Potions do not heal this floor.' },
    steel: { name: 'Steel Oath', text: 'Only weapon kills score points.' },
    bare: { name: 'Bare Oath', text: 'Only bare-handed kills score points.' },
  };
  // Relics are the run's main source of power. You pick one after every floor (1 of 3, free), a boss floor offers
  // boss relics instead, and the shop sells one rare relic. Rarity: common (simple numbers), rare (stronger, often a
  // build piece), boss (one of a kind, bends a rule). Each relic stands on its own: combos are for the player to find.
  const RARITIES = { common: 'Common', rare: 'Rare', boss: 'Boss' };
  const R = (name, rarity, text) => ({ name, rarity, text });
  const RELICS = {
    // weapons
    whetstone: R('Whetstone', 'common', 'Your weapon ignores its limit against monsters of 8 or lower.'),
    keenedge: R('Keen Edge', 'common', 'Your weapon can hit monsters up to 2 above its limit.'),
    grindstone: R('Grindstone', 'common', 'Weapons you equip are worth +1.'),
    oil: R('Blade Oil', 'common', 'Weapon kills count +2 points.'),
    quickdraw: R('Quickdraw', 'common', 'Equipping a weapon counts +2 points.'),
    quartermaster: R('Quartermaster', 'common', 'Start each floor with at least a fresh 5 weapon.'),
    masterwork: R('Masterwork', 'rare', 'Your weapon only dulls on monsters of 10 or more.'),
    executioner: R('Executioner', 'rare', 'Weapon kills of monsters 12 and up count half again as many points.'),
    unbreaking: R('Unbreaking Edge', 'boss', 'Your weapon never dulls.'),
    // bare hands
    brawler: R('Brawler', 'common', 'Bare-handed kills count +3 points.'),
    fang: R('Vampire Fang', 'common', 'Bare-handed kills heal you 2.'),
    pickpocket: R('Pickpocket', 'common', 'Bare-handed kills give 2 gold.'),
    knuckles: R('Brass Knuckles', 'common', 'Bare-handed fights deal 2 less damage.'),
    pitfighter: R('Pit Fighter', 'common', 'Your first bare-handed kill each floor gives +2 max health and heals 2.'),
    ironfist: R('Iron Fist', 'rare', 'Bare-handed fights against monsters of 6 or lower deal no damage.'),
    haymaker: R('Haymaker', 'rare', 'Your first bare-handed kill in each room counts double points.'),
    giantsgrip: R("Giant's Grip", 'boss', 'Bare-handed fights deal half damage (rounded down).'),
    // health
    hide: R('Thick Hide', 'common', '+6 max health, and heal 6 now.'),
    herbalist: R('Herbalist', 'common', 'Every potion in a room heals, not only the first.'),
    bloodpact: R('Blood Pact', 'common', 'Each contract you meet gives +2 max health and heals 2.'),
    bloodstone: R('Bloodstone', 'common', 'Potions heal 2 more.'),
    bedroll: R('Bedroll', 'common', 'Heal 3 at the start of each floor.'),
    alchemist: R('Alchemist', 'common', 'Healing beyond your max health counts as points.'),
    ironskin: R('Iron Skin', 'rare', 'Take 1 less damage from every monster.'),
    buckler: R('Buckler', 'rare', 'The first monster you fight in each room deals 2 less damage.'),
    berserk: R('Berserker', 'rare', 'Kills made while at 5 health or less count +5 points.'),
    secondheart: R('Second Heart', 'rare', 'The first time you would die, live on with 5 health instead. Then it crumbles.'),
    hagheart: R("Hag's Heart", 'boss', '+8 max health and heal 8 now. The first potion in each room heals double.'),
    // gold
    taxman: R('Taxman', 'common', 'Overkill pays 1 gold per 2 points instead of per 5.'),
    tithe: R('Tithe Box', 'common', 'Interest can reach 6 gold instead of 3.'),
    loanshark: R('Loan Shark', 'common', '+4 gold at the start of each floor. A missed contract also costs 8 gold.'),
    tipjar: R('Tip Jar', 'common', 'Each room you clear gives 1 gold.'),
    haggler: R('Haggler', 'common', 'Everything in the shop costs 2 less.'),
    ledger: R('Bounty Ledger', 'rare', 'Reckless contracts pay x6 instead of x4.'),
    idol: R('Golden Idol', 'rare', 'Kills count +1 point for every 15 gold you hold.'),
    bribe: R('Bribe', 'rare', 'A missed contract costs 10 gold instead of a strike, if you have it.'),
    lichledger: R("Lich's Ledger", 'boss', 'Interest has no cap, guild dues are halved, and every kill counts +1 point.'),
    // contracts and points
    thorns: R('Crown of Thorns', 'common', 'Every fight costs 1 more health, even after armor, but kills count +4 points.'),
    loaded: R('Loaded Dice', 'common', 'Between rooms, you may raise your contract one step, once per floor.'),
    oathkeeper: R('Oathkeeper', 'common', 'Contracts you sign need 4 fewer points.'),
    downpayment: R('Down Payment', 'common', 'Start each floor with 4 points already counted.'),
    wardrum: R('War Drum', 'rare', 'Between rooms, you may raise your contract one step, once per floor, and each raise counts +6 points.'),
    trophy: R('Trophy Hunter', 'rare', 'Monsters of 11 and up count +3 points.'),
    ambush: R('Ambush', 'rare', 'The first monster you kill in each room counts +2 points.'),
    seal: R('Insurance Seal', 'rare', 'Your first missed contract each act gives no strike.'),
    rulebreaker: R('Rulebreaker', 'rare', "Wildcard rules don't apply to you. You still get the Wildcard's pay."),
    bonecrown: R('Bone Crown', 'boss', 'Every kill counts +2 points.'),
    // fleeing and foresight
    secondwind: R('Second Wind', 'common', 'You may flee two rooms in a row (not three).'),
    scout: R('Scout', 'common', 'You may flee after dealing with 1 card of a room.'),
    lantern: R('Lantern', 'common', 'See the next card in the draw pile.'),
    fortune: R('Fortune Teller', 'common', 'Once per floor, redraw a room before you pick any of its cards.'),
    smokebomb: R('Smoke Bomb', 'rare', 'You may flee up to three rooms in a row.'),
    wardenkeys: R("Warden's Keys", 'boss', 'Flee at any point in a room, past any boss, and heal 2 when you do (not on back-to-back flees).'),
  };
  const PICK_SIZE = 3, RARE_CHANCE = 0.25, SKIP_GOLD = 8;
  // Rerolling the shop's relic shelf: the first reroll each visit costs REROLL_BASE, each one after it REROLL_STEP more.
  const REROLL_BASE = 2, REROLL_STEP = 2;
  const RELIC_COST = { common: 7, rare: 12 };

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    const r = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.state = () => a >>> 0; // where the sequence has got to, so a saved run carries on with the same luck
    return r;
  }
  // A run as plain data, for the browser to keep across a refresh, and back again.
  function saveGame(s) { const { r, ...rest } = s; return JSON.parse(JSON.stringify({ ...rest, rngState: r.state() })); }
  function loadGame(data) {
    const { rngState, ...rest } = data;
    // A fresh page counts card ids from 1 again: start past every card the run already has, so new ones never share an id.
    JSON.stringify(rest, (k, v) => { if (k === 'id' && typeof v === 'number' && v >= nextId) nextId = v + 1; return v; });
    return { ...rest, r: rng(rngState) };
  }
  function shuffle(arr, r) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }

  let nextId = 1;
  const card = (kind, v, suit) => ({ id: nextId++, kind, v, suit });
  function startingDeck() {
    const d = [];
    for (let v = 2; v <= 14; v++) { d.push(card('monster', v, '♠')); d.push(card('monster', v, '♣')); }
    for (let v = 2; v <= 10; v++) { d.push(card('weapon', v, '♦')); d.push(card('potion', v, '♥')); }
    return d;
  }
  const rankLabel = v => ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' })[v] || String(v);
  const has = (s, k) => s.relics.includes(k);
  const safeFloor = s => !!s.tutorial && s.floor === 0; // the tutorial run's first floor: health can't drop below 1
  const clause = s => s.contract && !has(s, 'rulebreaker') ? s.contract.clause : null; // the rule in force this floor

  // Shared by the game and the simulator bot. `s` needs hp, maxHp, weapon, potionUsed, roomKills, roomBare,
  // floorBare, slain, gold, relics, boss and contract.
  function canUseWeapon(s, m) {
    if (!s.weapon) return false;
    const limit = s.weapon.limit == null ? Infinity : s.weapon.limit + (has(s, 'keenedge') ? 2 : 0);
    if (m.v <= limit) return true;
    return has(s, 'whetstone') && m.v <= 8;
  }
  function monsterDamage(s, m, useWeapon) {
    let d = useWeapon ? Math.max(0, m.v - Math.max(0, s.weapon.v - (m.armor || 0))) : m.v;
    if (!useWeapon) {
      if (has(s, 'ironfist') && m.v <= 6) d = 0;
      if (has(s, 'giantsgrip')) d = Math.floor(d / 2);
      if (has(s, 'knuckles')) d -= 2;
    }
    if (has(s, 'buckler') && s.roomKills === 0) d -= 2;
    if (has(s, 'ironskin')) d -= 1;
    d = Math.max(0, d);
    return has(s, 'thorns') ? d + 1 : d; // after armor, so armor can't cancel it
  }
  function contractPoints(s, m, bare) {
    const cl = clause(s);
    if ((cl === 'steel' && bare) || (cl === 'bare' && !bare)) return 0;
    let p = m.v;
    if (bare && has(s, 'haymaker') && !s.roomBare) p += m.v;
    if (!bare && has(s, 'executioner') && m.v >= 12) p += Math.floor(m.v / 2);
    if (!bare && has(s, 'oil')) p += 2;
    if (has(s, 'thorns')) p += 4;
    if (bare && has(s, 'brawler')) p += 3;
    if (has(s, 'trophy') && m.v >= 11) p += 3;
    if (has(s, 'ambush') && s.roomKills === 0) p += 2;
    if (has(s, 'berserk') && s.hp <= 5) p += 5;
    if (has(s, 'bonecrown')) p += 2;
    if (has(s, 'idol')) p += Math.floor(s.gold / 15);
    if (has(s, 'lichledger')) p += 1;
    return p;
  }
  function potionHeal(s, c) {
    if (clause(s) === 'abstain') return 0;
    if (s.potionUsed && !has(s, 'herbalist')) return 0;
    let h = c.v;
    if (has(s, 'hagheart') && !s.potionUsed) h *= 2;
    if (has(s, 'bloodstone') && h > 0) h += 2;
    return bossIs(s, 'hag') ? Math.floor(h / 2) : h;
  }
  const bossIs = (s, k) => !!(s.boss && s.boss.key === k);
  const healBy = (s, n) => { const b = s.hp; s.hp = Math.min(s.maxHp, s.hp + n); return s.hp - b; };
  function resolveCard(s, c, mode) { // mode: 'weapon' | 'bare' for monsters
    const out = { dmg: 0, heal: 0, points: 0, gold: 0 };
    if (c.kind === 'monster') {
      const useWeapon = mode === 'weapon' && canUseWeapon(s, c);
      const dmg = monsterDamage(s, c, useWeapon);
      s.hp -= dmg; out.dmg = dmg;
      if (s.hp <= 0 && has(s, 'secondheart')) { s.hp = 5; s.relics = s.relics.filter(k => k !== 'secondheart'); out.saved = true; }
      if (s.hp <= 0 && safeFloor(s)) { s.hp = 1; s.spared = true; out.spared = true; } // the tutorial's floor can't kill you
      if (useWeapon && !has(s, 'unbreaking') && !(has(s, 'masterwork') && c.v < 10)) {
        const lim = Math.max(0, c.v - (bossIs(s, 'golem') ? 3 : 0));
        s.weapon.limit = s.weapon.limit == null ? lim : Math.min(s.weapon.limit, lim);
      }
      if (s.hp > 0) {
        out.points = contractPoints(s, c, !useWeapon); s.slain += out.points;
        if (!useWeapon && has(s, 'fang')) out.heal += healBy(s, 2);
        if (!useWeapon && has(s, 'pickpocket')) { s.gold += 2; out.gold = 2; }
        if (!useWeapon && has(s, 'pitfighter') && !s.floorBare) { s.maxHp += 2; out.heal += healBy(s, 2); out.grew = 2; }
        if (!useWeapon) { s.roomBare = (s.roomBare || 0) + 1; s.floorBare = true; }
      }
      s.roomKills++;
    } else if (c.kind === 'weapon') {
      s.weapon = { v: Math.max(1, c.v + (has(s, 'grindstone') ? 1 : 0) - (bossIs(s, 'mummy') ? 3 : 0)), limit: null };
      if (has(s, 'quickdraw')) { out.points = 2; s.slain += 2; }
    } else {
      const h = potionHeal(s, c);
      out.heal = healBy(s, h);
      if (has(s, 'alchemist') && h > out.heal) { out.points = h - out.heal; s.slain += out.points; }
      s.potionUsed = true;
      if (bossIs(s, 'vampire') && s.room) { s.bossBuff = (s.bossBuff || 0) + 2; s.room.forEach(x => { if (x.boss) x.v += 2; }); }
    }
    return out;
  }

  function newGame(seed, opts) {
    const r = rng(seed == null ? (Math.random() * 2 ** 32) >>> 0 : seed);
    const s = {
      r, deck: startingDeck(), draw: [], room: [], handled: 0, potionUsed: false, fledStreak: 0, roomKills: 0,
      hp: MAX_HP, maxHp: MAX_HP, weapon: null, floor: 0, roomsCleared: 0, slain: 0, totalSlain: 0,
      gold: 0, strikes: 0, relics: [], pick: null, roomBare: 0, floorBare: false, contract: null, offers: [], raises: 0, fortuneUsed: false,
      phase: 'bid', log: [], sealUsed: false, boss: null, shop: null, lastResult: null, bossKeys: [], endless: false,
      guided: !!(opts && opts.guided),
      // One deck: the dungeon isn't reshuffled between floors, only when a new act starts. Dealt cards stay gone
      // until then, and if the pile runs out first, everything not in play is shuffled back in. Full game rules otherwise.
      oneDeck: !!(opts && opts.oneDeck) && !(opts && opts.guided), reshuffles: 0,
    };
    startFloor(s);
    if (opts && opts.tutorial && s.guided) stackTutorial(s);
    return s;
  }
  const log = (s, msg) => { s.log.unshift(msg); if (s.log.length > 40) s.log.pop(); };
  const act = s => Math.floor(s.floor / 3);

  function newRoom(s) { s.handled = 0; s.potionUsed = false; s.roomKills = 0; s.roomBare = 0; }
  // Take n cards off the top of the pile. In One deck, an empty pile is refilled first with every card that's
  // been dealt (the dungeon deck minus what's in the room or still in the pile), shuffled.
  function deal(s, n) {
    if (s.oneDeck && s.draw.length < n) {
      const inPlay = new Set([...s.room, ...s.draw].map(c => c.id));
      const back = s.deck.filter(c => !inPlay.has(c.id)).map(c => ({ ...c }));
      if (back.length) {
        s.draw.push(...shuffle(back, s.r));
        s.reshuffles++; log(s, 'The pile ran out. The dungeon shuffles its dead back in.');
      }
    }
    return s.draw.splice(0, n);
  }
  // One deck: a card added to the dungeon mid-run goes into the pile at a random spot, so it can turn up soon.
  function slipIn(s, c) {
    if (!s.oneDeck) return;
    s.draw.splice(Math.floor(s.r() * (s.draw.length + 1)), 0, { ...c });
  }
  function startFloor(s) {
    if (s.floor === 3 || s.floor === 6) { // a new act adds two elites to the dungeon
      const v = s.floor === 3 ? 15 : 17;
      const elites = Array.from({ length: ELITES }, () => card('monster', v, '★'));
      s.deck.push(...elites); elites.forEach(c => slipIn(s, c));
      log(s, `Act ${act(s) + 1}: ${ELITES} elite ${v}s join the dungeon.`);
    } else if (s.floor >= FLOORS && s.floor % 3 === 0) { // Endless: every new act, the dungeon's monsters grow and more elites arrive
      s.deck.forEach(c => { if (c.kind === 'monster') { c.face = c.face || c.v; c.v++; } });
      const elites = Array.from({ length: ELITES }, () => card('monster', 17, '★'));
      s.deck.push(...elites); elites.forEach(c => slipIn(s, c));
      log(s, `Act ${act(s) + 1}: every monster grows 1 stronger, and ${ELITES} more elites join the dungeon.`);
    }
    if (s.floor % 3 === 0) s.sealUsed = false;
    if (has(s, 'loanshark')) { s.gold += 4; log(s, 'The loan shark advances you 4 gold.'); }
    if (has(s, 'bedroll') && healBy(s, 3)) log(s, 'A night on the bedroll: healed up to 3.');
    if (has(s, 'quartermaster') && (!s.weapon || s.weapon.v < 5 || s.weapon.limit != null && s.weapon.limit < 5)) {
      s.weapon = { v: 5 + (has(s, 'grindstone') ? 1 : 0), limit: null }; log(s, 'The quartermaster hands you a fresh 5 weapon.');
    }
    // One deck carries the pile (and the card left in the last room) from floor to floor within an act. A deck lasts
    // about one act, so each act starts on a fresh shuffle; carrying the dregs over killed ~70% of sim runs on floor 4.
    if (s.oneDeck && s.floor % 3 !== 0) s.room.push(...deal(s, 4 - s.room.length));
    else { s.draw = shuffle(s.deck.map(c => ({ ...c })), s.r); s.room = s.draw.splice(0, 4); }
    newRoom(s); s.fledStreak = 0;
    s.boss = bossFor(s, s.floor); s.bossBuff = 0; s.stolen = 0; s.horror = 0; s.wyrmTaken = 0; s.stalker = false; s.jailFled = false;
    if (s.boss && s.boss.type === 'stalker') { // somewhere in the next few rooms, never the first
      s.stalker = true;
      const c = bossCardOf(s); c.stalker = s.boss.key;
      s.draw.splice(Math.min(s.draw.length, 1 + Math.floor(s.r() * 7)), 0, c);
    }
    if (bossIs(s, 'banshee')) hideOne(s);
    s.roomsCleared = 0; s.slain = has(s, 'downpayment') ? 4 : 0; s.floorBare = false; s.contract = null; s.raises = 0; s.fortuneUsed = false;
    const tiers = allowedTiers(s);
    const clauseTier = tiers[Math.floor(s.r() * tiers.length)];
    const keys = Object.keys(CLAUSES);
    const ck = keys[Math.floor(s.r() * keys.length)];
    s.offers = tiers.map(t => ({ tier: t, clause: null }));
    if (!locked(s, 'clauses')) s.offers.push({ tier: clauseTier, clause: ck });
    s.phase = 'bid';
    if (locked(s, 'contracts')) survivalFloor(s);
  }
  // A floor with no contract: no points to hit, no strike to fear. Just get through the rooms.
  function survivalFloor(s, pay = SURVIVAL_PAY) {
    s.contract = { tier: 0, clause: null, target: 0, pay, survival: true };
    s.offers = []; s.phase = 'room';
  }
  function allowedTiers(s) {
    if (locked(s, 'tiers')) return [0];
    return bossIs(s, 'lich') ? [2] : [0, 1, 2];
  }
  function payout(s, tier, cl) {
    const mult = tier === 2 && has(s, 'ledger') ? 6 : TIER_MULT[tier];
    const base = (3 + act(s)) * mult;
    return cl ? Math.ceil(base * WILDCARD_MULT) : base;
  }
  // The points a contract of this tier needs on this floor (Oathkeeper lowers it).
  // Endless floors past the last row keep climbing by 8 a floor.
  const targetRow = f => f < TARGETS.length ? TARGETS[f] : TARGETS[TARGETS.length - 1].map(t => t + 8 * (f - TARGETS.length + 1));
  const target = (s, tier) => targetRow(s.floor)[tier] - (has(s, 'oathkeeper') ? 4 : 0);
  function makeContract(s, tier, cl) {
    return { tier, clause: cl || null, target: target(s, tier), pay: payout(s, tier, cl) };
  }
  function bid(s, i) {
    const o = s.offers[i];
    if (s.phase !== 'bid' || !o) return false;
    s.contract = makeContract(s, o.tier, o.clause);
    log(s, `Signed a ${o.clause ? `Wildcard (${CLAUSES[o.clause].name})` : TIERS[o.tier]} contract: slay ${s.contract.target} for ${s.contract.pay} gold.`);
    s.phase = 'room';
    return true;
  }
  function canRedraw(s) { return s.phase === 'room' && s.handled === 0 && has(s, 'fortune') && !s.fortuneUsed; }
  function redraw(s) {
    if (!canRedraw(s)) return false;
    s.draw.push(...s.room); s.room = []; s.room = deal(s, 4); s.fortuneUsed = true;
    log(s, 'The fortune teller redraws the room.');
    return true;
  }
  // Raise: between rooms, move your contract up one tier. Its clause stays. Only relics give raises: Loaded Dice and
  // War Drum each give one per floor.
  const raisesPerFloor = s => (has(s, 'loaded') ? 1 : 0) + (has(s, 'wardrum') ? 1 : 0);
  function canRaise(s) {
    return s.phase === 'room' && !locked(s, 'raise') && !s.contract.survival && s.handled === 0 && s.roomsCleared > 0 && s.contract.tier < 2 &&
      s.raises < raisesPerFloor(s);
  }
  function raise(s) {
    if (!canRaise(s)) return false;
    s.contract = makeContract(s, s.contract.tier + 1, s.contract.clause);
    s.raises++;
    if (has(s, 'wardrum')) { s.slain += 6; log(s, 'The war drum sounds: +6 points.'); }
    log(s, `Raised ${s.contract.clause ? 'the Wildcard' : `to ${TIERS[s.contract.tier]}`}: slay ${s.contract.target} for ${s.contract.pay} gold.`);
    return true;
  }
  function canFlee(s) {
    if (s.phase !== 'room' || clause(s) === 'sworn') return false;
    const keys = has(s, 'wardenkeys');
    if (!keys && s.handled > (has(s, 'scout') ? 1 : 0)) return false;
    if ((bossIs(s, 'jailer') && s.jailFled) || s.room.some(c => c.boss)) return false; // the Jailer allows one flee; nobody flees a boss's own room
    if (!keys && bossIs(s, 'warden') && s.hp <= 4) return false;
    return s.fledStreak < (has(s, 'smokebomb') ? 3 : has(s, 'secondwind') ? 2 : 1);
  }
  function flee(s) {
    if (!canFlee(s)) return false;
    s.room.forEach(c => { delete c.hidden; }); s.draw.push(...s.room); s.room = []; s.fledStreak++; newRoom(s);
    if (bossIs(s, 'jailer')) s.jailFled = true;
    if (has(s, 'wardenkeys') && s.fledStreak === 1) { healBy(s, 2); log(s, "Slipped out with the Warden's keys, and caught your breath (+2)."); }
    else if (bossIs(s, 'warden')) { s.hp -= 4; log(s, 'Fled past the Warden: -4 HP.'); }
    else log(s, 'Fled the room. Its cards go to the bottom of the pile.');
    nextRoom(s);
    return true;
  }
  function handle(s, id, mode) {
    if (s.phase !== 'room') return false;
    const i = s.room.findIndex(c => c.id === id);
    if (i < 0) return false;
    const c = s.room[i];
    if (c.hidden) return false; // the Banshee's face-down card: take another first
    const out = resolveCard(s, c, mode);
    s.room.forEach(x => { delete x.hidden; });
    s.room.splice(i, 1); s.handled++;
    const name = `${{ monster: 'Monster', weapon: 'Weapon', potion: 'Potion' }[c.kind]} ${c.v}`;
    if (out.saved) log(s, 'Your Second Heart beats once more: back up at 5 health. It crumbles.');
    if (out.spared) log(s, 'That should have killed you. You live, at 1 health. The goat insisted.');
    if (c.kind === 'monster') log(s, `${name}: took ${out.dmg} damage` + (s.hp > 0 ? `${s.contract.survival ? '' : `, +${out.points} points`}${out.heal ? `, healed ${out.heal}` : ''}${out.gold ? `, +${out.gold} gold` : ''}.` : '.'));
    else if (c.kind === 'weapon') log(s, `Equipped a ${s.weapon.v} weapon.`);
    else log(s, (out.heal ? `${name}: healed ${out.heal}` : `${name}: no healing`) + (out.points ? `, +${out.points} points.` : '.'));
    if (s.hp <= 0) { s.hp = 0; s.phase = 'lost'; s.lastResult = 'You fell in the dungeon.'; return true; }
    if (c.kind === 'monster') bossSlain(s, c);
    // A room is done after 3 cards, but a boss in it must die first.
    if (s.handled >= 3 && !s.room.some(x => x.boss)) {
      s.roomsCleared++; s.fledStreak = 0; newRoom(s);
      if (has(s, 'tipjar')) s.gold += 1;
      if (s.roomsCleared >= ROOMS_PER_FLOOR) endFloor(s);
      else nextRoom(s);
    }
    return true;
  }
  // ---------- bosses ----------
  // The boss of floor f (0-based), or null. Each act's boss is drawn the first time it's asked for.
  function bossFor(s, f) {
    if (!isBossFloor(f)) return null;
    const a = Math.floor(f / 3);
    for (let i = s.bossKeys.length; i <= a; i++) {
      const met = new Set(s.bossKeys), keys = Object.keys(BOSSES);
      let pool = keys.filter(k => !met.has(k) && (i >= 3 || BOSSES[k].act === i));
      if (i === 0 && s.guided) pool = ['warden']; // a guided run always meets the simplest boss first
      if (!pool.length) pool = keys.filter(k => !met.has(k));
      if (!pool.length) pool = keys; // every boss met: they start coming back
      s.bossKeys.push(pool[Math.floor(s.r() * pool.length)]);
    }
    const key = s.bossKeys[a], b = BOSSES[key];
    const v = b.v == null ? null : b.v + 2 * Math.max(0, a - b.act);
    return { key, name: b.name, type: b.type, kind: BOSS_TYPES[b.type], v, rule: b.rule.replace('a {v}', (/^(8|11|18)/.test(String(v)) ? 'an ' : 'a ') + v) }; // "an 11", "a 14"
  }
  function bossCardOf(s, v = s.boss.v, name = s.boss.name) {
    const c = card('monster', v, '☠'); c.name = name; c.bossKey = s.boss.key;
    if (bossIs(s, 'troll')) c.armor = 3;
    if (bossIs(s, 'skeletonking') && name === s.boss.name) c.rises = true;
    return c;
  }
  const hideOne = s => { // the Banshee hides two of the room's cards (always leaving one to take)
    const pool = s.room.filter(c => !c.boss);
    for (let n = 0; n < 2 && pool.length > 2 - n; n++) pool.splice(Math.floor(s.r() * pool.length), 1)[0].hidden = true;
  };
  // A boss or stalker card just died.
  function bossSlain(s, c) {
    if (c.rises) { const r = bossCardOf(s, Math.ceil(c.v / 2), 'The Skeleton King, risen'); r.boss = true; s.room.push(r); log(s, 'The Skeleton King rises again.'); }
    if (!c.stalker) return;
    s.stalker = false;
    if (c.stalker === 'goblinking' && s.stolen) { s.gold += 2 * s.stolen; log(s, `The Goblin King's hoard: +${2 * s.stolen} gold.`); }
    if (c.stalker === 'wyrm' && s.wyrmTaken) { s.maxHp += s.wyrmTaken; log(s, `The Wyrm is dead: your ${s.wyrmTaken} max health comes back.`); }
    if (c.stalker === 'horror') s.horror = 0;
    log(s, `${c.name} is dead.`);
  }
  // Deal the next room (after one is cleared or fled), with whatever the boss does to it.
  function nextRoom(s) {
    if (s.stalker) {
      if (bossIs(s, 'goblinking') && s.gold) { const g = Math.min(5, s.gold); s.gold -= g; s.stolen += g; log(s, `The Goblin King stole ${g} gold.`); }
      if (bossIs(s, 'wyrm')) { s.maxHp -= 3; s.wyrmTaken += 3; s.hp = Math.min(s.hp, s.maxHp); log(s, 'The Wyrm squeezes: -3 max health.'); }
      if (bossIs(s, 'horror')) s.horror += 2;
    }
    if (bossIs(s, 'hag')) { s.hp -= 1; log(s, "The Hag's plague: -1 health."); }
    if (bossIs(s, 'dragon') && s.weapon && s.weapon.v > 1) { s.weapon.v--; log(s, "The Dragon's breath: your weapon weakens by 1."); }
    if (s.hp <= 0) { s.hp = 0; s.phase = 'lost'; s.lastResult = 'You fell in the dungeon.'; return; }
    if (s.boss && s.boss.type === 'fight' && s.roomsCleared === ROOMS_PER_FLOOR - 1 && !s.room.some(c => c.boss)) {
      const b = bossCardOf(s, s.boss.v + s.bossBuff); b.boss = true; s.room.push(b);
      log(s, `${s.boss.name} blocks the way out.`);
    }
    const fresh = deal(s, Math.max(0, 4 - s.room.length));
    if (s.horror) fresh.forEach(c => { if (c.kind === 'monster' && !c.stalker) { c.face = c.face || c.v; c.v += s.horror; } });
    s.room.push(...fresh);
    if (s.stalker && bossIs(s, 'broodmother')) { const sp = card('monster', 5 + Math.max(0, act(s) - 1), '☠'); sp.name = 'Spiderling'; sp.spawn = true; sp.boss = true; s.room.push(sp); }
    if (bossIs(s, 'banshee')) hideOne(s);
  }
  // Boss cards and their spawn leave with the floor.
  function clearBossCards(s) {
    const temp = c => c.boss || c.stalker || c.spawn;
    s.draw = s.draw.filter(c => !temp(c)); s.room = s.room.filter(c => !temp(c));
    s.room.forEach(c => { delete c.hidden; });
  }
  function endFloor(s) {
    const c = s.contract; s.totalSlain += s.slain; clearBossCards(s);
    let msg;
    // The payout screen counts these up line by line: what the contract paid, the extras, and what was taken.
    const pay = s.payout = { floor: s.floor, slain: s.slain, target: c.target, survival: !!c.survival, outcome: null, start: s.gold, lines: [], strikes: s.strikes };
    const line = (key, label, gold) => pay.lines.push({ key, label, gold });
    if (c.survival) {
      pay.outcome = 'survived'; line('contract', 'Survival pay', c.pay);
      s.gold += c.pay;
      msg = `Floor survived. The guild pays you ${c.pay} gold.`;
    } else if (s.slain >= c.target) {
      const over = Math.floor((s.slain - c.target) / (has(s, 'taxman') ? 2 : 5));
      s.gold += c.pay + over;
      pay.outcome = 'met'; line('contract', 'Contract', c.pay); if (over) line('overkill', 'Overkill', over);
      msg = `Contract met: ${s.slain}/${c.target}. +${c.pay} gold` + (over ? `, +${over} overkill.` : '.');
      if (has(s, 'bloodpact')) { s.maxHp += 2; s.hp += 2; msg += ' Blood Pact: +2 max HP.'; line('bloodpact', 'Blood Pact: +2 max health', 0); }
    } else {
      if (has(s, 'seal') && !s.sealUsed) { s.sealUsed = true; pay.outcome = 'covered'; msg = `Contract missed (${s.slain}/${c.target}), but the Insurance Seal covers it.`; }
      else if (has(s, 'bribe') && s.gold >= 10) { s.gold -= 10; pay.outcome = 'covered'; pay.bribed = true; line('bribe', 'Bribe', -10); msg = `Contract missed (${s.slain}/${c.target}), but 10 gold of bribe makes the strike go away.`; }
      else if (bossIs(s, 'lich')) { s.strikes = Math.min(3, s.strikes + 2); pay.outcome = 'missed'; msg = `Contract missed: ${s.slain}/${c.target}. The Lich marks it twice: strike ${s.strikes} of 3.`; }
      else { s.strikes++; pay.outcome = 'missed'; msg = `Contract missed: ${s.slain}/${c.target}. Strike ${s.strikes} of 3.`; }
      if (has(s, 'loanshark')) { line('loanshark', 'Loan shark', -Math.min(8, s.gold)); s.gold = Math.max(0, s.gold - 8); msg += ' The loan shark takes 8 gold.'; }
    }
    const interest = c.survival ? 0 : Math.min(interestCap(s), Math.floor(s.gold / 5));
    s.gold += interest;
    if (interest) { msg += ` Interest +${interest}.`; line('interest', 'Interest', interest); }
    if (s.floor % 3 === 2 && !locked(s, 'contracts')) { // no dues before contracts begin
      const due = duesFor(s, act(s));
      if (s.gold >= due) { s.gold -= due; msg += ` Paid ${due} gold in guild dues.`; line('dues', 'Guild dues', -due); }
      else { line('dues', `Guild dues (${due} owed, strike)`, -s.gold); s.strikes++; s.gold = 0; msg += ` Couldn't pay ${due} gold in dues: strike ${s.strikes} of 3, and the guild takes what you have.`; }
    }
    log(s, msg); s.lastResult = msg; pay.end = s.gold; pay.strikesAfter = s.strikes;
    if (s.strikes >= 3) { s.phase = 'lost'; s.lastResult = msg + ' The guild revokes your license.'; return; }
    const rares = c.survival ? 0 : pay.outcome !== 'met' ? 0 : c.tier === 2 || c.clause ? PICK_SIZE : c.tier === 1 ? 1 : 0;
    if (s.floor === FLOORS - 1 && !s.endless) { s.phase = 'won'; s.wonRares = rares; return; }
    openShop(s, rares);
  }
  // After a floor: first a free relic pick, then the shop, which sells one rare relic beside its services.
  function openShop(s, rares) {
    s.phase = 'shop';
    const boss = isBossFloor(s.floor);
    s.pick = locked(s, 'relics') ? null : { boss, options: dealPick(s, boss ? 'boss' : null, rares) };
    if (s.pick && !s.pick.options.length) s.pick = null;
    const forSale = relicPool(s, 'rare').filter(k => !(s.pick && s.pick.options.includes(k)));
    s.shop = { relics: locked(s, 'relics') ? [] : shuffle(forSale, s.r).slice(0, 1), bought: {}, rerolls: 0 };
  }
  // Endless: after winning, keep going down. The run goes on until you die or strike out.
  function continueEndless(s) {
    if (s.phase !== 'won' || s.endless) return false;
    s.endless = true; log(s, 'You turned down the exit. Endless: the dungeon only gets worse from here.');
    openShop(s, s.wonRares || 0);
    return true;
  }
  const interestCap = s => has(s, 'lichledger') ? Infinity : has(s, 'tithe') ? 6 : 3;
  const duesBase = a => a < DUES.length ? DUES[a] : DUES[DUES.length - 1] + 12 * (a - DUES.length + 1); // Endless: +12 an act
  const duesFor = (s, a) => has(s, 'lichledger') ? Math.ceil(duesBase(a) / 2) : duesBase(a);
  // Relics you could still get, of one rarity.
  const relicPool = (s, rarity) => Object.keys(RELICS).filter(k => RELICS[k].rarity === rarity && !has(s, k));
  // The options for a relic pick: three different relics. `only` forces a rarity (boss picks); otherwise `rares` of
  // them are rare for sure and the rest are rare by chance. A rarity that runs dry falls back to the next one.
  function dealPick(s, only, rares) {
    const out = [];
    for (let i = 0; i < PICK_SIZE; i++) {
      const want = only || (i < rares || s.r() < RARE_CHANCE ? 'rare' : 'common');
      const order = want === 'boss' ? ['boss', 'rare', 'common'] : want === 'rare' ? ['rare', 'common'] : ['common', 'rare'];
      for (const r of order) {
        const pool = relicPool(s, r).filter(k => !out.includes(k));
        if (pool.length) { out.push(pool[Math.floor(s.r() * pool.length)]); break; }
      }
    }
    return out;
  }
  // Take a relic into your belt, with any effect it has the moment you get it.
  function gainRelic(s, k) {
    s.relics.push(k);
    if (k === 'hide') { s.maxHp += 6; healBy(s, 6); }
    if (k === 'hagheart') { s.maxHp += 8; healBy(s, 8); }
  }
  const relicsFull = s => s.relics.length >= MAX_RELICS;
  // The free pick after a floor: take one of the options (with room in your belt), or skip it for a little gold.
  function choose(s, k) {
    if (s.phase !== 'shop' || !s.pick || !s.pick.options.includes(k) || relicsFull(s)) return false;
    gainRelic(s, k); s.pick = null;
    log(s, `Took the ${RELICS[k].name}.`);
    return true;
  }
  function skipPick(s) {
    if (s.phase !== 'shop' || !s.pick) return false;
    s.pick = null; s.gold += SKIP_GOLD;
    log(s, `Passed on the relics. The goat slips you ${SKIP_GOLD} gold.`);
    return true;
  }
  // Reroll the shop's relic shelf for gold. The price climbs with each reroll and starts over on the next visit.
  const rerollCost = s => REROLL_BASE + REROLL_STEP * ((s.shop && s.shop.rerolls) || 0);
  const rerollPool = s => relicPool(s, 'rare').filter(k => !s.shop.relics.includes(k));
  const canReroll = s => s.phase === 'shop' && !s.pick && !!s.shop && s.shop.relics.length > 0 && rerollPool(s).length > 0;
  function rerollShop(s) {
    if (!canReroll(s) || s.gold < rerollCost(s)) return false;
    s.gold -= rerollCost(s); s.shop.rerolls = (s.shop.rerolls || 0) + 1;
    const old = s.shop.relics;
    s.shop.relics = shuffle(rerollPool(s), s.r).slice(0, old.length);
    old.forEach(k => { delete s.shop.bought[k]; });
    log(s, `Rerolled the relic shelf: ${s.shop.relics.map(k => RELICS[k].name).join(', ')}.`);
    return true;
  }
  const price = (s, item) => Math.max(1, item.cost - (has(s, 'haggler') ? 2 : 0));
  const SERVICES = {
    bandage: { name: 'Bandage', text: 'Heal 6 HP.', cost: 4 },
    cull: { name: 'Cull', text: 'Remove your strongest monster from the dungeon.', oneDeck: 'Remove the strongest monster still in the pile from the dungeon.', cost: 7 },
    smith: { name: 'Smith', text: 'Add a random 6-10 weapon to the dungeon.', cost: 6 },
  };
  function buy(s, what) {
    if (s.phase !== 'shop' || s.shop.bought[what]) return false;
    if (s.pick) return false; // the free relic pick comes first
    const item = RELICS[what] || SERVICES[what], c = cost(s, what);
    if (!item || s.gold < c) return false;
    if (RELICS[what]) {
      if (relicsFull(s) || !s.shop.relics.includes(what)) return false;
      gainRelic(s, what);
    } else if (what === 'bandage') s.hp = Math.min(s.maxHp, s.hp + 6);
    else if (what === 'cull') {
      // One deck culls the strongest monster still ahead of you in the pile, so it's one you would have met.
      const ahead = new Set(s.draw.map(c => c.id));
      const pool = s.deck.filter(c => c.kind === 'monster' && (!s.oneDeck || ahead.has(c.id)));
      const ms = (pool.length ? pool : s.deck.filter(c => c.kind === 'monster')).sort((a, b) => b.v - a.v);
      s.deck = s.deck.filter(c => c !== ms[0]);
      s.draw = s.draw.filter(c => c.id !== ms[0].id); s.room = s.room.filter(c => c.id !== ms[0].id);
      log(s, `Culled a ${ms[0].v} monster from the dungeon.`);
    } else if (what === 'smith') {
      const v = 6 + Math.floor(s.r() * 5), w = card('weapon', v, '♦'); s.deck.push(w); slipIn(s, w);
      log(s, `The smith forged a ${v} weapon.`);
    }
    s.gold -= c; s.shop.bought[what] = true;
    return true;
  }
  function dropRelic(s, key) {
    s.relics = s.relics.filter(k => k !== key);
    if (key === 'hide' || key === 'hagheart') { s.maxHp -= key === 'hide' ? 6 : 8; s.hp = Math.min(s.hp, s.maxHp); }
  }
  // What something in the shop costs you: services at their price, a relic by its rarity (dearer each act).
  function cost(s, what) {
    const r = RELICS[what];
    return price(s, r ? { cost: RELIC_COST[r.rarity] + 2 * act(s) } : SERVICES[what]);
  }
  function leaveShop(s) { if (s.phase !== 'shop') return; if (s.pick) skipPick(s); s.floor++; startFloor(s); }

  // What the HUD shows about dues: the next dues you'll owe (for the act you're in, or heading into from the shop),
  // and the floor (1-based) they're collected after. null when none are coming (guided act 1, run over).
  function duesAhead(s) {
    if (!['bid', 'room', 'shop'].includes(s.phase)) return null;
    const f = s.phase === 'shop' ? s.floor + 1 : s.floor, a = Math.floor(f / 3), last = a * 3 + 2;
    if ((a > 2 && !s.endless) || (s.guided && last < UNLOCK.contracts)) return null;
    return { due: duesFor(s, a), act: a, floor: last + 1, next: f === last };
  }
  // The biggest monster your weapon can hit right now, with Keen Edge and Whetstone counted. null: no limit yet.
  function weaponReach(s) {
    if (!s.weapon || s.weapon.limit == null) return null;
    return Math.max(s.weapon.limit + (has(s, 'keenedge') ? 2 : 0), has(s, 'whetstone') ? 8 : 0);
  }
  const nextCard = s => s.draw[0] || null;
  // The deck view: every card in the dungeon, sorted, each marked whether it's still in the pile. In the shop before a
  // fresh shuffle (every floor of a normal run, each act in One deck) every card counts as in the pile.
  function deckView(s) {
    const fresh = s.phase === 'shop' && (!s.oneDeck || (s.floor + 1) % 3 === 0); // the next floor starts a new shuffle
    const ahead = new Set(s.draw.map(c => c.id));
    const cards = s.deck.map(c => ({ kind: c.kind, v: c.v, elite: c.suit === '★', left: fresh || ahead.has(c.id) }))
      .sort((a, b) => a.v - b.v);
    return { cards, left: cards.filter(c => c.left).length, total: cards.length };
  }

  // ---------- developer mode (?dev=1): jump anywhere, grant anything. Never used by a normal run. ----------
  // Start floor f (0-based) fresh: the deck is rebuilt with the elites of every act reached so far.
  function devJump(s, f) {
    f = Math.max(0, Math.min(FLOORS - 1, f | 0));
    s.deck = startingDeck();
    for (let i = 0; i < ELITES; i++) { if (f > 3) s.deck.push(card('monster', 15, '★')); if (f > 6) s.deck.push(card('monster', 17, '★')); }
    s.floor = f; s.sealUsed = false; s.shop = null; s.lastResult = null; s.draw = []; s.room = [];
    if (s.hp <= 0) s.hp = s.maxHp;
    startFloor(s);
    log(s, `Dev: jumped to floor ${f + 1}.`);
  }
  // Skip to room n (0-based) of the current floor with a fresh deal.
  function devRoom(s, n) {
    if (s.phase === 'bid') bid(s, 0);
    if (s.phase !== 'room') return false;
    s.draw.push(...s.room); s.room = []; s.room = deal(s, 4);
    newRoom(s); s.fledStreak = 0; s.roomsCleared = Math.max(0, Math.min(ROOMS_PER_FLOOR - 1, n | 0));
    return true;
  }
  function devGrant(s, key) {
    if (!RELICS[key] || has(s, key)) return false;
    gainRelic(s, key);
    return true;
  }
  // End the floor now with the points you have, so its payout, interest and dues settle.
  function devEndFloor(s) {
    if (s.phase === 'bid') bid(s, 0);
    if (s.phase !== 'room') return false;
    s.roomsCleared = ROOMS_PER_FLOOR; endFloor(s);
    return true;
  }

  // The tutorial is the start of a guided run's first floor, dealt from a stacked pile: room 1 has a sword and an
  // easy fight, room 2 is all big monsters (worth fleeing), and the room after that has a potion. The rest of the
  // floor, and the run, is dealt as usual. The stacked cards are the deck's own, so the deck view stays right.
  const TUTORIAL_DECK = {
    room: [['monster', 5, '♠'], ['weapon', 7, '♦'], ['monster', 13, '♣'], ['monster', 9, '♣']],
    next: [['monster', 14, '♠'], ['monster', 12, '♣'], ['monster', 11, '♠'], ['monster', 3, '♣'], ['monster', 10, '♠'], ['potion', 6, '♥'], ['monster', 2, '♠']],
  };
  function stackTutorial(s) {
    const pool = [...s.room, ...s.draw];
    const take = ([kind, v, suit]) => pool.splice(pool.findIndex(c => c.kind === kind && c.v === v && c.suit === suit), 1)[0];
    s.room = TUTORIAL_DECK.room.map(take);
    s.draw = TUTORIAL_DECK.next.map(take).concat(pool);
    s.tutorial = true;
  }

  const api = {
    MAX_HP, ROOMS_PER_FLOOR, FLOORS, UNLOCK, SURVIVAL_PAY, MAX_RELICS, TIERS, TARGETS, DUES, BOSSES, BOSS_TYPES, RELICS, SERVICES, CLAUSES, WILDCARD_MULT,
    bossFor, isBossFloor, targetRow, continueEndless,
    RARITIES, PICK_SIZE, SKIP_GOLD, REROLL_BASE, REROLL_STEP, rerollCost, canReroll, rerollShop,
    newGame, saveGame, loadGame, safeFloor, bid, flee, canFlee, handle, buy, cost, choose, skipPick, relicsFull, target, duesFor, interestCap, dropRelic, leaveShop, allowedTiers, payout,
    canRaise, raise, raisesPerFloor, canRedraw, redraw,
    canUseWeapon, monsterDamage, contractPoints, potionHeal, resolveCard, rankLabel, act,
    duesAhead, weaponReach, nextCard, deckView, devJump, devRoom, devGrant, devEndFloor,
  };
  if (typeof module !== 'undefined') module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
