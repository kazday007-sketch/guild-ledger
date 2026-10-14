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
  const r = fight(s, m, 'weapon'); eq(r.lost, 1, 'Crown of Thorns: a fully blocked fight still costs 1'); eq(r.pts, 8, 'Crown of Thorns: +4 points'); }
{ const p = P(8), s = game({ relics: ['alchemist'], hp: 17, room: [p, M(2), M(2), M(2)] });
  E.handle(s, p.id); eq(s.slain, 5, 'Alchemist: 5 overheal counts 5 points'); }

// ---------- contracts and gold ----------
{ const s = game({ relics: ['ledger'], floor: 3 }); eq(E.payout(s, 2), 4 * 6, 'Bounty Ledger: Reckless pays x6 (act 2 base 4)'); eq(E.payout(s, 1), 4 * 2, 'Bounty Ledger: Bold unchanged'); }
{ const s = game({ relics: ['seal'], floor: 3 }); s.slain = 0; clearFloor(s); eq(s.strikes, 0, 'Insurance Seal: first miss in the act is free');
  E.leaveShop(s); E.bid(s, 0); s.slain = 0; clearFloor(s); eq(s.strikes, 1, 'Insurance Seal: second miss in the act is a strike'); }
{ const s = game({ relics: ['loaded'], floor: 4 }); s.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  ok(E.raise(s), 'Loaded Dice: a raise'); ok(!E.raise(s), 'Loaded Dice: once per floor'); eq(s.contract.tier, 1, 'Loaded Dice: Safe to Bold');
  const s2 = game({ floor: 4 }); s2.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s2, s2.room[0].id);
  ok(!E.canRaise(s2), 'Base: no raise without a relic');
  const s3 = game({ relics: ['loaded', 'wardrum'], floor: 4 }); s3.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s3, s3.room[0].id);
  ok(E.raise(s3) && E.raise(s3), 'Loaded Dice + War Drum: two raises'); }
{ const s = game({ relics: ['taxman'], floor: 3, gold: 0 }); s.slain = s.contract.target + 10; clearFloor(s);
  const pay = s.contract.pay; eq(s.gold, pay + 5 + Math.min(3, Math.floor((pay + 5) / 5)), 'Taxman: 10 over pays 5'); }
{ const s = game({ relics: ['tithe'], floor: 3, gold: 40 }); s.slain = s.contract.target; clearFloor(s);
  eq(s.gold, 40 + s.contract.pay + 6, 'Tithe Box: interest reaches 6'); }
{ const m = M(3), s = game({ relics: ['pickpocket'], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').gold, 2, 'Pickpocket: bare kill gives 2 gold'); }
{ const s = game({ floor: 3, gold: 20 }); s.phase = 'shop'; s.shop = { relics: ['loanshark'], bought: {} }; E.buy(s, 'loanshark');
  eq(s.gold, 20 - E.cost(s, 'loanshark'), 'Loan Shark: bought'); const g = s.gold; E.leaveShop(s); eq(s.gold, g + 4, 'Loan Shark: +4 at the start of the next floor');
  E.bid(s, 0); s.slain = 0; s.gold = 20; clearFloor(s); ok(s.gold <= 12 + 3, 'Loan Shark: a missed contract costs 8'); }

// ---------- 1.29.0 relics ----------
{ const m = M(5), s = game({ relics: ['oil', 'grindstone', 'whetstone'], weapon: [9, null], room: [m, M(2), M(2), M(2)] });
  eq(fight(s, m, 'weapon').pts, 7, 'Blade Oil: weapon kill +2'); }
{ const w = W(4), s = game({ relics: ['quickdraw'], room: [w, M(2), M(2), M(2)] }); E.handle(s, w.id); eq(s.slain, 2, 'Quickdraw: equipping counts 2'); }
{ const s = game({ relics: ['quartermaster'], floor: 2 }); s.weapon = null; s.slain = 999; clearFloor(s); E.skipPick(s); E.leaveShop(s);
  eq(s.weapon && s.weapon.v, 5, 'Quartermaster: a fresh 5 weapon at the start of the floor'); }
{ const a = M(8), b = M(9), s = game({ relics: ['masterwork'], weapon: [9, null], room: [a, b, M(2), M(2)] });
  fight(s, a, 'weapon'); ok(E.canUseWeapon(s, b), 'Masterwork: an 8 kill does not dull the weapon');
  const c = M(10), s2 = game({ relics: ['masterwork'], weapon: [10, null], room: [c, M(2), M(2), M(2)] }); fight(s2, c, 'weapon'); eq(s2.weapon.limit, 10, 'Masterwork: a 10 kill dulls it'); }
{ const m = M(11), s = game({ relics: ['executioner'], weapon: [11, null], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'weapon').pts, 22, 'Executioner: weapon kill of 11 counts 22'); }
{ const m = M(13), s = game({ relics: ['unbreaking'], weapon: [9, null], room: [m, M(2), M(2), M(2)] }); fight(s, m, 'weapon'); eq(s.weapon.limit, null, 'Unbreaking Edge: never dulls'); }
{ const m = M(9), s = game({ relics: ['knuckles', 'brawler', 'fang'], room: [m, M(2), M(2), M(2)] });
  eq(fight(s, m, 'bare').lost, 9 - 2 - 2, 'Brass Knuckles: 2 off a bare fight (and the fang heals 2)'); }
{ const m = M(6), s = game({ relics: ['ironfist'], room: [m, M(7), M(2), M(2)] }); eq(fight(s, m, 'bare').lost, 0, 'Iron Fist: a 6 deals nothing bare-handed');
  eq(fight(s, s.room[0], 'bare').lost, 7, 'Iron Fist: a 7 hits as normal'); }
{ const a = M(4), b = M(4), s = game({ relics: ['haymaker'], room: [a, b, M(2), M(2)] });
  eq(fight(s, a, 'bare').pts, 8, 'Haymaker: first bare kill doubles'); eq(fight(s, b, 'bare').pts, 4, 'Haymaker: second is normal'); }
{ const a = M(3), b = M(3), s = game({ relics: ['pitfighter'], hp: 10, room: [a, b, M(2), M(2)] });
  fight(s, a, 'bare'); eq(s.maxHp, 22, 'Pit Fighter: +2 max health'); fight(s, b, 'bare'); eq(s.maxHp, 22, 'Pit Fighter: once per floor'); }
{ const m = M(9), s = game({ relics: ['giantsgrip'], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').lost, 4, "Giant's Grip: a 9 bare deals 4"); }
{ const p = P(5), s = game({ relics: ['bloodstone', 'hide'], hp: 5, room: [p, M(2), M(2), M(2)] }); E.handle(s, p.id); eq(s.hp, 5 + 5 + 2, 'Bloodstone: potions heal 2 more'); }
{ const s = game({ relics: ['bedroll'], floor: 2, hp: 10 }); s.slain = 999; clearFloor(s); E.skipPick(s); E.leaveShop(s); eq(s.hp, 13, 'Bedroll: heal 3 at the start of a floor'); }
{ const m = M(14), s = game({ relics: ['secondheart'], hp: 6, room: [m, M(2), M(2), M(2)] }); E.handle(s, m.id, 'bare');
  eq(s.hp, 5, 'Second Heart: live on at 5'); ok(s.phase === 'room' && !s.relics.includes('secondheart'), 'Second Heart: it crumbles'); }
{ const s = game({ hp: 10 }); E.devGrant(s, 'hagheart'); eq(s.maxHp, 28, "Hag's Heart: +8 max"); eq(s.hp, 18, "Hag's Heart: heals 8");
  const a = P(3), b = P(3); s.room = [a, b, M(2), M(2)]; s.relics.push('herbalist'); E.handle(s, a.id); eq(s.hp, 24, "Hag's Heart: first potion heals double");
  E.handle(s, b.id); eq(s.hp, 27, "Hag's Heart: the second potion heals normally"); }
{ const s = game({ relics: ['tipjar', 'taxman'], gold: 0 }); s.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  eq(s.gold, 1, 'Tip Jar: a cleared room gives 1 gold'); }
{ const s = game({ floor: 3, gold: 20 }); s.phase = 'shop'; s.pick = null; s.shop = { relics: [], bought: {} }; const full = E.cost(s, 'bandage');
  E.devGrant(s, 'haggler'); eq(E.cost(s, 'bandage'), full - 2, 'Haggler: 2 off'); }
{ const m = M(4), s = game({ relics: ['idol'], gold: 32, room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').pts, 6, 'Golden Idol: 25 gold adds 2'); }
{ const s = game({ relics: ['bribe'], floor: 3, gold: 15 }); s.slain = 0; clearFloor(s); eq(s.strikes, 0, 'Bribe: no strike'); eq(s.payout.outcome, 'covered', 'Bribe: covered');
  const t = game({ relics: ['bribe'], floor: 3, gold: 5 }); t.slain = 0; clearFloor(t); eq(t.strikes, 1, 'Bribe: a strike when you can\'t pay'); }
{ const s = game({ relics: ['lichledger'], floor: 2, gold: 100 }); s.slain = 999; clearFloor(s);
  ok(/Interest \+\d{2,}/.test(s.lastResult), "Lich's Ledger: interest has no cap"); ok(/Paid 5 gold in guild dues/.test(s.lastResult), "Lich's Ledger: dues halved"); }
{ const s = E.newGame(1); E.devJump(s, 3); E.devGrant(s, 'oathkeeper'); E.devGrant(s, 'loaded'); E.bid(s, 0);
  eq(s.contract.target, E.TARGETS[3][0] - 4, 'Oathkeeper: 4 off the target'); }
{ const s = game({ relics: ['downpayment'], floor: 2 }); s.slain = 999; clearFloor(s); E.skipPick(s); E.leaveShop(s); eq(s.slain, 4, 'Down Payment: floors start at 4 points'); }
{ const s = game({ relics: ['wardrum'], floor: 4 }); s.room = [P(2), P(2), P(2), P(2)]; for (let i = 0; i < 3; i++) E.handle(s, s.room[0].id);
  const b = s.slain; E.raise(s); eq(s.slain, b + 6, 'War Drum: raising counts 6'); }
{ const m = M(4), s = game({ relics: ['bonecrown'], room: [m, M(2), M(2), M(2)] }); eq(fight(s, m, 'bare').pts, 6, 'Bone Crown: +2 a kill'); }
{ const s = E.newGame(1); E.devJump(s, 6); E.devGrant(s, 'rulebreaker'); const i = s.offers.findIndex(o => o.clause); s.offers[i].clause = 'sworn'; E.bid(s, i);
  ok(E.canFlee(s), 'Rulebreaker: a Sworn Wildcard still lets you flee'); }
{ const s = game({ relics: ['smokebomb'] }); ok(E.flee(s) && E.flee(s) && E.flee(s), 'Smoke Bomb: flee three in a row'); }
{ const s = game({ relics: ['wardenkeys'], floor: 2, hp: 3, room: [P(2), P(2), M(2), M(2)] }); s.hp = 3; E.handle(s, s.room[0].id); E.handle(s, s.room[0].id);
  ok(E.canFlee(s), "Warden's Keys: flee after 2 cards, past the Warden at low health"); E.flee(s); ok(s.hp >= 3, "Warden's Keys: fleeing costs nothing"); }

// ---------- relic picks ----------
{ const s = game({ floor: 3 }); s.slain = 0; clearFloor(s);
  ok(s.pick && s.pick.options.length === 3 && new Set(s.pick.options).size === 3, 'pick: three different relics after a floor');
  ok(!E.buy(s, 'bandage'), 'pick: the shop waits for the pick'); const k = s.pick.options[0];
  ok(E.choose(s, k) && s.relics.includes(k) && !s.pick, 'pick: choosing takes the relic');
  ok(s.shop.relics.length === 1 && E.RELICS[s.shop.relics[0]].rarity === 'rare', 'shop: one rare relic for sale'); }
{ const s = game({ floor: 2, tier: 2 }); s.slain = 999; clearFloor(s); ok(s.pick.boss && s.pick.options.every(k => E.RELICS[k].rarity === 'boss'), 'pick: boss floors offer boss relics'); }
{ const s = game({ floor: 3, tier: 2 }); s.slain = 999; clearFloor(s); ok(s.pick.options.every(k => E.RELICS[k].rarity === 'rare'), 'pick: a met Reckless contract offers rares'); }
{ const s = game({ floor: 3, gold: 0 }); s.slain = 0; clearFloor(s); const g = s.gold; E.skipPick(s); eq(s.gold, g + E.SKIP_GOLD, 'pick: skipping pays gold'); }
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

// ---------- dev helpers ----------
{ const s = E.newGame(5); E.devJump(s, 7); eq(s.floor, 7, 'devJump: floor 8'); ok(s.boss === null && s.phase === 'bid', 'devJump: a normal floor waits for a bid');
  eq(s.deck.filter(c => c.v === 15).length, 3, 'devJump: act 2 elites are in the deck'); eq(s.deck.filter(c => c.v === 17).length, 3, 'devJump: act 3 elites are in the deck');
  E.devJump(s, 8); ok(s.boss && s.boss.key === 'recklessOnly', 'devJump: floor 9 has the Lich');
  E.bid(s, 0); E.devRoom(s, 3); eq(s.roomsCleared, 3, 'devRoom: room 4'); }

// ---------- One deck ----------
// Play a floor for real: take the first 3 cards of each room bare-handed, never dying, always meeting the contract.
function playFloor(s) {
  if (s.phase === 'bid') E.bid(s, 0);
  for (let n = 0; s.phase === 'room' && n < 40; n++) { s.hp = 99; s.maxHp = 99; s.slain = 999; E.handle(s, s.room[0].id, 'bare'); }
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
  const p = s.draw.length; E.buy(s, 'smith');
  eq(s.draw.length, p + 1, 'one deck: Smith\'s weapon goes into the pile');
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
  clearFloor(s); E.leaveShop(s); s.hp = 3; s.room = [M(13), M(2), M(2), M(2)];
  E.handle(s, s.room[0].id, 'bare'); eq(s.phase, 'lost', 'tutorial: floor 2 can kill you'); }

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
