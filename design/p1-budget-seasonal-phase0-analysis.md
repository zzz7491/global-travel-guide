# P1 Phase 0 执行前架构复核分析
## Budget / Seasonal Type 系统化升级 · 只读复核（未修改任何文件）

> 阶段：**P1 Phase 0（只读）**；约束：未修改任何代码 / 数据 / 构建脚本；未 build / commit / push / deploy。
> 结论先行：**当前 v2.0 架构完全支持 Budget / Seasonal 扩展**——type 路由、自动派生、sitemap 自动收录机制均已验证，且 budget 与 route-plan 模板 12 模块一一对应，复用成立。

---

## 1. 当前架构状态（实测锚点）

| 项 | 位置 | 状态 |
|---|---|---|
| type 路由 | `content.js:16 urlFor()`、`:32 linkUrl()`（7 type case：home/country/city/attraction/route/guide/best-time/route-plan） | 新增 type = 各 +1 case |
| 面包屑叶子 | `content.js:50 SECTION_LABELS`、`:55 LEAF_TYPES` | +budget/+seasonal 即进面包屑末级 |
| 城市派生 | `content.js:154 buildCitySections`（groups 数组：attraction/route/guide/best-time + 完整路书 itineraries） | groups +budget/+seasonal 即自动出卡 |
| 首页派生 | `content.js:259 buildHomeBody`（countries/cities/routes/guides/seasons + featured） | +budget 区块/+seasonal 并入季节区 |
| 城市 Hub | `content.js:320 buildCityBody`（Phase A 已硬编码 Budget/Seasonal/Free/Traveler 空态，`:377/:382`） | 有真实数据时切换为派生卡片 |
| 构建加载 | `build.js:69-75`（ENTITIES loadDir 7 目录，`route-plans` 在 :75） | +`budgets`、`seasonals` 两行 loadDir |
| 模板映射 | `build.js:145`（tpl 含 routePlan）、`:248-250`（city→tpl.city；route-plan→buildRoutePlanBody） | budget→复用 buildRoutePlanBody+body-route-plan；seasonal→新 tpl.seasonal |
| sitemap | `build.js:261`（ITINERARIES push）+ 实体 push；`renderPage` JSON-LD（WebSite/Org/Breadcrumb + 城市 TouristDestination :169） | 新实体**自动进 sitemap** ✅ |
| legacy 引用 | `build.js:83 ITINERARIES`（normal/budget 两条，指向将被删除的静态页） | 迁移时删除该数组两条 + 静态文件 |

## 2. Budget Type 实现位置（P1）

| 动作 | 位置 |
|---|---|
| urlFor/linkUrl +case | `content.js:16/32`（`/${country}/${city}/budget/${slug}[.html]`） |
| SECTION_LABELS +`budget:'预算方案'`；LEAF_TYPES +`budget` | `content.js:50/55` |
| buildCitySections groups +`{type:'budget',title:'预算方案'}` | `content.js:154` |
| build.js 加载 `data/budgets` | `build.js:75` 后 +1 行 |
| 渲染 | **复用 `buildRoutePlanBody`（content.js:433）+ `body-route-plan.html`**——其 12 模块（路线设计理念/行程总览/门票方案/住宿建议/每日时间轴/每日交通与花费汇总/预算估算/预算分解表/数据可视化/每日餐饮明细/每日交通明细/备选方案 A/B/省钱技巧/实用提醒/行李清单）与 budget.html 模块一一对应；`buildRoutePlanCharts` 自动生成 Chart.js 脚本 |
| 模板 | **无需新建 body-budget.html**（复用成立）；如需差异化仅微调 cover 标签，不复制 HTML |

## 3. Seasonal Type 实现位置（P4）

| 动作 | 位置 |
|---|---|
| urlFor/linkUrl +case | `content.js:16/32`（`/${country}/${city}/seasonal/${slug}[.html]`） |
| SECTION_LABELS +`seasonal:'季节攻略'`；LEAF_TYPES +`seasonal` | `content.js:50/55` |
| buildCitySections groups +`{type:'seasonal',title:'季节攻略'}` | `content.js:154` |
| build.js 加载 `data/seasonals` + `tpl.seasonal: readTpl('body-seasonal.html')` + `e.type==='seasonal'` 分支 | `build.js:75/145/250` |
| 新模板 `body-seasonal.html`（season/months/weather/highlights/events/tips/blocks 渲染，用 Design System） | 新增文件 |

## 4. Legacy budget 迁移方案（P2）

- **来源**：`src/static/china/beijing/budget.html`（1946 行，11 模块 + Chart.js×4）。
- **目标**：`data/budgets/china-beijing-economy.json`（type:"budget"，slug:"economy" → URL `/china/beijing/budget/economy`）。
- **模块映射**：cover/designPhilosophy(经济版核心调整 5 项)/overview(5 日卡)/ticketTiers(门票三档)/accommodation(酒店)/budgetTiers(三档预算卡)/budgetTable(类目×3档+合计+双人)/foodDetail(每日餐饮表)/transitDetail(每日交通表)/charts(小时 bar[7,7,7,8,6]、预算 pie[1100,750,97,100]、三档 stacked bar)/savingTips/reminders/packing。
- **内容红线**：禁酒店/餐厅品牌名（如家/汉庭/大董→类型化描述）、禁单点固定价、核心数字不改写、图表数据保留。
- **删除**：迁移后删除 `src/static/china/beijing/budget.html` 与 `build.js ITINERARIES` 中经济版条目。

## 5. Legacy normal 迁移方案（P3）

- **来源**：`src/static/china/beijing/normal.html`（1480 行，封面/行程总览/双档预算表/实用提醒/附录）。
- **目标**：`data/route-plans/china-beijing-comfort.json`（**type:"route-plan"**，slug:"comfort" → URL `/china/beijing/route-plan/comfort`；不新增重复类型）。
- **模块映射**：cover/overview(5 日卡)/budgetTiers(经济版/舒适版双档)/budgetTable(类目/明细/两档)/reminders/附录→blocks；图表数据（经济版/舒适版 pie）保留。
- **删除**：迁移后删除 `src/static/china/beijing/normal.html` 与 `build.js ITINERARIES` 中正常版条目。

## 6. URL 风险评估

| 项 | 评估 |
|---|---|
| 新 URL | `/china/beijing/budget/economy`、`/china/beijing/route-plan/comfort` —— **新增**，不冲突 |
| 旧 URL | `/china/beijing/budget`、`/china/beijing/normal`（及 `.html` 变体）在静态文件删除后 404 → **需 `_redirects` 追加 301**：`/budget.html→/china/beijing/budget/economy`、`/normal.html→/china/beijing/route-plan/comfort`、`/china/beijing/budget[.html]→…/economy`、`/china/beijing/normal[.html]→…/comfort`（既有 `_redirects` 中 `/normal.html /china/beijing/normal.html 301`、`/budget.html …` 两条需改目标） |
| 东京 route-plan | URL 完全不受影响 ✅ |
| 页面数 | 46 − 2(ITINERARIES 静态) + 2(budget + route-plan 新实体) = **46，不变** ✅（seasonal 骨架无内容 → 不新增页） |
| 风险等级 | **中**：集中在 `_redirects` 正确性与旧链可达性，验收时逐一 curl 检查 |

## 7. SEO 风险评估

| 项 | 评估 |
|---|---|
| canonical | 新页面自动生成；legacy 两页 canonical 随迁移变化（`/china/beijing/budget`→`…/budget/economy`）——301 保兼容，**需执行期用户确认**（Phase 0 设计文档已列，本任务"明确批准的 legacy redirect"= 已授权） |
| sitemap | 实体 push 自动收录（新页面入 46 条，无重复内容）✅ |
| JSON-LD | 新页面自动获得 WebSite+Org+Breadcrumb（LEAF_TYPES 含 budget/seasonal 后面包屑完整）；城市 TouristDestination 不受影响 |
| 重复内容 | 旧 URL 301 后无重复收录；静态文件删除后无旧 canonical 残留 ✅ |
| 风险等级 | **低**：仅 legacy canonical 变更需确认 |

## 8. 需要修改文件清单（P1–P7 执行期）

| 文件 | 动作 |
|---|---|
| `src/lib/content.js` | urlFor/linkUrl +2 case；SECTION_LABELS/LEAF_TYPES +2；buildCitySections groups +2；buildCityBody 空态→真实切换；buildHomeBody +budget/seasonal 聚合 |
| `scripts/build.js` | loadDir +`budgets`/`seasonals`；tpl +`seasonal`；main 分支 +`budget`(复用 route-plan)/`seasonal`；ITINERARIES 删 2 条 |
| `src/templates/body-seasonal.html` | **新增**（骨架模板，Design System） |
| `src/templates/body-home.html` | +Budget Plans 区块（有数据才显示） |
| `data/budgets/china-beijing-economy.json` | **新增**（budget 迁移产物） |
| `data/route-plans/china-beijing-comfort.json` | **新增**（normal 迁移产物，route-plan type） |
| `src/static/china/beijing/{budget,normal}.html` | **删除**（迁移后） |
| `src/static/_redirects` | 更新/追加 legacy 301 |

## 9. 执行风险点

1. **内容迁移保真**：3300+ 行 HTML → 2 个 JSON，需逐模块转写；核心数字（¥1,612/¥2,047/¥2,531、三档表、图表数据）**不得改写**；品牌名必须类型化（验收 grep 品牌名）。
2. **ITINERARIES 与 sitemap 联动**：删除 ITINERARIES 条目须与新增实体同步，否则页面数 ≠46 或 sitemap 悬空。
3. **`_redirects` 正确性**：旧 4 条 beijing 路书相关 URL 需全量覆盖（根级 + `/china/beijing/` 级 + `.html` 变体），避免 404。
4. **buildRoutePlanBody 复用兼容**：budget JSON 字段名必须与 route-plan 模板 token 一致（overview/ticketTiers/budgetTiers/budgetTable/foodDetail/transitDetail/charts/…），缺字段须模板 `{{#if}}` 优雅降级。
5. **buildCityBody 空态冲突**：有真实 budget/seasonal 数据后，须移除对应"Coming Soon"空态（避免同区双渲染）。
6. **safe-delete 绕行**：删除 `src/static/china/beijing/*.html` 与 build 时仍用临时 OUT_DIR 流程。
7. **seasonal 骨架无内容**：模板/路由先就位，城市 Hub Seasonal 区继续空态（不产生 SEO 空页）。

> 本文件为只读产物，未修改任何文件。**等待人工确认后进入 P1–P7 实施。**
