// Simulator: a heuristic bot plays thousands of runs to tune difficulty and hunt for broken relic combos.
// Usage:
//   node sim.js curve [runs]          win rates for cautious / balanced / greedy bots, deaths and strikes by floor
//   node sim.js guided [runs]         the same curve in Guided start (systems unlock floor by floor)
//   node sim.js onedeck [runs]        the same curve in One deck mode (the pile isn't reshuffled between floors)
//   node sim.js relics [runs]         win rate when the bot starts with each relic (vs. none)
//   node sim.js pairs [runs] [top]    the relic pairs that beat their two singles by the most
//   node sim.js shop [runs]           shop rerolls and the skip reward: win rates with and without them
//   node sim.js endless [runs]        how deep each bot gets when it keeps going after a win (Endless)
const E = require('./engine.js');

function mini(s) {
  return {
    hp: s.hp, maxHp: s.maxHp, weapon: s.weapon && { ...s.weapon }, weapon2: s.weapon2 && { ...s.weapon2 }, potionUsed: s.potionUsed, roomKills: s.roomKills,
    cleave: s.cleave, weaponKills: s.weaponKills, bareKills: s.bareKills, bossFloors: s.bossFloors, scarDmg: s.scarDmg,
    roomBare: s.roomBare, floorBare: s.floorBare, slain: s.slain, gold: s.gold, relics: s.relics, boss: s.boss, contract: s.contract,
  };
}
function value(m, greed, need) {
  if (m.hp <= 0) return -1e6;
  const w = m.weapon ? m.weapon.v * (m.weapon.limit == null ? 1 : Math.min(1, m.weapon.limit / 10)) : 0;
  const short = Math.max(0, need - m.slain);
  return m.hp + greed * Math.min(m.slain, need + 10) - 0.15 * short + 0.6 * w;
}
// Best plan for the cards still to handle in this room.
function plan(s, greed) {
  const need = s.contract ? s.contract.target * Math.min(1, (s.roomsCleared + 1) / E.ROOMS_PER_FLOOR) : 0;
  let best = { v: -Infinity, steps: [] };
  // A boss in the room must die before it ends, so plan one more card and count leaving it as a disaster.
  const boss = s.room.some(c => c.boss);
  const left = s.relics.includes('greedy') ? s.room.length : Math.min(s.room.length, Math.max(3 - s.handled, boss ? 1 : 0));
  (function rec(m, room, steps) {
    if (steps.length === left || m.hp <= 0) {
      const v = value(m, greed, need) - (room.some(c => c.boss) && m.hp > 0 ? 1e5 : 0); if (v > best.v) best = { v, steps: steps.slice() }; return;
    }
    room.forEach((c, i) => {
      if (c.hidden && !steps.length) return; // the Banshee's face-down card can't be taken first
      for (const mode of E.modes(m, c)) {
        const m2 = { ...m, weapon: m.weapon && { ...m.weapon }, weapon2: m.weapon2 && { ...m.weapon2 } };
        E.resolveCard(m2, c, mode);
        rec(m2, room.filter((_, j) => j !== i), [...steps, [c.id, mode]]);
      }
    });
  })(mini(s), s.room, []);
  return best;
}

const BOTS = {
  cautious: { greed: 0.2, margin: 0.85, raiseAt: 1.3, clauses: false },
  balanced: { greed: 0.5, margin: 1.0, raiseAt: 1.1, clauses: true },
  greedy: { greed: 1.2, margin: 1.15, raiseAt: 0.95, clauses: true },
};

function playRun(seed, bot, opts = {}) {
  const s = E.newGame(seed, { oneDeck: !!opts.oneDeck, guided: !!opts.guided });
  if (opts.relics) opts.relics.forEach(k => E.devGrant(s, k));
  if (opts.give) opts.give.forEach(k => E.devGrant(s, k)); // a starting relic on top of the usual picks
  let avg = 42, n = 1, steps = 0;
  while (s.phase !== 'won' && s.phase !== 'lost' || (opts.endless && s.phase === 'won' && E.continueEndless(s))) {
    if (s.phase === 'won' || s.phase === 'lost') break;
    if (++steps > 3000) { s.stalled = true; s.phase = 'lost'; break; }
    if (s.phase === 'bid') {
      const est = (avg / n) * bot.margin + (s.hp - 14) * 0.4;
      let pick = 0, bestPay = -1;
      s.offers.forEach((o, i) => {
        const okClause = !o.clause || (bot.clauses && (o.clause === 'sworn' || (o.clause === 'abstain' && s.hp >= 14)));
        const pay = E.payout(s, o.tier, o.clause);
        if (okClause && E.target(s, o.tier) <= est && pay > bestPay) { pick = i; bestPay = pay; }
      });
      E.bid(s, pick);
    } else if (s.phase === 'room') {
      if (E.canRaise(s)) {
        const proj = s.slain / s.roomsCleared * E.ROOMS_PER_FLOOR;
        if (proj >= E.target(s, s.contract.tier + 1) * bot.raiseAt) { E.raise(s); continue; }
      }
      const p = plan(s, bot.greed);
      if (E.canRedraw(s) && p.v < s.hp - 8) { E.redraw(s); continue; }
      if (s.handled === 0 && E.canFlee(s) && p.v < s.hp - 8) { E.flee(s); continue; }
      // Stash Pouch: a potion you can't use now (full health, or one drunk already) is kept for later; a stashed potion is drunk when hurt.
      if (s.stash && E.canUseStash(s) && s.stash.kind === 'potion' && !s.potionUsed && s.maxHp - s.hp >= s.stash.v) { E.useStash(s); continue; }
      if (s.stash && E.canUseStash(s) && s.stash.kind === 'weapon' && (!s.weapon || s.weapon.limit != null && s.weapon.limit < s.stash.v)) { E.useStash(s); continue; }
      const keep = s.room.find(c => (c.kind === 'potion' && (s.potionUsed || s.hp === s.maxHp)) && E.canStash(s, c.id));
      if (keep && s.handled < 2) { E.stash(s, keep.id); continue; }
      // Hourglass: take back a card that cost a lot.
      const hp0 = s.hp;
      E.handle(s, p.steps[0][0], p.steps[0][1]);
      if (E.canUndo(s) && hp0 - s.hp >= 8) { E.undo(s); const c = s.room.find(x => x.id === p.steps[0][0]); if (c && E.canSwap(s, c.id)) E.swapCard(s, c.id); else if (c && E.canStash(s, c.id)) E.stash(s, c.id); continue; }
      if (s.phase !== 'room' && s.contract && s.hp > 0) { avg += s.slain; n++; }
    } else if (s.phase === 'shop') {
      if (opts.record) opts.record.push({ floor: s.floor, gold: s.gold });
      // Keep enough gold for this act's dues, scaled by how far into the act we are.
      const reserve = E.duesFor(s, E.act(s)) * ((s.floor % 3) + 1) / 3;
      const spend = (k, arg) => { const c = E.cost(s, k, arg); if (c != null && s.gold - c >= reserve) return E.buy(s, k, arg); return false; };
      if (s.hp < s.maxHp - 6) spend('bandage');
      if (s.pick) {
        // The free pick: the best-rated option; drop the weakest relic when full.
        const best = s.pick.options.slice().sort((a, b) => worth(s, b) - worth(s, a))[0];
        const skip = () => { E.skipPick(s); if (opts.skipGold != null) s.gold += opts.skipGold - E.SKIP_GOLD; };
        if (opts.relics || opts.noPicks || (opts.picky && worth(s, best) < opts.picky)) skip();
        else {
          if (E.relicsFull(s)) { const weak = s.relics.slice().sort((a, b) => worth(s, a) - worth(s, b))[0]; if (worth(s, weak) < worth(s, best)) E.dropRelic(s, weak); }
          if (!E.choose(s, best)) skip();
        }
      }
      // Reroll a weak relic shelf while the price leaves the dues reserve alone.
      if (opts.reroll && !opts.relics && !opts.noPicks && !E.relicsFull(s))
        while (E.canReroll(s) && s.shop.relics.every(k => worth(s, k) < opts.reroll) && s.gold - E.rerollCost(s) - E.cost(s, s.shop.relics[0]) >= reserve) E.rerollShop(s);
      if (!opts.relics && !opts.noPicks) for (const k of s.shop.relics) if (!E.relicsFull(s)) spend(k);
      // The kit: recruit the best weapon on offer, then forge the strongest weapon card while gold allows.
      if (!opts.noKit) {
        const o = (s.shop.recruit || []).map((c, i) => [c, i]).filter(([c]) => c.kind === 'weapon').sort((a, b) => b[0].v - a[0].v)[0];
        if (o) spend('recruit', o[1]);
        for (let n = 0; n < 3; n++) { const w = s.deck.filter(c => c.kind === 'weapon').sort((a, b) => b.v - a.v)[0]; if (!w || !spend('forge', w.id)) break; }
      }
      E.leaveShop(s);
    }
  }
  return s;
}
// How much the bot wants a relic: its win-rate lift when held alone (sim.js relics).
const RATING_OLD = {seal: 24.6, idol: 23.4, executioner: 21.8, unbreaking: 17.2, bribe: 17.0, quickdraw: 16.6, bonecrown: 16.6, buckler: 15.4, berserk: 15.2, hagheart: 14.0, ambush: 12.8, oil: 10.4, giantsgrip: 9.4, fortune: 8.8, ironskin: 8.6, grindstone: 7.6, masterwork: 7.4, smokebomb: 7.2, trophy: 6.8, oathkeeper: 6.4, ironfist: 4.8, bedroll: 4.6, wardenkeys: 4.4, fang: 4.0, wardrum: 3.8, bloodstone: 3.6, rulebreaker: 3.4, secondwind: 3.4, downpayment: 3.2, whetstone: 2.8, keenedge: 2.8, bloodpact: 2.6, brawler: 2.2, alchemist: 2.0, haymaker: 1.6, ledger: 1.4, quartermaster: 1.0, knuckles: 1.0, hide: 1.0, pitfighter: 0.8, herbalist: 0.5, scout: 0.5, lantern: 0.5, secondheart: 0.5, tipjar: 0.5, taxman: 0.5, loanshark: 0.5, pickpocket: 0.5, tithe: 0.5, haggler: 0.5, lichledger: 0.5, thorns: 0.5, loaded: 0.5};
// 2.x ratings: win-rate lift when given at the start (sim.js lift), measured after the relic rework.
const RATING = {unbreaking: 23.3, livingsteel: 12, giantsgrip: 22.9, hagheart: 20.5, executioner: 19.3, lichledger: 19.2, buckler: 18.0, ironskin: 15.8, trophybelt: 15.4, mimic: 14.4, seal: 14.4, haymaker: 13.9, berserk: 13.8, notched: 13.4, fortune: 13.0, greedy: 13, grindstone: 12.7, masterwork: 12.5, glassblade: 12.4, alchemykit: 11.4, wardrum: 11.2, hunger: 10.9, tipjar: 10.2, oathkeeper: 9.8, twinblades: 9.7, alchemist: 9.2, idol: 8.8, ironfist: 8.5, cleave: 7.9, bribe: 7.0, cursed: 6.7, smokebomb: 6.4, bloodstone: 5.5, taxman: 5.4, keenedge: 4.8, rulebreaker: 4.7, loanshark: 4.4, fang: 4.3, bloodpact: 4.3, knuckles: 4.0, bell: 4, wardenkeys: 3.8, secondwind: 3.8, pickpocket: 3.3, whetstone: 3.0, bedroll: 2.9, pitfighter: 2.8, secondheart: 2.8, miser: 2.5, compound: 2.5, scar: 2.0, hardknuckles: 1.8, escape: 1.5, hourglass: 1.4, stash: 0.6, bloodprice: 0.5, spyglass: 0.5, bait: 0.5, ironball: 0.5};
const worth = (s, k) => k === 'trophy' ? 16 : RATING[k] != null ? RATING[k] : ({ common: 3, rare: 6, epic: 10 })[E.RELICS[k].rarity];
function batch(runs, bot, opts, seed0 = 1) {
  const res = { stalled: 0, won: 0, died: 0, struck: 0, floors: 0, diedAt: Array(9).fill(0), struckAt: Array(9).fill(0) };
  for (let i = 0; i < runs; i++) {
    const s = playRun(seed0 + i, bot, opts);
    if (s.stalled) res.stalled++;
    if (s.phase === 'won') { res.won++; res.floors += 9; continue; }
    res.floors += s.floor;
    if (s.hp === 0) { res.died++; res.diedAt[s.floor]++; } else { res.struck++; res.struckAt[s.floor]++; }
  }
  res.win = res.won / runs; res.avgFloor = res.floors / runs + 1;
  return res;
}
const pct = x => (100 * x).toFixed(1).padStart(5) + '%';

const [mode = 'curve', runsArg, topArg] = require.main === module ? process.argv.slice(2) : ['none'];
const runs = +runsArg || 2000;
if (mode === 'curve' || mode === 'onedeck' || mode === 'guided') {
  for (const [name, bot] of Object.entries(BOTS)) {
    const r = batch(runs, bot, { oneDeck: mode === 'onedeck', guided: mode === 'guided' }, +topArg || 1);
    console.log(`${name.padEnd(9)} win ${pct(r.win)}  died ${pct(r.died / runs)}  struck out ${pct(r.struck / runs)}  avg last floor ${r.avgFloor.toFixed(2)}`);
    console.log(`          ended on floor 1-9: ${r.diedAt.map((d, i) => d + r.struckAt[i]).join(' ')}`);
  }
} else if (mode === 'shop') {
  const rows = [['plain', {}], ['rerolls weak shelf', { reroll: 8 }]];
  for (const g of [4, 6, 8, 10]) rows.push([`skips weak picks, skip ${g}`, { picky: 5, skipGold: g }]);
  for (const [name, opts] of rows) {
    const r = batch(runs, BOTS.balanced, opts);
    console.log(`${name.padEnd(28)} win ${pct(r.win)}  avg last floor ${r.avgFloor.toFixed(2)}`);
  }
} else if (mode === 'endless') {
  for (const [name, bot] of Object.entries(BOTS)) {
    const depth = [];
    for (let i = 0; i < runs; i++) { const s = playRun(1 + i, bot, { endless: true }); if (s.endless) depth.push(s.floor + 1); }
    depth.sort((a, b) => a - b);
    const q = p => depth[Math.min(depth.length - 1, Math.floor(p * depth.length))];
    console.log(`${name.padEnd(9)} went endless ${depth.length}/${runs}; last floor median ${q(0.5)}, 90th ${q(0.9)}, best ${depth[depth.length - 1]}`);
  }
} else if (mode === 'relics' || mode === 'pairs') {
  const bot = BOTS.balanced;
  const base = batch(runs, bot, { relics: [] }).win;
  const keys = Object.keys(E.RELICS);
  const single = {};
  for (const k of keys) single[k] = batch(runs, bot, { relics: [k] }).win;
  if (mode === 'relics') {
    console.log(`no relic: ${pct(base)}`);
    keys.sort((a, b) => single[b] - single[a]).forEach(k => console.log(`${E.RELICS[k].name.padEnd(16)} ${pct(single[k])}  (${single[k] >= base ? '+' : ''}${(100 * (single[k] - base)).toFixed(1)})`));
  } else {
    const rows = [];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i], b = keys[j];
      const w = batch(runs, bot, { relics: [a, b] }).win;
      rows.push({ a, b, w, lift: w - Math.max(single[a], single[b]) - (Math.min(single[a], single[b]) - base) });
    }
    rows.sort((x, y) => y.lift - x.lift);
    console.log(`no relic ${pct(base)}. Synergy = pair win rate minus what the two singles add on their own.`);
    rows.slice(0, +topArg || 12).forEach(r => console.log(`${(E.RELICS[r.a].name + ' + ' + E.RELICS[r.b].name).padEnd(34)} ${pct(r.w)}  synergy ${(100 * r.lift).toFixed(1)}`));
    rows.sort((x, y) => y.w - x.w);
    console.log('\nStrongest pairs outright:');
    rows.slice(0, 8).forEach(r => console.log(`${(E.RELICS[r.a].name + ' + ' + E.RELICS[r.b].name).padEnd(34)} ${pct(r.w)}`));
  }
}
module.exports = { playRun, batch, BOTS };
