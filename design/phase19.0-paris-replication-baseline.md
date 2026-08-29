# Phase 19.0 — Paris Replication Baseline Audit

**Date**: 2026-08-29
**Mode**: 只读审计（未修改任何 JSON / JS / CSS / 模板 / 图片，未下载或生成图片，未 Build / Commit / Push / Deploy）
**Status**: COMPLETE

---

## 1. 结论摘要

| 项目 | 结论 |
|------|------|
| 现有构建系统是否支持巴黎 | ✅ 支持，**无需修改任何核心代码** |
| 是否发现城市硬编码 | ❌ 无（`src/lib`、`src/templates`、`scripts/build.js` 仅注释中出现城市名） |
| 巴黎数据是否已存在 | ✅ 存在 14 个 JSON 文件，生产已上线 14 页 |
| 数据是否有占位/抄袭/错城引用 | ❌ 未发现（0 处占位符、0 处他城引用、0 处本地图片缺失） |
| 是否达到 Beijing v1.0 生产标准 | ❌ 未达到，缺 19 个页面 + 全部本地图片资产 |
| 本地图片资产 | ❌ `src/assets/images/paris/` 不存在，本地图片 0 张（当前 100% 依赖远程 Unsplash） |

---

## 2. 构建系统 / 路由评估（是否需改代码）

### 2.1 实体加载（scripts/build.js:82-95）

`loadDir()` 直接扫描 `data/{countries,cities,attractions,routes,guides,best-times,route-plans,budgets,seasonals,stories}`，按 `id` 建索引，无城市白名单、无城市分支。

### 2.2 URL 路由（src/lib/content.js:16-50）

```
/{country}/{city}/
/{country}/{city}/attractions/{slug}
/{country}/{city}/routes/{slug}
/{country}/{city}/guides/{slug}
/{country}/{city}/best-time
/{country}/{city}/route-plan/{slug}
/{country}/{city}/budget/{slug}
/{country}/{city}/seasonal/{slug}
/stories/{slug}
```

巴黎 → `/france/paris/...`，由 `country`/`city` 字段驱动，无硬编码。

### 2.3 城市硬编码扫描结果

在 `src/lib`、`src/templates`、`scripts/build.js` 中检索 `beijing|kyoto|paris|tokyo|shanghai|seoul`：**仅命中 8 处注释**（如 `// e.g. stories/japan-kyoto/`、`// globally reusable across cities (Tokyo/Paris/NYC)`），无逻辑分支。

### 2.4 图片解析规则（src/lib/content.js:108-140）

| 字段优先级 | heroImageUrl | ogImage |
|-----------|--------------|---------|
| 1 | `e.heroImage` | `e.socialImage` |
| 2 | `e.image`（远程 URL 也支持） | `e.image`（**裸 URL 无扩展名时会追加 `-social.jpg`**） |
| 3 | `site.heroImage` | `e.heroImage` |
| 4 | — | `site.defaultSocialImage` |

> 该逻辑解释了 Phase 18.8 记录的 N2（`-social.jpg` 后缀）：**只要实体缺 `socialImage` 且 `image` 为远程 URL，就会触发**。巴黎同样受影响（见 4.2）。

**结论：巴黎复制 = 纯数据 + 图片工作，零代码修改。**

---

## 3. 巴黎当前实际状态

### 3.1 内容清单（14 个文件 / 14 个生产页面）

| 类型 | 现有 | 文件 / slug |
|------|------|-------------|
| City | 1 | `cities/france-paris.json` |
| Attractions | 4 | eiffel-tower、louvre、montmartre、latin-quarter |
| Guides | 4 | accommodation、food、tips、transport |
| Routes | 2 | three-days、museum-route |
| Route Plans | 1 | economy |
| **Budgets** | **0** | — |
| Best Time | 1 | `best-times/france-paris.json` |
| Seasonals | 1 | spring（缺 summer / autumn / winter） |
| **Stories** | **0** | — |
| **合计** | **14** | 生产 sitemap 已收录 14 条 `/france/paris/*` |

生产抽查（5 条）：`/france/paris/`、`attractions/eiffel-tower`、`guides/food`、`seasonal/spring`、`route-plan/economy` → 全部 HTTP 200。

### 3.2 内容质量

| 对比项 | Paris | Beijing | Kyoto |
|--------|-------|---------|-------|
| 景点平均文本量（字符） | 874 | 1216 | 985 |
| 指南平均文本量 | 1031 | 621 | — |
| 路线平均文本量 | 1010 | 546 | — |
| 占位符 / TODO / Lorem | 0 | 0 | 0 |
| 他城引用（北京/京都/东京…） | 0 | 0 | 0 |
| 空 title/description/h1/lead | 0 | 0 | 0 |

巴黎指南与路线内容量**高于**北京；景点内容量略低于北京、与京都接近。内容本身是真实可用的，不是占位内容。

### 3.3 字段结构对照（缺口 = 巴黎缺失项）

| 类型 | Beijing / Kyoto 具备 | Paris 具备 | 缺口 |
|------|---------------------|-----------|------|
| attraction | `heroImage` `socialImage` `gallery` | — | **3 项全缺（4/4 文件）** |
| guide | `image`（Beijing 2/6 有） | — | 无图（4/4） |
| route | `image` | `image`（远程） | 远程 → 需本地化 + `socialImage` |
| route-plan | `image` | `image`（远程） | 远程 → 需本地化 + `socialImage` |
| seasonal | `heroImage` | `heroImage`（远程） | 远程 → 需本地化 |
| city | `heroImage` `gallery` `socialImage` `featured` | `heroImage` `gallery`（均远程） | 缺 `socialImage`、缺本地图、缺 `featured` |
| budget | 1 | 0 | **缺整类** |
| story | 5 | 0 | **缺整类** |

---

## 4. 已发现问题（仅记录，本阶段不修复）

### 4.1 BLOCKER（影响生产正常使用）

**无。** 巴黎现有 14 页均正常，无 404、无占位、无错城内容。

### 4.2 NON-BLOCKER

| # | 问题 | 证据 | 建议处理阶段 |
|---|------|------|--------------|
| P1 | 4 个景点全部无 `heroImage` / `socialImage` / `gallery` | 字段扫描 | 19.2 / 19.3 |
| P2 | 景点页、指南页 OG 回退到 `site.defaultSocialImage`（非巴黎图） | 生产 `attractions/eiffel-tower` og:image = photo-1599571234909（全站通用图） | 19.4 |
| P3 | `route-plan/economy` OG 出现 `-social.jpg` 拼接后缀 | 生产 og:image = `…w=800&q=70-social.jpg`（与北京 N2 同源） | 19.4（补 `socialImage`） |
| P4 | 季节页仅 spring，缺 summer / autumn / winter | `data/seasonals/` 仅 1 个 paris 文件 | 19.1 |
| P5 | 无 Budget 页（Beijing 1 / Kyoto 2） | `data/budgets/` 无 paris | 19.1 |
| P6 | 无 Story 页（Beijing 5 / Kyoto 5） | `data/stories/` 无 paris | 19.1 |
| P7 | 城市页 `heroImage` / `gallery` 全部远程 Unsplash，且无 `socialImage` | `cities/france-paris.json` | 19.2 / 19.4 |
| P8 | 城市页无 `featured: true`（Beijing、Tokyo 有），影响首页精选排序 | `featuredOnly()` @ content.js:351 | 19.1（需用户决策） |
| P9 | Paris route-plan `featured: true` + `priority: 1`，与 Kyoto/Tokyo/London/NY 同级竞争首页 featured 路书位 | `route-plans/france-paris-economy.json` | 19.1（需用户决策） |
| P10 | 景点内容深度略低于北京（874 vs 1216 字符） | 文本量统计 | 19.1（可选扩写） |

---

## 5. 图片资产现状与缺口

### 5.1 现状

| 项目 | 结果 |
|------|------|
| `src/assets/images/paris/` | **不存在** |
| 巴黎本地图片数 | **0** |
| 巴黎远程 Unsplash 引用 | 8 条（city hero 1 + gallery 4 + route 2 + route-plan 1 + seasonal 1） |

### 5.2 北京资产规范（作为巴黎基准，实测）

| 目录 | 数量 | 尺寸 | 平均体积 | 命名 |
|------|------|------|----------|------|
| `city/` | 1 | 1920×1080 | 123 KB | `city-hero.webp` |
| `og/` | 12 | **1200×630** | 120 KB | `{slug}-og.webp` / `city-og.webp` |
| `attractions/` | 36 | 1920×1080 | 293 KB | `{slug}-hero.webp`、`{slug}-gallery-01..03.webp` |
| `seasonals/` | 3 | 1920×1080 | 102 KB | `{season}-hero.webp` |
| `stories/` | 10 | 1920×1080 | 246 KB | `{slug}-cover.webp`、`{slug}-hero.webp` |

目录结构：`src/assets/images/{city}/{city|attractions|og|seasonals|stories}/`
北京 gallery 图片 credit 统一为 `Wikimedia Commons`。

### 5.3 巴黎图片缺口清单（按 Beijing v1.0 标准，11 个景点）

| 类别 | 数量 | 目标路径 | 尺寸 |
|------|------|----------|------|
| City Hero | 1 | `paris/city/city-hero.webp` | 1920×1080 |
| City OG | 1 | `paris/og/city-og.webp` | 1200×630 |
| 景点 Hero | 11 | `paris/attractions/{slug}-hero.webp` | 1920×1080 |
| 景点 OG | 11 | `paris/og/{slug}-og.webp` | 1200×630 |
| 景点 Gallery | 25 | `paris/attractions/{slug}-gallery-01..03.webp` | 1920×1080 |
| 季节 Hero | 4 | `paris/seasonals/{spring,summer,autumn,winter}-hero.webp` | 1920×1080 |
| 故事 Cover | 5 | `paris/stories/{slug}-cover.webp` | 1920×1080 |
| 故事 Hero | 5 | `paris/stories/{slug}-hero.webp` | 1920×1080 |
| **合计** | **63** | | |

> 北京实际 62 张（季节仅 3 张，autumn 缺本地图）。巴黎按 4 季齐全应为 63 张，避免重演北京 N3。

---

## 6. 达到生产标准的内容清单（目标 vs 现状）

| 类型 | 现状 | 目标（对齐 Beijing v1.0） | 增量 |
|------|------|--------------------------|------|
| City | 1 | 1 | 0（补图 + socialImage + featured 决策） |
| Attractions | 4 | 11 | **+7** |
| Guides | 4 | 6 | **+2**（culture-etiquette、shopping） |
| Routes | 2 | 3 | **+1** |
| Route Plans | 1 | 1 | 0 |
| Budgets | 0 | 1 | **+1** |
| Best Time | 1 | 1 | 0 |
| Seasonals | 1 | 4 | **+3** |
| Stories | 0 | 5 | **+5** |
| **页面总数** | **14** | **33**（28 城市路径 + 5 故事） | **+19** |

### 6.1 新增景点候选（巴黎真实地标，7 选 7 补齐至 11）

保留现有 4 个：eiffel-tower、louvre、montmartre、latin-quarter

建议新增（按辨识度排序）：

1. `notre-dame` 巴黎圣母院
2. `arc-de-triomphe` 凯旋门 / 香榭丽舍
3. `musee-orsay` 奥赛博物馆
4. `versailles` 凡尔赛宫
5. `seine-cruise` 塞纳河游船
6. `marais` 玛黑区
7. `centre-pompidou` 蓬皮杜中心

备选：`champs-elysees`、`sainte-chapelle`、`pere-lachaise`

---

## 7. 风险

| # | 风险 | 等级 | 说明 / 缓解 |
|---|------|------|-------------|
| R1 | **图片来源真实性** | 高 | 63 张图必须确认为巴黎真实地点，禁止张冠李戴、禁止复用京都/北京图；沿用北京 credit 来源（Wikimedia Commons），不使用无关图填充 Gallery |
| R2 | **远程 Unsplash 依赖** | 中 | 当前 14 页 100% 依赖外部 CDN；一旦外链失效即大面积图裂。本轮应全部替换为本地 WebP |
| R3 | **OG 全站回退** | 中 | 景点/指南缺图 → OG 显示站点通用图（非巴黎），社交分享效果差；需补 `socialImage` 而非依赖兜底 |
| R4 | **故事 slug 全局命名空间** | 中 | 故事页 URL 为 `/stories/{slug}`，**不区分城市**；巴黎 5 个 slug 必须与已有 11 个（北京 5 + 京都 6）不冲突，否则覆盖 |
| R5 | **季节与预算缺类** | 低 | 缺 3 季 + 1 预算，结构与 Beijing/Kyoto 不一致，影响内链与目录页完整度 |
| R6 | **首页 featured 排序** | 低 | 巴黎 city 无 `featured`；Paris route-plan `featured:true` 参与首页路书位竞争，需明确是否提升巴黎权重 |
| R7 | **景点内容深度** | 低 | 平均 874 字符，低于北京 1216；可在 19.1 顺带扩写 |
| R8 | **京都被污染** | 低 | 巴黎工作必须零触碰 `data/*kyoto*` 与 `src/assets/images/kyoto/`；本阶段未做任何修改，京都保持干净 |

---

## 8. 推荐后续 Phase 顺序

沿用 Beijing 已验证的 18.x 节奏（数据 → 图片 → 校验 → Build → Release → Deploy → 验收）：

| Phase | 目标 | 主要交付 |
|-------|------|----------|
| **19.1** | Paris Data Completion | 新增 7 景点 / 2 指南 / 1 路线 / 1 预算 / 3 季节 / 5 故事；为全部实体补齐 `heroImage` `socialImage` `gallery` 字段引用；确定 `featured` 与故事 slug 命名 |
| **19.2** | Paris Images Batch 1 | City hero + City OG + 11 景点 hero + 11 景点 OG（1200×630 / 1920×1080 WebP） |
| **19.3** | Paris Gallery / Story / Seasonal 图片 | 25 张 gallery + 4 张季节 hero + 10 张故事图，并回填 JSON |
| **19.4** | SEO / OG / JSON 引用校验 | 校验本地图片存在性、消除 `-social.jpg` 兜底、确认 OG 为巴黎本地图 |
| **19.5** | Build Finalization | 本地 Build、页面数核对、图片 404 = 0、Kyoto/Beijing 隔离校验 |
| **19.6** | Git Release | Release commit + `paris-v1.0-release` tag + push |
| **19.7** | Production Deployment | 部署 Cloudflare Pages |
| **19.8** | Production Verification | 线上全量验收（对齐 18.8 口径） |

**执行原则**：一次一个 Phase；每段结束写报告并暂停；京都是保护区，任何改动不得触碰京都数据与图片。

---

## 9. 本阶段修改确认

- Tracked 文件变更：**0**
- 新增文件：仅本报告 `design/phase19.0-paris-replication-baseline.md`
- 未修改 JSON / JS / CSS / 模板 / 图片；未下载或生成图片；未 Build / Commit / Push / Deploy

---

*Report completed: 2026-08-29*
*Status: 暂停，等待用户确认 Phase 19.1 的景点清单、featured 决策与故事 slug 命名后启动*
