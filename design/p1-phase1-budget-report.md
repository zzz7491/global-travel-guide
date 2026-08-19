# P1 阶段报告：Budget Type 注册与数据迁移准备
## Global Travel Guide v2.0 · Budget / Seasonal Type 系统化升级（P1 of P1–P7）

> 阶段：**P1（Budget Type 注册 + 数据迁移准备）已完成并通过 build 验证**
> 约束遵守：✅ 未改 URL / canonical / sitemap 逻辑 / type（既有 7 type 未动）；✅ 未动东京 route-plan / P0 / P0.5 / Phase A / Phase B；✅ 未 commit / push / deploy；✅ 未进入 P2（legacy 删除 / redirects 未动）。

---

## 1. 本阶段完成内容

### 1.1 Budget Type 注册（代码层）
| 位置 | 改动 |
|---|---|
| `src/lib/content.js` `urlFor()` | +`case 'budget': /{country}/{city}/budget/{slug}.html` |
| `src/lib/content.js` `linkUrl()` | +`case 'budget': /{country}/{city}/budget/{slug}`（干净 URL） |
| `src/lib/content.js` `LEAF_TYPES` | +`budget`（进面包屑末级） |
| `scripts/build.js` `ENTITIES` | +`...loadDir(data/budgets)` |
| `scripts/build.js` 渲染分支 | `e.type === 'route-plan' \|\| e.type === 'budget'` → **复用 `buildRoutePlanBody` + `body-route-plan.html`**（零新模板、零复制 HTML） |

> 设计决策：`SECTION_LABELS` **未加** `budget`（避免生成指向不存在 `/budgets/` 目录页的死链面包屑；是否新增全局 `/budgets` 目录页留待确认）。

### 1.2 Budget 数据迁移（`data/budgets/china-beijing-economy.json`，**新增**）
- 由 legacy `src/static/china/beijing/budget.html`（1946 行）**逐模块忠实迁移**，type:`budget`、slug:`economy` → URL `/china/beijing/budget/economy`。
- 迁移模块（15 个，与 route-plan 模板一一对应）：cover / designPhilosophy（5 项核心调整）/ overview（5 日卡）/ ticketTiers（三档）/ accommodation（3 档酒店，5 晚总价并入价格列）/ days（5 日时间轴共 39 个 timeline item，含 time/category/badges/info/photoSpot/bestTime/reservation/tips）/ dailySummary（5 行）/ budgetTiers（三档 ¥1,612 / ¥2,047 / ¥2,531）/ budgetTable（4 类目×3 档 + 合计）/ foodDetail（5 日 + 合计 ¥630-865）/ transitDetail（5 日 + 合计 ¥90-120）/ alternatives（2 组 A/B）/ charts（时长 bar + 预算 pie，数据原样）/ savingTips（8 条）/ reminders（3 组）/ packing（12 项）。
- **核心数字原样保留**：¥1,612 / ¥2,047 / ¥2,531、三档门票 ¥42/97/146、餐饮 ¥630-865、交通 ¥90-120、图表 [7,7,7,8,6] 与 [1100,750,97,100] 全部核对存在。
- 内容红线：价格均为估算区间；酒店/餐厅品牌名**按「保留内容信息」要求原样保留**（四季民福/便宜坊/姚记/汉庭等），是否按品牌化规则改写留待确认（见遗留事项）。

## 2. Build 验证结果

| 检查项 | 结果 |
|---|---|
| build | ✅ **Built 47 pages**（46 + 1 budget；sitemap 47 条，含 `/china/beijing/budget/economy`） |
| budget 页面 | ✅ `/china/beijing/budget/economy` 正常渲染，15 个模块齐全、canonical 正确 |
| 关键数字 | ✅ ¥1,612 / ¥2,047 / ¥2,531 / ¥630-865 / ¥90-120 均渲染 |
| 图表 | ✅ `new Chart` ×2（构建期 chartsScript 自动生成） |
| 东京 route-plan | ✅ canonical / 内容未变 |
| 旧静态 budget | ✅ 仍在（`/china/beijing/budget`），**P2 删除 + 301** |
| `[object Object]` | ✅ 全站 0（修复：overview.spots / ticketTiers.items / reminders.items 按既有约定用**字符串数组**，由 buildRoutePlanBody 自动包成 `{name}/{text}`） |
| 邮箱 / 运营主体 | ✅ 全站 0 |
| `build.js` 环境残留 | ✅ 0（临时 OUT_DIR 已还原） |

## 3. 未修改内容确认（P1 范围）

- ✅ 既有 7 个 type / URL / canonical / sitemap 逻辑 / 数据模型字段——零改动
- ✅ 东京 route-plan 内容与渲染——未动
- ✅ P0 / P0.5 / Phase A / Phase B 成果——未受影响
- ✅ 北京 legacy `budget.html` / `normal.html` 静态文件——**未删除**（P2 处理）
- ✅ `_redirects`——**未改**（P2 处理）
- ✅ `buildCitySections` / `buildCityBody` / `buildHomeBody`——**未改**（P5 / P6 处理）
- ✅ seasonal type——**未注册**（P4 处理）
- ✅ 未 commit / push / deploy

## 4. 遗留事项（进入 P2–P7）

1. **P2**：删除 `src/static/china/beijing/budget.html` 与 `build.js ITINERARIES` 经济版条目；`_redirects` 追加 301（`/china/beijing/budget`、`/budget.html` → `/china/beijing/budget/economy`）。
2. **P3**：normal.html → `data/route-plans/china-beijing-comfort.json`（route-plan type），迁移后删除静态文件 + ITINERARIES + 301。
3. **P4**：seasonal type 骨架（urlFor/linkUrl/LEAF_TYPES + `data/seasonals` + `body-seasonal.html`）。
4. **P5**：`buildCitySections` groups + budget/seasonal；`buildCityBody` 空态→真实数据切换（城市 Hub 的 Budget Plans / Seasonal Guides）。
5. **P6**：`buildHomeBody` + 首页 Budget Plans / Seasonal Experiences 聚合（无数据不显示）。
6. **待确认**：① legacy canonical 变更已由「明确批准的 legacy redirect」授权（301 保兼容）；② 是否新增 `/budgets`、`/seasonals` 全局目录页（sitemap 再 +2）；③ 品牌名是否按「禁品牌名」规则类型化（当前按「保留内容信息」原样保留）。

> 结论：P1 完成——budget type 注册成功，北京经济版路书 15 模块完整数据化迁移至 `/china/beijing/budget/economy`（复用 route-plan 模板，零新模板零复制），47 页 build 通过、全站无对象残留、东京 route-plan 零影响。**等待确认后进入 P2。**
