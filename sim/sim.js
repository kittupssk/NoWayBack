// Runs the real game script headlessly and pits two computer police players against the computer thief.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2] || __dirname + '/../index.html', 'utf8');
const gameJs = html.match(/<script>([\s\S]*)<\/script>/)[1];
const GAMES = +(process.argv[3] || 400);

const el = () => ({ innerHTML: '', textContent: '', hidden: false, classList: { add() {}, remove() {} }, addEventListener() {} });
const els = {};
const ctx = vm.createContext({
  document: { getElementById: id => els[id] || (els[id] = el()), querySelector: () => null, querySelectorAll: () => [] },
  LAYOUT: process.env.LAYOUT || 'shape', window: {}, setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, console, Math, Set, Map, Infinity, GAMES, OUT: {}
});

const driver = `
const N = 1500;
function sigFor(p, t) {
  const L = t.length;
  if (nb(p).includes(t[L - 1])) return 'hot';
  if (L >= 2 && near(p, t[L - 2])) return 'warm';
  for (const k of S.faint) if (L >= k && near(p, t[L - k])) return 'faint';
  return 'cold';
}
const pick = a => a[Math.floor(Math.random() * a.length)];
// Sharp police: tracks every possible thief trail that fits all the clues so far (particle filter).
function Sharp() {
  let parts = [];
  function init() {
    const rooms = []; for (let i = 0; i < S.size * S.size; i++) if (!special(i)) rooms.push(i);
    parts = []; for (let k = 0; k < N; k++) parts.push({ t: [pick(rooms)], loot: [], pend: null });
  }
  return {
    observe(prevPolice) {
      if (S.turn === 1) init();
      else {
        const next = [];
        for (const q of parts) {
          const cur = q.t[q.t.length - 1], opts = nb(cur).filter(i => !q.t.includes(i) && i !== prevPolice);
          if (!opts.length) continue;
          const m = pick(opts), loot = q.loot.slice();
          let alarmed = null, robbed = null;
          if (S.vaults.includes(m) && !loot.includes(m)) { loot.push(m); if (S.alarms !== 'off') robbed = m; }
          if (S.alarms === 'delayed') alarmed = q.pend; else alarmed = robbed;
          if (S.game === 'heist' && S.exits.includes(m) && loot.length >= S.need) continue;
          if (alarmed !== S.alarmNow) continue;
          next.push({ t: q.t.concat(m), loot, pend: S.alarms === 'delayed' ? robbed : null });
        }
        parts = next;
      }
      const p = last(S.police);
      parts = parts.filter(q => sigFor(p, q.t) === S.sig && q.t[q.t.length - 1] !== p);
      if (!parts.length) { // lost track: restart from rooms that fit the current clue only
        const rooms = []; for (let i = 0; i < S.size * S.size; i++) if (isRoom(i) && i !== p && (S.sig === 'hot') === nb(p).includes(i)) rooms.push(i);
        for (let k = 0; k < N; k++) parts.push({ t: [S.alarmNow != null && !S.alarmLate ? S.alarmNow : pick(rooms)], loot: S.knownEmpty.slice(), pend: null });
      }
      while (parts.length < N) parts.push(parts[Math.floor(Math.random() * parts.length)]);
      if (parts.length > N) parts = parts.slice(0, N);
    },
    act() {
      const p = last(S.police), here = parts.map(q => q.t[q.t.length - 1]);
      let best = p, bs = -1e9;
      for (const a of [p, ...nb(p)]) {
        const catchP = a === p ? 0 : here.filter(x => x === a).length / here.length;
        const avgD = here.reduce((s, x) => s + dist(a, x), 0) / here.length;
        const s = catchP * 1000 - avgD + Math.random() * 0.01;
        if (s > bs) { bs = s; best = a; }
      }
      return best;
    }
  };
}
// Casual police: reacts only to the latest clue, like a new player.
function Casual() {
  let target = null;
  return {
    observe() { if (S.alarmNow != null) target = S.alarmNow; },
    act() {
      const p = last(S.police), n = nb(p);
      if (S.sig === 'hot') return pick(n);
      if (target != null && target !== p) { const t = target; return n.reduce((a, b) => dist(b, t) < dist(a, t) ? b : a); }
      const fresh = n.filter(i => !S.police.slice(-3).includes(i));
      return pick(fresh.length ? fresh : n);
    }
  };
}
function play(level, game, Police) {
  cfg = { mode: 'cpu', game, level, alarms: 'instant', exits: 'opposite', clock: 0, layout: LAYOUT, size: 5, maxTurns: 12 }; applyLevel();
  startGame();
  const P = Police(); let prev = null, g = 0;
  while (S.phase === 'police' && g++ < 60) { P.observe(prev); prev = null; const a = P.act(); prev = a; policeAct(a); }
  return { w: S.result.w, why: S.result.why, turns: S.turn };
}
for (const game of ['heist', 'classic']) for (const level of ['easy', 'normal', 'hard']) for (const [name, P] of [['sharp', Sharp], ['casual', Casual]]) {
  if (ONLY && !(game + '/' + level).startsWith(ONLY)) continue;
  const r = { police: 0, why: {}, turns: 0 };
  for (let k = 0; k < GAMES; k++) { const x = play(level, game, P); if (x.w === 'police') r.police++; r.why[x.why] = (r.why[x.why] || 0) + 1; r.turns += x.turns; }
  OUT[game + '/' + level + '/' + name] = { policeWin: +(100 * r.police / GAMES).toFixed(1), avgTurns: +(r.turns / GAMES).toFixed(1), why: r.why };
}
`;
let patch = (process.argv[4] ? `Object.assign(LEVELS, ${process.argv[4]});` : '') + `const ONLY = ${JSON.stringify(process.env.ONLY || '')};`;
if (process.env.LOOP) patch += `LOOP = ${process.env.LOOP};`;
if (process.env.EXITS) patch += `genExits = () => ${process.env.EXITS};`;
vm.runInContext(gameJs + '\n' + patch + '\n' + driver, ctx);
for (const [k, v] of Object.entries(ctx.OUT)) console.log(k.padEnd(22), String(v.policeWin).padStart(5) + '% police', ' avg turn', v.avgTurns, JSON.stringify(v.why));
