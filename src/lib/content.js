// =============================================================================
// Content-model logic — SHARED by scripts/build.js (SSG) and future
// Cloudflare Workers (D1-backed dynamic rendering).
//
// This module is pure: no disk or network access. The caller supplies the
// data context (`site`, `index`, `entities`, `home`, template strings, etc.)
// so it runs identically in Node and the Workers runtime. Keeping the content
// logic here means the ONLY thing a Worker has to do differently is load rows
// from D1 instead of JSON files — the URL mapping, image resolution, block
// rendering and section derivation are reused verbatim.
// =============================================================================

import { renderTemplate, escapeHtml } from '../templates/render.js';

// --- URL routing (mirrors future D1 row -> Worker route params) -------------
export function urlFor(e) {
  switch (e.type) {
    case 'home': return '/';
    case 'country': return `/${e.country}/`;
    case 'city': return `/${e.country}/${e.city}/`;
    case 'attraction': return `/${e.country}/${e.city}/attractions/${e.slug}.html`;
    case 'route': return `/${e.country}/${e.city}/routes/${e.slug}.html`;
    case 'guide': return `/${e.country}/${e.city}/guides/${e.slug}.html`;
    case 'best-time': return `/${e.country}/${e.city}/best-time.html`;
    default: return '/';
  }
}

// Clean, extensionless URLs for canonical / sitemap / internal links.
// On-disk files keep .html (served via Cloudflare Pages pretty URLs + 308).
export function linkUrl(e) {
  switch (e.type) {
    case 'home': return '/';
    case 'country': return `/${e.country}/`;
    case 'city': return `/${e.country}/${e.city}/`;
    case 'attraction': return `/${e.country}/${e.city}/attractions/${e.slug}`;
    case 'route': return `/${e.country}/${e.city}/routes/${e.slug}`;
    case 'guide': return `/${e.country}/${e.city}/guides/${e.slug}`;
    case 'best-time': return `/${e.country}/${e.city}/best-time`;
    default: return '/';
  }
}

export function canonicalFor(e, siteUrl) {
  return String(siteUrl).replace(/\/$/, '') + linkUrl(e);
}

const SECTION_LABELS = {
  attraction: '景点',
  route: '路线',
  guide: '攻略',
};
const LEAF_TYPES = new Set(['attraction', 'route', 'guide', 'best-time']);

// BreadcrumbList auto-derived from the page path + real data labels.
export function buildBreadcrumb(e, ctx) {
  const siteUrl = String(ctx.site.siteUrl || '').replace(/\/$/, '');
  const crumbs = [{ name: '首页', url: siteUrl + '/' }];
  if (e.country) {
    const c = ctx.index[e.country];
    crumbs.push({ name: c?.name || e.country, url: `${siteUrl}/${e.country}/` });
  }
  if (e.city) {
    const city = ctx.index[`${e.country}-${e.city}`];
    crumbs.push({ name: city?.name || e.city, url: `${siteUrl}/${e.country}/${e.city}/` });
  }
  if (SECTION_LABELS[e.type]) {
    crumbs.push({
      name: SECTION_LABELS[e.type],
      url: `${siteUrl}/${e.country}/${e.city}/${e.type}s/`,
    });
  }
  if (LEAF_TYPES.has(e.type)) {
    crumbs.push({ name: e.h1 || e.name || '', url: siteUrl + linkUrl(e) });
  }
  // Index/directory pages (no country/city) get a self crumb labeled by caller.
  if (e.breadcrumbLabel) {
    crumbs.push({ name: e.breadcrumbLabel, url: e.breadcrumbUrl || `${siteUrl}/` });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

// --- R2-ready image resolution ----------------------------------------------
// `site.imageBaseUrl` is a SINGLE switch: "/assets/img" locally, or an R2
// public domain (e.g. "https://img.mootlsv.com") once images migrate.
export function heroImageUrl(e, site) {
  if (e && e.image) return `${site.imageBaseUrl}/${e.image}.jpg`;
  return site.heroImage;
}
export function ogImage(e, site) {
  if (e && e.socialImage) return `${site.imageBaseUrl}/${e.socialImage}.jpg`;
  if (e && e.image) return `${site.imageBaseUrl}/${e.image}-social.jpg`;
  return site.defaultSocialImage;
}

// --- Reference (cross-link) resolution --------------------------------------
export function resolveRefs(refs, index) {
  return (refs || [])
    .map((id) => index[id])
    .filter(Boolean)
    .map((e) => ({ title: e.h1 || e.name, url: linkUrl(e) }));
}

// --- Block -> inner HTML (data logic lives here, NOT in static HTML) --------
function blockInner(b, ctx) {
  if (b.kind === 'section') return b.html || '';
  if (b.kind === 'notes') {
    return '<ul class="notes-list">' +
      (b.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join('') + '</ul>';
  }
  if (b.kind === 'related') {
    const items = resolveRefs(b.refs, ctx.index);
    return '<ul class="related-list">' +
      items.map((it) => `<li><a href="${it.url}">${escapeHtml(it.title)}</a></li>`).join('') + '</ul>';
  }
  return '';
}

// Content page body: attraction / route / guide / best-time.
export function buildContentBody(e, ctx) {
  const blocks = (e.blocks || []).map((b) => ({
    title: b.title || '',
    inner: blockInner(b, ctx),
  }));
  const cityId = `${e.country}-${e.city}`;
  const city = ctx.index[cityId] || ctx.home;
  const back =
    e.type === 'city' || e.type === 'country'
      ? { backUrl: '/', backLabel: '返回首页' }
      : { backUrl: linkUrl(city), backLabel: `返回${city.name || '首页'}` };
  return renderTemplate(ctx.tpl.content, {
    h1: e.h1,
    lead: e.lead,
    blocks,
    backUrl: back.backUrl,
    backLabel: back.backLabel,
  });
}

// City landing sections are DERIVED from the data model — no hard-coded cards.
// Any attraction/route/guide/best-time belonging to this city appears
// automatically; add content in data/ and it shows up with zero template edits.
export function buildCitySections(city, ctx) {
  const kids = ctx.entities.filter(
    (e) => e.country === city.country && e.city === city.city && e.type !== 'city'
  );
  const groups = [
    { type: 'attraction', title: '景点攻略' },
    { type: 'route', title: '路线规划' },
    { type: 'guide', title: '实用攻略' },
    { type: 'best-time', title: '最佳旅行时间' },
  ];
  const sections = groups
    .map((g) => {
      const items = kids
        .filter((e) => e.type === g.type)
        .map((e) => ({ title: e.h1 || e.name, desc: e.lead || '', url: linkUrl(e) }));
      return items.length ? { title: g.title, items } : null;
    })
    .filter(Boolean);
  // Only show itineraries that belong to THIS city. Each itinerary carries
  // its own country/city (set in build.js ITINERARIES), so future cities such
  // as Tokyo/Paris only surface their own routes — never Beijing's.
  const itineraryItems = (ctx.itineraries || []).filter(
    (it) => it.country === city.country && it.city === city.city
  );
  if (itineraryItems.length) sections.push({ title: '完整路书', items: itineraryItems });
  return sections;
}

// Country landing sections are DERIVED from the data model — no hard-coded
// city links. Every city belonging to this country shows up automatically;
// drop a new cities/*.json and it appears with zero template edits.
export function buildCountrySections(country, ctx) {
  const cities = ctx.entities
    .filter((e) => e.type === 'city' && e.country === country.country)
    .map((e) => ({ title: e.name, desc: e.lead || '', url: linkUrl(e) }));
  return cities.length ? [{ title: '热门城市', items: cities }] : [];
}

// Global index / directory pages (countries / cities / attractions / routes /
// guides). Each lists every entity of one type, with clean internal links.
export function buildIndexSections(kind, ctx) {
  const typeMap = {
    countries: 'country',
    cities: 'city',
    attractions: 'attraction',
    routes: 'route',
    guides: 'guide',
  };
  const type = typeMap[kind];
  if (!type) return [];
  const items = ctx.entities
    .filter((e) => e.type === type)
    .map((e) => ({ title: e.h1 || e.name, desc: e.lead || '', url: linkUrl(e) }));
  if (!items.length) return [];
  const labelMap = {
    countries: '国家',
    cities: '城市',
    attractions: '景点',
    routes: '路线',
    guides: '旅行指南',
  };
  return [{ title: labelMap[kind], items }];
}

// Listing page body (country / city) given pre-built sections.
export function buildListingBody(e, sections, tplListing) {
  return renderTemplate(tplListing, { h1: e.h1, lead: e.lead, sections });
}
