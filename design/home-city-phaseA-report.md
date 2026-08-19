# Home-City Phase A 报告
## Global Travel Guide v2.0 首页与城市入口重构（表现层升级）

> 阶段：**Phase A 执行完成并通过验证**
> 约束遵守：✅ 未改 URL / canonical / sitemap 逻辑 / type / 数据模型；✅ 未影响东京 route-plan / P0 / P0.5 成果；✅ 未 commit / push / deploy；✅ 未提前实现 budget/seasonal type、UGC、登录、投稿。
> 前置：`design/home-city-phasea-analysis.md`（Phase 0 只读分析）与 `design/v2.0-home-city-design.md`（设计文档）。

---

## 1. 修改文件列表

| 文件 | 改动 | 类型 |
|---|---|---|
| `src/templates/body-home.html` | **新增**：首页 v2.0 模板（Hero/统计/Featured Destinations 国家→城市/Popular Routes 旗舰卡/Guides/Seasonal/Traveler Stories 空态） | 新增 |
| `src/templates/body-city.html` | **新增**：城市页 v2.0 模板（面包屑/City Hero/About/分区渲染 + 空态） | 新增 |
| `src/lib/content.js` | **新增** `buildHomeBody()`、`buildCityBody()`、`planBadge()`（复用 `buildCitySections` 派生，未改任何既有函数） | 新增函数 |
| `src/design-system/components.css` | 追加 hero/stats/section-header/dest/route/guide/season/badge/empty/breadcrumb 组件（全 tokens） | 扩展 |
| `src/design-system/responsive.css` | 追加 375px 移动端规则（hero 限高/单列卡片/字体） | 扩展 |
| `scripts/build.js` | 导入新函数；注册 `tpl.home/tpl.city`；首页/城市页接线 `renderTemplate`；城市页 JSON-LD 追加 TouristDestination；执行期临时 `OUT_DIR` 支持已还原 | 接线 |

> `build.js` 最终 diff 仅含上述接线（无 env-OUT 残留）；`data/*.json`、`layout.html`、`body-route-plan.html`、P0/P0.5 文件零改动。

## 2. 首页前后对比

| 维度 | 前 | 后 |
|---|---|---|
| 首屏 | 米色底 + 药丸导航 + H1 品牌名 + 长 lead | **Hero 大图区**：品牌 overline + `Explore the world.`（H1）+ `Plan your journey.`（副标）+ 中文副标 + **Search destination 搜索框**（跳 /countries）+ 「Featured Destinations」按钮 + **统计条** |
| 统计 | 无 | **4 Destinations / 8 Curated Routes / 8 Planning Guides**（数据实计，非虚构 100+） |
| 目的地 | 国家+城市混排单网格 | **Featured Destinations**：国家卡（tint 绿）→ 城市卡（tint 金）两级 |
| 路线 | 纯文字卡列表 | **Popular Routes**：旗舰路书大卡（东京五日经济版 · 5 Days · economy 徽标）+ 路线卡网格 |
| 指南 | 单卡 | **Travel Planning Guides**：8 张真实指南卡 + All guides → |
| 季节 | 纯文字卡 | **Seasonal Experiences**：最佳时间卡 |
| 用户内容 | 无 | **Traveler Stories** 空态（Coming Soon，不制造假内容） |
| 区块头 | 无 | `.section-header`（衬线标题 + 查看全部 →） |

## 3. 城市页前后对比

| 维度 | 前 | 后 |
|---|---|---|
| 结构 | H1 + lead + 5 组文字卡 | **City Travel Hub**：面包屑 → City Hero（nameEn + 城市名 + 定位语）→ About City（简介 + 事实条）→ Best Time → Featured Routes（旗舰路书大卡 + 路线卡）→ Top Attractions → Planning Guides → Budget Plans（空态）→ Seasonal Guides（空态）→ Free Experiences（空态）→ Traveler Content（空态） |
| 东京实测 | 5 组文字卡 | Hero（Tokyo·东京）+ 事实条（亚洲/日语/日元/UTC+9）+ 全部分区渲染 ✓ |
| 北京实测 | 5 组文字卡 | Hero（北京）+ 分区渲染 ✓（无 nameEn/facts 时优雅降级，Phase B 补齐） |
| 内容可达性 | — | 保留 Top Attractions / Planning Guides 两区，**不丢既有内容入口**（非回归措施，报告中标注） |

## 4. Design System 新增组件（components.css，全 tokens、无新颜色变量）

`.hero` / `.hero--city` / `.hero-inner` / `.hero-brand` / `.hero-title` / `.hero-sub(-zh)` / `.hero-actions` / `.hero-search` / `.btn-on-hero` / `.stats-bar` / `.stat(-value/-label)` / `.section-header` / `.section-more` / `.dest-grid` / `.dest-card(--country/--city)` / `.route-card(--featured)` / `.route-grid` / `.guide-card` / `.season-card` / `.city-card` / `.badge` / `.empty-state` / `.breadcrumb` / `.about-text` / `.stats-bar--facts`

- 全部复用 tokens（`--brand/--tint-*/--accent/--font-serif/--space-*/--radius-*`）；hero 用 `--hero-image` + 深色渐变叠加。
- **零页面私有 CSS**：新页面/新组件均无 `<style>`、无私有 `:root` 颜色（grep `^\s*--` = 0）。

## 5. SEO 验证

| 项 | 结果 |
|---|---|
| 首页 title | `Global Travel Guide｜全球旅行攻略与自由行路线指南`（**不变**） |
| 首页 canonical | `https://travel.mootlsv.com/`（**不变**）；JSON-LD 1 块（WebSite+Organization+Breadcrumb） |
| 东京/北京 title | 不变；canonical 不变 |
| 城市页 JSON-LD | **新增 TouristDestination**（name/description/url，无虚假 geo/rating）；BreadcrumbList 复用 |
| 可见面包屑 | 城市页新增（首页 / 中国 / 北京 · Home / Japan / Tokyo） |
| sitemap | **46 条，不变** |

## 6. Build 验证

- `node scripts/build.js` → **Built 46 pages + sitemap.xml**（页面数 = 原数量，46 = 46）。
- 构建方式：临时 OUT_DIR 构建 + 写回 `public`（safe-delete 绕行），`build.js` 已还原，`git diff` 无环境残留。
- 东京 route-plan：canonical 不变、`new Chart` 图表脚本完好、内容未动。
- 北京 budget/normal 静态路书：canonical 不变、内容未动。
- grep 全清：邮箱/公司 = 0；`[object Object]` = 0（修复 route-plan `days` 数组徽标拼接 bug）；导航 `.html` 链接 = 0。
- 国家页（中国/日本）与目录页（countries/cities/…）仍走原 listing 模板，渲染正常。

## 7. 未修改内容确认

- ✅ URL / canonical / sitemap / type / schemaVersion —— 零改动
- ✅ 数据模型（`data/*.json`）—— 零改动（无新增字段；北京 nameEn/facts 等留待 Phase B）
- ✅ 东京 route-plan 全部内容与渲染 —— 未动
- ✅ 北京 budget/normal 静态路书 —— 未动
- ✅ `layout.html` / `body-content.html` / `body-listing.html` / `body-route-plan.html` / tokens.css —— 未动
- ✅ P0（Design System / Footer / 移动端规则）与 P0.5（静态页收口 / 导航统一）成果 —— 未受影响
- ✅ 未 commit / push / deploy

## 8. 后续 P1 / P2 建议

1. **Phase B（数据增强）**：city/country JSON 补 `hero/tagline/highlights/bestTime/relatedCities` 与北京 `nameEn/facts`；卡片图接入 `imageBaseUrl`（本地占位 → R2）——可让 Hero 每城独立大图、卡片带图。
2. **P1（类型）**：注册 `budget` / `seasonal` type，吸收北京遗留静态路书；城市页 Budget Plans / Seasonal Guides 从空态转真实数据；Related Cities 有同国多城后自动激活。
3. **P2（UGC）**：note/photo/share/review + authorship/engagement/tags 标准块；首页 Traveler Stories 与城市页 Traveler Content 空态转真实内容。
4. **P3（远期）**：真搜索（站点索引/联想）+ SearchAction JSON-LD（当前搜索框为「输入 → 跳转 /countries」入口式 UI）。
5. **可选**：Hero 统计改为品牌化「100+ Destinations」愿景（当前为数据实计，随内容扩容自然增长）。

> 结论：Phase A 表现层升级完成并验证通过——首页升级为「世界旅行规划入口」，城市页升级为「City Travel Hub」，全部由既有数据模型派生，URL/SEO/sitemap 零改动，46 页构建通过。等待人工确认后进入 Phase B / P1。
