# Global Travel Guide v2.0 · P10 Phase 0 分析（更新版）

## City Expansion Release（巴黎 / 伦敦 / 纽约）· P9 后状态复核

> 阶段：**P10 Phase 0（只读分析，未修改任何文件，未创建城市数据）**
> 基线：**P9 Release（e61629f，已上线生产 travel.mootlsv.com）**
> 状态：等待确认后进入 P1–P7

---

## 1. Schema 支持性确认（P9 后实测）

### 1.1 Country Schema（已标准化，可直接复用）
```
id / type / country / name / nameEn / title / description / keywords / h1 / lead /
code / continent / language / currency / timezone / visa / transport / heroImage
```
- P9 已补齐中国/日本全字段 → 新国家（法国/英国/美国）照此模板生产即可，**schema 零改动**。

### 1.2 City Schema（已含 Gallery，可直接复用）
```
id / type / country / city / name / nameEn / title / description / keywords / h1 / lead /
continent / language / currency / timezone / related / tagline / heroImage /
bestTime / facts / highlights / gallery[] / relatedCities
```
- `gallery[]`（{src, alt, credit}）P9 已落地并渲染 → 新城市填 JSON 即自动出现 Gallery 区块。

### 1.3 最小字段集合（新城市必填）
| 实体 | 必填 | 可选（推荐） |
|---|---|---|
| country | id / type / country / name | nameEn / code / continent / language / currency / timezone / visa / transport / heroImage / title / description / keywords / h1 / lead |
| city | id / type / country / city / name | nameEn / tagline / heroImage / gallery[] / facts[] / highlights[] / bestTime / relatedCities / title / description / keywords / h1 / lead |

> 全部非必填字段缺失时：区块自动隐藏 / 优雅空态，**不会产生空页面**（模板 `{{#if}}` 保护）。

## 2. 数据驱动通用性复核（P9 后）

| 检查项 | 结果 |
|---|---|
| 硬编码新城市（france/london/new-york/paris） | **0**（源码 grep 无命中）✅ |
| `urlFor/linkUrl` country/city | 模板化 `` `/${e.country}/` `` `` `/${e.country}/${e.city}/` `` ✅ |
| `buildCountrySections` | 按 country 过滤自动列城市（content.js）✅ |
| `buildCitySections` / `buildCityBody` | 按 country+city 过滤自动聚合，Gallery/hero 消费就位 ✅ |
| 国家页渲染 | `type === 'country'` → body-listing（build.js:348），自动生成 ✅ |
| sitemap | entities 循环 `pages.push` 自动收录（build.js:355）✅ |
| /countries /cities 目录 | INDEX_PAGES 自动列出 ✅ |
| TouristDestination image[] | P9 已建（heroImage + gallery 合并去重，build.js:276-280）✅ |

**结论：新增国家/城市只需 country JSON + city JSON + 图片，自动生成国家页 / 城市 Hub / Gallery / SEO / sitemap / 目录页，核心代码零改动。**

## 3. 页面数测算

当前 **49 页**（生产基线）。新增 3 国家 + 3 城市：
- 国家页：`/france/` `/uk/` `/us/`（+3）
- 城市页：`/france/paris/` `/uk/london/` `/us/new-york/`（+3）
- **合计 49 → 55 页**（此前 8-16 版分析已指出：任务书写的「52」未计入 3 个国家页；按实测 55 页验收）

## 4. P6 首页精选策略（本阶段唯一代码调整点）

**现状**：`buildHomeBody`（content.js:302）countries/cities 为**全部实体** pick → 新增 3 城后首页 Featured Destinations 显示 5 国 5 城（过载）。

**方案（数据驱动 + 最小代码）**：
- 数据层：中国/日本 country、东京/北京 city 标 `featured: true`（optional）；新 3 国 3 城**不标**。
- 代码层：`buildHomeBody` countries/cities 过滤——**有 featured 标记时只显示 featured**；无任何标记时显示全部（向后兼容，P8/P9 行为不变）。
- 效果：首页保持精选 2 国 2 城；全部城市经 `/cities` 目录可达。
- 约束：不改 URL / 模板结构 / 不新增页面逻辑（仅列表过滤）。

## 5. P5 校验工具增强（当前能力 → 目标）

当前 `scripts/validate-city-schema.js`（P9）已检查：JSON 合法性 / 必填字段 / slug 格式 / id 一致性 / heroImage URL / gallery 格式（src+alt+type 枚举）/ facts 格式。

P10 需增强（新增 5 项）：
1. `country` 对应的 `data/countries/{country}.json` **存在**
2. `heroImage` **必填**（P10 起新城市标准）
3. `gallery` **数量 ≥ 1**（P10 起新城市标准）
4. gallery 每项 `alt` 非空
5. **slug 唯一性**（跨城市文件无重复 country-city 组合）

## 6. P2 图片要求

- 每城 gallery 4–6 张 + heroImage；国家 heroImage 1 张。
- **全部 URL curl HTTP 200 验证**（构建前）；alt 中性描述（如「巴黎 埃菲尔铁塔」），不写评分/排名/虚构人口。
- 复用 L1 Unsplash 直链（card `w=800&q=70` / hero `w=1600&q=80`）。

## 7. 执行计划（P1–P7，待确认）

| # | 任务 | 产出 |
|---|---|---|
| P1 | France/UK/US 国家 JSON（全字段 + heroImage 200） | data/countries/{france,uk,us}.json |
| P2 | 巴黎/伦敦/纽约 city JSON（gallery 4-6/facts/highlights/bestTime/relatedCities） | data/cities/{france-paris,uk-london,us-new-york}.json |
| P3 | Hub 自动生成验证（Hero/About/Gallery/BestTime；无数据区块隐藏/空态） | build 后实测 |
| P4 | SEO 验证（TouristDestination name/description/image[]；无虚假 geo/rating） | build 后实测 |
| P5 | validate-city-schema 增强（5 项）→ 5 城 PASS | 脚本更新 |
| P6 | 首页精选（featured 标记 + buildHomeBody 过滤） | 2 国 2 城精选 |
| P7 | 全量验收（55 页、sitemap、canonical、JSON-LD、图片、375px、grep）+ 报告 | design/p10-report.md |

## 8. 风险

- 页面数 55 vs 任务书 52（如实上报）。
- 事实准确性：巴黎 UTC+1、伦敦 UTC+0、纽约 UTC-5；货币 EUR/GBP/USD——人工核对。
- 图片 URL 需逐个 200 验证；gallery 内容与城市真实对应。
- P6 过滤为最小代码改动，需回归「无 featured 标记城市不受影响」（向后兼容）。

---

*P10 Phase 0 完成（更新版，基于 P9 Release 状态）。未修改任何文件，未创建城市数据。等待确认进入 P1–P7。*
