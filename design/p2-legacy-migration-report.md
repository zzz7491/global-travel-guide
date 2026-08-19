# P2 报告：Legacy 路书收口 + URL 兼容迁移
## Global Travel Guide v2.0 · 北京 legacy 静态路书纳入数据驱动体系

> 阶段：**P2 执行完成并通过验证**
> 约束遵守：✅ 未改既有 URL 结构（仅按批准新增 legacy 301）；✅ 未动东京 route-plan / P0 / P0.5 / Phase A / Phase B / P1 成果；✅ 未 commit / push / deploy；✅ 全程 safe-delete 绕行构建。
> 前置：P1（budget type + `data/budgets/china-beijing-economy.json`）已完成。

---

## 1. 修改文件列表

| 文件 | 改动 |
|---|---|
| `data/route-plans/china-beijing-comfort.json` | **新增**：normal.html 忠实迁移（route-plan type，slug:comfort，15 模块） |
| `src/static/china/beijing/budget.html` | **删除**（内容已迁入 budget JSON） |
| `src/static/china/beijing/normal.html` | **删除**（内容已迁入 comfort route-plan JSON） |
| `scripts/build.js` | `ITINERARIES` 清空为 `[]`（移除两条静态注册） |
| `src/static/_redirects` | 更新/新增 6 条 legacy 301 |
| `src/lib/content.js` | `buildCitySections` groups +`budget`/`seasonal`；`buildCityBody` Budget/Seasonal 空态→真实数据切换（Hub 集成） |
| `public/china/beijing/{budget,normal}.html` | **孤儿文件清理**（上一轮构建残留，已删除，旧 URL 由 301 接管） |

## 2. URL 迁移表

| 旧 URL | 新 URL | 类型 |
|---|---|---|
| `/china/beijing/budget` | `/china/beijing/budget/economy` | budget type |
| `/china/beijing/budget.html` | `/china/beijing/budget/economy` | budget type |
| `/budget.html` | `/china/beijing/budget/economy` | budget type（根级旧链） |
| `/china/beijing/normal` | `/china/beijing/route-plan/comfort` | route-plan type |
| `/china/beijing/normal.html` | `/china/beijing/route-plan/comfort` | route-plan type |
| `/normal.html` | `/china/beijing/route-plan/comfort` | route-plan type（根级旧链） |

## 3. Redirect 表（`_redirects`，全部 301）

```
/normal.html                /china/beijing/route-plan/comfort 301
/budget.html                /china/beijing/budget/economy 301
/china/beijing/normal       /china/beijing/route-plan/comfort 301
/china/beijing/normal.html  /china/beijing/route-plan/comfort 301
/china/beijing/budget       /china/beijing/budget/economy 301
/china/beijing/budget.html  /china/beijing/budget/economy 301
```
- 无 redirect loop（旧链单跳直达新地址）；新页 canonical 均指向自身新 URL。

## 4. SEO 保留证明

| 检查项 | 结果 |
|---|---|
| budget 新页 | title「北京经济版路书｜低预算北京5日游」、canonical `…/budget/economy`、JSON-LD 完整、关键数字 ¥2,047 等渲染 ✅ |
| comfort 新页 | title「北京舒适版路书｜金秋北京5日定制游」、canonical `…/route-plan/comfort`、JSON-LD 完整、≈¥11,788 渲染 ✅ |
| sitemap | **46 条**；**旧 URL（beijing/budget、beijing/normal 裸路径）= 0**；新 URL（budget/economy、route-plan/comfort）均在 ✅ |
| 旧 URL 收录 | 文件已删、301 接管 → 无重复内容、无旧 canonical 残留 ✅ |

## 5. Build 结果

- `node scripts/build.js`（临时 OUT_DIR 构建 + 写回 `public` + 还原）→ **Built 46 pages + sitemap.xml**。
- **页面数量说明**：P1 后为 47；P2 删除 2 个 legacy 静态注册、新增 1 个 comfort route-plan 实体 → **47 − 2 + 1 = 46**。任务描述中「保持 47 页」为算术误差（47−2+1=46），实际交付 46 页，无遗漏页。
- 东京 route-plan：canonical / 内容 / 图表未变；budget 页数字完好。
- 北京城市 Hub：**Featured Routes → Budget Plans → Seasonal Guides** 顺序就位；Budget Plans 显示北京经济版卡、Featured Routes 显示北京舒适版卡（`href` 均为新路径），无重复卡、无 Budget 空态（Seasonal 无数据仍为优雅空态，待 P4）。
- grep：`[object Object]` = 0；邮箱/运营主体 = 0；`build.js` 环境残留 = 0；旧静态孤儿文件已清除。

## 6. 未修改内容确认

- ✅ 东京 route-plan 内容与渲染 —— 未动
- ✅ 既有 type / URL 结构 / canonical 逻辑 / sitemap 生成逻辑 —— 未动（仅按批准新增 legacy 301）
- ✅ P0 / P0.5 / Phase A / Phase B / P1 成果 —— 未受影响
- ✅ 北京 legacy 路书内容：budget（P1）与 normal（本 P2）均为**逐模块忠实迁移**，核心数字/每日安排/图表数据原样（如 budget ¥1,612/2,047/2,531、comfort ≈¥7,348/11,788、时长 [8,7,8,9,6]）
- ✅ 未 commit / push / deploy

## 7. 遗留风险与后续

| 项 | 说明 |
|---|---|
| 页面数 47→46 | 已如实上报（算术核对 47−2+1=46）；如需保持 47 需新增内容，不建议为凑数加页 |
| Seasonal Guides 空态 | seasonal type 未注册（P4 骨架后激活）；当前城市 Hub 显示优雅空态 |
| 品牌名 | budget/comfort 内容含餐厅/酒店品牌名（按「保留内容信息」迁移），是否类型化待确认 |
| 首页聚合 | buildHomeBody 尚未聚合 budget（P6 处理） |
| `/budgets`、`/seasonals` 全局目录页 | 未新增（待确认） |

> 结论：P2 完成——北京 legacy 路书正式纳入数据驱动体系（budget → `/china/beijing/budget/economy`，normal → `/china/beijing/route-plan/comfort`），旧 URL 全量 301 保权，城市 Hub 自动展示新卡，46 页 build 通过、SEO 零回退。**按任务要求暂停，不进入 P3。**
