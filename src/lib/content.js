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
    case 'route-plan': return `/${e.country}/${e.city}/route-plan/${e.slug}.html`;
    case 'budget': return `/${e.country}/${e.city}/budget/${e.slug}.html`;
    case 'seasonal': return `/${e.country}/${e.city}/seasonal/${e.slug}.html`;
    case 'story': return `/stories/${e.slug}.html`;
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
    case 'route-plan': return `/${e.country}/${e.city}/route-plan/${e.slug}`;
    case 'budget': return `/${e.country}/${e.city}/budget/${e.slug}`;
    case 'seasonal': return `/${e.country}/${e.city}/seasonal/${e.slug}`;
    case 'story': return `/stories/${e.slug}`;
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
  budget: '预算方案',
  seasonal: '季节攻略',
  story: '旅行故事',
};
const LEAF_TYPES = new Set(['attraction', 'route', 'guide', 'best-time', 'route-plan', 'budget', 'seasonal', 'story']);

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
    // budget / seasonal / story are GLOBAL directories (/budgets /seasonals
    // /stories); other section types keep the city-scoped URL.
    const GLOBAL_DIRS = { budget: '/budgets/', seasonal: '/seasonals/', story: '/stories/' };
    crumbs.push({
      name: SECTION_LABELS[e.type],
      url: GLOBAL_DIRS[e.type]
        ? `${siteUrl}${GLOBAL_DIRS[e.type]}`
        : `${siteUrl}/${e.country}/${e.city}/${e.type}s/`,
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

// --- Image path resolution --------------------------------------------------
// Support both legacy bare filenames and new schema full paths.
// Legacy: image = "kyoto.jpg" → /assets/img/kyoto.jpg
// New schema: heroImage/socialImage = "/images/kyoto/xxx.webp" → used as-is

function resolveImagePath(rawPath, baseUrl, fallback, addExt = '.jpg') {
  if (!rawPath) return fallback;
  // Remote http(s) URLs are complete and opaque — never append or alter them,
  // even when they lack a file extension (e.g. Unsplash query strings).
  // This prevents injecting "-social.jpg"/".jpg" onto query-terminated URLs.
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  // Absolute local path with extension → use directly
  if (/^\//.test(rawPath)) {
    if (/\.(webp|jpg|jpeg|png)$/i.test(rawPath)) return rawPath;
    return rawPath + addExt;
  }
  // Bare filename → legacy behavior
  return `${baseUrl}/${rawPath}${addExt}`;
}

// --- R2-ready image resolution ----------------------------------------------
// `site.imageBaseUrl` is a SINGLE switch: "/assets/img" locally, or an R2
// public domain (e.g. "https://img.mootlsv.com") once images migrate.
export function heroImageUrl(e, site) {
  if (e && e.heroImage) return resolveImagePath(e.heroImage, site.imageBaseUrl, site.heroImage, '');
  // e.image might be a full remote URL - use resolveImagePath which handles this
  if (e && e.image) return resolveImagePath(e.image, site.imageBaseUrl, site.heroImage, '.jpg');
  return site.heroImage;
}
export function ogImage(e, site) {
  if (e && e.socialImage) return resolveImagePath(e.socialImage, site.imageBaseUrl, site.defaultSocialImage, '');
  // e.image might be a full remote URL - use resolveImagePath which handles this
  if (e && e.image) return resolveImagePath(e.image, site.imageBaseUrl, site.defaultSocialImage, '-social.jpg');
  // Fallback to heroImage if available
  if (e && e.heroImage) return resolveImagePath(e.heroImage, site.imageBaseUrl, site.defaultSocialImage, '');
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
  const gallery = (e.gallery || []).map((g) => ({
    src: g.src || '',
    alt: g.alt || '',
    caption: g.caption || g.alt || '',
  })).filter((g) => g.src);
  const cityId = `${e.country}-${e.city}`;
  const city = ctx.index[cityId] || ctx.home;
  const back =
    e.type === 'city' || e.type === 'country'
      ? { backUrl: '/', backLabel: '返回首页' }
      : { backUrl: linkUrl(city), backLabel: `返回${city.name || '首页'}` };
  // Related links from blocks.referenced or auto-generated
  const relBlock = e.blocks?.find(b => b.kind === 'related');
  const relatedLinks = relBlock?.refs?.length
    ? relBlock.refs.map(id => {
        const ref = ctx.index[id];
        if (!ref) return null;
        return {
          title: ref.h1 || ref.title || '',
          desc: ref.lead || ref.description || '',
          url: linkUrl(ref),
          image: ref.heroImage || ref.image || '',
          alt: ref.h1 || ref.title || '',
        };
      }).filter(Boolean)
    : [];
  return renderTemplate(ctx.tpl.content, {
    h1: e.h1,
    lead: e.lead,
    blocks,
    gallery,
    relatedTitle: relBlock?.title || '相关推荐',
    relatedLinks,
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
    { type: 'budget', title: '预算方案' },
    { type: 'seasonal', title: '季节攻略' },
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
    budgets: 'budget',
    seasonals: 'seasonal',
    stories: 'story',
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
    budgets: '预算方案',
    seasonals: '季节攻略',
    stories: '旅行故事',
  };
  return [{ title: labelMap[kind], items }];
}

// Homepage sections are DERIVED from the data model so the landing page always
// reflects every published destination / route / best-time — no hard-coded
// Beijing entries. Drop a new country/city/route/best-time JSON in /data and it
// appears on the homepage automatically, with zero template edits. The /guides
// entry is a single portal link to the global guides index.
export function buildHomeSections(ctx) {
  const toItem = (e) => ({
    title: e.h1 || e.name || '',
    desc: e.lead || e.description || '',
    url: linkUrl(e),
  });
  const destinations = ctx.entities
    .filter((e) => e.type === 'country' || e.type === 'city')
    .map(toItem)
    .filter((i) => i.title);
  const routes = ctx.entities.filter((e) => e.type === 'route').map(toItem);
  const bestTimes = ctx.entities.filter((e) => e.type === 'best-time').map(toItem);

  const sections = [];
  if (destinations.length) sections.push({ title: '世界目的地', items: destinations });
  if (routes.length) sections.push({ title: '精选路线', items: routes });
  if (bestTimes.length) sections.push({ title: '最佳旅行时间', items: bestTimes });
  sections.push({ title: '旅行指南', items: [{ title: '全球旅行指南', url: '/guides' }] });
  return sections;
}

// Listing page body (country / city) given pre-built sections.
export function buildListingBody(e, sections, tplListing) {
  return renderTemplate(tplListing, { h1: e.h1, lead: e.lead, sections });
}

// =============================================================================
// Featured ordering — deterministic, data-driven, backward compatible.
// 1) featured:true first   2) priority ascending (missing = 100)
// 3) type weight (route-plan > budget > seasonal > others)
// 4) stable: original array order when all else is equal.
// =============================================================================
const FEATURED_TYPE_WEIGHT = { 'route-plan': 3, budget: 2, seasonal: 1 };
export function featuredSort(items) {
  return [...items].sort((a, b) => {
    const fa = !!a.featured, fb = !!b.featured;
    if (fa !== fb) return fa ? -1 : 1;
    const pa = a.priority == null ? 100 : Number(a.priority);
    const pb = b.priority == null ? 100 : Number(b.priority);
    if (pa !== pb) return pa - pb;
    const wa = FEATURED_TYPE_WEIGHT[a.type] || 0;
    const wb = FEATURED_TYPE_WEIGHT[b.type] || 0;
    if (wa !== wb) return wb - wa;
    return 0;
  });
}

// =============================================================================
// Home v2.0 body — "World Travel Planning Entry" (presentation layer only).
// Derives every block from the data model; no hard-coded cards, no new fields.
// =============================================================================
function planBadge(rp) {
  const dayCount = Array.isArray(rp.days) ? rp.days.length : typeof rp.days === 'number' ? rp.days : 0;
  const days = dayCount ? `${dayCount} Days` : '';
  const edition = rp.edition ? ` · ${rp.edition}` : '';
  return (days + edition).trim() || 'Route Plan';
}
export function buildHomeBody(ctx) {
  const cityOf = (e) => ctx.index[`${e.country}-${e.city}`];
  // Featured Destinations: when ANY entity carries `featured: true`, only
  // those are shown on the homepage (curated entry); otherwise all are shown
  // (backward compatible with pre-P10 data that has no featured field).
  const featuredOnly = (type) => {
    const all = ctx.entities.filter((e) => e.type === type);
    const marked = all.filter((e) => e.featured === true);
    return (marked.length ? marked : all);
  };
  const countries = featuredOnly('country')
    .map((e) => ({
      title: e.name || e.h1 || '',
      desc: e.lead || e.description || '',
      tagline: e.lead || e.description || '',
      url: linkUrl(e),
      image: e.heroImage || '',
      alt: `${e.name || ''} 旅行目的地`,
    }))
    .filter((i) => i.title);
  const cities = featuredOnly('city')
    .map((e) => ({
      title: e.name || e.h1 || '',
      desc: e.lead || '',
      tagline: e.tagline || e.lead || '',
      url: linkUrl(e),
      image: e.heroImage || '',
      alt: `${e.name || ''} 城市旅行`,
    }))
    .filter((i) => i.title);
  const guides = ctx.entities
    .filter((e) => e.type === 'guide')
    .map((e) => ({
      title: e.h1 || e.name || '',
      desc: e.lead || e.description || '',
      url: linkUrl(e),
      category: e.category || '',
    }))
    .filter((i) => i.title);
  const routePlans = ctx.entities.filter((e) => e.type === 'route-plan');
  const budgets = ctx.entities.filter((e) => e.type === 'budget');
  const itineraryCount = (ctx.itineraries || []).length;

  // Popular Routes grid = routes + non-featured route-plans + budgets.
  // Each card carries city name, type badge and (where available) days.
  const routes = [
    ...ctx.entities
      .filter((e) => e.type === 'route')
      .map((e) => ({
        title: e.h1 || e.name || '',
        desc: e.lead || e.description || '',
        url: linkUrl(e),
        image: e.image || cityOf(e)?.heroImage || '',
        alt: `${e.h1 || e.name || ''} 路线封面`,
        badge: 'Route',
        cityName: cityOf(e)?.name || '',
      })),
    ...routePlans.slice(1).map((e) => ({
      title: e.h1 || e.name || '',
      desc: e.lead || e.description || '',
      url: linkUrl(e),
      image: cityOf(e)?.heroImage || '',
      alt: `${e.h1 || e.name || ''} 路书封面`,
      badge: `Route Plan · ${planBadge(e)}`,
      cityName: cityOf(e)?.name || '',
    })),
    ...budgets.map((e) => ({
      title: e.h1 || e.name || '',
      desc: e.lead || e.description || '',
      url: linkUrl(e),
      image: cityOf(e)?.heroImage || '',
      alt: `${e.h1 || e.name || ''} 预算方案`,
      badge: `Budget · ${planBadge(e)}`,
      cityName: cityOf(e)?.name || '',
    })),
  ].filter((i) => i.title);

  // Honest, data-derived stats (no fabricated "100+").
  const stats = [
    { value: String(countries.length + cities.length), label: 'Destinations' },
    { value: String(routes.length + routePlans.length + budgets.length + itineraryCount), label: 'Curated Routes' },
    { value: String(guides.length), label: 'Planning Guides' },
  ];

  // Featured flagship card: priority route-plan -> budget.
  let featured = null;
  const fp = featuredSort([...routePlans, ...budgets])[0];
  if (fp) {
    featured = {
      title: fp.h1 || fp.title || '',
      desc: fp.lead || fp.description || '',
      url: linkUrl(fp),
      image: fp.image || cityOf(fp)?.heroImage || '',
      alt: `${fp.h1 || fp.title || ''} 旗舰路书封面`,
      badge: (fp.type === 'budget' ? 'Budget · ' : 'Route Plan · ') + planBadge(fp),
      cityName: cityOf(fp)?.name || '',
    };
  }

  // Seasonal Experiences — ONLY real seasonal data (city / season / months / image).
  const seasons = ctx.entities
    .filter((e) => e.type === 'seasonal')
    .map((e) => ({
      title: e.h1 || e.name || '',
      desc: `${e.season || ''}${e.months && e.months.length ? ' · ' + e.months.join('/') : ''}`.trim(),
      url: linkUrl(e),
      image: e.heroImage || cityOf(e)?.heroImage || '',
      alt: `${e.h1 || e.name || ''} 季节攻略`,
      cityName: cityOf(e)?.name || '',
      meta: `${e.season || ''}${e.months && e.months.length ? ' · ' + e.months.join('/') : ''}`.trim(),
    }))
    .filter((i) => i.title);

  return { heroBrand: ctx.site.brand, stats, countries, cities, featured, routes, guides, seasons };
}

// =============================================================================
// City v2.0 body — "City Travel Hub" (presentation layer only).
// Reuses buildCitySections for data-driven sections; adds hero, about, facts,
// breadcrumb and graceful empty states for not-yet-launched content types.
// =============================================================================
export function buildCityBody(city, ctx) {
  const derived = buildCitySections(city, ctx);
  const byTitle = (t) => derived.find((s) => s.title === t);

  const crumbs = [{ name: '首页', url: '/' }];
  const country = ctx.index[city.country];
  if (country) crumbs.push({ name: country.name || country.country, url: linkUrl(country) });
  crumbs.push({ name: city.name || city.city, url: linkUrl(city) });

  const facts = city.facts && city.facts.length
    ? city.facts.map((f) => ({ label: f.label, value: f.value }))
    : (() => {
        const out = [];
        if (city.continent) out.push({ value: city.continent, label: 'Continent' });
        if (city.language) out.push({ value: city.language, label: 'Language' });
        if (city.currency) out.push({ value: city.currency, label: 'Currency' });
        if (city.timezone) out.push({ value: city.timezone, label: 'Timezone' });
        return out;
      })();

  const hub = [];

  // Best Time — from existing best-time entity (+ optional summary field).
  const bt = byTitle('最佳旅行时间');
  if (bt && bt.items.length) {
    hub.push({ title: 'Best Time', items: bt.items, summary: (city.bestTime && city.bestTime.description) || '' });
  }

  // Featured Routes — routes + route-plans + itineraries of this city.
  // Featured big card priority: route-plan -> budget.
  const routeSec = byTitle('路线规划');
  const rpSec = byTitle('完整路书');
  const rpItems = [...(routeSec ? routeSec.items : []), ...(rpSec ? rpSec.items : [])];
  if (rpItems.length) {
    const cityRPs = ctx.entities.filter(
      (e) => (e.type === 'route-plan' || e.type === 'budget') && e.country === city.country && e.city === city.city
    );
    const featuredRp = featuredSort(cityRPs)[0];
    let featured = null;
    if (featuredRp) {
      featured = {
        title: featuredRp.h1 || featuredRp.title || '',
        desc: featuredRp.lead || featuredRp.description || '',
        url: linkUrl(featuredRp),
        image: featuredRp.image || city.heroImage || '',
        alt: `${featuredRp.h1 || featuredRp.title || ''} 旗舰路书封面`,
        badge: (featuredRp.type === 'budget' ? 'Budget · ' : 'Route Plan · ') + planBadge(featuredRp),
        cityName: city.name || city.city || '',
      };
    }
    hub.push({ title: 'Featured Routes', items: rpItems, featured });
  }

  // Budget Plans — real rich cards (title / days / budget range), else empty state.
  const budgetEntities = ctx.entities.filter(
    (e) => e.type === 'budget' && e.country === city.country && e.city === city.city
  );
  if (budgetEntities.length) {
    hub.push({
      title: 'Budget Plans',
      items: budgetEntities.map((e) => {
        const est = e.budgetTiers && e.budgetTiers[0] && e.budgetTiers[0].estimate;
        const range = est ? `¥${est.low} 起` : '';
        const dayCount = Array.isArray(e.days) ? e.days.length : typeof e.days === 'number' ? e.days : 0;
        const days = dayCount ? `${dayCount}天` : '';
        return {
          title: e.h1 || e.title || '',
          desc: [days, range].filter(Boolean).join(' · '),
          url: linkUrl(e),
          image: city.heroImage || '',
          alt: `${e.h1 || e.name || ''} 预算方案`,
          cardClass: 'budget-card',
        };
      }),
    });
  } else {
    hub.push({
      title: 'Budget Plans', empty: true,
      emptyTitle: 'Budget Plans Coming Soon',
      note: '分档预算方案即将上线，帮你把每一笔花在核心体验上。',
    });
  }
  // Seasonal Guides — real rich cards (season / months / image), else empty state.
  const seasonalEntities = ctx.entities.filter(
    (e) => e.type === 'seasonal' && e.country === city.country && e.city === city.city
  );
  if (seasonalEntities.length) {
    hub.push({
      title: 'Seasonal Guides',
      items: seasonalEntities.map((e) => ({
        title: e.h1 || e.name || '',
        desc: `${e.season || ''}${e.months && e.months.length ? ' · ' + e.months.join('/') : ''}`.trim(),
        url: linkUrl(e),
        image: e.heroImage || city.heroImage || '',
        alt: `${e.h1 || e.name || ''} 季节攻略`,
        cardClass: 'season-card',
      })),
    });
  } else {
    hub.push({
      title: 'Seasonal Guides', empty: true,
      emptyTitle: 'Seasonal Guides Coming Soon',
      note: '当季玩法与季节活动攻略即将上线。',
    });
  }

  // Top Attractions / Planning Guides — retained from the derived sections so
  // the existing content stays reachable from the hub (no regression).
  const att = byTitle('景点攻略');
  if (att && att.items.length) hub.push({ title: 'Top Attractions', items: att.items });
  const gd = byTitle('实用攻略');
  if (gd && gd.items.length) hub.push({ title: 'Planning Guides', items: gd.items });

  // Traveler Stories — real story cards when data exists (future UGC), else
  // a unified empty state. No fabricated content.
  const cityStories = ctx.entities.filter(
    (e) => e.type === 'story' && e.country === city.country && e.city === city.city
  );
  if (cityStories.length) {
    hub.push({
      title: 'Traveler Stories',
      items: cityStories.map((s) => ({
        title: s.title || s.h1 || '',
        desc: [s.author && s.author.name, s.travelStyle].filter(Boolean).join(' · '),
        url: linkUrl(s),
        image: s.cover || city.heroImage || '',
        alt: `${s.title || ''} 旅行故事`,
        cardClass: 'story-card',
      })),
    });
  } else {
    hub.push({
      title: 'Traveler Stories', empty: true,
      emptyTitle: 'Traveler Stories Coming Soon',
      note: '真实旅行经验将在未来开放，敬请期待。',
    });
  }

  // Related Cities — explicit list first, then auto-derive same-country cities.
  let relatedCities = [];
  const explicit = (city.relatedCities || []).map((id) => ctx.index[id]).filter(Boolean);
  if (explicit.length) {
    relatedCities = explicit;
  } else {
    relatedCities = ctx.entities.filter(
      (e) => e.type === 'city' && e.country === city.country && e.id !== city.id
    );
  }
  if (relatedCities.length) {
    hub.push({
      title: 'Related Cities',
      items: relatedCities.map((e) => ({ title: e.name || e.city, desc: e.lead || '', url: linkUrl(e) })),
    });
  }

  return {
    h1: city.h1 || city.name || city.city,
    name: city.name || city.city,
    heroNameEn: city.nameEn || '',
    tagline: city.tagline || city.lead || '',
    heroImage: city.heroImage || '',
    about: city.description || city.lead || '',
    facts,
    highlights: (city.highlights || []).map((s) => ({ text: s })),
    bestTime: city.bestTime || null,
    gallery: (city.gallery || []).map((g) => ({
      src: g.src || '',
      alt: g.alt || '',
      credit: g.credit || '',
    })).filter((g) => g.src),
    crumbs,
    sections: hub,
  };
}

// =============================================================================
// Seasonal v2.0 body — data for body-seasonal.html (presentation layer only).
// Coerces string arrays to {text} objects; falls back gracefully when absent.
// =============================================================================
export function buildSeasonalBody(e, ctx) {
  const plan = JSON.parse(JSON.stringify(e));
  const city = ctx.index[`${e.country}-${e.city}`] || ctx.home;
  plan.heroName = city.name || city.city || '';
  plan.months = (plan.months || []).map((s) => ({ text: s }));
  plan.highlights = (plan.highlights || []).map((s) => ({ text: s }));
  plan.tips = (plan.tips || []).map((s) => ({ text: s }));
  plan.backUrl = linkUrl(city);
  plan.backLabel = `返回${city.name || '首页'}`;
  return plan;
}

// Story (future UGC traveler story) body — architecture reserved, no content
// shipped. All fields optional; missing author/travelStyle/highlights simply
// hide their UI blocks. Never fabricate user data.
export function buildStoryBody(e, ctx) {
  const city = e.city ? ctx.index[`${e.country}-${e.city}`] || ctx.home : ctx.home;
  const story = JSON.parse(JSON.stringify(e));
  story.h1 = story.title || '';
  story.lead = story.summary || '';
  story.heroImage = story.cover || '';
  story.cityName = city && city.name ? city.name : '';
  story.highlights = (story.highlights || []).map((s) => ({ text: s }));
  story.hasAuthor = !!(story.author && story.author.name);
  story.meta = [story.travelStyle, story.season, story.days ? `${story.days} Days` : '']
    .filter(Boolean).join(' · ');
  story.backUrl = e.city ? linkUrl(city) : '/';
  story.backLabel = e.city && city && city.name ? `返回${city.name}` : '返回首页';
  // Related links for stories
  const relBlock = e.blocks?.find(b => b.kind === 'related');
  story.relatedLinks = relBlock?.refs?.length
    ? relBlock.refs.map(id => {
        const ref = ctx.index[id];
        if (!ref) return null;
        return {
          title: ref.h1 || ref.title || '',
          desc: ref.lead || ref.description || '',
          url: linkUrl(ref),
          image: ref.heroImage || ref.image || '',
          alt: ref.h1 || ref.title || '',
        };
      }).filter(Boolean)
    : [];
  story.relatedTitle = relBlock?.title || '相关景点';
  return story;
}

// Route-plan (flagship itinerary) body — data-driven rendering of the
// 12-module route-plan template. Mirrors the richness of the hand-written
// Beijing budget.html but is fully JSON-driven and globally reusable across
// cities (Tokyo/Paris/NYC) with zero template edits.
export function buildRoutePlanBody(e, ctx) {
  const tpl = ctx.tpl.routePlan;
  const plan = JSON.parse(JSON.stringify(e));
  // The template engine iterates arrays of objects, so coerce any string
  // arrays (spots / list items / packing) into {name|text} objects.
  (plan.overview || []).forEach((o) => {
    o.spots = (o.spots || []).map((s) => ({ name: s }));
  });
  (plan.ticketTiers || []).forEach((t) => {
    t.items = (t.items || []).map((s) => ({ text: s }));
  });
  (plan.reminders || []).forEach((r) => {
    r.items = (r.items || []).map((s) => ({ text: s }));
  });
  plan.packing = (plan.packing || []).map((s) => ({ text: s }));
  plan.chartsScript = buildRoutePlanCharts(plan.charts);
  const cityId = `${e.country}-${e.city}`;
  const city = ctx.index[cityId] || ctx.home;
  plan.backUrl = linkUrl(city);
  plan.backLabel = `返回${city.name || '首页'}`;
  return renderTemplate(tpl, plan);
}

// Build the Chart.js <script> block for a route-plan page. Uses the same
// Chart.js CDN as the hand-written Beijing budget.html (no new dependency).
// Returned as a raw string consumed by the template's {{{chartsScript}}} token.
function buildRoutePlanCharts(charts) {
  if (!charts || !charts.days || !charts.budget) return '';
  const data = JSON.stringify(charts);
  return `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
(function(){
  try {
    var c = ${data};
    var h = document.getElementById('rpChartHours');
    if (h) { new Chart(h.getContext('2d'), { type:'bar', data:{ labels:c.days, datasets:[{ label:'游玩时长（小时）', data:c.dailyHours, backgroundColor:['#2E7D32','#43A047','#66BB6A','#81C784','#A5D6A7'], borderRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:10, ticks:{ font:{ size:11 } } }, x:{ ticks:{ font:{ size:10 } } } } }); }
    var b = document.getElementById('rpChartBudget');
    if (b) { new Chart(b.getContext('2d'), { type:'doughnut', data:{ labels:c.budget.labels, datasets:[{ data:c.budget.economy, backgroundColor:['#8E44AD','#E67E22','#C0392B','#2980B9','#F9A825'], borderWidth:2, borderColor:'#fff' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{ size:11 }, padding:8 } } } }); }
  } catch (err) { if (window.console) console.warn('route-plan chart init failed', err); }
})();
</script>`;
}
