# P12 Phase 0 分析 — 全站视觉与体验巡检

- 日期：2026-08-19
- 范围：首页 / 国家页 / 城市 Hub / 三城子实体 / route-plan / seasonal / gallery
- 性质：**只读巡检**（未修改代码 / 未 build / 未 commit）
- 基线：P11 Release（82afb34）线上 94 页 + `public/` 94 页产物

---

## 一、巡检维度结论速览

| 维度 | 结论 | 说明 |
|---|---|---|
| 移动端 375px | ✅ 良好 | responsive.css 375px-first + route-plan 768px 覆盖 + table-scroll 表格滚动 |
| 首屏 Hero 层级 | ⚠️ 不一致 | 首页/Hub/seasonal 有 Hero；国家页/目录页/子实体页 h1 直出（无图） |
| Featured 卡片一致性 | ✅ 一致 | 首页与 Hub 均用 `.route-card--featured`（绿渐变）；dest-card 两档 tint 统一 |
| Gallery 展示 | ✅ 正常 | 16:9 统一、alt 全、lazy 全；无 lightbox（中性） |
| 空态体验 | ⚠️ 噪音 | 空态样式统一，但「Free Experiences」恒显且无数据源 |
| CTA 引导路径 | ⚠️ 完整但有一缺口 | 首页→目录→Hub→子实体→back/related 闭环完整；**首页搜索框无过滤功能** |
| 图片比例与裁切 | ✅ 统一 | card-img 16:9（800×450）object-fit:cover 全站统一 |
| 字体/间距/颜色 token | ✅ 规范 | 全站 var() 引用 tokens.css；route-plan 内嵌 style 用别名映射；仅 1 处货币硬编码 |

---

## 二、关键发现（按优先级）

### 🔴 A1 · route-plan 预算分解表货币前缀硬编码（需修复）

**现象**：巴黎/伦敦/纽约 route-plan 的「预算分解表」显示 `约¥160–320`，但实际金额为 **€/£/$**（伦敦 160–320 实为 £）。东京正常（本来就是 ¥）。

**根因**：`src/templates/body-route-plan.html:314-316 / 321-323` 硬编码 `约¥{{...}}`，未使用数据层的货币字段。对照：同页「预算估算」卡（budgetTiers）用 `{{estimate.currency}}` 显示正确（£230–480 ✓）。

**影响**：事实准确性（货币单位错误）、信任度。**SEO 无影响，纯展示缺陷**。线上已生效（P11 三城 route-plan 均受影响）。

**建议修复**：模板改为引用数据层货币（如 `{{budgetTable.currency}}` 或由 buildRoutePlanBody 注入），不动东京。

### 🟠 B1 · 首页搜索框无过滤逻辑（需决策）

**现象**：`body-home.html` hero-search `<form action="/countries" method="get" name="q">`，提交 `?q=xxx` 后目录页无任何过滤处理——**搜索是装饰性的**。

**根因**：纯静态站（构建期生成），`?q=` 无法在构建期预知，需客户端处理。

**可选方案**：
- a) 目录页加一小段 JS 客户端过滤（约 10 行，只增强体验、不改 URL 结构）
- b) 移除搜索框，改为纯 CTA 按钮（最保守）
- c) 保持现状（搜索跳转目录页不过滤，体验最弱）

### 🟡 C1 · 国家页/目录页/子实体页无 Hero（可选优化）

首页、城市 Hub、seasonal 均有全宽 Hero（图+品牌+标题），但国家页（listing）、目录页、子实体页（attraction/guide/best-time）为 `h1 + lead` 直出——视觉重量与 Hub 差异明显。属既有设计选择（listing 语义），非缺陷，可选为 listing 加轻量页头。

### 🟡 C2 · Free Experiences 空态恒显（可选优化）

`buildCityBody` 无条件 push `Free Experiences` 空态（`content.js:538`），无数据源 → **所有城市 Hub 永久显示「Free Experiences Coming Soon」**，属空态噪音。可选：移除该空态或等真实数据再显示。

### 🟡 C3 · body 背景 background-attachment: fixed（轻微）

`style.css:14` 使用 `var(--hero-image) ... fixed`（background-attachment 简写），iOS Safari 下 fixed 背景存在滚动渲染/性能小问题。轻微，非必改。

### 🟡 C4 · 首页 stats 口径不统一（轻微）

首页 stats：Destinations=4（P10 后 featured 子集 2 国 2 城）、Planning Guides=20（全量）——**口径不一致**（4 为精选数、20 为全量数），且 4 < 实际全站 10 目的地。诚实但易误导。可选：label 改为「Featured Destinations」或统一全量口径。

### 🟢 D1 · 子实体页无图片（内容模型限制）

attraction/guide 页为纯文本（blocks 驱动，schema 无 image 字段，东京同理）——与 Hub 丰富度差异大。属内容模型既有设计，非 bug；如需配图需扩展 schema（超出 P12 微调范围，记录不执行）。

---

## 三、一致性确认（巡检通过项）

- ✅ **token 纪律**：tokens.css 为唯一色源；route-plan 内嵌 style 全部 `var()` 别名映射；无页面私有色值（除系统白/黑）
- ✅ **组件无重复**：`style.css .card/.cards`（content/listing 用）与 design-system 组件互补，无重名冲突（P0.5 已清理 .topnav 双份）
- ✅ **图片体系**：全站 img 带 width/height=800/450 + alt + lazy；card-img 16:9 cover 统一
- ✅ **375px 防线**：`overflow-x:hidden` + h1 clamp + 卡片单列 + 表格 min-width 560px 滚动（responsive.css 39 行 + route-plan 768px 块）
- ✅ **空态样式统一**：empty-state 组件（虚线边框 + 米金底）四处空态（Budget/Seasonal/Free/Stories）文案风格一致
- ✅ **Hub 结构统一**：巴黎/伦敦/纽约/东京/北京八区块结构完全一致（Best Time / Featured Routes / Budget Plans / Seasonal Guides / Top Attractions / Planning Guides / Free Experiences / Traveler Stories）
- ✅ **CTA 闭环**：首页（搜索+Featured 按钮+section-more）→ 目录页 → Hub（section-more+卡片）→ 子实体（back 返回 Hub + related-list 推荐）→ route-plan（rp-back）；路径完整无断链
- ✅ **route-plan 移动端**：cover h1 54→30px、grid 1fr、四张表 table-scroll——处理完善

---

## 四、建议执行范围（待用户确认）

| 项 | 内容 | 改动面 | 优先级 |
|---|---|---|---|
| A1 | route-plan 预算分解表货币前缀修复（¥→数据货币） | body-route-plan.html 模板 1 处 + build.js 注入 currency | **P0 修复** |
| B1 | 首页搜索框（三选一：JS 过滤 / 移除改 CTA / 保持） | 待决策 | P1 决策 |
| C1 | listing 页轻量页头（可选） | components.css + body-listing.html | P2 可选 |
| C2 | 移除恒显 Free Experiences 空态 | content.js 1 处 | P2 可选 |
| C3 | body fixed 背景 → 本地/滚动安全 | style.css 1 处 | P2 可选 |
| C4 | stats 口径统一（label 或口径） | content.js 1 处 | P2 可选 |

**纪律约束（若进入执行）**：只做增量微调、不重写既有结构、A1 修复不影响东京渲染、build 回归 94 页、安全 grep 0、不 commit（待用户指令）。

**Phase 0 到此暂停，等待确认执行范围。**
