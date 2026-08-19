# P4 Phase 0 分析：Seasonal Type 骨架注册与系统接入
## 只读复核（未修改任何文件）

> 结论：seasonal 的系统接入点已大部分就位（P2 已加 buildCitySections 组 + Hub 空态切换），本阶段需补齐：**Type 注册（urlFor/linkUrl/LEAF_TYPES + build.js 加载与渲染分支）+ 独立模板 `body-seasonal.html` + buildHomeBody 合并 + Article JSON-LD + 1 条骨架验证样例**。

---

## 1. 当前架构状态（实测锚点）

| 项 | 位置 | 状态 |
|---|---|---|
| type 路由 | `content.js:16 urlFor` / `:32 linkUrl`（9 type：home/country/city/attraction/route/guide/best-time/route-plan/budget） | seasonal **缺失**，+1 case 即可 |
| LEAF_TYPES | `content.js:57`（含 budget） | +`seasonal` 即进面包屑末级 |
| SECTION_LABELS | `content.js:50` | **不加** seasonal（避免死链 `/seasonals/` 面包屑） |
| buildCitySections | `content.js:165-166` groups 已含 `budget`/`seasonal`（P2 完成） | ✅ 无需改 |
| buildCityBody Hub | `content.js:383-389` Seasonal Guides 真实/空态切换（P2 完成） | ✅ 无需改 |
| buildHomeBody | `content.js` seasons 目前仅取 `best-time` | 需合并 `seasonal` |
| build.js | ENTITIES 加载 7 目录；渲染分支 `route-plan||budget → buildRoutePlanBody` | +`data/seasonals` loadDir；+seasonal 渲染分支 |
| 模板 | `body-route-plan.html` 为 budget 复用；无 seasonal 模板 | **需新建 `body-seasonal.html`**（独立：季节内容结构与 route-plan 不同，不复用） |
| 页面基线 | sitemap **46** 条 | 注册能力不加页；加 1 条测试 seasonal → 47 |

## 2. Seasonal 设计要点

- **独立模板**：seasonal 内容（季节/月份/天气/活动）与 route-plan/listing 结构不同，**需独立 `body-seasonal.html`**；全部使用 Design System 组件（hero/section-header/about-text/highlight-chips/chip/cards/notes-list/section-summary/empty-state），零页面私有 CSS。
- **Schema（全 optional，无数据不生成页面）**：`{type,country,city,slug,title,description,season,months[],heroImage,weather,highlights[],events[],tips[],blocks[]}`。
- **Hub 接入点已就位**：有数据 → buildCitySections 自动派生「季节攻略」组 → buildCityBody 渲染真实卡；无数据 → 现有优雅空态。
- **首页**：buildHomeBody 的 `seasons` 改为 `best-time + seasonal` 合并（只显示真实数据）。
- **SEO**：renderPage 自动生成 title/description/canonical/JSON-LD（WebSite+Org+Breadcrumb，LEAF_TYPES 含 seasonal 后面包屑完整）；build.js 为 seasonal 追加 `Article` JSON-LD（headline= h1、description、url，无虚假日期）。
- **测试样例**：为验证骨架端到端，添加 1 条 `data/seasonals/china-beijing-autumn.json`（北京秋季，内容源自现有 best-time/Phase B 数据，不虚构），页面数 46→47，明确记录。

## 3. 约束确认

- ✅ 不影响东京 route-plan / 北京 budget / 北京 comfort route-plan / P0 / P0.5 / Phase A / Phase B / P1 / P2
- ✅ 不生产批量季节内容（仅 1 条骨架验证样例）
- ✅ 不进入 P5 内容生产 / UGC / 用户系统 / 全局目录页

> 本文件为只读产物，未修改任何文件。
