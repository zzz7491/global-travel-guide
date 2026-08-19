# Global Travel Guide v2.0 · P10 Phase 0 分析

## 100 城第一批内容生产（巴黎 / 伦敦 / 纽约）

> 阶段：**P10 Phase 0（只读分析，未修改任何文件）**
> 状态：等待确认后进入 P1–P7

---

## 1. 现有 Schema 确认（P9 后）

### 1.1 City Schema（东京/北京样板，22 字段全量）
`id / type / country / city / name / nameEn / title / description / keywords / h1 / lead / continent / language / currency / timezone / tagline / heroImage / bestTime / facts / highlights / relatedCities / gallery[]`

- `gallery[]` 结构：`{ src, alt, credit }`（P9 落地，body-city 已渲染 Gallery 区块）
- 顶层四件套与 facts 双轨（facts 优先、顶层回退）——北京已对齐

### 1.2 Country Schema（中国/日本样板）
`id / type / country / name / nameEn / title / description / keywords / h1 / lead / code / continent / language / currency / timezone / visa / transport / heroImage`

- P9 已补齐两国全字段——新国家照此模板生产即可

## 2. 数据驱动通用性验证（实测）

| 检查项 | 结果 |
|---|---|
| 硬编码国家/城市（france/london/new-york/paris）| **零**（源码 grep 无命中）✅ |
| `urlFor/linkUrl` country/city | 模板化 `` `/${e.country}/` `` `` `/${e.country}/${e.city}/` `` → 任意值自动路由 ✅ |
| `buildCountrySections` | 按 country 过滤自动列出该国家城市 → 新国家页自动生成 ✅ |
| `buildCitySections` | 按 country+city 过滤子实体 → 新城市 Hub 自动聚合 ✅ |
| `buildCityBody` | Hero/About/Gallery/BestTime/各区块全数据驱动，无城市特殊判断 ✅ |
| Gallery | P9 已建（buildCityBody 映射 + body-city 区块 + components.css 组件）→ 新城市 JSON 填 gallery 即渲染 ✅ |
| SEO TouristDestination image[] | P9 已建（heroImage + gallery 合并去重）→ 新城市自动输出 ✅ |
| sitemap | entities 循环 `pages.push` 自动收录 ✅；/countries /cities 目录自动列出 ✅ |

**结论：新增城市只需「country JSON + city JSON + 图片」，自动生成国家页 / 城市 Hub / Gallery / SEO / sitemap / 目录页，零代码。**

## 3. 页面数测算（重要）

当前 49 页。新增 3 国家 + 3 城市：
- 国家页：`/france/` `/uk/` `/us/` → **+3**
- 城市页：`/france/paris/` `/uk/london/` `/us/new-york/` → **+3**
- **合计 49 → 55 页**（规范 P7 写「49→52 +3」，未计入 3 个国家页；按实测 55 页为准，报告中如实说明）

## 4. 首页 Featured 策略（P6 设计）

当前 `buildHomeBody` 把**全部** countries + cities 放进首页 Featured Destinations（新增 3 城后会显示 5 国 5 城，过载）。

**方案（数据驱动 + 最小代码）**：
- 数据层：中国/日本 country、东京/北京 city 标 `featured: true`（optional）；新 3 国 3 城**不标**。
- 代码层：`buildHomeBody` countries/cities 过滤——**有 featured 标记时只显示 featured**；无任何标记时显示全部（向后兼容，P8/P9 行为不变）。
- 效果：首页保持精选 2 国 2 城；全部城市经 `/cities` 目录（已有）可达。
- 约束：不改 URL / 模板结构 / 不新增页面逻辑（仅列表过滤）。

## 5. 图片体系（P2 要求）

- 每城 gallery 4–6 张 + heroImage；国家 heroImage 1 张。
- **全部 URL 必须 curl HTTP 200 验证**；alt 中性描述（如「巴黎 埃菲尔铁塔」不写评分/排名）。
- 复用 L1 Unsplash 直链（`w=800&q=70` 卡片 / `w=1600&q=80` hero）。

## 6. 校验工具增强（P5 设计）

`scripts/validate-city-schema.js` 追加检查：
1. `country` 对应的 `data/countries/{country}.json` 存在
2. `heroImage` 存在（P10 起必填）
3. `gallery` 数量 ≥ 1（P10 起必填）
4. 每张 gallery `alt` 非空
5. slug 唯一性（跨城市文件无重复 country-city 组合）

## 7. 执行计划（P1–P7）

| # | 任务 | 产出 |
|---|---|---|
| P1 | France/UK/US 国家 JSON（字段完整 + 图 200） | data/countries/france.json / uk.json / us.json |
| P2 | 巴黎/伦敦/纽约 city JSON（tagline/gallery 4-6/facts/highlights/bestTime/relatedCities） | data/cities/france-paris.json / uk-london.json / us-new-york.json |
| P3 | Hub 自动生成验证（Hero/About/Gallery/BestTime；无数据区块隐藏/空态） | build 后实测 |
| P4 | SEO 验证（TouristDestination name/description/image[]；无虚假 geo/rating） | build 后实测 |
| P5 | validate-city-schema 增强（country 存在/heroImage/gallery 数量/alt/slug 唯一） | 脚本更新 + 5 城 PASS |
| P6 | 首页精选（featured 标记 + buildHomeBody 过滤） | 2 国 2 城精选 |
| P7 | 全量验收（55 页、sitemap、canonical、JSON-LD、图片、375px、grep）+ 报告 | design/p10-report.md |

## 8. 风险

- 页面数 49→55 与规范 52 有差（如实上报）。
- 图片 URL 需逐个验证；gallery 内容与城市真实对应（alt 中性、不虚构）。
- facts 顶层双轨需与城市事实一致（巴黎 UTC+1、伦敦 UTC+0、纽约 UTC-5 等，人工核对）。
- 首页精选过滤为代码小改，需回归验证无 featured 标记城市（未来）不受影响。

---

*P10 Phase 0 完成，等待确认后进入 P1–P7。*
