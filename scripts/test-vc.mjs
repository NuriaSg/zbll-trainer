import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = JSON.parse(fs.readFileSync(path.join(ROOT, 'zbll_cases.json'), 'utf8'));

function invertScramble(scramble) {
  if (!scramble) return '';
  return scramble.trim().split(/\s+/).filter(Boolean).reverse().map(m => {
    if (m.endsWith("'")) return m.slice(0, -1);
    if (m.endsWith('2')) return m;
    return m + "'";
  }).join(' ');
}

const alg = entries[0].algorithm;
const inv = invertScramble(alg);
console.log('algorithm:', alg);
console.log('inverse:', inv);

for (const sz of [48, 100, 150, 200, 256, 300]) {
  const url = `https://visualcube.api.cubing.net/visualcube.php?fmt=png&size=${sz}&stage=ll&view=plan&sch=yrgwob&alg=${encodeURIComponent(inv)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'zbll-trainer/1.0' } });
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type');
    console.log('size', sz, 'status:', res.status, 'bytes:', buf.length);
    if (buf.length < 500) console.log('  body:', buf.toString('utf8').slice(0, 300));
    else console.log('  png magic:', buf.slice(0, 8).toString('hex'));
  } catch (e) {
    console.log('  error:', e.message);
  }
}
