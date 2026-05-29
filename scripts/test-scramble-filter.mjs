import data from '../zbll_cases.json' with { type: 'json' };

const MAX_WIDE = 2;
const ROT = /^[xyzmse](?:2|')?$/i;
const WIDE = /^[rludfbd](?:2|')?$/;

function stats(s) {
  const moves = s.trim().split(/\s+/);
  let wide = 0, slice = false;
  for (const m of moves) {
    if (ROT.test(m)) slice = true;
    if (WIDE.test(m)) wide++;
  }
  return { wide, slice, ok: !slice && wide <= MAX_WIDE };
}

const good = new Set([
  "R' D' R U2 R' D R U R U2 R' U R U R'",
  "L' U R U' L U R2 U2 R U R' U R",
  "r' F R F' r U R2 U2 R U R' U R",
  "D' R U' R' F2 U2 F2 D R' U R U' R",
  "F U R U2 R' U R U2 R' U' R' F' R U R U' R'",
  "D' R U R' D R U2 R2 U R U' R U",
  "R' U L U' R U L2 U2 L U L' U L",
]);

const u1 = data.filter(e => e.set_name === 'U' && e.case_name === 'U1');
let mismatches = 0;
for (const e of u1) {
  const a = stats(e.scramble);
  const user = good.has(e.scramble);
  const match = a.ok === user;
  if (!match) mismatches++;
  console.log(e.id, 'ok', a.ok, 'user', user, match ? 'OK' : 'MISMATCH', 'wide', a.wide, 'slice', a.slice);
}
console.log('acceptable count', u1.filter(e => stats(e.scramble).ok).length);
console.log('mismatches', mismatches);
