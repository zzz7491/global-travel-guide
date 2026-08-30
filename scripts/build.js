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
  buildHomeSections,
  buildHomeBody,
  buildCityBody,
  buildListingBody,
  buildBreadcrumb,
  buildRoutePlanBody,
  buildSeasonalBody,
  buildStoryBody,
} from '../src/lib/content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT, 'data');
const TMPL_DIR = path.join(ROOT, 'src', 'templates');
const STATIC_DIR = path.join(ROOT, 'src', 'static');
const ASSETS_DIR = path.join(ROOT, 'src', 'assets');
const DESIGN_DIR = path.join(ROOT, 'src', 'design-system');
const OUT_DIR = path.join(ROOT, 'public');

// --- helpers ----------------------------------------------------------------
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function loadDir(dir, recursive = false) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  if (recursive) {
    // Recursive loading for nested directories (e.g. stories/japan-kyoto/)
    function walk(d) {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name.endsWith('.json')) out.push(readJson(full));
      }
    }
    walk(dir);
  } else {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.json')) out.push(readJson(path.join(dir, f)));
    }
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
  ...loadDir(path.join(DATA_DIR, 'route-plans')),
  ...loadDir(path.join(DATA_DIR, 'budgets')),
  ...loadDir(path.join(DATA_DIR, 'seasonals')),
  ...loadDir(path.join(DATA_DIR, 'stories'), true),
];
const INDEX = {};
ENTITIES.forEach((e) => { INDEX[e.id] = e; });

// Beijing itineraries migrated to data-driven types (budget / route-plan).
// Kept as an empty array; future static itineraries can be registered here.
const ITINERARIES = [];

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
  {
    kind: 'budgets', url: '/budgets', file: 'budgets/index.html',
    title: '全球旅行预算方案 | Global Travel Guide',
    description: 'Global Travel Guide 全球旅行预算方案：分档预算路书，经济型与舒适型自由行成本参考。',
    keywords: '旅行预算,旅行花费,经济自由行,预算路书',
    h1: '全球旅行预算方案', lead: '分档预算路书：经济型与舒适型自由行成本参考，花得明白。',
  },
  {
    kind: 'seasonals', url: '/seasonals', file: 'seasonals/index.html',
    title: '全球季节旅行攻略 | Global Travel Guide',
    description: 'Global Travel Guide 全球季节旅行攻略：按季节与月份精选最佳旅行时机与当季玩法。',
    keywords: '季节旅行,最佳旅行时间,当季玩法,季节攻略',
    h1: '全球季节旅行攻略', lead: '按季节与月份精选最佳旅行时机与当季玩法。',
  },
  {
    kind: 'stories', url: '/stories', file: 'stories/index.html',
    title: '旅行者故事 | Global Travel Guide',
    description: 'Global Travel Guide 旅行者故事：真实旅行者的路线分享与体验。',
    keywords: '旅行故事,旅行分享,旅行体验',
    h1: '旅行者故事', lead: '真实旅行者的路线分享与体验。',
    conditional: true, // only generated when at least one story entity exists
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
  home: readTpl('body-home.html'),
  city: readTpl('body-city.html'),
  routePlan: readTpl('body-route-plan.html'),
  seasonal: readTpl('body-seasonal.html'),
  story: readTpl('body-story.html'),
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
    ...(e.type === 'home'
      ? [(() => {
          const dests = ctx.entities.filter((et) => et.type === 'country' || et.type === 'city');
          return {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Featured Destinations',
            itemListElement: dests.map((it, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: it.name || it.h1 || '',
              url: siteUrl + linkUrl(it),
            })),
          };
        })()]
      : []),
    ...(e.type === 'index' && e._indexItems && e._indexItems.length
      ? [{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: e.h1 || '',
          itemListElement: e._indexItems.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.title || '',
            url: siteUrl + it.url,
          })),
        }]
      : []),
    ...(e.type === 'route-plan' || e.type === 'budget'
      ? [(() => {
          const a = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: e.h1 || e.name || e.title || '',
            description: e.description || e.lead || '',
            url: siteUrl + linkUrl(e),
          };
          // image only when the entity actually has one — never an empty field.
          if (e.image) a.image = e.image;
          return a;
        })()]
      : []),
    ...(e.type === 'seasonal'
      ? [{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: e.h1 || e.name || e.title || '',
          description: e.description || e.lead || '',
          url: siteUrl + linkUrl(e),
          ...(e.heroImage ? { image: e.heroImage } : {}),
        }]
      : []),
    ...(e.type === 'story'
      ? [(() => {
          const a = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: e.title || e.h1 || '',
            description: e.summary || e.description || '',
            url: siteUrl + linkUrl(e),
          };
          if (e.cover) a.image = e.cover;
          if (e.author && e.author.name) a.author = { '@type': 'Person', name: e.author.name };
          if (e.publishedAt) a.datePublished = e.publishedAt;
          return a;
        })()]
      : []),
    ...(e.type === 'city'
      ? [(() => {
          const lang = e.language
            || (e.facts || []).find((f) => f.label === 'Language')?.value
            || '';
          const td = {
            '@context': 'https://schema.org',
            '@type': 'TouristDestination',
            name: e.name || e.city,
            description: e.description || e.lead || '',
            url: siteUrl + linkUrl(e),
          };
          // image: heroImage first, then gallery srcs — only when real data.
          const imgs = [];
          if (e.heroImage) imgs.push(e.heroImage);
          for (const g of (e.gallery || [])) {
            if (g && g.src && !imgs.includes(g.src)) imgs.push(g.src);
          }
          if (imgs.length) td.image = imgs;
          if (lang) td.availableLanguage = lang;
          if (e.bestTime && e.bestTime.description) td.bestTime = e.bestTime.description;
          return td;
        })()]
      : []),
    ...(e.faq && e.faq.length
      ? [{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          name: e.h1 ? `${e.h1} 常见问题` : '常见问题',
          mainEntity: e.faq.map((item, i) => ({
            '@type': 'Question',
            name: item.q || item.question || '',
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a || item.answer || '',
            },
          })).filter((q) => q.name),
        }]
      : []),
    ...(e.howto
      ? [{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: e.howto.name || e.h1 || '',
          description: e.howto.description || e.lead || '',
          totalTime: e.howto.totalTime || '',
          step: (e.howto.steps || []).map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.name || `步骤${i+1}`,
            text: s.text || '',
            image: s.image || '',
          })).filter(s => s.name),
        }]
      : []),
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
  writeFile('index.html', renderPage(HOME, renderTemplate(tpl.home, buildHomeBody(ctx))));
  pages.push({ url: '/', file: 'index.html' });

  // --- Auto internal link generation ---------------------------------------
  function autoLink(e, entities) {
    const cityEntities = entities.filter(x => x.country === e.country && x.city === e.city);
    if (!cityEntities.length) return [];
    const seen = new Set(e.blocks?.find(b => b.kind === 'related')?.refs || []);
    const results = [];
    if (e.type === 'city' || e.type === 'country') {
      for (const t of ['attraction', 'route', 'guide', 'story']) {
        for (const c of cityEntities.filter(x => x.type === t)) {
          if (!seen.has(c.id) && results.length < 6) results.push(c.id);
        }
      }
    } else if (e.type === 'attraction') {
      for (const c of cityEntities.filter(x => x.type === 'attraction' && x.slug !== e.slug).slice(0, 4)) {
        if (!seen.has(c.id)) results.push(c.id);
      }
      for (const c of cityEntities.filter(x => x.type === 'route').slice(0, 2)) {
        if (!seen.has(c.id)) results.push(c.id);
      }
    } else if (e.type === 'guide') {
      for (const c of cityEntities.filter(x => x.type === 'attraction').slice(0, 3)) {
        if (!seen.has(c.id)) results.push(c.id);
      }
    } else if (e.type === 'story') {
      for (const c of cityEntities.filter(x => x.type === 'attraction').slice(0, 3)) {
        if (!seen.has(c.id)) results.push(c.id);
      }
      for (const c of cityEntities.filter(x => x.type === 'route').slice(0, 2)) {
        if (!seen.has(c.id)) results.push(c.id);
      }
    } else if (e.type === 'route' || e.type === 'route-plan' || e.type === 'budget') {
      for (const c of cityEntities.filter(x => x.type === 'attraction').slice(0, 3)) {
        if (!seen.has(c.id)) results.push(c.id);
      }
    }
    return results;
  }

  for (const e of ENTITIES) {
    const existingRef = e.blocks?.find(b => b.kind === 'related')?.refs;
    const autoRefs = autoLink(e, ENTITIES);
    if (autoRefs.length && !existingRef) {
      e.blocks = e.blocks || [];
      e.blocks.push({ kind: 'related', title: '相关推荐', refs: autoRefs });
    } else if (autoRefs.length && existingRef) {
      const merged = [...new Set([...existingRef, ...autoRefs])];
      const relBlock = e.blocks.find(b => b.kind === 'related');
      if (relBlock) relBlock.refs = merged.slice(0, 8);
    }
    // Ensure description fallback for stories (use summary if description missing)
    if (e.type === 'story' && !e.description) {
      e.description = e.summary || '';
    }
    e._canonical = canonicalFor(e, SITE.siteUrl);
    e._ogImage = ogImage(e, SITE);
    e._heroImageUrl = heroImageUrl(e, SITE);
    let body;
    if (e.type === 'city') body = renderTemplate(tpl.city, buildCityBody(e, ctx));
    else if (e.type === 'country') body = buildListingBody(e, buildCountrySections(e, ctx), tpl.listing);
    else if (e.type === 'route-plan' || e.type === 'budget') body = buildRoutePlanBody(e, ctx);
    else if (e.type === 'seasonal') body = renderTemplate(tpl.seasonal, buildSeasonalBody(e, ctx));
    else if (e.type === 'story') body = renderTemplate(tpl.story, buildStoryBody(e, ctx));
    else body = buildContentBody(e, ctx);
    const rel = urlFor(e).replace(/^\//, '').replace(/\/$/, '/index.html');
    writeFile(rel, renderPage(e, body));
    pages.push({ url: linkUrl(e), file: rel });
  }

  // Static long-form pages (itineraries) + shared assets + favicon + robots
  copyDir(STATIC_DIR, OUT_DIR);
  copyDir(ASSETS_DIR, path.join(OUT_DIR, 'assets'));
  copyDir(DESIGN_DIR, path.join(OUT_DIR, 'design-system'));
  for (const it of ITINERARIES) pages.push({ url: it.url, file: it.url.replace(/^\//, '') });
  for (const sp of STATIC_PAGES) pages.push({ url: sp.url, file: sp.file });

  // Global directory pages — pseudo-entities reusing renderPage + body-listing.
  const baseUrl = SITE.siteUrl.replace(/\/$/, '');
  const KIND_TYPE = { countries: 'country', cities: 'city', attractions: 'attraction', routes: 'route', guides: 'guide', budgets: 'budget', seasonals: 'seasonal', stories: 'story' };
  for (const ip of INDEX_PAGES) {
    // Conditional directories (e.g. /stories) render only when real content
    // exists — never generate empty SEO pages.
    if (ip.conditional && !ENTITIES.some((e) => e.type === KIND_TYPE[ip.kind])) continue;
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
    // Destination search UI is enabled only on the /countries directory.
    page.enableSearch = ip.kind === 'countries';
    const sections = buildIndexSections(ip.kind, ctx);
    // Index items feed the page's ItemList JSON-LD (P8-P2) — only when real.
    page._indexItems = (sections[0] && sections[0].items) || [];
    const body = buildListingBody(page, sections, tpl.listing);
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

  // Lightweight static search index for the /countries destination search.
  // Holds every country + city (name / country / slug / url / type / desc);
  // consumed only by the client-side filter — pure SSG, no backend, not in
  // the sitemap (it is not a navigable page).
  const searchIndex = ENTITIES
    .filter((e) => e.type === 'country' || e.type === 'city')
    .map((e) => ({
      name: e.name || e.h1 || '',
      type: e.type,
      country: e.type === 'city' ? (INDEX[e.country]?.name || e.country) : '',
      countrySlug: e.country,
      slug: e.type === 'city' ? e.city : e.country,
      url: linkUrl(e),
      desc: e.lead || e.description || '',
    }))
    .filter((it) => it.name);
  writeFile('search-index.json', JSON.stringify(searchIndex));

  console.log(`Built ${pages.length} pages + sitemap.xml + search-index.json into /public`);
}

main();
