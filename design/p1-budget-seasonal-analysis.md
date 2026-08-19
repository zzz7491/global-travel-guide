# P1 Budget / Seasonal Type 系统设计（只读分析 + Schema 设计）
## Global Travel Guide v2.0 · 北京 legacy 路书数据化吸收

> 阶段：**P1 第一阶段（只读分析 + Schema 设计，未写任何代码）**
> 约束遵守：✅ 未修改任何文件；✅ 未动东京 route-plan / 现有 URL / canonical / sitemap。
> 目标：把北京 legacy `budget.html`（及其兄弟 `normal.html`）吸收进数据驱动架构，新增 `budget` / `seasonal` 两个 type，保持 URL 规则统一、SSG 自动生成、SEO 独立页面、城市 Hub 自动展示、首页自动聚合。

---

## 一、Legacy 内容结构分析（实测）

### 1.1 `src/static/china/beijing/budget.html`（经济版，1946 行，自带私有 CSS + Chart.js×4）

| 模块 | 位置 | 内容结构 | 对应 route-plan JSON 字段 |
|---|---|---|---|
| 封面 Cover | 757–796 | tag / 标题 / 预算统计（¥90 TRANSIT 等）/ badge / 日期行 | `cover` |
| 经济版核心调整 | 798–837 | "vs 原版方案" 5 项变化 grid（大交通/门票/住宿/交通/美食） | `designPhilosophy` |
| 行程总览 | 839–895 | 5 日卡（day/theme/spots/门票费）+ 2 图（时长 bar、预算 pie） | `overview` + `charts.days` |
| 门票三档方案 | 897–… | 3 档 tier 卡（name/price/items） | `ticketTiers` |
| 经济型酒店推荐 | 951–… | 酒店卡（含品牌名，迁移时需按全局规则改写为类型描述） | `accommodation` |
| 经济版总预算估算 | 1529–1621 | 3 档 budget-tier 卡（name/total/每人/desc）+ `budget-table`（类目×3 档 + 合计 + 双人）+ 2 图 | `budgetTiers` + `budgetTable` + `charts.budget` |
| 每日餐饮费用明细 | 1623–… | 表（日/早/午/晚/小计） | `foodDetail` |
| 每日市内交通费用 | 1682–… | 表 | `transitDetail` |
| 省钱秘籍 | 1744–… | 列表 | `savingTips` |
| 实用提醒 | 1767–… | 列表 | `reminders` |
| 行李清单 | 1812–… | 列表 | `packing` |
| Chart.js | 1849–1942 | hours bar / budget pie / doughnut / 三档对比 stacked bar | `chartsScript`（构建期生成） |

### 1.2 `src/static/china/beijing/normal.html`（标准版，1480 行）

| 模块 | 内容结构 | 备注 |
|---|---|---|
| 封面 | 5 DAYS / 5 HOTELS 统计 | 与 budget 封面同构 |
| 行程总览 | 5 日卡（day/theme/spots/时长） | 无门票费列 |
| 预算估算 | 2 图（经济版/舒适版 pie）+ 表（类目/明细/经济版/舒适版 双档） | **双档结构**（非三档） |
| 实用提醒 / 附录 | 列表 | |

### 1.3 结论

- **budget.html ≈ route-plan JSON 的手写前身**：其 11 个模块与东京 route-plan（`japan-tokyo-economy.json`）的 12 模块**一一对应**（cover/designPhilosophy/overview/ticketTiers/accommodation/budgetTiers/budgetTable/foodDetail/transitDetail/savingTips/reminders/packing）。→ **吸收路径最顺：budget type 直接复用 route-plan 模板与模块结构**，仅以「分档预算」为叙事重心。
- normal.html 为「双档预算」标准版 → 建议作为 **route-plan type**（北京舒适版）吸收，或同样入 budget type（两档）。

---

## 二、Schema 设计

### 2.1 `budget` type（对齐用户示例 + route-plan 模块，全部字段可选）

```jsonc
{
  "type": "budget",
  "schemaVersion": 1.1,
  "id": "china-beijing-economy",
  "country": "china",
  "city": "beijing",
  "slug": "economy",                 // URL: /china/beijing/budget/economy
  "title": "北京经济版路书｜低预算北京5日游",
  "description": "…",
  "keywords": "…",
  "h1": "北京五日经济版路书",
  "lead": "省钱不省精彩 · 平价也出深度",
  "edition": "economy",              // 经济/标准/舒适
  "days": 5,
  "suitableFor": "预算优先的第一次北京自由行",
  "seasonNote": "9-10月最佳",
  "travelTone": "高性价比 · 全地铁 · 经济连锁",
  "cover": { "tag": "ECONOMY EDITION", "title": ["北京五日", "经济版路书"], "subtitle": "…", "info": [{"num":"5","label":"DAYS"}] },
  "designPhilosophy": { "desc": "为什么这样规划？", "items": [{"title":"门票策略","text":"免费为主，三档可选 ¥42 起"}] },
  "overview": [ { "day": 1, "theme": "中轴皇城", "sub": "…", "spots": ["天安门广场(免费)", "故宫(¥40)", "景山(¥2)", "前门大街(免费)"], "ticket": "门票42元" } ],
  "ticketTiers": [ { "name": "极致省钱版", "price": "¥42", "items": ["故宫 ¥40", "景山公园 ¥2"] } ],
  "accommodation": [ { "tier": "经济", "type": "经济连锁酒店", "range": "¥150-280/晚", "note": "…" } ],   // ⚠️ 禁品牌名 → 类型化描述
  "budgetTiers": [ { "name": "极致省钱版", "total": "¥1,612", "perPerson": "两人约¥1,162/人", "desc": "门票¥42+交通¥90+餐饮¥630+住宿¥850" } ],
  "budgetTable": { "categories": ["门票","市内交通(5天)","餐饮(5天)","住宿(5晚·单人)","合计(单人)","两人同行(每人)"], "tiers": ["极致省钱版","推荐平衡版","完整体验版"], "rows": [["¥42","¥97","¥146"]] },
  "dailySummary": { "title": "每日花费参考", "days": [ {"day":1,"amount":"¥130","note":"故宫+景山为主"} ] },
  "alternatives": [ { "title": "方案B：免费城市探索", "desc": "明城墙遗址/三里屯" } ],
  "foodDetail": { "days": [ {"day":1,"breakfast":"¥8","lunch":"¥25","dinner":"¥30","total":"¥63"} ] },
  "transitDetail": { "days": [ {"day":1,"mode":"地铁","cost":"¥18"} ], "total": "¥90-120" },
  "charts": { "days": ["Day1 中轴皇城",…], "dailyHours": [7,7,7,8,6], "budget": { "labels": ["住宿","餐饮","门票","交通"], "economy": [1100,750,97,100] } },
  "savingTips": ["…"], "reminders": ["…"], "packing": ["…"]
}
```

> 与用户示例（`tiers:[{name,range,items}]`）兼容：`tiers` 可作为 `budgetTiers` 的别名形态（name/range/items），两者取一即可。

### 2.2 `seasonal` type（对齐用户示例）

```jsonc
{
  "type": "seasonal",
  "schemaVersion": 1.1,
  "id": "china-beijing-autumn",
  "country": "china",
  "city": "beijing",
  "slug": "autumn",                  // URL: /china/beijing/seasonal/autumn
  "title": "北京秋季攻略｜金秋北京怎么玩",
  "description": "…",
  "h1": "北京秋季旅行攻略",
  "lead": "秋高气爽，9-10月是北京最佳出游季。",
  "season": "秋季",
  "months": ["9月", "10月"],
  "weather": "15-25℃，干燥少雨，秋高气爽",
  "highlights": ["故宫银杏", "香山红叶", "长城秋色"],       // 可选
  "events": [ { "name": "红叶节", "time": "10月中-11月初", "place": "香山公园", "note": "…" } ],
  "tips": ["早晚温差大，备薄外套", "热门景点提前预约门票"],
  "blocks": [ { "kind": "section", "title": "秋季玩法", "html": "…" } ]   // 可选长文
}
```

---

## 三、Type / URL / 自动集成设计（执行期蓝图，本次不实现）

| 项 | 设计 |
|---|---|
| URL 规则 | `/{country}/{city}/budget/{slug}`（如 `/china/beijing/budget/economy`）；`/{country}/{city}/seasonal/{slug}` |
| `urlFor/linkUrl` | 各 +1 case（`budget` / `seasonal`），与 route-plan 同构 |
| `LEAF_TYPES` | +`budget`、`seasonal`（进面包屑末级） |
| `SECTION_LABELS` | +`budget:'预算方案'`、`seasonal:'季节攻略'` |
| `buildCitySections` groups | +`{type:'budget', title:'预算方案'}`、`{type:'seasonal', title:'季节攻略'}` → **城市 Hub 的 Budget Plans / Seasonal Guides 由空态转真实数据（自动）** |
| `buildIndexSections` | INDEX_PAGES +`/budgets`、`/seasonals` 全局目录页（**新增 URL，sitemap 46→48+，需执行期确认**） |
| 首页自动聚合 | `buildHomeBody` 派生 `budget-plans` 与 `seasonal` 区块（Popular Routes 旁或独立），自动出现 |
| 模板 | budget 复用 `body-route-plan.html`（12 模块已覆盖预算场景，仅 cover/标签按 type 微调）；seasonal 新建 `body-seasonal.html` |
| 数据目录 | `data/budget-plans/*.json`、`data/seasonals/*.json`（loadDir 自动加载，与 route-plans 同机制） |
| sitemap | 实体进入 `pages` 数组 → 自动收录 |

### 迁移与 URL 兼容（需执行期用户确认）

| 项 | 方案 |
|---|---|
| budget.html 吸收 | → `data/budget-plans/china-beijing-economy.json`（11 模块映射，含 4 图表数据） |
| normal.html 吸收 | 建议 → `data/route-plans/china-beijing-normal.json`（route-plan type，双档预算结构） |
| 旧 URL 兼容 | `_redirects` 追加：`/china/beijing/budget /china/beijing/budget/economy 301`；`/china/beijing/normal /china/beijing/route-plan/normal 301`（与既有 beijing 旧 URL 重定向同机制） |
| ⚠️ canonical 变化 | 迁移后 legacy 两页 canonical 由 `/china/beijing/budget` 变为 `/china/beijing/budget/economy`——**这是 type 化的必然结果，需你确认后才执行** |
| 内容红线 | 迁移时遵守全局规则：**禁酒店/餐厅品牌名**（如「如家/汉庭/大董」→ 类型化描述「经济连锁酒店/平价烤鸭店」）、禁单点固定价、用估算区间；图表数据保留 |

---

## 四、约束确认

- ✅ 本阶段（第一阶段）未写任何代码 / 未改任何文件
- ✅ 未动东京 route-plan / 现有 URL / canonical / sitemap
- ✅ budget / seasonal 均为**新增 type**（`urlFor` 加 case 即可，零破坏既有 7 type）
- ⚠️ 执行期将新增 `/budgets`、`/seasonals` 目录页（sitemap 增长）与 legacy 两页 canonical 变更——均标注待确认

## 五、待确认事项

1. **normal.html 吸收目标**：route-plan type（建议）还是 budget type 两档？
2. **legacy canonical 变更**：是否接受 `/china/beijing/budget` → `/china/beijing/budget/economy`（301 保兼容）？
3. **是否新增 `/budgets`、`/seasonals` 全局目录页**（sitemap 会增加 2 条）？
4. **seasonal 首期内容**：是否以北京（秋季）+ 东京（春季/秋季）各 1 篇起步（数据来自现有 best-time 摘要）？
5. **budget 模板**：复用 route-plan 模板（推荐）还是独立 `body-budget.html`？
