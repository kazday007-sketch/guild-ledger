// Guild Ledger: game rules. Pure logic, no DOM. Works in the browser (window.Engine) and Node (require).
(function (root) {
  const MAX_HP = 20;
  const TUTORIAL_ROOMS = 2; // the fled room in between doesn't count
  const ROOMS_PER_FLOOR = 4;
  const FLOORS = 9; // 3 acts x 3 floors, a boss rule on floors 3, 6, 9
  const MAX_RELICS = 4;
  const TIERS = ['Safe', 'Bold', 'Reckless'];
  const TIER_MULT = [1, 2, 4];
  // [Safe, Bold, Reckless] monster points to slay on each floor. Tuned with sim.js.
  const TARGETS = [
    [28, 38, 48], [30, 40, 50], [31, 41, 51],
    [32, 42, 52], [34, 44, 54], [36, 46, 56],
    [37, 47, 57], [38, 48, 58], [40, 50, 60],
  ];
  // Guild dues, paid at the end of each act (after floors 3, 6, 9). Failing to pay is a strike.
  const DUES = [10, 22, 34];
  const BOSSES = {
    2: { name: 'The Warden', rule: 'Fleeing costs 4 HP this floor.', key: 'fleeToll' },
    5: { name: 'The Plague Hag', rule: 'Potions heal half (rounded down).', key: 'halfPotion' },
    8: { name: 'The Lich Auditor', rule: 'Only Reckless contracts are accepted.', key: 'recklessOnly' },
  };
  // Guided runs unlock systems gradually (floor indices, 0-based). Act 1 (floors 1-3) has no contracts, strikes
  // or dues: you only have to survive, and the guild pays SURVIVAL_PAY per floor (no interest). The shop after
  // floor 1 sells services only; relics appear from the shop after floor 2. Contracts (Safe only) start on
  // floor 4, Bold, Reckless and raises on floor 5, and clauses on floor 7 (the start of act 3).
  const UNLOCK = { contracts: 3, relics: 1, tiers: 4, raise: 4, clauses: 6 };
  const SURVIVAL_PAY = 6;
  const locked = (s, k) => s.guided && s.floor < UNLOCK[k];
  // Clauses: one contract offer per floor carries one. It pays x1.5 and bends a rule for that floor.
  const CLAUSES = {
    sworn: { name: 'Sworn', text: 'You cannot flee this floor.' },
    abstain: { name: 'Abstinent', text: 'Potions do not heal this floor.' },
    steel: { name: 'Steel Oath', text: 'Only weapon kills score points.' },
    bare: { name: 'Bare Oath', text: 'Only bare-handed kills score points.' },
  };
  const RELICS = {
    // weapons
    whetstone: { name: 'Whetstone', text: 'Your weapon ignores its limit against monsters of 8 or lower.', cost: 6 },
    keenedge: { name: 'Keen Edge', text: 'Your weapon can hit monsters up to 2 above its limit.', cost: 7 },
    grindstone: { name: 'Grindstone', text: 'Weapons you equip are worth +1.', cost: 6 },
    // defense and healing
    ironskin: { name: 'Iron Skin', text: 'Take 1 less damage from every monster.', cost: 8 },
    buckler: { name: 'Buckler', text: 'The first monster you fight in each room deals 2 less damage.', cost: 7 },
    hide: { name: 'Thick Hide', text: '+6 max HP, and heal 6 now.', cost: 7 },
    herbalist: { name: 'Herbalist', text: 'Every potion in a room heals, not only the first.', cost: 6 },
    fang: { name: 'Vampire Fang', text: 'Bare-handed kills heal you 2.', cost: 7 },
    bloodpact: { name: 'Blood Pact', text: 'Each contract you meet gives +2 max HP and heals 2.', cost: 6 },
    // movement
    secondwind: { name: 'Second Wind', text: 'You may flee two rooms in a row (not three).', cost: 5 },
    scout: { name: 'Scout', text: 'You may flee after dealing with 1 card of a room.', cost: 6 },
    lantern: { name: 'Lantern', text: 'See the next card in the draw pile.', cost: 3 },
    fortune: { name: 'Fortune Teller', text: 'Once per floor, before bidding, redraw the first room.', cost: 5 },
    // points
    trophy: { name: 'Trophy Hunter', text: 'Face and elite monsters (J and up) count +3 toward contracts.', cost: 7 },
    brawler: { name: 'Brawler', text: 'Bare-handed kills count +3 toward contracts.', cost: 6 },
    ambush: { name: 'Ambush', text: 'The first monster you kill in each room counts +2.', cost: 6 },
    berserk: { name: 'Berserker', text: 'Kills made while at 5 HP or less count +5.', cost: 5 },
    thorns: { name: 'Crown of Thorns', text: 'Every fight costs 1 more HP, even after armor, but kills count +3 points.', cost: 5 },
    alchemist: { name: 'Alchemist', text: 'Healing beyond your max HP counts as contract points.', cost: 6 },
    // contracts and gold
    ledger: { name: 'Bounty Ledger', text: 'Reckless contracts pay x6 instead of x4.', cost: 7 },
    seal: { name: 'Insurance Seal', text: 'Your first missed contract each act gives no strike.', cost: 8 },
    loaded: { name: 'Loaded Dice', text: 'You may raise your contract twice per floor.', cost: 5 },
    taxman: { name: 'Taxman', text: 'Overkill pays 1 gold per 2 points instead of per 5.', cost: 5 },
    tithe: { name: 'Tithe Box', text: 'Interest can reach 6 gold instead of 3.', cost: 6 },
    pickpocket: { name: 'Pickpocket', text: 'Bare-handed kills give 2 gold.', cost: 5 },
    loanshark: { name: 'Loan Shark', text: '+4 gold at the start of each floor. A missed contract also costs 8 gold.', cost: 3 },
  };

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
  const clause = s => s.contract && s.contract.clause;

  // Shared by the game and the simulator bot. `s` needs hp, maxHp, weapon, potionUsed, roomKills,
  // slain, gold, relics, boss and contract.
  function canUseWeapon(s, m) {
    if (!s.weapon) return false;
    const limit = s.weapon.limit == null ? Infinity : s.weapon.limit + (has(s, 'keenedge') ? 2 : 0);
    if (m.v <= limit) return true;
    return has(s, 'whetstone') && m.v <= 8;
  }
  function monsterDamage(s, m, useWeapon) {
    let d = useWeapon ? Math.max(0, m.v - s.weapon.v) : m.v;
    if (has(s, 'buckler') && s.roomKills === 0) d -= 2;
    if (has(s, 'ironskin')) d -= 1;
    d = Math.max(0, d);
    return has(s, 'thorns') ? d + 1 : d; // after armor, so armor can't cancel it
  }
  function contractPoints(s, m, bare) {
    const cl = clause(s);
    if ((cl === 'steel' && bare) || (cl === 'bare' && !bare)) return 0;
    let p = m.v;
    if (has(s, 'thorns')) p += 3;
    if (bare && has(s, 'brawler')) p += 3;
    if (has(s, 'trophy') && m.v >= 11) p += 3;
    if (has(s, 'ambush') && s.roomKills === 0) p += 2;
    if (has(s, 'berserk') && s.hp <= 5) p += 5;
    return p;
  }
  function potionHeal(s, c) {
    if (clause(s) === 'abstain') return 0;
    if (s.potionUsed && !has(s, 'herbalist')) return 0;
    return s.boss && s.boss.key === 'halfPotion' ? Math.floor(c.v / 2) : c.v;
  }
  function resolveCard(s, c, mode) { // mode: 'weapon' | 'bare' for monsters
    const out = { dmg: 0, heal: 0, points: 0, gold: 0 };
    if (c.kind === 'monster') {
      const useWeapon = mode === 'weapon' && canUseWeapon(s, c);
      const dmg = monsterDamage(s, c, useWeapon);
      s.hp -= dmg; out.dmg = dmg;
      if (useWeapon) s.weapon.limit = s.weapon.limit == null ? c.v : Math.min(s.weapon.limit, c.v);
      if (s.hp > 0) {
        out.points = contractPoints(s, c, !useWeapon); s.slain += out.points;
        if (!useWeapon && has(s, 'fang')) { const b = s.hp; s.hp = Math.min(s.maxHp, s.hp + 2); out.heal = s.hp - b; }
        if (!useWeapon && has(s, 'pickpocket')) { s.gold += 2; out.gold = 2; }
      }
      s.roomKills++;
    } else if (c.kind === 'weapon') {
      s.weapon = { v: c.v + (has(s, 'grindstone') ? 1 : 0), limit: null };
    } else {
      const h = potionHeal(s, c);
      const before = s.hp; s.hp = Math.min(s.maxHp, s.hp + h); out.heal = s.hp - before;
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
      gold: 0, strikes: 0, relics: [], contract: null, offers: [], raises: 0, fortuneUsed: false,
      phase: 'bid', log: [], sealUsed: false, boss: null, shop: null, lastResult: null,
      guided: !!(opts && opts.guided),
    };
    startFloor(s);
    return s;
  }
  const log = (s, msg) => { s.log.unshift(msg); if (s.log.length > 40) s.log.pop(); };
  const act = s => Math.floor(s.floor / 3);

  function newRoom(s) { s.handled = 0; s.potionUsed = false; s.roomKills = 0; }
  function startFloor(s) {
    if (s.floor === 3 || s.floor === 6) { // a new act adds two elites to the dungeon
      const v = s.floor === 3 ? 15 : 17;
      s.deck.push(card('monster', v, '★'), card('monster', v, '★'));
      log(s, `Act ${act(s) + 1}: two elite ${v}s join the dungeon.`);
    }
    if (s.floor % 3 === 0) s.sealUsed = false;
    if (has(s, 'loanshark')) { s.gold += 4; log(s, 'The loan shark advances you 4 gold.'); }
    s.draw = shuffle(s.deck.map(c => ({ ...c })), s.r);
    s.room = s.draw.splice(0, 4);
    newRoom(s); s.fledStreak = 0;
    s.roomsCleared = 0; s.slain = 0; s.contract = null; s.raises = 0; s.fortuneUsed = false;
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
    return cl ? Math.ceil(base * 1.5) : base;
  }
  function makeContract(s, tier, cl) {
    return { tier, clause: cl || null, target: TARGETS[s.floor][tier], pay: payout(s, tier, cl) };
  }
  function bid(s, i) {
    const o = s.offers[i];
    if (s.phase !== 'bid' || !o) return false;
    s.contract = makeContract(s, o.tier, o.clause);
    log(s, `Signed a ${TIERS[o.tier]}${o.clause ? ' ' + CLAUSES[o.clause].name : ''} contract: slay ${s.contract.target} for ${s.contract.pay} gold.`);
    s.phase = 'room';
    return true;
  }
  function canRedraw(s) { return s.phase === 'bid' && has(s, 'fortune') && !s.fortuneUsed; }
  function redraw(s) {
    if (!canRedraw(s)) return false;
    s.draw.push(...s.room); s.room = s.draw.splice(0, 4); s.fortuneUsed = true;
    log(s, 'The fortune teller redraws the first room.');
    return true;
  }
  // Raise: between rooms, move your contract up one tier. Its clause stays.
  function canRaise(s) {
    return s.phase === 'room' && !locked(s, 'raise') && s.handled === 0 && s.roomsCleared > 0 && s.contract.tier < 2 &&
      s.raises < (has(s, 'loaded') ? 2 : 1);
  }
  function raise(s) {
    if (!canRaise(s)) return false;
    s.contract = makeContract(s, s.contract.tier + 1, s.contract.clause);
    s.raises++;
    log(s, `Raised to ${TIERS[s.contract.tier]}: slay ${s.contract.target} for ${s.contract.pay} gold.`);
    return true;
  }
  function canFlee(s) {
    if (s.phase !== 'room' || clause(s) === 'sworn') return false;
    if (s.handled > (has(s, 'scout') ? 1 : 0)) return false;
    if (s.boss && s.boss.key === 'fleeToll' && s.hp <= 4) return false;
    return s.fledStreak < (has(s, 'secondwind') ? 2 : 1);
  }
  function flee(s) {
    if (!canFlee(s)) return false;
    s.draw.push(...s.room); s.room = s.draw.splice(0, 4); s.fledStreak++; newRoom(s);
    if (s.boss && s.boss.key === 'fleeToll') { s.hp -= 4; log(s, 'Fled past the Warden: -4 HP.'); }
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
    const name = rankLabel(c.v) + c.suit;
    if (c.kind === 'monster') log(s, `${name}: took ${out.dmg} damage` + (s.hp > 0 ? `${s.contract.survival ? '' : `, +${out.points} points`}${out.heal ? `, healed ${out.heal}` : ''}${out.gold ? `, +${out.gold} gold` : ''}.` : '.'));
    else if (c.kind === 'weapon') log(s, `Equipped a ${s.weapon.v}♦ weapon.`);
    else log(s, (out.heal ? `${name}: healed ${out.heal}` : `${name}: no healing`) + (out.points ? `, +${out.points} points.` : '.'));
    if (s.hp <= 0) { s.hp = 0; s.phase = 'lost'; s.lastResult = 'You fell in the dungeon.'; return true; }
    if (s.handled === 3) {
      s.roomsCleared++; s.fledStreak = 0; newRoom(s);
      if (s.roomsCleared >= (s.tutorial ? TUTORIAL_ROOMS : ROOMS_PER_FLOOR)) endFloor(s);
      else s.room.push(...s.draw.splice(0, 4 - s.room.length));
    }
    return true;
  }
  function endFloor(s) {
    const c = s.contract; s.totalSlain += s.slain;
    if (s.tutorial) { s.phase = 'tutdone'; s.lastResult = `You made it through with ${s.hp} health left.`; return; }
    let msg;
    if (c.survival) {
      s.gold += c.pay;
      msg = `Floor survived. The guild pays you ${c.pay} gold.`;
    } else if (s.slain >= c.target) {
      const over = Math.floor((s.slain - c.target) / (has(s, 'taxman') ? 2 : 5));
      s.gold += c.pay + over;
      msg = `Contract met: ${s.slain}/${c.target}. +${c.pay} gold` + (over ? `, +${over} overkill.` : '.');
      if (has(s, 'bloodpact')) { s.maxHp += 2; s.hp += 2; msg += ' Blood Pact: +2 max HP.'; }
    } else {
      if (has(s, 'seal') && !s.sealUsed) { s.sealUsed = true; msg = `Contract missed (${s.slain}/${c.target}), but the Insurance Seal covers it.`; }
      else { s.strikes++; msg = `Contract missed: ${s.slain}/${c.target}. Strike ${s.strikes} of 3.`; }
      if (has(s, 'loanshark')) { s.gold = Math.max(0, s.gold - 8); msg += ' The loan shark takes 8 gold.'; }
    }
    const interest = c.survival ? 0 : Math.min(has(s, 'tithe') ? 6 : 3, Math.floor(s.gold / 5));
    s.gold += interest;
    if (interest) msg += ` Interest +${interest}.`;
    if (s.floor % 3 === 2 && !locked(s, 'contracts')) { // no dues before contracts begin
      const due = DUES[act(s)];
      if (s.gold >= due) { s.gold -= due; msg += ` Paid ${due} gold in guild dues.`; }
      else { s.strikes++; s.gold = 0; msg += ` Couldn't pay ${due} gold in dues: strike ${s.strikes} of 3, and the guild takes what you have.`; }
    }
    log(s, msg); s.lastResult = msg;
    if (s.strikes >= 3) { s.phase = 'lost'; s.lastResult = msg + ' The guild revokes your license.'; return; }
    if (s.floor === FLOORS - 1) { s.phase = 'won'; return; }
    s.phase = 'shop';
    const pool = Object.keys(RELICS).filter(k => !has(s, k));
    s.shop = { relics: locked(s, 'relics') ? [] : shuffle(pool, s.r).slice(0, 3), bought: {} };
  }
  const SERVICES = {
    bandage: { name: 'Bandage', text: 'Heal 6 HP.', cost: 3 },
    cull: { name: 'Cull', text: 'Remove your strongest monster from the dungeon.', cost: 5 },
    smith: { name: 'Smith', text: 'Add a random 6-10 weapon to the dungeon.', cost: 4 },
  };
  function buy(s, what) {
    if (s.phase !== 'shop' || s.shop.bought[what]) return false;
    const item = RELICS[what] || SERVICES[what];
    if (!item || s.gold < item.cost) return false;
    if (RELICS[what]) {
      if (s.relics.length >= MAX_RELICS || !s.shop.relics.includes(what)) return false;
      s.relics.push(what);
      if (what === 'hide') { s.maxHp += 6; s.hp = Math.min(s.maxHp, s.hp + 6); }
    } else if (what === 'bandage') s.hp = Math.min(s.maxHp, s.hp + 6);
    else if (what === 'cull') {
      const ms = s.deck.filter(c => c.kind === 'monster').sort((a, b) => b.v - a.v);
      s.deck = s.deck.filter(c => c !== ms[0]);
      log(s, `Culled a ${rankLabel(ms[0].v)}${ms[0].suit} from the dungeon.`);
    } else if (what === 'smith') {
      const v = 6 + Math.floor(s.r() * 5); s.deck.push(card('weapon', v, '♦'));
      log(s, `The smith forged a ${v}♦.`);
    }
    s.gold -= item.cost; s.shop.bought[what] = true;
    return true;
  }
  function dropRelic(s, key) {
    s.relics = s.relics.filter(k => k !== key);
    if (key === 'hide') { s.maxHp -= 6; s.hp = Math.min(s.hp, s.maxHp); }
  }
  function leaveShop(s) { if (s.phase !== 'shop') return; s.floor++; startFloor(s); }

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
    MAX_HP, ROOMS_PER_FLOOR, TUTORIAL_ROOMS, FLOORS, UNLOCK, SURVIVAL_PAY, MAX_RELICS, TIERS, TARGETS, DUES, BOSSES, RELICS, SERVICES, CLAUSES,
    newGame, newTutorial, bid, flee, canFlee, handle, buy, dropRelic, leaveShop, allowedTiers, payout,
    canRaise, raise, canRedraw, redraw,
    canUseWeapon, monsterDamage, contractPoints, potionHeal, resolveCard, rankLabel, act,
  };
  if (typeof module !== 'undefined') module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
