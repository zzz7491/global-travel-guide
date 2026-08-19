#!/usr/bin/env node
/**
 * validate-city-schema.js — City JSON schema validator (P9-P5).
 *
 * Checks every data/cities/*.json for:
 *   1. JSON well-formedness
 *   2. Required fields (id / type / country / city / name)
 *   3. Slug format (lowercase, hyphen-separated)
 *   4. heroImage URL (http prefix when present)
 *   5. gallery[] shape (src + alt present; credit optional)
 *   6. facts[] shape (label + value) when present
 *
 * Usage:
 *   node scripts/validate-city-schema.js            # all cities
 *   node scripts/validate-city-schema.js data/cities/china-beijing.json  # single file
 *
 * Output: PASS / FAIL per file + summary; exit code 0 (all pass) or 1 (any fail).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CITIES_DIR = path.join(__dirname, '..', 'data', 'cities');
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const GALLERY_TYPES = new Set(['landmark', 'street', 'culture', 'food', 'nature']);

function checkFile(file) {
  const problems = [];
  let entity;
  try {
    entity = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return { file, pass: false, problems: [`JSON 解析失败: ${err.message}`] };
  }

  // 2. Required fields
  for (const k of ['id', 'type', 'country', 'city', 'name']) {
    if (!entity[k]) problems.push(`缺少必填字段: ${k}`);
  }
  if (entity.type && entity.type !== 'city') problems.push(`type 应为 "city"，实际 "${entity.type}"`);

  // 3. Slug format (city + country)
  if (entity.city && !SLUG_RE.test(entity.city)) problems.push(`city slug 格式非法: "${entity.city}"（应小写连字符）`);
  if (entity.country && !SLUG_RE.test(entity.country)) problems.push(`country slug 格式非法: "${entity.country}"`);
  if (entity.id && entity.id !== `${entity.country}-${entity.city}`) {
    problems.push(`id 应等于 "{country}-{city}"，实际 "${entity.id}"`);
  }

  // 4. heroImage URL
  if (entity.heroImage && !/^https?:\/\//.test(entity.heroImage)) {
    problems.push(`heroImage 非法 URL: ${String(entity.heroImage).slice(0, 60)}`);
  }

  // 5. gallery[] shape
  if (entity.gallery !== undefined) {
    if (!Array.isArray(entity.gallery)) {
      problems.push('gallery 应为数组');
    } else {
      entity.gallery.forEach((g, i) => {
        if (!g || typeof g !== 'object') { problems.push(`gallery[${i}] 应为对象`); return; }
        if (!g.src || !/^https?:\/\//.test(g.src)) problems.push(`gallery[${i}] 缺少合法 src`);
        if (!g.alt) problems.push(`gallery[${i}] 缺少 alt`);
        if (g.type && !GALLERY_TYPES.has(g.type)) problems.push(`gallery[${i}].type 非法: "${g.type}"（枚举: ${[...GALLERY_TYPES].join('/')}）`);
      });
    }
  }

  // 6. facts[] shape
  if (entity.facts !== undefined) {
    if (!Array.isArray(entity.facts)) {
      problems.push('facts 应为数组');
    } else {
      entity.facts.forEach((f, i) => {
        if (!f || typeof f !== 'object' || !f.label || !f.value) {
          problems.push(`facts[${i}] 需含 label + value`);
        }
      });
    }
  }

  return { file: path.basename(file), pass: problems.length === 0, problems };
}

function main() {
  const targets = process.argv.slice(2);
  const files = targets.length
    ? targets.map((t) => path.resolve(t))
    : fs.readdirSync(CITIES_DIR).filter((f) => f.endsWith('.json')).map((f) => path.join(CITIES_DIR, f));

  if (!files.length) {
    console.log('FAIL — 未找到任何 city JSON 文件');
    process.exit(1);
  }

  let passCount = 0;
  let failed = false;
  for (const f of files) {
    if (!fs.existsSync(f)) { console.log(`FAIL — 文件不存在: ${f}`); failed = true; continue; }
    const r = checkFile(f);
    if (r.pass) { passCount++; console.log(`PASS  ${r.file}`); }
    else {
      failed = true;
      console.log(`FAIL  ${r.file}`);
      r.problems.forEach((p) => console.log(`      - ${p}`));
    }
  }
  console.log(`\n${passCount}/${files.length} 通过${failed ? ' — 存在 FAIL' : ' — 全部 PASS'}`);
  process.exit(failed ? 1 : 0);
}

main();
