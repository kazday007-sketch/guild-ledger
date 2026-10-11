// Guild Ledger: game rules. Pure logic, no DOM. Works in the browser (window.Engine) and Node (require).
(function (root) {
  const MAX_HP = 20;
  const TUTORIAL_ROOMS = 2; // the fled room in between doesn't count
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
  const BOSSES = {
    2: { name: 'The Warden', rule: 'Fleeing costs 4 HP this floor.', key: 'fleeToll' },
    5: { name: 'The Plague Hag', rule: 'Potions heal half (rounded down).', key: 'halfPotion' },
    8: { name: 'The Lich Auditor', rule: 'Only Reckless contracts are accepted.', key: 'recklessOnly' },
  };
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
  // boss relics instead, and the shop sells one rare relic. Rarity: common (simple numbers), rare (build pieces),
  // boss (one of a kind, bends a rule). Family: Blade (weapons), Fist (bare hands), Blood (health), Coin (gold),
  // Oath (contracts and points); a few have none. Some relics grow with how many of their family you hold.
  const FAMILIES = {
    blade: { name: 'Blade', glyph: '⚔\uFE0E' }, fist: { name: 'Fist', glyph: '✊\uFE0E' }, blood: { name: 'Blood', glyph: '♥' },
    coin: { name: 'Coin', glyph: '◉' }, oath: { name: 'Oath', glyph: '✒\uFE0E' }, none: { name: 'Wanderer', glyph: '✦' },
  };
  const RARITIES = { common: 'Common', rare: 'Rare', boss: 'Boss' };
  const R = (name, fam, rarity, text) => ({ name, fam, rarity, text });
  const RELICS = {
    // Blade
    whetstone: R('Whetstone', 'blade', 'common', 'Your weapon ignores its limit against monsters of 8 or lower.'),
    keenedge: R('Keen Edge', 'blade', 'common', 'Your weapon can hit monsters up to 2 above its limit.'),
    grindstone: R('Grindstone', 'blade', 'common', 'Weapons you equip are worth +1.'),
    oil: R('Blade Oil', 'blade', 'common', 'Weapon kills count +1 point for each Blade relic you hold.'),
    quickdraw: R('Quickdraw', 'blade', 'common', 'Equipping a weapon counts +2 points.'),
    quartermaster: R('Quartermaster', 'blade', 'common', 'Start each floor with at least a fresh 5 weapon.'),
    masterwork: R('Masterwork', 'blade', 'rare', 'Your weapon only dulls on monsters of 10 or more.'),
    executioner: R('Executioner', 'blade', 'rare', 'Weapon kills of monsters 10 and up count double points.'),
    unbreaking: R('Unbreaking Edge', 'blade', 'boss', 'Your weapon never dulls.'),
    // Fist
    brawler: R('Brawler', 'fist', 'common', 'Bare-handed kills count +3 points.'),
    fang: R('Vampire Fang', 'fist', 'common', 'Bare-handed kills heal you 2.'),
    pickpocket: R('Pickpocket', 'fist', 'common', 'Bare-handed kills give 2 gold.'),
    knuckles: R('Brass Knuckles', 'fist', 'common', 'Bare-handed fights deal 1 less damage for each Fist relic you hold.'),
    pitfighter: R('Pit Fighter', 'fist', 'common', 'Your first bare-handed kill each floor gives +2 max health and heals 2.'),
    ironfist: R('Iron Fist', 'fist', 'rare', 'Bare-handed fights against monsters of 6 or lower deal no damage.'),
    haymaker: R('Haymaker', 'fist', 'rare', 'Your first bare-handed kill in each room counts double points.'),
    giantsgrip: R("Giant's Grip", 'fist', 'boss', 'Bare-handed fights deal half damage (rounded down).'),
    // Blood
    hide: R('Thick Hide', 'blood', 'common', '+6 max health, and heal 6 now.'),
    herbalist: R('Herbalist', 'blood', 'common', 'Every potion in a room heals, not only the first.'),
    bloodpact: R('Blood Pact', 'blood', 'common', 'Each contract you meet gives +2 max health and heals 2.'),
    bloodstone: R('Bloodstone', 'blood', 'common', 'Potions heal +1 for each Blood relic you hold.'),
    bedroll: R('Bedroll', 'blood', 'common', 'Heal 3 at the start of each floor.'),
    alchemist: R('Alchemist', 'blood', 'common', 'Healing beyond your max health counts as points.'),
    ironskin: R('Iron Skin', 'blood', 'rare', 'Take 1 less damage from every monster.'),
    buckler: R('Buckler', 'blood', 'rare', 'The first monster you fight in each room deals 2 less damage.'),
    berserk: R('Berserker', 'blood', 'rare', 'Kills made while at 5 health or less count +5 points.'),
    secondheart: R('Second Heart', 'blood', 'rare', 'The first time you would die, live on with 5 health instead. Then it crumbles.'),
    hagheart: R("Hag's Heart", 'blood', 'boss', '+8 max health and heal 8 now. The first potion in each room heals double.'),
    // Coin
    taxman: R('Taxman', 'coin', 'common', 'Overkill pays 1 gold per 2 points instead of per 5.'),
    tithe: R('Tithe Box', 'coin', 'common', 'Interest can reach 6 gold instead of 3.'),
    loanshark: R('Loan Shark', 'coin', 'common', '+4 gold at the start of each floor. A missed contract also costs 8 gold.'),
    tipjar: R('Tip Jar', 'coin', 'common', 'Each room you clear gives 1 gold for each Coin relic you hold.'),
    haggler: R('Haggler', 'coin', 'common', 'Everything in the shop costs 2 less.'),
    ledger: R('Bounty Ledger', 'coin', 'rare', 'Reckless contracts pay x6 instead of x4.'),
    idol: R('Golden Idol', 'coin', 'rare', 'Kills count +1 point for every 15 gold you hold.'),
    bribe: R('Bribe', 'coin', 'rare', 'A missed contract costs 10 gold instead of a strike, if you have it.'),
    lichledger: R("Lich's Ledger", 'coin', 'boss', 'Interest has no cap, guild dues are halved, and kills count +1 point for each Coin relic you hold.'),
    // Oath
    thorns: R('Crown of Thorns', 'oath', 'common', 'Every fight costs 1 more health, even after armor, but kills count +4 points.'),
    loaded: R('Loaded Dice', 'oath', 'common', 'Between rooms, you may raise your contract one step, once per floor.'),
    oathkeeper: R('Oathkeeper', 'oath', 'common', 'Contracts you sign need 2 fewer points for each Oath relic you hold.'),
    downpayment: R('Down Payment', 'oath', 'common', 'Start each floor with 4 points already counted.'),
    wardrum: R('War Drum', 'oath', 'rare', 'Between rooms, you may raise your contract one step, once per floor, and each raise counts +6 points.'),
    trophy: R('Trophy Hunter', 'oath', 'rare', 'Monsters of 11 and up count +3 points.'),
    ambush: R('Ambush', 'oath', 'rare', 'The first monster you kill in each room counts +2 points.'),
    seal: R('Insurance Seal', 'oath', 'rare', 'Your first missed contract each act gives no strike.'),
    rulebreaker: R('Rulebreaker', 'oath', 'rare', "Wildcard rules don't apply to you. You still get the Wildcard's pay."),
    bonecrown: R('Bone Crown', 'oath', 'boss', 'Every kill counts +2 points.'),
    // no family
    secondwind: R('Second Wind', 'none', 'common', 'You may flee two rooms in a row (not three).'),
    scout: R('Scout', 'none', 'common', 'You may flee after dealing with 1 card of a room.'),
    lantern: R('Lantern', 'none', 'common', 'See the next card in the draw pile.'),
    fortune: R('Fortune Teller', 'none', 'common', 'Once per floor, redraw a room before you pick any of its cards.'),
    smokebomb: R('Smoke Bomb', 'none', 'rare', 'You may flee any number of rooms in a row.'),
    wardenkeys: R("Warden's Keys", 'none', 'boss', 'Flee at any point in a room, past any boss, and heal 2 each time you do.'),
  };
  const PICK_SIZE = 3, RARE_CHANCE = 0.25, SKIP_GOLD = 4;
  const RELIC_COST = { common: 7, rare: 12 };

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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
  const fam = (s, f) => s.relics.filter(k => RELICS[k] && RELICS[k].fam === f).length; // relics of a family you hold
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
    let d = useWeapon ? Math.max(0, m.v - s.weapon.v) : m.v;
    if (!useWeapon) {
      if (has(s, 'ironfist') && m.v <= 6) d = 0;
      if (has(s, 'giantsgrip')) d = Math.floor(d / 2);
      if (has(s, 'knuckles')) d -= fam(s, 'fist');
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
    if (!bare && has(s, 'executioner') && m.v >= 10) p += m.v;
    if (!bare && has(s, 'oil')) p += fam(s, 'blade');
    if (has(s, 'thorns')) p += 4;
    if (bare && has(s, 'brawler')) p += 3;
    if (has(s, 'trophy') && m.v >= 11) p += 3;
    if (has(s, 'ambush') && s.roomKills === 0) p += 2;
    if (has(s, 'berserk') && s.hp <= 5) p += 5;
    if (has(s, 'bonecrown')) p += 2;
    if (has(s, 'idol')) p += Math.floor(s.gold / 15);
    if (has(s, 'lichledger')) p += fam(s, 'coin');
    return p;
  }
  function potionHeal(s, c) {
    if (clause(s) === 'abstain') return 0;
    if (s.potionUsed && !has(s, 'herbalist')) return 0;
    let h = c.v;
    if (has(s, 'hagheart') && !s.potionUsed) h *= 2;
    if (has(s, 'bloodstone')) h += fam(s, 'blood');
    return s.boss && s.boss.key === 'halfPotion' ? Math.floor(h / 2) : h;
  }
  const healBy = (s, n) => { const b = s.hp; s.hp = Math.min(s.maxHp, s.hp + n); return s.hp - b; };
  function resolveCard(s, c, mode) { // mode: 'weapon' | 'bare' for monsters
    const out = { dmg: 0, heal: 0, points: 0, gold: 0 };
    if (c.kind === 'monster') {
      const useWeapon = mode === 'weapon' && canUseWeapon(s, c);
      const dmg = monsterDamage(s, c, useWeapon);
      s.hp -= dmg; out.dmg = dmg;
      if (s.hp <= 0 && has(s, 'secondheart')) { s.hp = 5; s.relics = s.relics.filter(k => k !== 'secondheart'); out.saved = true; }
      if (useWeapon && !has(s, 'unbreaking') && !(has(s, 'masterwork') && c.v < 10)) s.weapon.limit = s.weapon.limit == null ? c.v : Math.min(s.weapon.limit, c.v);
      if (s.hp > 0) {
        out.points = contractPoints(s, c, !useWeapon); s.slain += out.points;
        if (!useWeapon && has(s, 'fang')) out.heal += healBy(s, 2);
        if (!useWeapon && has(s, 'pickpocket')) { s.gold += 2; out.gold = 2; }
        if (!useWeapon && has(s, 'pitfighter') && !s.floorBare) { s.maxHp += 2; out.heal += healBy(s, 2); out.grew = 2; }
        if (!useWeapon) { s.roomBare = (s.roomBare || 0) + 1; s.floorBare = true; }
      }
      s.roomKills++;
    } else if (c.kind === 'weapon') {
      s.weapon = { v: c.v + (has(s, 'grindstone') ? 1 : 0), limit: null };
      if (has(s, 'quickdraw')) { out.points = 2; s.slain += 2; }
    } else {
      const h = potionHeal(s, c);
      out.heal = healBy(s, h);
      if (has(s, 'alchemist') && h > out.heal) { out.points = h - out.heal; s.slain += out.points; }
      s.potionUsed = true;
    }
    return out;
  }

  function newGame(seed, opts) {
    const r = rng(seed == null ? (Math.random() * 2 ** 32) >>> 0 : seed);
    const s = {
      r, deck: startingDeck(), draw: [], room: [], handled: 0, potionUsed: false, fledStreak: 0, roomKills: 0,
      hp: MAX_HP, maxHp: MAX_HP, weapon: null, floor: 0, roomsCleared: 0, slain: 0, totalSlain: 0,
      gold: 0, strikes: 0, relics: [], pick: null, roomBare: 0, floorBare: false, contract: null, offers: [], raises: 0, fortuneUsed: false,
      phase: 'bid', log: [], sealUsed: false, boss: null, shop: null, lastResult: null,
      guided: !!(opts && opts.guided),
      // One deck: the dungeon isn't reshuffled between floors, only when a new act starts. Dealt cards stay gone
      // until then, and if the pile runs out first, everything not in play is shuffled back in. Full game rules otherwise.
      oneDeck: !!(opts && opts.oneDeck) && !(opts && opts.guided), reshuffles: 0,
    };
    startFloor(s);
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
    s.roomsCleared = 0; s.slain = has(s, 'downpayment') ? 4 : 0; s.floorBare = false; s.contract = null; s.raises = 0; s.fortuneUsed = false;
    s.boss = BOSSES[s.floor] || null;
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
    return s.boss && s.boss.key === 'recklessOnly' ? [2] : [0, 1, 2];
  }
  function payout(s, tier, cl) {
    const mult = tier === 2 && has(s, 'ledger') ? 6 : TIER_MULT[tier];
    const base = (3 + act(s)) * mult;
    return cl ? Math.ceil(base * WILDCARD_MULT) : base;
  }
  // The points a contract of this tier needs on this floor (Oathkeeper lowers it).
  const target = (s, tier) => TARGETS[s.floor][tier] - (has(s, 'oathkeeper') ? 2 * fam(s, 'oath') : 0);
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
    if (!keys && s.boss && s.boss.key === 'fleeToll' && s.hp <= 4) return false;
    return has(s, 'smokebomb') || s.fledStreak < (has(s, 'secondwind') ? 2 : 1);
  }
  function flee(s) {
    if (!canFlee(s)) return false;
    s.draw.push(...s.room); s.room = []; s.room = deal(s, 4); s.fledStreak++; newRoom(s);
    if (has(s, 'wardenkeys')) { healBy(s, 2); log(s, "Slipped out with the Warden's keys, and caught your breath (+2)."); }
    else if (s.boss && s.boss.key === 'fleeToll') { s.hp -= 4; log(s, 'Fled past the Warden: -4 HP.'); }
    else log(s, 'Fled the room. Its cards go to the bottom of the pile.');
    return true;
  }
  function handle(s, id, mode) {
    if (s.phase !== 'room') return false;
    const i = s.room.findIndex(c => c.id === id);
    if (i < 0) return false;
    const c = s.room[i];
    const out = resolveCard(s, c, mode);
    s.room.splice(i, 1); s.handled++;
    const name = `${{ monster: 'Monster', weapon: 'Weapon', potion: 'Potion' }[c.kind]} ${c.v}`;
    if (out.saved) log(s, 'Your Second Heart beats once more: back up at 5 health. It crumbles.');
    if (c.kind === 'monster') log(s, `${name}: took ${out.dmg} damage` + (s.hp > 0 ? `${s.contract.survival ? '' : `, +${out.points} points`}${out.heal ? `, healed ${out.heal}` : ''}${out.gold ? `, +${out.gold} gold` : ''}.` : '.'));
    else if (c.kind === 'weapon') log(s, `Equipped a ${s.weapon.v} weapon.`);
    else log(s, (out.heal ? `${name}: healed ${out.heal}` : `${name}: no healing`) + (out.points ? `, +${out.points} points.` : '.'));
    if (s.hp <= 0) { s.hp = 0; s.phase = 'lost'; s.lastResult = 'You fell in the dungeon.'; return true; }
    if (s.handled === 3) {
      s.roomsCleared++; s.fledStreak = 0; newRoom(s);
      if (has(s, 'tipjar') && !s.tutorial) s.gold += fam(s, 'coin');
      if (s.roomsCleared >= (s.tutorial ? TUTORIAL_ROOMS : ROOMS_PER_FLOOR)) endFloor(s);
      else s.room.push(...deal(s, 4 - s.room.length));
    }
    return true;
  }
  function endFloor(s) {
    const c = s.contract; s.totalSlain += s.slain;
    if (s.tutorial) { s.phase = 'tutdone'; s.lastResult = `You made it through with ${s.hp} health left.`; return; }
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
    if (s.floor === FLOORS - 1) { s.phase = 'won'; return; }
    s.phase = 'shop';
    // First a free relic pick, then the shop, which sells one rare relic beside its services.
    const boss = !!BOSSES[s.floor];
    const rares = c.survival ? 0 : pay.outcome !== 'met' ? 0 : c.tier === 2 || c.clause ? PICK_SIZE : c.tier === 1 ? 1 : 0;
    s.pick = locked(s, 'relics') ? null : { boss, options: dealPick(s, boss ? 'boss' : null, rares) };
    if (s.pick && !s.pick.options.length) s.pick = null;
    const forSale = relicPool(s, 'rare').filter(k => !(s.pick && s.pick.options.includes(k)));
    s.shop = { relics: locked(s, 'relics') ? [] : shuffle(forSale, s.r).slice(0, 1), bought: {} };
  }
  const interestCap = s => has(s, 'lichledger') ? Infinity : has(s, 'tithe') ? 6 : 3;
  const duesFor = (s, a) => has(s, 'lichledger') ? Math.ceil(DUES[a] / 2) : DUES[a];
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
  // and the floor (1-based) they're collected after. null when none are coming (training, guided act 1, run over).
  function duesAhead(s) {
    if (s.tutorial || !['bid', 'room', 'shop'].includes(s.phase)) return null;
    const f = s.phase === 'shop' ? s.floor + 1 : s.floor, a = Math.floor(f / 3), last = a * 3 + 2;
    if (a > 2 || (s.guided && last < UNLOCK.contracts)) return null;
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

  // A training floor with a stacked deck, used by the tutorial: clear a room, flee a room of big monsters, then clear one more.
  function newTutorial() {
    const s = newGame(1);
    const c = (kind, v, suit) => card(kind, v, suit);
    // Room 1 leaves the Goblin King behind, room 2 is all big monsters and you flee it, and room 3 ends training.
    const room1 = [c('monster', 5, '♠'), c('weapon', 7, '♦'), c('monster', 13, '♣'), c('monster', 9, '♣')];
    const next = [c('monster', 14, '♠'), c('monster', 12, '♣'), c('monster', 11, '♠'), c('monster', 3, '♣'), c('monster', 10, '♠'), c('potion', 6, '♥'), c('monster', 2, '♠')];
    s.tutorial = true; s.room = room1; s.draw = next.concat(s.draw); s.log = [];
    survivalFloor(s, 0);
    return s;
  }

  const api = {
    MAX_HP, ROOMS_PER_FLOOR, TUTORIAL_ROOMS, FLOORS, UNLOCK, SURVIVAL_PAY, MAX_RELICS, TIERS, TARGETS, DUES, BOSSES, RELICS, SERVICES, CLAUSES, WILDCARD_MULT,
    FAMILIES, RARITIES, PICK_SIZE, SKIP_GOLD,
    newGame, newTutorial, bid, flee, canFlee, handle, buy, cost, choose, skipPick, relicsFull, fam, target, duesFor, interestCap, dropRelic, leaveShop, allowedTiers, payout,
    canRaise, raise, raisesPerFloor, canRedraw, redraw,
    canUseWeapon, monsterDamage, contractPoints, potionHeal, resolveCard, rankLabel, act,
    duesAhead, weaponReach, nextCard, deckView, devJump, devRoom, devGrant, devEndFloor,
  };
  if (typeof module !== 'undefined') module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
