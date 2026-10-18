// Rule checks for every relic, the guild dues and the dev-mode helpers. Run with `node src/test.js`.
const E = require('./engine.js');
let fails = 0, passes = 0;
const ok = (cond, what) => { if (cond) passes++; else { fails++; console.log('FAIL', what); } };
const eq = (a, b, what) => ok(a === b, `${what}: expected ${b}, got ${a}`);

// A full-game state on floor f with the given relics, a chosen room and draw pile.
let id = 9000;
const C = (kind, v) => ({ id: id++, kind, v, suit: kind === 'monster' ? '♠' : kind === 'weapon' ? '♦' : '♥' });
const M = v => C('monster', v), W = v => C('weapon', v), P = v => C('potion', v);
function game({ floor = 3, relics = [], room, draw, tier = 0, hp, weapon, gold } = {}) {
  const s = E.newGame(1);
  E.devJump(s, floor);
  relics.forEach(k => E.devGrant(s, k));
  if (s.phase === 'bid') E.bid(s, s.offers.findIndex(o => o.tier === tier && !o.clause));
  if (room) s.room = room;
  if (draw) s.draw = draw.concat(s.draw);
  if (hp != null) s.hp = hp;
  if (weapon) s.weapon = { v: weapon[0], limit: weapon[1] };
  if (gold != null) s.gold = gold;
  return s;
}
const fight = (s, c, mode) => { const hp = s.hp, slain = s.slain, gold = s.gold; E.handle(s, c.id, mode); return { lost: hp - s.hp, pts: s.slain - slain, gold: s.gold - gold }; };
// Finish the floor: clear rooms with harmless potions until it ends.
function clearFloor(s) {
  for (let n = 0; s.phase === 'room' && n < 40; n++) {
    s.room = [W(2), W(2), W(2), W(2)];
    E.handle(s, s.room[0].id);
  }
}

// ---------- weapons ----------

// ---------- defense and healing ----------
{ const a = M(9), b = M(9), s = game({ relics: ['buckler'], room: [a, b, M(2), M(2)] });
  const r = fight(s, a, 'bare'); eq(r.lost, 0, 'Buckler: the first fight in the room can\'t hurt you'); eq(r.pts, 4, 'Buckler: and it scores half');
  eq(fight(s, b, 'bare').lost, 9, 'Buckler: second fight is full damage'); }
{ const m = M(8), s = game({ relics: ['fang'], hp: 15, room: [m, M(2), M(2), M(2)] });
  eq(fight(s, m, 'bare').lost, 4, 'Vampire Fang: a bare kill of an 8 heals 4 (net -4)');
  const m2 = M(3), s2 = game({ relics: ['fang'], hp: 15, weapon: [2, null], room: [m2, M(2), M(2), M(2)] });
  eq(fight(s2, m2, 'weapon').lost, 1, 'Vampire Fang: weapon kills don\'t heal'); }

// ---------- movement ----------
{ const s = game({ relics: ['fortune'] }); const old = s.room.map(c => c.id);
  ok(E.redraw(s), 'Fortune Teller: redraw'); ok(!s.room.some(c => old.includes(c.id)), 'Fortune Teller: four new cards');
  ok(!E.redraw(s), 'Fortune Teller: once per floor'); }

// ---------- points ----------
{ const m = M(3), s = game({ relics: ['berserk'], hp: 8, room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').pts, 8, 'Berserker: kill landing at 5 HP counts +5'); }
{ const p = P(8), s = game({ relics: ['alchemist'], hp: 17, room: [p, M(2), M(2), M(2)] });
  E.handle(s, p.id); eq(s.slain, 5, 'Alchemist: 5 overheal counts 5 points'); }

// ---------- contracts and gold ----------
{ const s = game({ relics: ['taxman'], floor: 3, gold: 0 }); s.slain = s.contract.target + 10; clearFloor(s);
  const pay = s.contract.pay; eq(s.gold, pay + 5 + Math.min(3, Math.floor((pay + 5) / 5)), 'Taxman: 10 over pays 5'); }
{ const s = game({ floor: 3, gold: 20 }); s.phase = 'shop'; s.shop = { relics: ['loanshark'], bought: {} }; E.buy(s, 'loanshark');
  eq(s.gold, 20 - E.cost(s, 'loanshark'), 'Loan Shark: bought'); const g = s.gold; E.leaveShop(s); eq(s.gold, g + 4, 'Loan Shark: +4 at the start of the next floor');
  E.bid(s, 0); s.slain = 0; s.gold = 20; clearFloor(s); ok(s.gold <= 12 + 3, 'Loan Shark: a missed contract costs 8'); }

// ---------- 1.29.0 relics ----------
{ const m = M(12), s = game({ relics: ['executioner'], weapon: [12, null], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'weapon').pts, 18, 'Executioner: weapon kill of 12 counts 18');
  const m2 = M(11), s2 = game({ relics: ['executioner'], weapon: [11, null], room: [m2, M(2), M(2), M(2)] }); eq(fight(s2, m2, 'weapon').pts, 11, 'Executioner: an 11 counts as usual'); }
{ const m = M(13), s = game({ relics: ['unbreaking'], weapon: [9, null], room: [m, M(2), M(2), M(2)] }); fight(s, m, 'weapon'); eq(s.weapon.limit, null, 'Unbreaking Edge: never dulls'); }
{ const a = M(4), b = M(4), s = game({ relics: ['haymaker'], room: [a, b, M(2), M(2)] });
  eq(fight(s, a, 'bare').pts, 8, 'Haymaker: first bare kill doubles'); eq(fight(s, b, 'bare').pts, 4, 'Haymaker: second is normal'); }
{ const m = M(9), s = game({ relics: ['giantsgrip'], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').lost, 4, "Giant's Grip: a 9 bare deals 4"); }
{ const s = game({ hp: 5 }); E.devGrant(s, 'hagheart'); eq(s.maxHp, 20, "Hag's Heart: no extra max health");
  const a = P(3), b = P(3), c = P(3); s.room = [a, b, c, M(2)]; E.handle(s, a.id); eq(s.hp, 11, "Hag's Heart: first potion heals double");
  E.handle(s, b.id); eq(s.hp, 14, "Hag's Heart: a second potion in the room still works"); E.handle(s, c.id); eq(s.hp, 14, "Hag's Heart: not a third"); }
{ const s = game({ hp: 5 }); const a = P(3), b = P(3); s.room = [a, b, M(2), M(2)]; E.handle(s, a.id); E.handle(s, b.id); eq(s.hp, 8, 'base: only one potion works per room'); }
{ const w = W(8), s = game({ relics: ['unbreaking'], weapon: [5, null], room: [w, M(2), M(2), M(2)] }); E.handle(s, w.id);
  eq(s.weapon.v, 5, 'Unbreaking Edge: a new weapon is thrown away while you hold one');
  const w2 = W(8), s2 = game({ relics: ['unbreaking'], room: [w2, M(2), M(2), M(2)] }); E.handle(s2, w2.id); eq(s2.weapon.v, 8, 'Unbreaking Edge: bare-handed, you take it'); }
{ const s = game({ relics: ['livingsteel'] }); const w = s.deck.find(c => c.kind === 'weapon'); const v0 = w.v;
  s.room = [{ ...w }, M(2), M(2), M(2)]; E.handle(s, w.id); const m = M(3); s.room[0] = m; fight(s, m, 'weapon');
  eq(s.deck.find(c => c.id === w.id).v, v0 + 1, 'Living Steel: a weapon kill raises that weapon card'); eq(s.weapon.v, v0 + 1, 'Living Steel: and the weapon in hand');
  for (let i = 0; i < 8; i++) { const m2 = M(2); s.room[0] = m2; s.weapon.limit = null; fight(s, m2, 'weapon'); }
  eq(s.deck.find(c => c.id === w.id).v, v0 + 5, 'Living Steel: up to +5 a card'); }
{ const m = M(4), s = game({ relics: ['idol'], gold: 32, room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').pts, 6, 'Golden Idol: 25 gold adds 2'); }
{ const s = game({ relics: ['bribe'], floor: 3, gold: 15 }); s.slain = 0; clearFloor(s); eq(s.strikes, 0, 'Bribe: no strike'); eq(s.payout.outcome, 'covered', 'Bribe: covered');
  const t = game({ relics: ['bribe'], floor: 3, gold: 5 }); t.slain = 0; clearFloor(t); eq(t.strikes, 1, 'Bribe: a strike when you can\'t pay'); }
{ const s = game({ relics: ['lichledger'], floor: 2, gold: 100 }); s.slain = 999; clearFloor(s);
  ok(/Interest \+\d{2,}/.test(s.lastResult), "Lich's Ledger: interest has no cap"); }
{ const s = game({ relics: ['lichledger'], floor: 1, gold: 50, room: [P(2), P(2), P(2), P(2)] }); for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  eq(s.gold, 60, "Lich's Ledger: interest after a room"); }
{ const s = game({ relics: ['wardrum'], floor: 4 }); s.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  const b = s.slain; E.raise(s); eq(s.slain, b + 6, 'War Drum: raising counts 6'); }
{ const s = game({ relics: ['sanguine'], floor: 4, hp: 10 }); const t = s.contract.target;
  ok(E.seal(s), 'Sanguine Seal: seal between rooms'); eq(s.contract.target, t - 5, 'Sanguine Seal: target 5 lower'); eq(s.hp, 7, 'Sanguine Seal: costs 3 health');
  ok(!E.canSeal(s), 'Sanguine Seal: once a room'); E.handle(s, s.room[0].id); ok(!E.canSeal(s), 'Sanguine Seal: only between rooms'); }
{ const s = game({ relics: ['smokebomb'] }); ok(E.flee(s) && E.flee(s) && E.flee(s), 'Smoke Bomb: flee three in a row'); ok(!E.canFlee(s), 'Smoke Bomb: not four'); }
{ const s = game({ relics: ['smokebomb', 'wardenkeys'], hp: 10 }); E.flee(s); E.flee(s); E.flee(s); eq(s.hp, 12, "Warden's Keys: back-to-back flees heal only once"); }
{ const s = game({ relics: ['wardenkeys'], floor: 2, hp: 3, room: [P(2), P(2), M(2), M(2)] }); s.hp = 3; E.handle(s, s.room[0].id); E.handle(s, s.room[0].id);
  ok(E.canFlee(s), "Warden's Keys: flee after 2 cards, past the Warden at low health"); E.flee(s); ok(s.hp >= 3, "Warden's Keys: fleeing costs nothing"); }

// ---------- relic picks ----------
{ const s = game({ floor: 3 }); s.slain = 0; clearFloor(s);
  ok(s.pick && s.pick.options.length === 3 && new Set(s.pick.options).size === 3, 'pick: three different relics after a floor');
  ok(!E.buy(s, 'bandage'), 'pick: the shop waits for the pick'); const k = s.pick.options[0];
  ok(E.choose(s, k) && s.relics.includes(k) && !s.pick, 'pick: choosing takes the relic');
  ok(s.shop.relics.length === 1 && E.RELICS[s.shop.relics[0]].rarity !== 'common', 'shop: one rare or epic relic for sale'); }
{ const s = game({ floor: 2, tier: 2 }); s.slain = 999; clearFloor(s); ok(s.pick.boss && s.pick.options.every(k => k === 'trophy' || E.RELICS[k]), 'pick: boss floors offer a pick'); }
{ let epic = 0, trophy = 0; for (let i = 0; i < 400; i++) { const s = E.newGame(100 + i); E.devJump(s, 2); E.bid(s, 0); s.slain = 999; clearFloor(s);
    if (!s.pick) continue; s.pick.options.forEach(k => { if (k !== 'trophy' && E.RELICS[k].rarity === 'epic') epic++; }); if (s.pick.options.includes('trophy')) trophy++; }
  ok(epic > 250, 'pick odds: a boss pick rolls plenty of epics (' + epic + ')'); ok(trophy > 50 && trophy < 160, 'pick odds: about 1 in 4 boss picks offers a trophy (' + trophy + ')'); }
{ let epic = 0, n = 0; for (let i = 0; i < 300; i++) { const s = E.newGame(900 + i); E.devJump(s, 1); E.bid(s, 0); s.slain = 0; clearFloor(s);
    if (!s.pick) continue; s.pick.options.forEach(k => { n++; if (E.RELICS[k].rarity === 'epic') epic++; }); ok(!s.pick.options.includes('trophy'), 'pick: no trophies on normal floors'); }
  ok(epic / n < 0.12, 'pick odds: epics are scarce after a normal floor (' + epic + '/' + n + ')'); }
{ const s = game({ floor: 2, tier: 0 }); s.slain = 999; clearFloor(s); s.pick.trophy = { v: 14, name: 'Test Boss', bossKey: 'ogre' }; s.pick.options[2] = 'trophy';
  const n = s.deck.length; ok(E.choose(s, 'trophy'), 'trophy: can be chosen'); const t = s.deck[s.deck.length - 1];
  ok(s.deck.length === n + 1 && t.kind === 'weapon' && t.v === 14 && t.trophy, 'trophy: the boss joins your deck as a 14 weapon'); ok(!s.relics.includes('trophy'), 'trophy: takes no belt slot'); }
{ const s = game({ floor: 3, tier: 2 }); s.slain = 999; clearFloor(s); ok(s.pick.options.every(k => E.RELICS[k].rarity !== 'common'), 'pick: a met Reckless contract offers no commons'); }
{ const s = game({ floor: 3, gold: 0 }); s.slain = 0; clearFloor(s); const g = s.gold; E.skipPick(s); eq(s.gold, g + E.SKIP_GOLD, 'pick: skipping pays gold'); }
{ const s = game({ floor: 3, gold: 0 }); s.slain = 0; clearFloor(s); eq(E.SKIP_GOLD, 8, 'pick: skipping pays 8 gold');
  ok(!E.rerollShop(s), 'reroll: the pick comes first'); E.skipPick(s); s.gold = 30; const first = s.shop.relics[0];
  eq(E.rerollCost(s), 2, 'reroll: the first costs 2');
  ok(E.rerollShop(s) && s.gold === 28 && s.shop.relics.length === 1 && s.shop.relics[0] !== first && E.RELICS[s.shop.relics[0]].rarity !== 'common', 'reroll: swaps the relic for another rare or epic one');
  eq(E.rerollCost(s), 4, 'reroll: the next costs 2 more'); E.rerollShop(s); eq(s.gold, 24, 'reroll: the second cost 4');
  E.buy(s, s.shop.relics[0]); const g = s.gold; ok(E.rerollShop(s) && s.gold === g - 6 && !s.shop.bought[s.shop.relics[0]], 'reroll: a sold shelf can be rerolled for a new relic');
  s.gold = 7; ok(!E.rerollShop(s) && s.gold === 7, 'reroll: not without the gold');
  E.leaveShop(s); E.bid(s, 0); s.slain = 0; clearFloor(s); E.skipPick(s); eq(s.phase, 'shop', 'reroll: next shop'); eq(E.rerollCost(s), 2, 'reroll: the price starts over at the next shop'); }
{ const s = game({ floor: 3 }); Object.keys(E.RELICS).slice(0, E.MAX_RELICS).forEach(k => E.devGrant(s, k)); s.slain = 0; clearFloor(s);
  ok(!E.choose(s, s.pick.options[0]), 'pick: a full belt must drop one first'); E.dropRelic(s, s.relics[0]); ok(E.choose(s, s.pick.options[0]), 'pick: then it fits'); }
{ const s = E.newGame(3, { guided: true }); clearFloor(s); ok(s.pick && s.pick.options.length === 3, 'guided: a relic pick after floor 1'); }

// ---------- guild dues ----------
for (const mode of ['full', 'guided']) {
  for (const a of [0, 1, 2]) {
    if (mode === 'guided' && a === 0) continue; // act 1 of a guided run has no contracts, strikes or dues
    const s = E.newGame(2, { guided: mode === 'guided' }); E.devJump(s, a * 3 + 2);
    if (s.phase === 'bid') E.bid(s, 0);
    s.gold = 50; s.slain = 999; clearFloor(s);
    ok(/Paid \d+ gold in guild dues/.test(s.lastResult), `${mode} act ${a + 1}: dues collected (${s.lastResult})`);
    if (a < 2) ok(s.phase === 'shop', `${mode} act ${a + 1}: on to the shop`);
    const t = E.newGame(2, { guided: mode === 'guided' }); E.devJump(t, a * 3 + 2);
    if (t.phase === 'bid') E.bid(t, 0);
    t.gold = 0; t.slain = t.contract.target; t.contract.pay = 0; clearFloor(t);
    ok(t.strikes === 1 && /Couldn't pay/.test(t.lastResult), `${mode} act ${a + 1}: unpaid dues give a strike`);
  }
}
{ const s = E.newGame(3, { guided: true }); E.devJump(s, 2); s.gold = 50; clearFloor(s);
  ok(!/dues/.test(s.lastResult), 'guided act 1: no dues'); }
{ // what the HUD shows: the dues for the act you're in, or heading into from the shop
  const s = E.newGame(4); E.devJump(s, 2); E.bid(s, 0); s.gold = 50; s.slain = 999; clearFloor(s);
  eq(E.duesAhead(s).due, E.DUES[1], 'in the shop after act 1, the next dues are act 2\'s');
  eq(E.duesAhead(s).floor, 6, 'act 2 dues are collected after floor 6'); }

// ---------- 2.x relics ----------
{ const s = game({ relics: ['hardknuckles'], room: [M(9), M(2), M(2), M(2)] }); s.bareKills = 6;
  eq(fight(s, s.room[0], 'bare').lost, 7, 'Hardened Knuckles: 6 bare kills take 2 off'); eq(s.bareKills, 7, 'Hardened Knuckles: kills keep counting'); }
{ const s = game({ relics: ['twinblades'], room: [W(8), W(4), M(7), M(2)] });
  E.handle(s, s.room[0].id); E.handle(s, s.room[0].id); eq(s.weapon.v, 4, 'Twin Blades: the new weapon is in hand'); eq(s.weapon2.v, 8, 'Twin Blades: the old one moves to the off hand');
  const m = s.room[0]; ok(E.modes(s, m).includes('weapon2'), 'Twin Blades: fight with the off hand');
  eq(fight(s, m, 'weapon2').lost, 0, 'Twin Blades: the 8 blocks a 7'); eq(s.weapon2.limit, 7, 'Twin Blades: the off-hand weapon dulls, not the main one'); eq(s.weapon.limit, null, 'Twin Blades: main untouched'); }
{ const a = M(4), b = M(6), s = game({ relics: ['cleave'], weapon: [9, null], room: [a, b, M(2), M(2)] });
  fight(s, a, 'weapon'); eq(s.cleave, 5, 'Cleave: a 9 beats a 4 by 5'); eq(fight(s, b, 'bare').lost, 1, 'Cleave: 5 comes off the next fight (6 bare deals 1)'); eq(s.cleave, 0, 'Cleave: used up'); }
{ const s = game({ relics: ['glassblade'], room: [W(5), M(2), M(2), M(2)] }); E.handle(s, s.room[0].id); eq(s.weapon.v, 8, 'Glass Blade: a 5 equips as 8');
  s.room = [M(2), M(2), M(2), M(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id, 'weapon'); eq(s.weapon, null, 'Glass Blade: shatters after 3 kills'); }
{ const s = game({ relics: ['bell'], room: [M(7), M(2), M(2), M(2)] }); const n = s.draw.length; E.handle(s, s.room[0].id, 'bare');
  ok(s.draw.length === n + 1 && s.draw.some(c => c.bell && c.kind === 'potion' && c.v === 7), "Necromancer's Bell: a 7 comes back as a 7 potion"); }
{ const s = game({ hp: 10 }); E.devGrant(s, 'ironball'); eq(s.maxHp, 40, 'Iron Ball: +20 max'); eq(s.hp, 30, 'Iron Ball: heals 20'); ok(!E.canFlee(s), 'Iron Ball: no fleeing');
  E.dropRelic(s, 'ironball'); eq(s.maxHp, 20, 'Iron Ball: dropping it takes the 20 back'); }
{ const p = P(5), s = game({ relics: ['alchemykit'], room: [p, M(2), M(2), M(2)] }); ok(E.modes(s, p).includes('equip'), 'Alchemy Kit: a potion can be equipped');
  E.handle(s, p.id, 'equip'); eq(s.weapon && s.weapon.v, 5, 'Alchemy Kit: a 5 potion is a 5 weapon'); }
{ const s = game({ relics: ['hunger'], hp: 10, room: [P(6), M(3), M(2), M(2)] }); E.handle(s, s.room[0].id); eq(s.hp, 10, 'Pact of Hunger: potions do not heal');
  E.handle(s, s.room[0].id, 'bare'); eq(s.hp, 10 - 3 + 2, 'Pact of Hunger: a kill heals 2'); }
{ const s = game({ relics: ['mimic'], hp: 10, room: [M(4), P(5), M(9), M(2)] });
  ok(E.modes(s, s.room[0]).includes('drink') && !E.modes(s, s.room[2]).includes('drink'), "Mimic's Tongue: only 4 or lower can be drunk");
  E.handle(s, s.room[0].id, 'drink'); eq(s.hp, 14, "Mimic's Tongue: a 4 monster heals 4"); const b = s.slain;
  E.handle(s, s.room[0].id, 'bare'); eq(s.hp, 9, "Mimic's Tongue: fighting a 5 potion costs 5"); eq(s.slain - b, 5, "Mimic's Tongue: and counts 5 points"); }
{ const s = game({ relics: ['compound'], floor: 3, gold: 100 }); s.slain = s.contract.target; clearFloor(s);
  eq(s.gold, 100 + s.contract.pay + 5, 'Compound Purse: interest cap 5 after one floor'); eq(E.interestCap(s), 5, 'Compound Purse: cap shown'); }
{ const s = game({ relics: ['miser'], floor: 3, gold: 0 }); s.slain = 999; clearFloor(s); E.skipPick(s); let g = s.gold; E.leaveShop(s); eq(s.gold, g + 2, "Miser's Purse: first shop left pays 2");
  E.bid(s, 0); s.slain = 999; clearFloor(s); E.skipPick(s); g = s.gold; E.leaveShop(s); eq(s.gold, g + 4, "Miser's Purse: second in a row pays 4");
  E.bid(s, 0); s.slain = 999; clearFloor(s); E.skipPick(s); E.buy(s, 'bandage'); g = s.gold; E.leaveShop(s); eq(s.gold, g, "Miser's Purse: spending breaks the streak"); eq(s.miserStreak, 0, "Miser's Purse: streak reset"); }
{ const s = game({ relics: ['cursed'], floor: 3 }); eq(E.payout(s, 1), 4 * 2 * 3, 'Cursed Contract: Bold pays triple'); s.slain = 0; clearFloor(s); eq(s.maxHp, 15, 'Cursed Contract: a miss costs 5 max health'); }
{ const s = game({ relics: ['greedy'], gold: 0, room: [P(2), P(2), P(2), P(2)] }); for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  eq(s.roomsCleared, 0, 'Greedy Hands: 3 cards is not enough'); E.handle(s, s.room[0].id); eq(s.roomsCleared, 1, 'Greedy Hands: all 4 clears it'); eq(s.gold, 3, 'Greedy Hands: +3 gold');
  eq(s.room.length, 4, 'Greedy Hands: the next room is dealt fresh'); }
{ const p = P(7), s = game({ relics: ['stash'], hp: 10, room: [p, M(2), M(2), M(2)] }); ok(E.stash(s, p.id), 'Stash Pouch: set a card aside'); eq(s.handled, 1, 'Stash Pouch: it counts as taken');
  ok(!E.canStash(s, s.room[0].id), 'Stash Pouch: one at a time'); E.handle(s, s.room[0].id, 'bare'); E.handle(s, s.room[0].id, 'bare'); eq(s.roomsCleared, 1, 'Stash Pouch: the room still ends');
  ok(E.useStash(s), 'Stash Pouch: drink it in a later room'); eq(s.hp, 6 + 7, 'Stash Pouch: the potion heals'); eq(s.stash, null, 'Stash Pouch: empty again'); eq(s.handled, 0, 'Stash Pouch: playing it is free'); }
{ const s = game({ relics: ['spyglass'] }); eq(E.nextCards(s).map(c => c.id).join(), s.draw.slice(0, 3).map(c => c.id).join(), 'Spyglass: the next 3 cards'); }
{ const s = game({ relics: ['bait'], room: [M(12), M(5), P(3), W(4)] }); const n = s.draw.length; E.flee(s); eq(s.draw.length, n + 3 - 4, 'Bait: one card fewer goes back (and 4 are dealt)');
  ok(!s.draw.some(c => c.v === 12 && c.kind === 'monster' && c.id === 9999), 'Bait: the 12 is gone'); }
{ const s = game({ relics: ['bloodprice'], hp: 10 }); const old = s.room[1], top = s.draw[0];
  ok(E.swapCard(s, old.id), 'Blood Price: swap a card'); eq(s.hp, 9, 'Blood Price: costs 1'); eq(s.room[1].id, top.id, 'Blood Price: the top of the pile takes its place');
  eq(s.draw[s.draw.length - 1].id, old.id, 'Blood Price: the old card goes to the bottom'); ok(!E.canSwap(s, s.room[0].id), 'Blood Price: once a room'); }
{ const a = M(5), b = M(5), s = game({ relics: ['echo'], room: [a, b, M(2), M(2)] });
  eq(fight(s, a, 'bare').pts, 10, 'Echo: the first kill in a room scores double'); eq(fight(s, b, 'bare').pts, 5, 'Echo: the second scores as usual'); }
{ const p = P(5), s = game({ relics: ['echo'], hp: 5, room: [p, M(2), M(2), M(2)] }); E.handle(s, p.id); eq(s.hp, 15, 'Echo: a first potion heals double'); }
{ const w = W(5), s = game({ relics: ['echo'], room: [w, M(2), M(2), M(2)] }); E.handle(s, w.id); eq(s.weapon.v, 8, 'Echo: a first weapon is 3 stronger'); }
{ const s = game({ relics: ['wardrum'], floor: 4 }); s.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  const b = s.slain; E.raise(s); eq(s.slain, b + 6, 'War Drum: raising counts 6'); }
{ const s = game({ relics: ['sanguine'], floor: 4, hp: 10 }); const t = s.contract.target;
  ok(E.seal(s), 'Sanguine Seal: seal between rooms'); eq(s.contract.target, t - 5, 'Sanguine Seal: target 5 lower'); eq(s.hp, 7, 'Sanguine Seal: costs 3 health');
  ok(!E.canSeal(s), 'Sanguine Seal: once a room'); E.handle(s, s.room[0].id); ok(!E.canSeal(s), 'Sanguine Seal: only between rooms'); }
{ const s = game({ relics: ['smokebomb'] }); ok(E.flee(s) && E.flee(s) && E.flee(s), 'Smoke Bomb: flee three in a row'); ok(!E.canFlee(s), 'Smoke Bomb: not four'); }
{ const s = game({ relics: ['smokebomb', 'wardenkeys'], hp: 10 }); E.flee(s); E.flee(s); E.flee(s); eq(s.hp, 12, "Warden's Keys: back-to-back flees heal only once"); }
{ const s = game({ relics: ['wardenkeys'], floor: 2, hp: 3, room: [P(2), P(2), M(2), M(2)] }); s.hp = 3; E.handle(s, s.room[0].id); E.handle(s, s.room[0].id);
  ok(E.canFlee(s), "Warden's Keys: flee after 2 cards, past the Warden at low health"); E.flee(s); ok(s.hp >= 3, "Warden's Keys: fleeing costs nothing"); }

// ---------- relic picks ----------
{ const s = game({ floor: 3 }); s.slain = 0; clearFloor(s);
  ok(s.pick && s.pick.options.length === 3 && new Set(s.pick.options).size === 3, 'pick: three different relics after a floor');
  ok(!E.buy(s, 'bandage'), 'pick: the shop waits for the pick'); const k = s.pick.options[0];
  ok(E.choose(s, k) && s.relics.includes(k) && !s.pick, 'pick: choosing takes the relic');
  ok(s.shop.relics.length === 1 && E.RELICS[s.shop.relics[0]].rarity !== 'common', 'shop: one rare or epic relic for sale'); }
{ const s = game({ floor: 2, tier: 2 }); s.slain = 999; clearFloor(s); ok(s.pick.boss && s.pick.options.every(k => k === 'trophy' || E.RELICS[k]), 'pick: boss floors offer a pick'); }
{ let epic = 0, trophy = 0; for (let i = 0; i < 400; i++) { const s = E.newGame(100 + i); E.devJump(s, 2); E.bid(s, 0); s.slain = 999; clearFloor(s);
    if (!s.pick) continue; s.pick.options.forEach(k => { if (k !== 'trophy' && E.RELICS[k].rarity === 'epic') epic++; }); if (s.pick.options.includes('trophy')) trophy++; }
  ok(epic > 250, 'pick odds: a boss pick rolls plenty of epics (' + epic + ')'); ok(trophy > 50 && trophy < 160, 'pick odds: about 1 in 4 boss picks offers a trophy (' + trophy + ')'); }
{ let epic = 0, n = 0; for (let i = 0; i < 300; i++) { const s = E.newGame(900 + i); E.devJump(s, 1); E.bid(s, 0); s.slain = 0; clearFloor(s);
    if (!s.pick) continue; s.pick.options.forEach(k => { n++; if (E.RELICS[k].rarity === 'epic') epic++; }); ok(!s.pick.options.includes('trophy'), 'pick: no trophies on normal floors'); }
  ok(epic / n < 0.12, 'pick odds: epics are scarce after a normal floor (' + epic + '/' + n + ')'); }
{ const s = game({ floor: 2, tier: 0 }); s.slain = 999; clearFloor(s); s.pick.trophy = { v: 14, name: 'Test Boss', bossKey: 'ogre' }; s.pick.options[2] = 'trophy';
  const n = s.deck.length; ok(E.choose(s, 'trophy'), 'trophy: can be chosen'); const t = s.deck[s.deck.length - 1];
  ok(s.deck.length === n + 1 && t.kind === 'weapon' && t.v === 14 && t.trophy, 'trophy: the boss joins your deck as a 14 weapon'); ok(!s.relics.includes('trophy'), 'trophy: takes no belt slot'); }
{ const s = game({ floor: 3, tier: 2 }); s.slain = 999; clearFloor(s); ok(s.pick.options.every(k => E.RELICS[k].rarity !== 'common'), 'pick: a met Reckless contract offers no commons'); }
{ const s = game({ floor: 3, gold: 0 }); s.slain = 0; clearFloor(s); const g = s.gold; E.skipPick(s); eq(s.gold, g + E.SKIP_GOLD, 'pick: skipping pays gold'); }
{ const s = game({ floor: 3, gold: 0 }); s.slain = 0; clearFloor(s); eq(E.SKIP_GOLD, 8, 'pick: skipping pays 8 gold');
  ok(!E.rerollShop(s), 'reroll: the pick comes first'); E.skipPick(s); s.gold = 30; const first = s.shop.relics[0];
  eq(E.rerollCost(s), 2, 'reroll: the first costs 2');
  ok(E.rerollShop(s) && s.gold === 28 && s.shop.relics.length === 1 && s.shop.relics[0] !== first && E.RELICS[s.shop.relics[0]].rarity !== 'common', 'reroll: swaps the relic for another rare or epic one');
  eq(E.rerollCost(s), 4, 'reroll: the next costs 2 more'); E.rerollShop(s); eq(s.gold, 24, 'reroll: the second cost 4');
  E.buy(s, s.shop.relics[0]); const g = s.gold; ok(E.rerollShop(s) && s.gold === g - 6 && !s.shop.bought[s.shop.relics[0]], 'reroll: a sold shelf can be rerolled for a new relic');
  s.gold = 7; ok(!E.rerollShop(s) && s.gold === 7, 'reroll: not without the gold');
  E.leaveShop(s); E.bid(s, 0); s.slain = 0; clearFloor(s); E.skipPick(s); eq(s.phase, 'shop', 'reroll: next shop'); eq(E.rerollCost(s), 2, 'reroll: the price starts over at the next shop'); }
{ const s = game({ floor: 3 }); Object.keys(E.RELICS).slice(0, E.MAX_RELICS).forEach(k => E.devGrant(s, k)); s.slain = 0; clearFloor(s);
  ok(!E.choose(s, s.pick.options[0]), 'pick: a full belt must drop one first'); E.dropRelic(s, s.relics[0]); ok(E.choose(s, s.pick.options[0]), 'pick: then it fits'); }
{ const s = E.newGame(3, { guided: true }); clearFloor(s); ok(s.pick && s.pick.options.length === 3, 'guided: a relic pick after floor 1'); }

// ---------- guild dues ----------
for (const mode of ['full', 'guided']) {
  for (const a of [0, 1, 2]) {
    if (mode === 'guided' && a === 0) continue; // act 1 of a guided run has no contracts, strikes or dues
    const s = E.newGame(2, { guided: mode === 'guided' }); E.devJump(s, a * 3 + 2);
    if (s.phase === 'bid') E.bid(s, 0);
    s.gold = 50; s.slain = 999; clearFloor(s);
    ok(/Paid \d+ gold in guild dues/.test(s.lastResult), `${mode} act ${a + 1}: dues collected (${s.lastResult})`);
    if (a < 2) ok(s.phase === 'shop', `${mode} act ${a + 1}: on to the shop`);
    const t = E.newGame(2, { guided: mode === 'guided' }); E.devJump(t, a * 3 + 2);
    if (t.phase === 'bid') E.bid(t, 0);
    t.gold = 0; t.slain = t.contract.target; t.contract.pay = 0; clearFloor(t);
    ok(t.strikes === 1 && /Couldn't pay/.test(t.lastResult), `${mode} act ${a + 1}: unpaid dues give a strike`);
  }
}
{ const s = E.newGame(3, { guided: true }); E.devJump(s, 2); s.gold = 50; clearFloor(s);
  ok(!/dues/.test(s.lastResult), 'guided act 1: no dues'); }
{ // what the HUD shows: the dues for the act you're in, or heading into from the shop
  const s = E.newGame(4); E.devJump(s, 2); E.bid(s, 0); s.gold = 50; s.slain = 999; clearFloor(s);
  eq(E.duesAhead(s).due, E.DUES[1], 'in the shop after act 1, the next dues are act 2\'s');
  eq(E.duesAhead(s).floor, 6, 'act 2 dues are collected after floor 6'); }

// ---------- 2.x relics ----------
{ const s = game({ relics: ['hardknuckles'], room: [M(9), M(2), M(2), M(2)] }); s.bareKills = 6;
  eq(fight(s, s.room[0], 'bare').lost, 7, 'Hardened Knuckles: 6 bare kills take 2 off'); eq(s.bareKills, 7, 'Hardened Knuckles: kills keep counting'); }
{ const s = game({ relics: ['twinblades'], room: [W(8), W(4), M(7), M(2)] });
  E.handle(s, s.room[0].id); E.handle(s, s.room[0].id); eq(s.weapon.v, 4, 'Twin Blades: the new weapon is in hand'); eq(s.weapon2.v, 8, 'Twin Blades: the old one moves to the off hand');
  const m = s.room[0]; ok(E.modes(s, m).includes('weapon2'), 'Twin Blades: fight with the off hand');
  eq(fight(s, m, 'weapon2').lost, 0, 'Twin Blades: the 8 blocks a 7'); eq(s.weapon2.limit, 7, 'Twin Blades: the off-hand weapon dulls, not the main one'); eq(s.weapon.limit, null, 'Twin Blades: main untouched'); }
{ const a = M(4), b = M(6), s = game({ relics: ['cleave'], weapon: [9, null], room: [a, b, M(2), M(2)] });
  fight(s, a, 'weapon'); eq(s.cleave, 5, 'Cleave: a 9 beats a 4 by 5'); eq(fight(s, b, 'bare').lost, 1, 'Cleave: 5 comes off the next fight (6 bare deals 1)'); eq(s.cleave, 0, 'Cleave: used up'); }
{ const s = game({ relics: ['glassblade'], room: [W(5), M(2), M(2), M(2)] }); E.handle(s, s.room[0].id); eq(s.weapon.v, 8, 'Glass Blade: a 5 equips as 8');
  s.room = [M(2), M(2), M(2), M(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id, 'weapon'); eq(s.weapon, null, 'Glass Blade: shatters after 3 kills'); }
{ const s = game({ relics: ['bell'], room: [M(7), M(2), M(2), M(2)] }); const n = s.draw.length; E.handle(s, s.room[0].id, 'bare');
  ok(s.draw.length === n + 1 && s.draw.some(c => c.bell && c.kind === 'potion' && c.v === 7), "Necromancer's Bell: a 7 comes back as a 7 potion"); }
{ const s = game({ hp: 10 }); E.devGrant(s, 'ironball'); eq(s.maxHp, 40, 'Iron Ball: +20 max'); eq(s.hp, 30, 'Iron Ball: heals 20'); ok(!E.canFlee(s), 'Iron Ball: no fleeing');
  E.dropRelic(s, 'ironball'); eq(s.maxHp, 20, 'Iron Ball: dropping it takes the 20 back'); }
{ const p = P(5), s = game({ relics: ['alchemykit'], room: [p, M(2), M(2), M(2)] }); ok(E.modes(s, p).includes('equip'), 'Alchemy Kit: a potion can be equipped');
  E.handle(s, p.id, 'equip'); eq(s.weapon && s.weapon.v, 5, 'Alchemy Kit: a 5 potion is a 5 weapon'); }
{ const s = game({ relics: ['hunger'], hp: 10, room: [P(6), M(3), M(2), M(2)] }); E.handle(s, s.room[0].id); eq(s.hp, 10, 'Pact of Hunger: potions do not heal');
  E.handle(s, s.room[0].id, 'bare'); eq(s.hp, 10 - 3 + 2, 'Pact of Hunger: a kill heals 2'); }
{ const s = game({ relics: ['mimic'], hp: 10, room: [M(4), P(5), M(9), M(2)] });
  ok(E.modes(s, s.room[0]).includes('drink') && !E.modes(s, s.room[2]).includes('drink'), "Mimic's Tongue: only 4 or lower can be drunk");
  E.handle(s, s.room[0].id, 'drink'); eq(s.hp, 14, "Mimic's Tongue: a 4 monster heals 4"); const b = s.slain;
  E.handle(s, s.room[0].id, 'bare'); eq(s.hp, 9, "Mimic's Tongue: fighting a 5 potion costs 5"); eq(s.slain - b, 5, "Mimic's Tongue: and counts 5 points"); }
{ const s = game({ relics: ['compound'], floor: 3, gold: 100 }); s.slain = s.contract.target; clearFloor(s);
  eq(s.gold, 100 + s.contract.pay + 5, 'Compound Purse: interest cap 5 after one floor'); eq(E.interestCap(s), 5, 'Compound Purse: cap shown'); }
{ const s = game({ relics: ['miser'], floor: 3, gold: 0 }); s.slain = 999; clearFloor(s); E.skipPick(s); let g = s.gold; E.leaveShop(s); eq(s.gold, g + 2, "Miser's Purse: first shop left pays 2");
  E.bid(s, 0); s.slain = 999; clearFloor(s); E.skipPick(s); g = s.gold; E.leaveShop(s); eq(s.gold, g + 4, "Miser's Purse: second in a row pays 4");
  E.bid(s, 0); s.slain = 999; clearFloor(s); E.skipPick(s); E.buy(s, 'bandage'); g = s.gold; E.leaveShop(s); eq(s.gold, g, "Miser's Purse: spending breaks the streak"); eq(s.miserStreak, 0, "Miser's Purse: streak reset"); }
{ const s = game({ relics: ['cursed'], floor: 3 }); eq(E.payout(s, 1), 4 * 2 * 3, 'Cursed Contract: Bold pays triple'); s.slain = 0; clearFloor(s); eq(s.maxHp, 15, 'Cursed Contract: a miss costs 5 max health'); }
{ const s = game({ relics: ['greedy'], gold: 0, room: [P(2), P(2), P(2), P(2)] }); for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  eq(s.roomsCleared, 0, 'Greedy Hands: 3 cards is not enough'); E.handle(s, s.room[0].id); eq(s.roomsCleared, 1, 'Greedy Hands: all 4 clears it'); eq(s.gold, 3, 'Greedy Hands: +3 gold');
  eq(s.room.length, 4, 'Greedy Hands: the next room is dealt fresh'); }
{ const p = P(7), s = game({ relics: ['stash'], hp: 10, room: [p, M(2), M(2), M(2)] }); ok(E.stash(s, p.id), 'Stash Pouch: set a card aside'); eq(s.handled, 1, 'Stash Pouch: it counts as taken');
  ok(!E.canStash(s, s.room[0].id), 'Stash Pouch: one at a time'); E.handle(s, s.room[0].id, 'bare'); E.handle(s, s.room[0].id, 'bare'); eq(s.roomsCleared, 1, 'Stash Pouch: the room still ends');
  ok(E.useStash(s), 'Stash Pouch: drink it in a later room'); eq(s.hp, 6 + 7, 'Stash Pouch: the potion heals'); eq(s.stash, null, 'Stash Pouch: empty again'); eq(s.handled, 0, 'Stash Pouch: playing it is free'); }
{ const s = game({ relics: ['spyglass'] }); eq(E.nextCards(s).map(c => c.id).join(), s.draw.slice(0, 3).map(c => c.id).join(), 'Spyglass: the next 3 cards'); }
{ const s = game({ relics: ['bait'], room: [M(12), M(5), P(3), W(4)] }); const n = s.draw.length; E.flee(s); eq(s.draw.length, n + 3 - 4, 'Bait: one card fewer goes back (and 4 are dealt)');
  ok(!s.draw.some(c => c.v === 12 && c.kind === 'monster' && c.id === 9999), 'Bait: the 12 is gone'); }
{ const s = game({ relics: ['bloodprice'], hp: 10 }); const old = s.room[1], top = s.draw[0];
  ok(E.swapCard(s, old.id), 'Blood Price: swap a card'); eq(s.hp, 9, 'Blood Price: costs 1'); eq(s.room[1].id, top.id, 'Blood Price: the top of the pile takes its place');
  eq(s.draw[s.draw.length - 1].id, old.id, 'Blood Price: the old card goes to the bottom'); ok(!E.canSwap(s, s.room[0].id), 'Blood Price: once a room'); }
{ const s = game({ relics: ['wardrum'], floor: 4 }); s.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id); E.raise(s);
  const pay = s.contract.pay; s.slain = 999; const g = s.gold; clearFloor(s); ok(s.payout.lines.some(l => l.key === 'raise' && l.gold === Math.ceil(pay / 2)), 'Raise: a met raised contract pays half again'); }
{ const s = E.newGame(5); s.relics = ['oil', 'giantsgrip']; s.phase = 'shop'; s.pick = { options: ['lantern', 'spyglass'] }; s.shop = { relics: ['ledger'], bought: {} };
  const b = E.loadGame(JSON.parse(JSON.stringify(E.saveGame(s)))); eq(b.relics.join(), 'giantsgrip', 'save: retired relics drop out of the belt');
  eq(b.pick.options.join(), 'spyglass', 'save: and out of the pick'); eq(b.shop.relics.length, 0, 'save: and off the shelf'); }

// ---------- dev helpers ----------
{ const s = E.newGame(5); E.devJump(s, 7); eq(s.floor, 7, 'devJump: floor 8'); ok(s.boss === null && s.phase === 'bid', 'devJump: a normal floor waits for a bid');
  eq(s.deck.filter(c => c.v === 15).length, 3, 'devJump: act 2 elites are in the deck'); eq(s.deck.filter(c => c.v === 17).length, 3, 'devJump: act 3 elites are in the deck');
  E.devJump(s, 8); ok(s.boss && E.BOSSES[s.boss.key].act === 2, 'devJump: floor 9 has an act 3 boss');
  E.bid(s, 0); E.devRoom(s, 3); eq(s.roomsCleared, 3, 'devRoom: room 4'); }

// ---------- One deck ----------
// Play a floor for real: take the first 3 cards of each room bare-handed, never dying, always meeting the contract.
function playFloor(s) {
  if (s.phase === 'bid') E.bid(s, 0);
  for (let n = 0; s.phase === 'room' && n < 40; n++) { s.hp = 99; s.maxHp = 99; s.slain = 999; E.handle(s, s.room.find(c => !c.hidden).id, 'bare'); }
}
const inPile = s => s.draw.length + s.room.length;
{ const s = E.newGame(7, { oneDeck: true }); ok(s.oneDeck, 'oneDeck flag set');
  eq(inPile(s), 44, 'one deck: floor 1 starts on the whole deck');
  const seen = new Set(); const draw0 = s.draw.length;
  playFloor(s); ok(s.phase === 'shop', 'one deck: floor 1 ends in the shop');
  const left = s.room.map(c => c.id);
  eq(left.length, 1, 'one deck: one card is left in the last room');
  const pile1 = s.draw.length; ok(pile1 < draw0, 'one deck: the pile shrinks over a floor');
  E.leaveShop(s);
  eq(inPile(s), pile1 + 1, 'one deck: floor 2 deals from what is left, plus the card left in the room');
  ok(left.every(id => s.room.some(c => c.id === id)), 'one deck: the card left in the room is still there on floor 2');
  playFloor(s); E.leaveShop(s); playFloor(s);
  E.leaveShop(s); eq(s.floor, 3, 'one deck: reached act 2');
  eq(inPile(s), 47, 'one deck: act 2 starts on a fresh shuffle of the whole deck with its 3 elites'); }
{ // the pile runs out mid-act: everything dealt goes back in
  const s = E.newGame(8, { oneDeck: true }); E.bid(s, 0);
  s.draw = s.draw.slice(0, 1); const before = s.reshuffles;
  s.hp = 99; E.handle(s, s.room[0].id, 'bare'); E.handle(s, s.room[0].id, 'bare'); E.handle(s, s.room[0].id, 'bare');
  eq(s.room.length, 4, 'one deck: a room still gets 4 cards when the pile runs out');
  eq(s.reshuffles, before + 1, 'one deck: running out reshuffles the dealt cards');
  eq(inPile(s), 44, 'one deck: every dealt card, the ones just handled too, is back in play'); }
{ // services change the pile you're about to play
  const s = E.newGame(9, { oneDeck: true }); playFloor(s); E.skipPick(s); s.gold = 50;
  const top = Math.max(...s.draw.filter(c => c.kind === 'monster').map(c => c.v));
  const n = s.draw.filter(c => c.kind === 'monster' && c.v === top).length;
  E.buy(s, 'cull');
  eq(s.draw.filter(c => c.kind === 'monster' && c.v === top).length, n - 1, 'one deck: Cull takes the strongest monster still in the pile');
  const p = s.draw.length; E.buy(s, 'recruit', 0);
  eq(s.draw.length, p + 1, 'one deck: a recruited card goes into the pile');
  const v = E.deckView(s); eq(v.total, s.deck.length, 'deck view lists every card'); eq(v.left, s.draw.length, 'deck view: cards left = the pile'); }
{ // normal runs are unchanged
  const s = E.newGame(7); playFloor(s);
  eq(E.deckView(s).left, s.deck.length, 'deck view: in a normal shop every card is coming back'); E.leaveShop(s);
  eq(inPile(s), 44, 'normal run: every floor reshuffles the whole deck'); }
{ const s = E.newGame(7, { oneDeck: true, guided: true }); ok(!s.oneDeck && s.guided, 'one deck is never guided'); }

// The tutorial: a guided run's first floor dealt from a stacked pile of the deck's own cards, then a normal floor.
{ const s = E.newGame(3, { guided: true, tutorial: true });
  eq(s.room.map(c => c.kind[0] + c.v).join(' '), 'm5 w7 m13 m9', 'tutorial: room 1 is stacked');
  eq(s.draw.slice(0, 7).map(c => c.v).join(' '), '14 12 11 3 10 6 2', 'tutorial: the next cards are stacked');
  const ids = [...s.room, ...s.draw].map(c => c.id);
  eq(new Set(ids).size, 44, 'tutorial: every card is the deck\'s own, once');
  eq(E.deckView(s).left, 44 - 4, 'tutorial: deck view still adds up');
  ok(s.phase === 'room' && s.contract.survival, 'tutorial: floor 1 is a survival floor');
  const W7 = s.room.find(c => c.v === 7), O9 = s.room.find(c => c.v === 9), G5 = s.room.find(c => c.v === 5);
  E.handle(s, W7.id); E.handle(s, O9.id, 'weapon'); E.handle(s, G5.id, 'weapon');
  eq(s.room.map(c => c.v).join(' '), '13 14 12 11', 'tutorial: room 2 is all big monsters');
  ok(E.flee(s), 'tutorial: you can flee room 2');
  eq(s.room.map(c => c.v).join(' '), '3 10 6 2', 'tutorial: the room after fleeing has the potion');
  eq(s.hp, 18, 'tutorial: the guided moves cost 2 health');
  clearFloor(s); eq(s.phase, 'shop', 'tutorial: floor 1 ends as usual, after 4 rooms'); }
{ const s = E.newGame(3, { tutorial: true }); ok(!s.tutorial, 'tutorial only stacks a guided run'); }
{ // the tutorial's floor can't kill you; later floors can
  const s = E.newGame(3, { guided: true, tutorial: true }); s.hp = 3;
  E.handle(s, s.room.find(c => c.v === 13).id, 'bare');
  ok(s.hp === 1 && s.spared && s.phase === 'room', 'tutorial: a fatal hit on floor 1 leaves you at 1 health');
  clearFloor(s); ok(s.patched && s.hp === 10, 'tutorial: saved on floor 1, you start floor 2 at half health');
  E.leaveShop(s); eq(s.phase, 'bid', 'guided: floor 2 opens with a contract');
  E.bid(s, 0); s.hp = 3; s.room = [M(13), M(2), M(2), M(2)];
  E.handle(s, s.room[0].id, 'bare'); eq(s.phase, 'lost', 'tutorial: floor 2 can kill you'); }
{ // guided: no dues at the end of act 1, even with contracts from floor 2
  const s = E.newGame(5, { guided: true }); s.floor = 2; ok(!E.duesAhead(s) || E.duesAhead(s).act > 0, 'guided: no dues ahead in act 1');
  s.floor = 4; ok(E.duesAhead(s) && E.duesAhead(s).act === 1, 'guided: dues ahead in act 2'); }

// ---------- bosses ----------
// A run on boss floor f whose boss is `key` (earlier acts get other bosses).
function bossGame(key, f = 2, seed = 1) {
  const s = E.newGame(seed); s.bossKeys = Array.from({ length: Math.floor(f / 3) }, (_, i) => Object.keys(E.BOSSES).find(k => E.BOSSES[k].act === i && k !== key)).concat(key);
  E.devJump(s, f); if (s.phase === 'bid') E.bid(s, s.offers.findIndex(o => !o.clause)); return s;
}
{ const seen = new Set(); for (let i = 1; i <= 40; i++) { const s = E.newGame(i); [2, 5, 8].forEach(f => { const b = E.bossFor(s, f); ok(E.BOSSES[b.key].act === f / 3 - 2 / 3, `bosses: floor ${f + 1} draws from its act`); }); seen.add(s.bossKeys[0]); }
  ok(seen.size >= 4, 'bosses: runs meet different act 1 bosses');
  eq(E.bossFor(E.newGame(9, { guided: true }), 2).key, 'warden', 'bosses: a guided run meets the Warden first');
  const s = E.newGame(2); const keys = []; for (let a = 0; a < 15; a++) keys.push(E.bossFor(s, a * 3 + 2).key);
  eq(new Set(keys).size, 15, 'bosses: no boss is met twice in 15 acts'); }
{ const s = bossGame('warden'); s.hp = 99; s.maxHp = 99;
  for (let n = 0; n < 3; n++) { s.room = [W(2), W(2), W(2), W(2)]; E.handle(s, s.room[0].id); E.handle(s, s.room[0].id); E.handle(s, s.room[0].id); }
  const b = s.room.find(c => c.boss); ok(b && b.v === 11, 'Warden: waits in the last room as an 11');
  ok(!E.canFlee(s), 'Warden: you can\'t flee his room');
  s.room.filter(c => !c.boss).slice(0, 3).forEach(c => E.handle(s, c.id, 'bare'));
  eq(s.phase, 'room', 'Warden: the floor goes on while he lives'); E.handle(s, b.id, 'bare'); ok(s.phase !== 'room', 'Warden: killing him ends the floor'); }
{ const s = bossGame('skeletonking', 5); s.hp = 99; s.maxHp = 99; s.roomsCleared = 2; s.room = [W(2), W(2), W(2), W(2)]; for (let n = 0; n < 3; n++) E.handle(s, s.room[0].id); // on into the boss's room
  s.room.filter(c => !c.boss).slice(0, 3).forEach(c => E.handle(s, c.id, 'bare'));
  const k = s.room.find(c => c.boss); ok(k && k.rises, 'Skeleton King: in the last room'); E.handle(s, k.id, 'bare');
  const r = s.room.find(c => c.boss); ok(r && r.v === Math.ceil(k.v / 2), 'Skeleton King: rises once at half strength'); E.handle(s, r.id, 'bare'); ok(s.phase !== 'room', 'Skeleton King: twice dead ends the floor'); }
{ const s = bossGame('troll', 8); s.weapon = { v: 10, limit: null }; ok(E.monsterDamage(s, { v: 18, armor: 3 }, true) === 11, 'Cave Troll: its hide takes 3 off your weapon'); }
{ const s = bossGame('vampire', 5); s.hp = 5; const b = { id: 1, kind: 'monster', v: 15, boss: true }; s.room = [P(5), b, M(2), M(2)]; E.handle(s, s.room[0].id); eq(b.v, 17, 'Vampire Lord: a potion makes him 2 stronger'); }
{ const s = bossGame('jailer'); s.room = [M(2), M(2), M(2), M(2)]; ok(E.flee(s), 'Jailer: one flee'); s.fledStreak = 0; ok(!E.canFlee(s), 'Jailer: no second flee'); }
{ const s = bossGame('mummy'); s.room = [W(8), M(2), M(2), M(2)]; E.handle(s, s.room[0].id); eq(s.weapon.v, 5, 'Mummy: weapons are 3 weaker'); }
{ const s = bossGame('golem', 5); s.weapon = { v: 9, limit: null }; s.room = [M(8), M(2), M(2), M(2)]; E.handle(s, s.room[0].id, 'weapon'); eq(s.weapon.limit, 5, 'Bone Golem: a kill dulls the weapon 3 lower'); }
{ const s = bossGame('hag', 5); s.hp = 10; s.room = [M(2), M(2), M(2), M(2)]; ok(E.flee(s) && s.hp === 9, 'Plague Hag: a new room costs 1 health'); eq(E.potionHeal(s, P(8)), 4, 'Plague Hag: potions heal half'); }
{ const s = bossGame('dragon', 8); s.weapon = { v: 8, limit: null }; s.room = [M(2), M(2), M(2), M(2)]; E.flee(s); eq(s.weapon.v, 7, 'Dragon: its breath weakens the weapon each room'); }
{ const s = bossGame('banshee'); s.room = [M(2), M(3), M(4), M(5)]; E.flee(s); eq(s.room.filter(c => c.hidden).length, 2, 'Banshee: two cards face down');
  const h = s.room.find(c => c.hidden), v = s.room.find(c => !c.hidden); ok(!E.handle(s, h.id, 'bare'), 'Banshee: a face-down card can\'t be taken');
  E.handle(s, v.id, 'bare'); ok(!s.room.some(c => c.hidden), 'Banshee: taking a card turns them over'); }
{ const s = bossGame('goblinking'); const g = [...s.room, ...s.draw].find(c => c.stalker); ok(g && s.draw.indexOf(g) >= 1 && s.draw.indexOf(g) <= 8, 'Goblin King: hides in the next few rooms');
  s.gold = 20; s.room = [M(2), M(2), M(2), M(2)]; E.flee(s); eq(s.gold, 15, 'Goblin King: steals 5 gold a room');
  s.hp = 99; s.room = [g, M(2), M(2), M(2)]; E.handle(s, g.id, 'bare'); eq(s.gold, 25, 'Goblin King: killing him pays back double'); }
{ const s = bossGame('wyrm', 8); s.room = [M(2), M(2), M(2), M(2)]; E.flee(s); eq(s.maxHp, E.MAX_HP - 3, 'Wyrm: -3 max health a room');
  const w = [...s.room, ...s.draw].find(c => c.stalker); s.hp = 99; s.room = [w, M(2), M(2), M(2)]; E.handle(s, w.id, 'bare'); eq(s.maxHp, E.MAX_HP, 'Wyrm: killing it gives the max health back'); }
{ const s = bossGame('broodmother', 5); s.room = [M(2), M(2), M(2), M(2)]; E.flee(s); const sp = s.room.find(c => c.name === 'Spiderling'); ok(sp && sp.boss, 'Broodmother: a spiderling you must kill');
  s.hp = 99; clearFloor(s); ok(!s.draw.some(c => c.stalker || c.spawn), 'bosses: boss cards leave with the floor'); }
{ const s = bossGame('horror', 8); s.draw.unshift(M(2), M(2), M(2), M(2)); s.room = [M(2), M(2), M(2), M(2)]; E.flee(s); ok(s.room.every(c => c.v === 4), 'Horror: new monsters grow 2 a room'); }
{ const s = bossGame('lich', 8); eq(E.allowedTiers(s).join(), '2', 'Lich: Reckless only'); s.strikes = 0; s.slain = 0; s.hp = 99; s.gold = 999; clearFloor(s); eq(s.strikes, 2, 'Lich: a miss costs two strikes'); }

// ---------- endless ----------
{ const s = E.newGame(4); E.devJump(s, 8); E.bid(s, 0); s.slain = 999; s.gold = 999; s.hp = 99; s.maxHp = 99;
  for (let n = 0; s.phase === 'room' && n < 40; n++) { s.room = s.room.filter(c => c.boss).concat([W(2), W(2), W(2), W(2)]); const b = s.room.find(c => c.boss); E.handle(s, (b || s.room[0]).id, 'bare'); }
  eq(s.phase, 'won', 'endless: floor 9 still wins'); ok(E.continueEndless(s) && s.phase === 'shop' && s.endless, 'endless: keep going into the shop');
  const before = s.deck.filter(c => c.kind === 'monster').reduce((n, c) => n + Math.ceil(c.v * E.ENDLESS_GROWTH), 0);
  E.leaveShop(s); eq(s.floor, 9, 'endless: floor 10');
  eq(s.deck.filter(c => c.kind === 'monster').reduce((n, c) => n + c.v, 0), before + 3 * Math.ceil(17 * E.ENDLESS_GROWTH), 'endless: monsters grow a fifth and 3 stronger elites arrive');
  ok(E.targetRow(9)[0] > E.TARGETS[7][0] && E.targetRow(11)[0] > E.TARGETS[8][0], 'endless: targets keep climbing'); ok(E.duesFor(s, 3) > E.DUES[2], 'endless: dues keep climbing');
  eq(E.duesAhead(s).floor, 12, 'endless: dues after floor 12'); ok(E.bossFor(s, 11) && !s.bossKeys.slice(0, 3).includes(E.bossFor(s, 11).key), 'endless: a boss not met before'); }

// ---------- saving a run ----------
// A run saved mid-floor and loaded again plays out exactly like the one that never stopped.
function step(s) {
  if (s.phase === 'bid') return E.bid(s, 0);
  if (s.phase === 'room') { const c = s.room.find(x => !x.hidden); return E.handle(s, c.id, c.kind === 'monster' && E.canUseWeapon(s, c) ? 'weapon' : c.kind === 'monster' ? 'bare' : null); }
  if (s.phase === 'shop') return s.pick ? E.skipPick(s) : E.leaveShop(s);
}
for (const [seed, at] of [[7, 5], [11, 30], [23, 60], [31, 70]]) {
  const a = E.newGame(seed, { oneDeck: seed === 23 }); a.hp = a.maxHp = 999;
  for (let n = 0; n < at && !['won', 'lost'].includes(a.phase); n++) step(a);
  const b = E.loadGame(JSON.parse(JSON.stringify(E.saveGame(a))));
  ok(typeof b.r === 'function' && !('rngState' in b) && !['won', 'lost'].includes(b.phase), `save ${seed}: saved mid-run and the dice come back`);
  for (let n = 0; n < 2000 && !['won', 'lost'].includes(a.phase); n++) { step(a); step(b); }
  const noIds = g => JSON.stringify(E.saveGame(g), (k, v) => k === 'id' ? undefined : v); // both runs share one id counter here
  eq(noIds(b), noIds(a), `save ${seed}: a loaded run plays out the same`);
  ok(a.floor > 2, `save ${seed}: played on past floor 3`);
}
{ const data = E.saveGame(E.newGame(3)); data.deck[0].id = 5e6; const s = E.loadGame(data); E.devJump(s, 3);
  ok(s.deck.some(c => c.id > 5e6), 'save: cards added after loading get new ids');
  eq(new Set(s.deck.map(c => c.id)).size, s.deck.length, 'save: no two cards share an id'); }

// Daily dungeon: one seed deals the same dungeon every time, and a different seed a different one.
{
  const deal = seed => { const s = E.newGame(seed); return JSON.stringify([s.room, s.draw, s.offers].map(x => (x || []).map(c => c.v + (c.suit || c.tier || '')))); };
  eq(deal(20261017), deal(20261017), 'same seed, same dungeon');
  ok(deal(20261017) !== deal(20261018), 'next day, a different dungeon');
}
// 2.30.0: a rout (1.5 times the target) makes the relic pick all rares; the payout and the end screen count what relics did.
{ const s = E.newGame(5); E.bid(s, 0); s.slain = Math.ceil(s.contract.target * E.ROUT); E.devEndFloor(s);
  ok(s.payout.rout && s.payout.lines.some(l => l.key === 'rout'), 'rout: 1.5x the target is a rout');
  ok(s.pick && s.pick.options.every(k => E.RELICS[k].rarity !== 'common'), 'rout: the relic pick is all rares'); }
{ const s = E.newGame(5); E.bid(s, 0); s.slain = s.contract.target; E.devEndFloor(s);
  ok(!s.payout.rout, 'rout: just meeting the target is no rout'); }
{ const s = E.newGame(9); E.devGrant(s, 'giantsgrip'); E.bid(s, 0);
  const m = { id: 9e6, kind: 'monster', v: 6, suit: '♠' }; s.room = [m, ...s.room.slice(1)];
  E.handle(s, m.id, 'bare');
  eq(s.relicFloor.block, 3, "credit: Giant's Grip counts 3 damage blocked this floor");
  eq(E.engineReport(s).top && E.engineReport(s).top.k, 'giantsgrip', 'engine report: the relic that did the most');
  const d = E.monsterDamage(s, { kind: 'monster', v: 6 }, false); eq(s.relicFloor.block, 3, 'credit: a preview counts nothing');
  E.devEndFloor(s); eq(s.payout.relics.block, 3, 'payout: carries what relics did this floor');
  eq(E.engineReport(s).startHp, E.MAX_HP, 'engine report: starting health'); }

// ---------- 2.31.0: the kit ----------
{ const s = game({ floor: 3, gold: 0 }); s.slain = 0; clearFloor(s); E.skipPick(s); s.gold = 300;
  const w = s.deck.find(c => c.kind === 'weapon'), v0 = w.v, c0 = E.forgeCost(s);
  eq(c0, 6, 'Forge: the first costs 6'); ok(E.canForge(s, w.id), 'Forge: a weapon can be forged');
  ok(E.buy(s, 'forge', w.id), 'Forge: bought'); eq(s.deck.find(c => c.id === w.id).v, v0 + 2, 'Forge: +2 to the card'); eq(s.gold, 300 - c0, 'Forge: paid');
  eq(E.forgeCost(s), 9, 'Forge: the next costs 3 more'); const m = s.deck.find(c => c.kind === 'monster'); ok(!E.canForge(s, m.id), 'Forge: monsters can\'t be forged');
  for (let i = 0; i < 6; i++) E.buy(s, 'forge', w.id); ok(s.deck.find(c => c.id === w.id).v > 10, 'Forge: no ceiling on card values');
  const o = s.shop.recruit; ok(o && o.length === 3, 'Recruit: three offers'); const n = s.deck.length, g = s.gold, rc = E.recruitCost(o[0]);
  ok(E.buy(s, 'recruit', 0), 'Recruit: bought'); eq(s.deck.length, n + 1, 'Recruit: the card joins the deck'); eq(s.gold, g - rc, 'Recruit: paid');
  ok(!E.buy(s, 'recruit', 1), 'Recruit: one per shop'); }
{ const s = E.newGame(3); E.devJump(s, 9); E.bid(s, 0); const t9 = E.targetRow(9)[0], t12 = E.targetRow(12)[0], t15 = E.targetRow(15)[0];
  ok(t15 - t12 > t12 - t9, 'Endless: targets climb faster each act (' + t9 + ', ' + t12 + ', ' + t15 + ')'); eq(E.ENDLESS_GROWTH, 1.2, 'Endless: x1.2 an act'); }

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
