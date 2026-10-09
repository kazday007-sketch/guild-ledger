// Simulator: a heuristic bot plays thousands of runs to tune difficulty and hunt for broken relic combos.
// Usage:
//   node sim.js curve [runs]          win rates for cautious / balanced / greedy bots, deaths and strikes by floor
//   node sim.js relics [runs]         win rate when the bot starts with each relic (vs. none)
//   node sim.js pairs [runs] [top]    the relic pairs that beat their two singles by the most
const E = require('./engine.js');

function mini(s) {
  return {
    hp: s.hp, maxHp: s.maxHp, weapon: s.weapon && { ...s.weapon }, potionUsed: s.potionUsed, roomKills: s.roomKills,
    slain: s.slain, gold: s.gold, relics: s.relics, boss: s.boss, contract: s.contract,
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
  const left = 3 - s.handled;
  (function rec(m, room, steps) {
    if (steps.length === left || m.hp <= 0) {
      const v = value(m, greed, need); if (v > best.v) best = { v, steps: steps.slice() }; return;
    }
    room.forEach((c, i) => {
      const modes = c.kind === 'monster' ? (E.canUseWeapon(m, c) ? ['weapon', 'bare'] : ['bare']) : [null];
      for (const mode of modes) {
        const m2 = { ...m, weapon: m.weapon && { ...m.weapon } };
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
  const s = E.newGame(seed);
  if (opts.relics) { s.relics = opts.relics.slice(); if (s.relics.includes('hide')) { s.maxHp += 6; s.hp += 6; } }
  let avg = 42, n = 1, steps = 0;
  while (s.phase !== 'won' && s.phase !== 'lost') {
    if (++steps > 3000) { s.stalled = true; s.phase = 'lost'; break; }
    if (s.phase === 'bid') {
      const est = (avg / n) * bot.margin + (s.hp - 14) * 0.4;
      let pick = 0, bestPay = -1;
      s.offers.forEach((o, i) => {
        const okClause = !o.clause || (bot.clauses && (o.clause === 'sworn' || (o.clause === 'abstain' && s.hp >= 14)));
        const pay = E.payout(s, o.tier, o.clause);
        if (okClause && E.TARGETS[s.floor][o.tier] <= est && pay > bestPay) { pick = i; bestPay = pay; }
      });
      E.bid(s, pick);
    } else if (s.phase === 'room') {
      if (E.canRaise(s)) {
        const proj = s.slain / s.roomsCleared * E.ROOMS_PER_FLOOR;
        if (proj >= E.TARGETS[s.floor][s.contract.tier + 1] * bot.raiseAt) { E.raise(s); continue; }
      }
      const p = plan(s, bot.greed);
      if (E.canRedraw(s) && p.v < s.hp - 8) { E.redraw(s); continue; }
      if (s.handled === 0 && E.canFlee(s) && p.v < s.hp - 8) { E.flee(s); continue; }
      E.handle(s, p.steps[0][0], p.steps[0][1]);
      if (s.phase !== 'room' && s.contract && s.hp > 0) { avg += s.slain; n++; }
    } else if (s.phase === 'shop') {
      if (opts.record) opts.record.push({ floor: s.floor, gold: s.gold });
      // Keep enough gold for this act's dues, scaled by how far into the act we are.
      const reserve = E.DUES[E.act(s)] * ((s.floor % 3) + 1) / 3;
      const spend = k => { const it = E.RELICS[k] || E.SERVICES[k]; if (s.gold - it.cost >= reserve) E.buy(s, k); };
      if (s.hp < s.maxHp - 6) spend('bandage');
      if (!opts.relics) for (const k of s.shop.relics) if (s.relics.length < E.MAX_RELICS) spend(k);
      spend('smith');
      E.leaveShop(s);
    }
  }
  return s;
}
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
if (mode === 'curve') {
  for (const [name, bot] of Object.entries(BOTS)) {
    const r = batch(runs, bot, {});
    console.log(`${name.padEnd(9)} win ${pct(r.win)}  died ${pct(r.died / runs)}  struck out ${pct(r.struck / runs)}  avg last floor ${r.avgFloor.toFixed(2)}`);
    console.log(`          ended on floor 1-9: ${r.diedAt.map((d, i) => d + r.struckAt[i]).join(' ')}`);
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
