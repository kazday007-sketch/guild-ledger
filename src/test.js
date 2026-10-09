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
{ const m = M(8), s = game({ relics: ['whetstone'], weapon: [7, 3], room: [m, M(2), M(2), M(2)] });
  ok(E.canUseWeapon(s, m), 'Whetstone: a dulled weapon still hits an 8');
  eq(fight(s, m, 'weapon').lost, 1, 'Whetstone: 7 weapon vs 8 loses 1');
  const s2 = game({ weapon: [7, 3], room: [M(8), M(2), M(2), M(2)] });
  ok(!E.canUseWeapon(s2, s2.room[0]), 'No Whetstone: a dulled weapon can\'t hit an 8');
  const s3 = game({ relics: ['whetstone'], weapon: [7, 3], room: [M(9), M(2), M(2), M(2)] });
  ok(!E.canUseWeapon(s3, s3.room[0]), 'Whetstone: still no help against a 9'); }
{ const s = game({ relics: ['keenedge'], weapon: [7, 5], room: [M(7), M(8), M(2), M(2)] });
  ok(E.canUseWeapon(s, s.room[0]), 'Keen Edge: limit 5 hits a 7');
  ok(!E.canUseWeapon(s, s.room[1]), 'Keen Edge: limit 5 can\'t hit an 8');
  eq(E.weaponReach(s), 7, 'Keen Edge: the HUD shows the weapon reaching 7'); }
{ const w = W(6), s = game({ relics: ['grindstone'], room: [w, M(2), M(2), M(2)] });
  E.handle(s, w.id); eq(s.weapon.v, 7, 'Grindstone: a 6 weapon equips as 7'); }

// ---------- defense and healing ----------
{ const m = M(9), s = game({ relics: ['ironskin'], room: [m, M(5), M(2), M(2)] });
  eq(fight(s, m, 'bare').lost, 8, 'Iron Skin: a 9 deals 8'); }
{ const a = M(9), b = M(9), s = game({ relics: ['buckler'], room: [a, b, M(2), M(2)] });
  eq(fight(s, a, 'bare').lost, 7, 'Buckler: first fight in the room deals 2 less');
  eq(fight(s, b, 'bare').lost, 9, 'Buckler: second fight is full damage'); }
{ const s = game({ gold: 20 }); s.phase = 'shop'; s.shop = { relics: ['hide'], bought: {} }; s.hp = 10;
  E.buy(s, 'hide'); eq(s.maxHp, 26, 'Thick Hide: +6 max HP'); eq(s.hp, 16, 'Thick Hide: heals 6 now');
  E.dropRelic(s, 'hide'); eq(s.maxHp, 20, 'Thick Hide: dropping it takes the 6 max HP back'); }
{ const a = P(5), b = P(4), s = game({ relics: ['herbalist'], hp: 5, room: [a, b, M(2), M(2)] });
  E.handle(s, a.id); E.handle(s, b.id); eq(s.hp, 14, 'Herbalist: both potions heal');
  const c = P(5), d = P(4), s2 = game({ hp: 5, room: [c, d, M(2), M(2)] });
  E.handle(s2, c.id); E.handle(s2, d.id); eq(s2.hp, 10, 'No Herbalist: only the first potion heals'); }
{ const m = M(3), s = game({ relics: ['fang'], hp: 15, room: [m, M(2), M(2), M(2)] });
  eq(fight(s, m, 'bare').lost, 1, 'Vampire Fang: bare kill of a 3 heals 2 (net -1)');
  const m2 = M(3), s2 = game({ relics: ['fang'], hp: 15, weapon: [2, null], room: [m2, M(2), M(2), M(2)] });
  eq(fight(s2, m2, 'weapon').lost, 1, 'Vampire Fang: weapon kills don\'t heal'); }
{ const s = game({ relics: ['bloodpact'], hp: 10 }); s.slain = 999; clearFloor(s);
  eq(s.maxHp, 22, 'Blood Pact: met contract gives +2 max HP'); eq(s.hp, 12, 'Blood Pact: and heals 2'); }

// ---------- movement ----------
{ const s = game({ relics: ['secondwind'] });
  ok(E.flee(s), 'Second Wind: first flee'); ok(E.flee(s), 'Second Wind: second flee in a row'); ok(!E.flee(s), 'Second Wind: not a third');
  const s2 = game(); ok(E.flee(s2), 'Base: first flee'); ok(!E.flee(s2), 'Base: no second flee in a row'); }
{ const m = M(2), s = game({ relics: ['scout'], room: [m, M(3), M(3), M(3)] });
  E.handle(s, m.id, 'bare'); ok(E.canFlee(s), 'Scout: may flee after 1 card');
  E.handle(s, s.room[0].id, 'bare'); ok(!E.canFlee(s), 'Scout: not after 2 cards');
  const m2 = M(2), s2 = game({ room: [m2, M(3), M(3), M(3)] }); E.handle(s2, m2.id, 'bare'); ok(!E.canFlee(s2), 'Base: no flee after 1 card'); }
{ const s = game({ relics: ['lantern'] }); ok(s.draw.length > 0 && E.nextCard(s) === s.draw[0], 'Lantern: the next card is the top of the pile');
  const before = s.draw[0].id; s.room = [P(2), P(2), P(2), P(2)]; E.handle(s, s.room[0].id); E.handle(s, s.room[0].id); E.handle(s, s.room[0].id);
  ok(s.room.some(c => c.id === before), 'Lantern: the card it showed is dealt into the next room'); }
{ const s = game({ relics: ['fortune'] }); const old = s.room.map(c => c.id);
  ok(E.redraw(s), 'Fortune Teller: redraw'); ok(!s.room.some(c => old.includes(c.id)), 'Fortune Teller: four new cards');
  ok(!E.redraw(s), 'Fortune Teller: once per floor'); }

// ---------- points ----------
{ const m = M(12), s = game({ relics: ['trophy'], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').pts, 15, 'Trophy Hunter: a 12 counts 15'); }
{ const m = M(4), s = game({ relics: ['brawler'], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').pts, 7, 'Brawler: bare 4 counts 7'); }
{ const a = M(4), b = M(4), s = game({ relics: ['ambush'], room: [a, b, M(2), M(2)] });
  eq(fight(s, a, 'bare').pts, 6, 'Ambush: first kill +2'); eq(fight(s, b, 'bare').pts, 4, 'Ambush: second kill normal'); }
{ const m = M(3), s = game({ relics: ['berserk'], hp: 8, room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').pts, 8, 'Berserker: kill landing at 5 HP counts +5'); }
{ const m = M(4), s = game({ relics: ['thorns'], weapon: [10, null], room: [m, M(2), M(2), M(2)] });
  const r = fight(s, m, 'weapon'); eq(r.lost, 1, 'Crown of Thorns: a fully blocked fight still costs 1'); eq(r.pts, 7, 'Crown of Thorns: +3 points'); }
{ const p = P(8), s = game({ relics: ['alchemist'], hp: 17, room: [p, M(2), M(2), M(2)] });
  E.handle(s, p.id); eq(s.slain, 5, 'Alchemist: 5 overheal counts 5 points'); }

// ---------- contracts and gold ----------
{ const s = game({ relics: ['ledger'], floor: 3 }); eq(E.payout(s, 2), 4 * 6, 'Bounty Ledger: Reckless pays x6 (act 2 base 4)'); eq(E.payout(s, 1), 4 * 2, 'Bounty Ledger: Bold unchanged'); }
{ const s = game({ relics: ['seal'], floor: 3 }); s.slain = 0; clearFloor(s); eq(s.strikes, 0, 'Insurance Seal: first miss in the act is free');
  E.leaveShop(s); E.bid(s, 0); s.slain = 0; clearFloor(s); eq(s.strikes, 1, 'Insurance Seal: second miss in the act is a strike'); }
{ const s = game({ relics: ['loaded'], floor: 4 }); s.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  ok(E.raise(s), 'Loaded Dice: first raise'); ok(E.raise(s), 'Loaded Dice: second raise'); eq(s.contract.tier, 2, 'Loaded Dice: Safe to Reckless');
  const s2 = game({ floor: 4 }); s2.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s2, s2.room[0].id);
  ok(E.raise(s2) && !E.raise(s2), 'Base: one raise per floor'); }
{ const s = game({ relics: ['taxman'], floor: 3, gold: 0 }); s.slain = s.contract.target + 10; clearFloor(s);
  const pay = s.contract.pay; eq(s.gold, pay + 5 + Math.min(3, Math.floor((pay + 5) / 5)), 'Taxman: 10 over pays 5'); }
{ const s = game({ relics: ['tithe'], floor: 3, gold: 40 }); s.slain = s.contract.target; clearFloor(s);
  eq(s.gold, 40 + s.contract.pay + 6, 'Tithe Box: interest reaches 6'); }
{ const m = M(3), s = game({ relics: ['pickpocket'], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').gold, 2, 'Pickpocket: bare kill gives 2 gold'); }
{ const s = game({ floor: 3, gold: 10 }); s.phase = 'shop'; s.shop = { relics: ['loanshark'], bought: {} }; E.buy(s, 'loanshark');
  eq(s.gold, 7, 'Loan Shark: costs 3'); E.leaveShop(s); eq(s.gold, 11, 'Loan Shark: +4 at the start of the next floor');
  E.bid(s, 0); s.slain = 0; s.gold = 20; clearFloor(s); ok(s.gold <= 12 + 3, 'Loan Shark: a missed contract costs 8'); }

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

// ---------- dev helpers ----------
{ const s = E.newGame(5); E.devJump(s, 7); eq(s.floor, 7, 'devJump: floor 8'); ok(s.boss === null && s.phase === 'bid', 'devJump: a normal floor waits for a bid');
  eq(s.deck.filter(c => c.v === 15).length, 2, 'devJump: act 2 elites are in the deck'); eq(s.deck.filter(c => c.v === 17).length, 2, 'devJump: act 3 elites are in the deck');
  E.devJump(s, 8); ok(s.boss && s.boss.key === 'recklessOnly', 'devJump: floor 9 has the Lich');
  E.bid(s, 0); E.devRoom(s, 3); eq(s.roomsCleared, 3, 'devRoom: room 4'); }

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
