#!/usr/bin/env node
/**
 * Genera una PNG por caso ZBLL (472) desde VisualCube.
 * Uso: node scripts/generate-case-images.mjs
 * Reanuda: omite archivos que ya existen.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'images', 'cases');
const JSON_PATH = path.join(ROOT, 'zbll_cases.json');
/** VisualCube API: válido ~150–200; >200 devuelve PNG vacío (0 bytes) */
const SIZE = 200;
const CONCURRENCY = 4;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function invertScramble(scramble) {
  if (!scramble) return '';
  return scramble.trim().split(/\s+/).filter(Boolean).reverse().map(m => {
    if (m.endsWith("'")) return m.slice(0, -1);
    if (m.endsWith('2')) return m;
    return m + "'";
  }).join(' ');
}

function buildVisualCubeUrl(algorithm) {
  const inv = invertScramble(algorithm);
  const enc = encodeURIComponent(inv);
  return `https://visualcube.api.cubing.net/visualcube.php?fmt=png&size=${SIZE}&stage=ll&view=plan&sch=yrgwob&alg=${enc}`;
}

function collectUniqueCases(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = `${e.set_name}||${e.case_name}`;
    if (!map.has(key)) map.set(key, e.algorithm);
  }
  return map;
}

function isValidPng(buf) {
  return buf.length >= 8 && buf.subarray(0, 4).equals(PNG_MAGIC);
}

async function fetchWithRetry(url, retries = 4) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'zbll-trainer-image-gen/1.0' },
      });
      const buf = Buffer.from(await res.arrayBuffer());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!isValidPng(buf)) {
        const hint = buf.length === 0 ? 'cuerpo vacío (¿size>200?)' : `no es PNG (${buf.length} bytes)`;
        throw new Error(hint);
      }
      return buf;
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  const entries = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const cases = collectUniqueCases(entries);
  console.log(`Casos únicos: ${cases.size}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const tasks = [];
  for (const [key, algorithm] of cases) {
    const [setName, caseName] = key.split('||');
    const dir = path.join(OUT_DIR, setName);
    const file = path.join(dir, `${caseName}.png`);
    tasks.push({ setName, caseName, algorithm, file, dir });
  }

  let done = 0;
  let skipped = 0;
  let failed = 0;
  const manifest = [];

  async function worker(task) {
    const { setName, caseName, algorithm, file, dir } = task;
    if (fs.existsSync(file) && fs.statSync(file).size > 500) {
      skipped++;
      manifest.push({ set: setName, case: caseName, file: `images/cases/${setName}/${caseName}.png` });
      return;
    }
    fs.mkdirSync(dir, { recursive: true });
    try {
      const url = buildVisualCubeUrl(algorithm);
      const buf = await fetchWithRetry(url);
      fs.writeFileSync(file, buf);
      manifest.push({ set: setName, case: caseName, file: `images/cases/${setName}/${caseName}.png` });
      done++;
      if ((done + skipped) % 25 === 0) {
        console.log(`  … ${done} nuevos, ${skipped} omitidos, ${failed} fallos`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${setName}/${caseName}: ${err.message}`);
    }
  }

  let i = 0;
  async function pool() {
    const runners = Array.from({ length: CONCURRENCY }, async () => {
      while (i < tasks.length) {
        const idx = i++;
        await worker(tasks[idx]);
      }
    });
    await Promise.all(runners);
  }

  console.log('Descargando imágenes…');
  await pool();

  manifest.sort((a, b) => a.set.localeCompare(b.set) || a.case.localeCompare(b.case));
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ version: 1, size: SIZE, count: manifest.length, cases: manifest }, null, 2)
  );

  console.log(`Listo: ${done} generadas, ${skipped} ya existían, ${failed} fallos.`);
  console.log(`Manifest: images/cases/manifest.json (${manifest.length} entradas)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
