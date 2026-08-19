# P5 报告：城市 Hub 深度完善 + 首页内容聚合优化
## Global Travel Guide v2.0 · 首页/城市页内容入口升级

> 阶段：**P5 执行完成并通过验证**
> 约束遵守：✅ 未动既有 route-plan / budget / seasonal 页面；✅ 未新增虚假内容（全部来自真实 JSON）；✅ 未改 URL / canonical / sitemap 逻辑；✅ 未 commit / push / deploy；✅ safe-delete 绕行构建；✅ 未进入 P6 UGC / 用户投稿 / 登录 / 评论 / 社区。
> 前置：`design/p5-phase0-analysis.md`（Phase 0 只读复核）。

---

## 1. 修改文件列表

| 文件 | 改动 |
|---|---|
| `src/lib/content.js` `buildHomeBody` | 目的地卡带 **tagline**；Popular Routes 网格 = routes + 非 featured route-plan + **budget**（每卡 城市名 / 类型 badge / 天数）；Featured 优先级 route-plan→budget；Seasonal Experiences **只显示真实 seasonal**（城市/季节/月份/图片）；统计更新 |
| `src/lib/content.js` `buildCityBody` | Featured 大卡优先级 route-plan→budget；Budget Plans **富卡片**（title / 天数 / 预算区间 / 图 / budget-card 类）；Seasonal Guides **富卡片**（season / months / image / season-card 类） |
| `src/templates/body-home.html` | dest 卡显示 tagline；route 卡显示 badge + 城市名；season 卡显示城市徽标 + 季节/月份 meta |
| `src/templates/body-city.html` | 区块卡支持图片（card-img, lazy/alt/16:9）+ 按类渲染（cardClass） |
| `src/design-system/components.css` | 新增 `.budget-card`（tint-gold）+ 统一卡片圆角 `--radius-lg` + hover |
| `scripts/build.js` | 首页 JSON-LD +**ItemList**（Featured Destinations）；route-plan/budget +**Article** schema |
| `data/budgets/china-beijing-economy.json` / `data/route-plans/china-beijing-comfort.json` | 清理重复 `days` 键（数值 5 与时间轴数组并存 → 保留数组） |

## 2. 首页变化

| 区块 | 变化 |
|---|---|
| Featured Destinations | 卡内显示城市/国家 **tagline**（如「未来都市与传统文化交织的日本首都」）+ 图片 |
| Popular Routes | 旗舰大卡（北京 comfort · Route Plan · 5 Days）+ 网格 8 卡：5 路线（Route badge）+ 东京 economy 路书 + 北京 budget（**Budget · 5 Days · economy**），每卡带城市名 |
| Seasonal Experiences | **只显示真实 seasonal**（北京秋季，城市徽标 + 9月/10月 + 图）；best-time 不再混入首页季节区 |
| Planning Guides | 保持 + category 徽标 |
| 统计 | Curated Routes = 路线+路书+budget 实计（8） |

## 3. 城市 Hub 变化

| 区块 | 变化 |
|---|---|
| Featured Routes | 旗舰大卡优先级 **route-plan → budget**（北京=comfort，东京=economy） |
| Budget Plans | 富卡：标题 / **5天 · ¥1,612 起** / 城市图 / `budget-card` 样式 |
| Seasonal Guides | 富卡：标题 / **秋季 · 9月/10月** / 图 / `season-card` 样式 |
| Related Cities | 无相关城市时**隐藏**（北京/东京均不显示空模块）✅ |
| Free / Traveler | 保持优雅空态（无数据不造假） |

## 4. Design System 变化（components.css，仅 tokens）

- `.budget-card`（tint-gold 底 + gold-ink 标题）+ hover 统一；`.guide-card/.season-card/.city-card/.budget-card` 圆角统一 `--radius-lg`；卡片图沿用 `.card-img`（16:9 / lazy / alt）。

## 5. SEO 验证

| 项 | 结果 |
|---|---|
| 首页 ItemList JSON-LD | ✅ `{"@type":"ItemList","name":"Featured Destinations"}`（2 国 2 城 ListItem） |
| route-plan / budget Article | ✅ 东京 economy + 北京 budget + 北京 comfort 均含 Article schema |
| canonical | ✅ 既有页面全部不变（economy/budget/comfort/seasonal 抽查） |
| URL / sitemap | ✅ 不变，47 条 |

## 6. Build 验证

- `node scripts/build.js` → **Built 47 pages**（46 + 1 seasonal；本阶段为渲染增强，页面数不变）。
- 修复 1 处数据 bug：budget/comfort JSON 重复 `days` 键（`"days":5` 与时间轴数组并存，JSON.parse 取数组）→ 删除数值键；`buildCityBody` 天数用 `Array.isArray ? length : number` 计算。
- grep：`[object Object]` = **0**；邮箱/运营主体 = 0；导航 `.html` 内链 = 0；`build.js` 环境残留 = 0。
- 移动端（375px）：hero 56vh 限高、卡片单列、`overflow-x:hidden` 生效，无横向溢出风险。

## 7. 未修改内容确认

- ✅ 东京 route-plan / 北京 budget / 北京 comfort / 北京 seasonal —— 内容与 canonical 未动
- ✅ URL / canonical / sitemap 逻辑 / type —— 未动
- ✅ P0 / P0.5 / Phase A / Phase B / P1 / P2 / P4 成果 —— 未受影响
- ✅ 无虚假内容（所有卡片均来自真实 JSON；best-time 仅从首页季节区移除，城市 Hub 与 sitemap 保留）
- ✅ 未 commit / push / deploy

## 8. 遗留事项

1. **Featured 大卡选取**：当前取 `routePlans[0]`（loadDir 字母序 → 北京 comfort）。如需固定「东京 economy」为旗舰，可加 `featured:true` 标记或排序规则（待确认）。
2. **P6 UGC**：Traveler Stories / Traveler Content 空态待 UGC 阶段激活。
3. **全局目录页** `/budgets`、`/seasonals` 未新增（待确认）。

> 结论：P5 完成——首页成为真实内容聚合入口（目的地 tagline / 路线含路书与预算 / 季节仅真实数据），城市 Hub 富卡片化（预算区间、季节月份、Related 空则隐藏），JSON-LD 增强（ItemList / Article），47 页 build 通过、零回归。**按要求暂停，等待确认。**
