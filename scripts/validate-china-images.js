#!/usr/bin/env node
/**
 * validate-china-images.js — China image-integrity validator for Wuxi (巫溪).
 *
 * Rules enforced:
 *   1. No picsum.photos anywhere in China data (prohibited as production content).
 *   2. Every curated local image path under data/ must resolve to a file that
 *      exists under src/assets/images/.
 *   3. Every curated image's provenance must be recorded in
 *      data/image-sources/china-image-sources.json.
 *   4. Attractions with empty gallery must have NO heroImage/socialImage
 *      (they fall back to site defaults by design — no fabricated image).
 *   5. Gallery entries that carry a `credit` must match a recorded source.
 *
 * Run:  node validate-china-images.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const ASSETS = path.join(ROOT, 'src', 'assets');

// Cities covered by the image-integrity remediation.
// Each has fully verified + locally-hosted commons images and registry entries.
const CITIES = new Set([
  'beijing', 'wuxi', 'chengdu', 'hangzhou', 'huangshan', 'lijiang', 'shanghai',
  'suzhou', 'wuyishan', 'xian', 'zhangjiajie',
]);
const SUBDIRS = ['attractions', 'cities', 'routes', 'guides', 'seasonals', 'best-times', 'budgets', 'route-plans'];

function cityOf(filename) {
  const m = /^china-([a-z]+)-/.exec(filename);
  return m ? m[1] : null;
}

const problems = [];
let checked = 0;

function allDataFiles() {
  const files = [];
  for (const sub of SUBDIRS) {
    const dir = path.join(DATA, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const city = cityOf(f);
      if (city && CITIES.has(city) && f.endsWith('.json')) files.push(path.join(sub, f));
    }
  }
  return files;
}

// Gather all recorded sources
const sourceFile = path.join(DATA, 'image-sources', 'china-image-sources.json');
const sources = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
const recordedLocalPaths = new Set();
for (const e of sources.entities || []) {
  const p = Array.isArray(e.localPath) ? e.localPath : [e.localPath];
  for (const x of p) recordedLocalPaths.add(x);
}

function checkEntity(rel, entity) {
  checked++;
  // Rule 1: no picsum
  const raw = JSON.stringify(entity);
  if (/picsum\.photos/i.test(raw)) {
    problems.push(`${rel}: contains picsum.photos (prohibited)`);
  }

  const imgValues = [];
  if (entity.heroImage) imgValues.push(entity.heroImage);
  if (entity.socialImage) imgValues.push(entity.socialImage);
  if (entity.image) imgValues.push(entity.image);
  for (const g of entity.gallery || []) imgValues.push(g.src);

  for (const v of imgValues) {
    // Only enforce rules on curated absolute local paths
    if (!/^\/assets\/images\//.test(v)) continue;
    const relPath = v.replace(/^\/assets\//, ''); // -> images/wuxi/...
    const abs = path.join(ASSETS, relPath);
    // Rule 2: file exists
    if (!fs.existsSync(abs)) {
      problems.push(`${rel}: referenced image missing on disk: ${v}`);
    }
    // Rule 3: provenance recorded
    if (!recordedLocalPaths.has(v)) {
      problems.push(`${rel}: image path not recorded in china-image-sources.json: ${v}`);
    }
  }

  // Rule 4: empty-gallery attractions must not carry curated hero/social
  if ((entity.type === 'attraction' || entity.type === 'route') && entity.gallery && entity.gallery.length === 0) {
    if (entity.heroImage) problems.push(`${rel}: empty gallery but heroImage present (should fall back to site default): ${entity.heroImage}`);
    if (entity.socialImage) problems.push(`${rel}: empty gallery but socialImage present: ${entity.socialImage}`);
  }

  // Rule 5: gallery credits must reference a known source file
  for (const g of entity.gallery || []) {
    if (g.credit && /Wikimedia Commons/.test(g.credit) && !recordedLocalPaths.has(g.src)) {
      problems.push(`${rel}: gallery item has Commons credit but src not in recorded sources: ${g.src}`);
    }
  }
}

for (const rel of allDataFiles()) {
  let entity;
  try {
    entity = JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
  } catch (e) {
    problems.push(`${rel}: JSON parse error: ${e.message}`);
    continue;
  }
  checkEntity(rel, entity);
}

// Rule 1b: global sweep for picsum across all China data
function sweepChina() {
  const hits = [];
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else {
        const city = cityOf(f);
        if (city && CITIES.has(city) && f.endsWith('.json')) {
          const c = fs.readFileSync(p, 'utf8');
          if (/picsum\.photos/i.test(c)) hits.push(path.relative(DATA, p));
        }
      }
    }
  }
  walk(DATA);
  return hits;
}
for (const h of sweepChina()) problems.push(`picsum still present: ${h}`);

console.log(`checked ${checked} China data entities (${[...CITIES].join(', ')})`);
if (problems.length === 0) {
  console.log('PASS — china image integrity OK');
} else {
  console.log(`FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
