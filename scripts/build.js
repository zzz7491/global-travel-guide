#!/usr/bin/env node
/*
 * Global Travel Guide — static site generator (zero runtime dependencies).
 *
 *   Source of truth : /data            (JSON content model — future D1 seed)
 *   Presentation    : /src/templates   (HTML skeletons with {{tokens}})
 *   Shared render   : /src/lib/content.js + /src/templates/render.js
 *   Shared assets   : /src/assets      -> copied to /public/assets
 *   Long-form pages : /src/static      -> copied verbatim to /public
 *   Output          : /public         (what Cloudflare Pages serves)
 *
 * The SAME content render path (urlFor / heroImageUrl / buildContentBody /
 * buildCitySections) is reused later by a Cloudflare Worker that loads rows
 * from D1 instead of JSON files — see ARCHITECTURE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTemplate } from '../src/templates/render.js';
import {
  urlFor,
  linkUrl,
  canonicalFor,
  heroImageUrl,
  ogImage,
  buildContentBody,
  buildCitySections,
  buildCountrySections,
  buildIndexSections,
  buildListingBody,
  buildBreadcrumb,
} from '../src/lib/content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT, 'data');
const TMPL_DIR = path.join(ROOT, 'src', 'templates');
const STATIC_DIR = path.join(ROOT, 'src', 'static');
const ASSETS_DIR = path.join(ROOT, 'src', 'assets');
const OUT_DIR = path.join(ROOT, 'public');

// --- helpers ----------------------------------------------------------------
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function loadDir(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.json')) out.push(readJson(path.join(dir, f)));
  }
  return out;
}
function readTpl(name) {
  return fs.readFileSync(path.join(TMPL_DIR, name), 'utf8');
}

// --- load content model -----------------------------------------------------
const SITE = readJson(path.join(DATA_DIR, 'site.json'));
const HOME = readJson(path.join(DATA_DIR, 'home.json'));
const ENTITIES = [
  ...loadDir(path.join(DATA_DIR, 'countries')),
  ...loadDir(path.join(DATA_DIR, 'cities')),
  ...loadDir(path.join(DATA_DIR, 'attractions')),
  ...loadDir(path.join(DATA_DIR, 'routes')),
  ...loadDir(path.join(DATA_DIR, 'guides')),
  ...loadDir(path.join(DATA_DIR, 'best-times')),
];
const INDEX = {};
ENTITIES.forEach((e) => { INDEX[e.id] = e; });

// Long-form itinerary pages kept as verbatim static HTML (not in the data model).
// country/city let buildCitySections filter each itinerary to its own city, so
// future cities (Tokyo/Paris) never inherit Beijing's routes.
const ITINERARIES = [
  { title: '正常版（舒适）', desc: '食宿品鉴与风光体验配置更完整。', url: '/china/beijing/normal', country: 'china', city: 'beijing' },
  { title: '经济版（省钱）', desc: '控制住宿餐饮交通成本，保留核心体验。', url: '/china/beijing/budget', country: 'china', city: 'beijing' },
];

// Global directory pages — "travel knowledge catalog", not content pages.
const INDEX_PAGES = [
  {
    kind: 'countries', url: '/countries', file: 'countries/index.html',
    title: '全球国家旅行指南 | Global Travel Guide',
    description: 'Global Travel Guide 全球国家旅行指南：按国家浏览世界目的地，规划你的下一段旅程。',
    keywords: '全球国家,国家旅行指南,世界目的地,各国旅游攻略',
    h1: '全球国家旅行指南', lead: '按国家浏览世界目的地，发现值得一去的旅行地。',
  },
  {
    kind: 'cities', url: '/cities', file: 'cities/index.html',
    title: '全球城市旅行指南 | Global Travel Guide',
    description: 'Global Travel Guide 全球城市旅行指南：汇集世界各地城市，提供景点、路线与实用旅行信息。',
    keywords: '全球城市,城市旅行指南,世界城市旅游,城市自由行',
    h1: '全球城市旅行指南', lead: '汇集世界各地的城市，探索它们的景点、路线与玩法。',
  },
  {
    kind: 'attractions', url: '/attractions', file: 'attractions/index.html',
    title: '全球景点指南 | Global Travel Guide',
    description: 'Global Travel Guide 全球景点指南：整理世界知名景点与必访之地，助你规划行程。',
    keywords: '全球景点,世界景点攻略,必去景点,景点推荐',
    h1: '全球景点指南', lead: '整理世界各地的知名景点与必访之地。',
  },
  {
    kind: 'routes', url: '/routes', file: 'routes/index.html',
    title: '全球旅行路线指南 | Global Travel Guide',
    description: 'Global Travel Guide 全球旅行路线指南：集合各地自由行路线与行程规划参考。',
    keywords: '全球路线,旅行路线规划,自由行路线,行程参考',
    h1: '全球旅行路线指南', lead: '集合各地的自由行路线与行程规划参考。',
  },
  {
    kind: 'guides', url: '/guides', file: 'guides/index.html',
    title: '全球旅行实用指南 | Global Travel Guide',
    description: 'Global Travel Guide 全球旅行实用指南：交通、住宿、美食、预算等实用旅行建议。',
    keywords: '旅行指南,实用旅行攻略,交通住宿美食,旅行建议',
    h1: '全球旅行实用指南', lead: '交通、住宿、美食、预算等实用旅行建议，帮你轻松出行。',
  },
];

// Static base pages (about / contact / sitemap / privacy / terms). Kept as
// verbatim HTML in /src/static and registered here so they enter sitemap.xml.
// Canonical/og/JSON-LD are hand-authored inside each file's <head>.
const STATIC_PAGES = [
  { url: '/about', file: 'about.html' },
  { url: '/services', file: 'services.html' },
  { url: '/contact', file: 'contact.html' },
  { url: '/sitemap-page', file: 'sitemap-page.html' },
  { url: '/privacy', file: 'privacy.html' },
  { url: '/terms', file: 'terms.html' },
];

const tpl = {
  layout: readTpl('layout.html'),
  content: readTpl('body-content.html'),
  listing: readTpl('body-listing.html'),
};
const ctx = { site: SITE, index: INDEX, entities: ENTITIES, home: HOME, itineraries: ITINERARIES, tpl };

// --- output primitives ------------------------------------------------------
function renderPage(e, bodyHtml) {
  // JSON-LD: WebSite + Organization (reliable site fields) + BreadcrumbList
  // (auto-derived). Only real data — no faked address/geo/author/date/image.
  const siteUrl = String(SITE.siteUrl || '').replace(/\/$/, '');
  const jsonld = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.brand,
      url: siteUrl + '/',
      description: SITE.description || e.description || '',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.brand,
      url: siteUrl + '/',
    },
    buildBreadcrumb(e, ctx),
  ]).replace(/</g, '\\u003c');
  return renderTemplate(tpl.layout, {
    locale: SITE.locale,
    brand: SITE.brand,
    title: e.title,
    description: e.description,
    keywords: e.keywords || '',
    canonical: e._canonical,
    ogImage: e._ogImage,
    heroImageUrl: e._heroImageUrl,
    nav: SITE.nav,
    bodyHtml,
    jsonld,
  });
}
function writeFile(rel, content) {
  const p = path.join(OUT_DIR, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
// SSG owns /public entirely — wipe before regenerating so stale paths from
// earlier hand-written structures never linger as orphans.
function cleanOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    return;
  }
  for (const entry of fs.readdirSync(OUT_DIR, { withFileTypes: true })) {
    const p = path.join(OUT_DIR, entry.name);
    fs.rmSync(p, { recursive: true, force: true });
  }
}

// --- build ------------------------------------------------------------------
function main() {
  cleanOutDir();
  const pages = []; // { url, file }

  // Home
  HOME._canonical = canonicalFor(HOME, SITE.siteUrl);
  HOME._ogImage = SITE.defaultSocialImage;
  HOME._heroImageUrl = SITE.heroImage;
  writeFile('index.html', renderPage(HOME, buildListingBody(HOME, HOME.sections, tpl.listing)));
  pages.push({ url: '/', file: 'index.html' });

  // Entities (country / city / attraction / route / guide / best-time)
  for (const e of ENTITIES) {
    e._canonical = canonicalFor(e, SITE.siteUrl);
    e._ogImage = ogImage(e, SITE);
    e._heroImageUrl = heroImageUrl(e, SITE);
    let body;
    if (e.type === 'city') body = buildListingBody(e, buildCitySections(e, ctx), tpl.listing);
    else if (e.type === 'country') body = buildListingBody(e, buildCountrySections(e, ctx), tpl.listing);
    else body = buildContentBody(e, ctx);
    const rel = urlFor(e).replace(/^\//, '').replace(/\/$/, '/index.html');
    writeFile(rel, renderPage(e, body));
    pages.push({ url: linkUrl(e), file: rel });
  }

  // Static long-form pages (itineraries) + shared assets + favicon + robots
  copyDir(STATIC_DIR, OUT_DIR);
  copyDir(ASSETS_DIR, path.join(OUT_DIR, 'assets'));
  for (const it of ITINERARIES) pages.push({ url: it.url, file: it.url.replace(/^\//, '') });
  for (const sp of STATIC_PAGES) pages.push({ url: sp.url, file: sp.file });

  // Global directory pages — pseudo-entities reusing renderPage + body-listing.
  const baseUrl = SITE.siteUrl.replace(/\/$/, '');
  for (const ip of INDEX_PAGES) {
    const page = {
      type: 'index',
      title: ip.title,
      description: ip.description,
      keywords: ip.keywords,
      h1: ip.h1,
      lead: ip.lead,
      breadcrumbLabel: ip.h1,
      breadcrumbUrl: baseUrl + ip.url,
    };
    page._canonical = baseUrl + ip.url;
    page._ogImage = SITE.defaultSocialImage;
    page._heroImageUrl = SITE.heroImage;
    const body = buildListingBody(page, buildIndexSections(ip.kind, ctx), tpl.listing);
    writeFile(ip.file, renderPage(page, body));
    pages.push({ url: ip.url, file: ip.file });
  }

  // Sitemap generated from the SAME data model (single source of truth).
  const siteUrl = SITE.siteUrl.replace(/\/$/, '');
  const urls = pages.map((p) => `  <url><loc>${siteUrl}${p.url}</loc></url>`).join('\n');
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  writeFile('sitemap.xml', sitemap);

  console.log(`Built ${pages.length} pages + sitemap.xml into /public`);
}

main();
