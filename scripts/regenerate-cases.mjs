#!/usr/bin/env node
/** Regenera PNGs concretos usando el scramble principal (normalizado para VisualCube). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'zbll_cases.json');
const SIZE = 200;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const TARGETS = [
  ['S', 'S14'],
];

const MANUAL_SETUP = {
  'S||S14': "R' U R U R' U R U2 R' U' R2 D R' U2 R D' R'",
};

/** VisualCube no entiende bien R3, R2', etc. */
function normalizeForVisualCube(sequence) {
  return sequence.trim().split(/\s+/).filter(Boolean).map(move => {
    const m = move;
    if (/^[RLUDFB]2'$/i.test(m)) return m.slice(0, 2);
    if (/^[RLUDFB]3'$/i.test(m)) return m[0];
    if (/^[RLUDFB]3$/i.test(m)) return m[0];
    return m;
  }).join(' ');
}

function buildVisualCubeUrl(setup) {
  const enc = encodeURIComponent(setup.trim());
  return `https://visualcube.api.cubing.net/visualcube.php?fmt=png&size=${SIZE}&stage=ll&view=plan&sch=yrgwob&alg=${enc}`;
}

function firstEntry(entries, setName, caseName) {
  const entry = entries.find(e => e.set_name === setName && e.case_name === caseName);
  if (!entry) throw new Error(`No existe ${setName}/${caseName}`);
  return entry;
}

function isValidPng(buf) {
  return buf.length >= 500 && buf.subarray(0, 4).equals(PNG_MAGIC);
}

async function fetchPng(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'zbll-trainer-image-gen/1.0' } });
  const buf = Buffer.from(await res.arrayBuffer());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!isValidPng(buf)) throw new Error(`PNG inválido (${buf.length} bytes)`);
  return buf;
}

async function fetchWithRetry(url, retries = 5) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchPng(url);
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  const entries = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

  for (const [setName, caseName] of TARGETS) {
    const entry = firstEntry(entries, setName, caseName);
    const manual = MANUAL_SETUP[`${setName}||${caseName}`];
    const raw = manual ?? entry.scramble?.trim();
    if (!raw) throw new Error(`Sin scramble: ${setName}/${caseName}`);

    const setup = normalizeForVisualCube(raw);
    const dir = path.join(ROOT, 'images', 'cases', setName);
    const file = path.join(dir, `${caseName}.png`);
    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(file)) fs.unlinkSync(file);

    console.log(`\n${setName}/${caseName}`);
    console.log(`  JSON scramble: ${raw}`);
    console.log(`  VisualCube:    ${setup}`);

    const url = buildVisualCubeUrl(setup);
    const buf = await fetchWithRetry(url);
    fs.writeFileSync(file, buf);
    console.log(`  ✓ guardado ${file} (${buf.length} bytes)`);
  }

  console.log('\nListo.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
