# Global Travel Guide v2.0 · P8 Phase 0 只读分析

## 内容生态扩展 + 全局目录体系完善 + 生产能力准备

> 阶段：**P8 Phase 0（只读分析，未修改任何代码 / JSON / 模板 / 构建脚本）**
> 约束：✅ 未 build / commit / push / deploy；✅ 未动 URL / canonical / sitemap；✅ 未动东京 route-plan、北京 budget/comfort/seasonal、stories 数据
> 状态：等待人工确认后进入 P8 执行阶段

---

## 1. 全局内容目录评估（/budgets /seasonals /stories）

### 1.1 现状（实测）

**目录页机制**（`scripts/build.js:90-126` `INDEX_PAGES` + `:321-338` 渲染循环）：
- 5 个现有目录：`/countries` `/cities` `/attractions` `/routes` `/guides`，全部由 `buildIndexSections(kind, ctx)`（`content.js:207`）**数据驱动自动派生**——`typeMap` 把目录 kind 映射到实体 type，`ctx.entities` 过滤出同 type 实体生成卡片，零硬编码。
- 目录页复用 `body-listing.html`（`<h1>+<p class="lead">+cards` 通用列表壳）+ `renderPage`（自动获得 WebSite/Org/Breadcrumb JSON-LD + canonical）。
- sitemap 由 `pages` 数组统一生成（`build.js:340-348`），目录页自动入 sitemap。

**关键缺口**：
| 目录 | typeMap 支持 | INDEX_PAGES 注册 | SECTION_LABELS | 现状 |
|---|---|---|---|---|
| budgets | ❌ | ❌ | ❌（budget 无 label） | 无目录页 |
| seasonals | ❌ | ❌ | ❌（seasonal 无 label） | 无目录页 |
| stories | ❌（story 未入 typeMap） | ❌ | ✅（story: 'Stories'） | 无目录页（0 数据） |

**面包屑现状**（`content.js:76-85`）：`SECTION_LABELS[e.type]` 存在才生成分类 crumb——attraction/route/guide/story 有，**budget/seasonal 没有** → budget/seasonal 叶子页面包屑止于城市级，无「预算方案」「季节攻略」分类层。若新增目录页，应同步补 `SECTION_LABELS` 的 budget/seasonal 并指向 `/budgets/` `/seasonals/`。

### 1.2 评估结论

- **可完全数据驱动生成**：✅ 三个目录均可复用现有 `INDEX_PAGES + buildIndexSections + body-listing` 三件套，仅需：
  1. `buildIndexSections` typeMap +`budgets:'budget'` `seasonals:'seasonal'` `stories:'story'`（3 行）；
  2. labelMap +`预算方案` `季节攻略` `旅行故事`（3 行）；
  3. `INDEX_PAGES` +3 条目（title/description/h1/lead 文案，静态注册如现有目录页）。
- **对 47 页结构影响**：页面数 47 → **50**（+3 目录页，仅注册、无内容实体变化）；东京/北京既有页面 URL/canonical/sitemap 记录全部不变；sitemap 自动 +3。
- **canonical 设计**：`page._canonical = baseUrl + ip.url`（现有模式，即 `/budgets` `/seasonals` `/stories` 无尾斜杠）。
- **面包屑设计**：目录页沿用 `breadcrumbLabel`/`breadcrumbUrl` 自引用 crumb（`首页 → 预算方案`）；同时补 `SECTION_LABELS.budget='预算方案'`、`SECTION_LABELS.seasonal='季节攻略'` 使叶子页获得完整分类面包屑。
- **风险**：`/stories` 目录在 0 数据时仍会生成空目录页 → 建议 `/stories` 仅在 `stories 实体 > 0` 时注册（条件注册），避免空 SEO 页面；`/budgets` `/seasonals` 已有 1 条数据可正常注册。

### 1.3 执行期改动点（供确认）

- `src/lib/content.js`：`buildIndexSections` typeMap/labelMap +3；`SECTION_LABELS` +budget/seasonal。
- `scripts/build.js`：`INDEX_PAGES` +3（stories 条件注册）。
- 不改 `buildIndexSections` 之外任何函数、不改 URL/canonical/sitemap 逻辑主体。

---

## 2. Featured 内容排序体系分析

### 2.1 现状（实测）

**首页**（`content.js:351-361`）：
```js
const fp = routePlans[0] || budgets[0];   // 依赖 loadDir 读取顺序（字母序）
```
- `loadDir` 按文件名排序 → `route-plans/china-beijing-comfort.json` 排在 `japan-tokyo-economy.json` 之前 → 首页 Featured 大卡当前 = **北京舒适版**（P5 报告已标注为「依赖文件排序」的遗留项）。
- **城市页**（`content.js:422-424`）：`cityRPs.find((e) => e.type === 'route-plan') || cityRPs[0]`——同一城市内 route-plan 优先于 budget，同 type 内仍依赖文件顺序（当前每城仅 1 个 route-plan/budget，无歧义，但 100 城多版本时会有）。

### 2.2 设计方案（optional 字段，旧数据零影响）

新增两个 **optional** 字段：
```jsonc
{ "featured": true,      // 布尔：首页 Featured 大卡第一优先
  "priority": 10 }        // 数字：越小越靠前（默认 100）
```

**统一排序规则**（`sortEntitiesForFeatured` 小函数，home + city 共用）：
1. `featured === true` 优先（跨类型：route-plan > budget > seasonal 保持类型优先级）；
2. 同 featured 档内：`priority` 升序（缺省 100）；
3. 同 priority 内：type 优先级 `route-plan > budget > seasonal > destination`；
4. 兜底：保持现有文件序（稳定排序），**旧数据无字段时行为不变**。

**应用位置**：
- 首页 `buildHomeBody`：`featured = pickFeatured(routePlans, budgets)`（先 featured 标记 → priority → 类型）；
- 城市页 `buildCityBody`：同城 cityRPs 用同一排序；
- 可选扩展：首页「Featured Destinations」国家/城市卡排序、Seasonal 卡排序也接入 priority（统一入口）。

### 2.3 评估结论

- 方案纯增量：`featured`/`priority` 全 optional，现有 5 个 JSON（2 route-plan + 1 budget + 1 seasonal + 2 city）无字段时行为与现在一致；
- 数据层可选在东京 economy 上标 `featured: true`（若确认首页旗舰=东京），北京 comfort 不标（保持字母序兜底即可）；
- 排序函数建议放 `content.js` 工具区，`buildHomeBody`/`buildCityBody` 共用。

---

## 3. 图片体系分析（100 城方案）

### 3.1 现状（实测）

| 项 | 现状 |
|---|---|
| 图源 | Unsplash 完整 URL **直接写入 JSON**（`heroImage`/`image` 字段，如 `https://images.unsplash.com/photo-xxx?w=1600&q=80`） |
| 卡片图 | P7 后全站 17 张 `<img>` 全部 `width=800 height=450` + `alt` + `loading=lazy`（合规） |
| Hero | `layout.html:24` `--hero-image:url("{{heroImageUrl}}")` CSS 背景（city 页另在 `body-city.html` 内联 `--hero-image`） |
| 预留结构 | `site.imageBaseUrl: "/assets/img"` + `heroImageUrl()/ogImage()` 函数（`content.js:108-116`）——**当前数据未走该函数**（数据直接存完整 URL，函数仅兜底） |
| 图片分布 | index.html 13 张、北京城市页 3 张、东京城市页 1 张；leaf 页（route-plan/budget/seasonal 等）无 `<img>`（hero 为 CSS 背景） |
| CDN | Unsplash 自身为全球 CDN，HTTP 200 稳定（Phase B 已验证） |

### 3.2 100 城图片管理方案（三层演进）

**L1 · 现状（Unsplash 直链，0 成本）**
- 适用：0–30 城验证期。每城 2 图（hero 1600×900 + 卡图 800×450 同图不同参数），alt 用「城市名+主题」，字段：`heroImage`（城市/country）、`image`（route-plan/budget）、`cover`（story 预留）。
- 风险：外链稳定性依赖 Unsplash；无品牌一致性的视觉资产。

**L2 · 本地图库（推荐 P8 落地）**
- 新增 `src/assets/img/<country>/<city>/{hero,card}.jpg` 本地目录，`imageBaseUrl` 改指向 `/assets/img`；
- 数据字段从「完整 URL」改为**相对 slug**（如 `heroImage: "japan/tokyo/hero"`），由现有 `heroImageUrl()` 统一拼接——**函数已就绪，只需数据迁移 + copyDir 已含 assets 目录**；
- 收益：零外链依赖、可自管版权、build 产物自带图。
- 注意：`heroImageUrl()` 当前约定 `${e.image}.jpg` 后缀，需与本地文件命名约定对齐。

**L3 · Cloudflare R2（规模期）**
- R2 public bucket 域名（如 `https://img.mootlsv.com`）替换 `imageBaseUrl` **单开关**切换（架构已预留），零代码改动；
- 图片对象按 `{country}/{city}/hero.jpg`、`{country}/{city}/card.jpg`、`{city}-social.jpg`（og:image）命名。

### 3.3 建议（P8 执行候选）

- **本阶段不做全量迁移**（涉及 17+ 张图重新落盘 + JSON 改相对路径，属独立子任务）；
- P8 优先固化**图片规范文档**（命名/尺寸/alt 模板/字段选择表），并保留 imageBaseUrl 单开关说明；
- 100 城落地时按 L2→L3 演进，容量预估：每城 2–3 图 × 100 城 ≈ 200–300 对象，R2 免费额度内。

---

## 4. 城市规模化扩展分析（→100 城）

### 4.1 现状 city schema（实测）

```
东京: id/type/country/city/name/nameEn/title/description/keywords/h1/lead/
      continent/language/currency/timezone/related/tagline/heroImage/
      bestTime/facts/highlights/relatedCities
北京: 同 minus continent/language/currency/timezone（用 facts[] 表达）
```

**已具备**（直接支撑 Hub）：`nameEn`（hero 英文）、`tagline`（定位语）、`heroImage`（hero 图）、`bestTime{season,description}`、`facts[{label,value}]`、`highlights[]`（chips）、`relatedCities[]`（Related Cities 显式优先）。

### 4.2 新增 optional 字段设计（只设计，不创建数据）

```jsonc
{
  // —— 信息完整性（事实条/Hub）——
  "population": "约 1,400 万",        // facts 卡
  "airport": "HND / NRT",            // 交通攻略区
  "transport": "地铁+JR+巴士",        // 交通攻略区
  "neighborhoods": ["新宿","浅草","银座"],  // 区域卡（未来）
  "nearbyCities": ["japan-osaka"],   // Related Cities 扩充（跨国家近邻）

  // —— 可复用顶层（东京已有，北京可对齐）——
  "continent": "Asia",
  "language": "Japanese",
  "currency": "JPY",
  "timezone": "UTC+9"
}
```

**设计原则**：
- 全部 optional、无默认值假设；缺失时 Hub 相关区块自动隐藏/降级（现有模板已支持 `{{#if}}`）；
- `nearbyCities` 与现有 `relatedCities`（同国城市）互补：`relatedCities` 同国、`nearbyCities` 地理近邻，Related Cities 区合并去重展示；
- 顶层 `continent/language/currency/timezone` 与 `facts[]` 双轨兼容：`facts[]` 存在优先，否则回退顶层字段（`buildCityBody:396-405` 已实现该回退——北京补顶层字段即可获得与东京一致的事实条，无需模板改动）。

### 4.3 100 城扩展评估（代码改动量）

| 操作 | 代码改动 | 说明 |
|---|---|---|
| 新增 1 城（含国家不存在时 +1 国家） | **零** | `urlFor`/`linkUrl`/`buildCountrySections`/`buildCitySections`/`buildCityBody`/sitemap 全数据驱动自动派生 |
| 新增 1 条 attraction/route/guide/best-time/budget/seasonal | **零** | 城市 Hub 与首页自动聚合 |
| 新增 1 种新 type | ~10 行 | urlFor/linkUrl/LEAF_TYPES(+SECTION_LABELS)/build.js 渲染分支（每类型一次性） |
| 首页 Featured 排序规则 | ~15 行 | 见第 2 节（P8 落地后 100 城生效） |
| 图片体系 L2 迁移 | 一次性 | 见第 3 节 |

**风险点**：
1. `facts[]` 手工维护 → 100 城建议用顶层字段 + 自动派生（减少重复劳动）；
2. `relatedCities` 手工 id 引用易错 → 缺省自动同国（已实现，`content.js:536-540`），显式值仅用于跨国家近邻；
3. 首页 Featured Destinations 卡片 2 城 → 100 城时需分页/精选（`featured` 标记只显示精选子集，其余走 `/cities` 目录）；
4. heroImage 逐城手填 → 缺图时 `SITE.heroImage` 全局兜底（已有）。

---

## 5. SEO 规模化分析

### 5.1 现状 JSON-LD 矩阵（实测，`build.js:153-240`）

| 页面 | WebSite | Org | Breadcrumb | ItemList | TouristDestination | Article |
|---|---|---|---|---|---|---|
| 首页 | ✅ | ✅ | ✅ | ✅（Featured Destinations） | – | – |
| 城市页 | ✅ | ✅ | ✅ | – | ✅（image/availableLanguage/bestTime 有数据才生成） | – |
| 国家页 | ✅ | ✅ | ✅ | – | – | – |
| attraction/route/guide/best-time | ✅ | ✅ | ✅ | – | – | – |
| route-plan/budget | ✅ | ✅ | ✅ | – | – | ✅ |
| seasonal | ✅ | ✅ | ✅ | – | – | ✅（含 image） |
| story（预留） | ✅ | ✅ | ✅ | – | – | ✅（headline/image/author/datePublished 有数据才生成） |
| 目录页（/countries 等） | ✅ | ✅ | ✅（自引用 crumb） | ❌ | – | – |
| 静态页（about 等） | 手工 @graph（等价） | | | | | |

### 5.2 规模化统一策略

**A. 目录页补 ItemList**（规模化高价值）
- `/countries` `/cities` `/attractions` `/routes` `/guides`（+新 `/budgets` `/seasonals`）目录页均加 `ItemList` JSON-LD（复用首页 ItemList 模式，items = 该目录实体）；
- 首页 ItemList 已存在（Featured Destinations），目录页 ItemList 使每个目录页获得富结果资格；
- **空目录不生成**（`buildIndexSections` 返回空时跳过 ItemList，与「不生成空 schema」原则一致）。

**B. TouristDestination 增强**（城市页）
- 已有：`name/description/url/image/availableLanguage/bestTime`（有数据才生成）；
- 可扩展（有数据才生成，绝不虚构）：`address{addressCountry}`（国家代码）、`geo`（**暂无真实坐标数据 → 不生成**）；
- 保持「无数据不生成空字段」红线。

**C. Article 统一**（route-plan/budget/seasonal/story）
- 统一结构：`headline/description/url` + 有数据才加的 `image`（seasonal/story 已有，route-plan/budget 可加 image——P7 已为两者补了 `image` 字段，可直接进 Article JSON-LD）+ story 的 `author/datePublished`；
- 建议 route-plan/budget Article 补 `image: e.image`（数据已就位，一行改动）。

**D. BreadcrumbList 规模化**
- 已全自动（`buildBreadcrumb` 数据驱动）；
- 新增 budget/seasonal SECTION_LABELS 后，叶子页分类面包屑自动完整（见第 1 节）。

**E. 静态页对齐（低优先级）**
- 6 个静态页手工 `@graph` 语义等价但硬编码站点域（P7 已标注）；规模化前建议改为模板统一生成（`STATIC_PAGES` 走 renderPage），消除双轨。

### 5.3 规模化风险

- JSON-LD 体积：100 城 × 每页 3–4 组 schema，首页 ItemList 100 条过大 → 建议首页 ItemList 仅收录 `featured` 精选（≤10），全量走目录页 ItemList；
- `@type` 命名一致性：TouristDestination vs City——当前用 TouristDestination（Google 支持），保持统一；
- 避免重复 schema：目录页 ItemList 与首页 ItemList 内容不同源（目录=全量、首页=精选），无冲突。

---

## 6. 总结：P8 执行候选清单（待确认）

| # | 任务 | 改动 | 页面影响 | 优先级 |
|---|---|---|---|---|
| 1 | `/budgets` `/seasonals` 目录页注册 | content.js typeMap/labelMap/SECTION_LABELS + build.js INDEX_PAGES +2 | 47→49 | 高 |
| 2 | `/stories` 目录页**条件注册**（有数据才生成） | build.js INDEX_PAGES 条件化 | 0 数据时不变 | 高 |
| 3 | Featured 排序体系 | content.js sortEntitiesForFeatured + featured/priority optional 字段（数据可选标 featured） | 0（无字段时行为不变） | 高 |
| 4 | 目录页 ItemList JSON-LD | build.js 目录页分支 | 0 | 中 |
| 5 | route-plan/budget Article +image | build.js Article 分支 +1 行 | 0 | 中 |
| 6 | city schema optional 字段文档化 | 仅设计（本阶段） | 0 | 中 |
| 7 | 图片体系 L2 迁移（本地图库） | 独立子任务，建议单独确认 | 0（URL 不变，图源切换） | 低 |
| 8 | 静态页 JSON-LD 统一化 | 独立子任务 | 0 | 低 |

**约束确认**：全部任务不改既有 URL/canonical/sitemap 记录；东京 route-plan、北京 budget/comfort/seasonal、stories 数据零改动；Design System 唯一来源（目录页沿用 body-listing + 现有卡片组件，不新增页面私有 CSS）；不 commit/push/deploy。

---

*Phase 0 完成，等待人工确认后进入 P8 执行。*
