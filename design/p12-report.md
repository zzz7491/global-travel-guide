# P12 执行报告 — route-plan 预算表货币显示修复

- 日期：2026-08-19
- 范围：A1 P0 缺陷修复（B1 搜索框按指示暂不处理）
- 状态：**修复完成 + 94 页构建回归通过**，未 commit / push / deploy

---

## P1 · 货币前缀修复 ✅

**改动文件（唯一代码改动）**：`src/templates/body-route-plan.html`

| 项 | 改动前 | 改动后 |
|---|---|---|
| 预算分解表 rows（3 处，原 L314-316） | `约¥{{economy.low}}`… | `约{{budgetTiers.0.estimate.currency}}{{economy.low}}`… |
| 预算分解表 totals 行（3 处，原 L321-323） | `约¥{{budgetTable.totals...}}`… | `约{{budgetTiers.0.estimate.currency}}{{...}}`… |

**实现说明**：
- 货币改为数据驱动：引用 `budgetTiers[0].estimate.currency`（每城 route-plan 数据自带货币字段）
- 复用自研模板引擎能力（each 内 scope 合并顶层 data + 数组点路径 `budgetTiers.0`），**零数据文件改动、零 build.js 改动**
- 未改动 JSON-LD、未改动页面结构、未改动东京渲染

## P2 · 四城货币回归 ✅

预算分解表区块（rows + totals）实测：

| 城市 | 货币前缀 | 验证 |
|---|---|---|
| 东京 | `约¥`（1000–2500 / 2380–5400 等） | ✅ 保持 |
| 巴黎 | `约€`（160–320 / 295–595 / 1080–1890 等） | ✅ 正确 |
| 伦敦 | `约£`（160–320 / 265–565 / 1040–1830 等） | ✅ 正确 |
| 纽约 | `约$`（240–440 / 355–695 / 1340–2290 等） | ✅ 正确 |

> 注：初检用 `sort -u` 误将 cover/dailySummary 值混入，已改用「预算分解表区块范围提取」精确复核——结果全部正确。

## P3 · 全站安全检查 ✅

| 检查项 | 结果 |
|---|---|
| 「约¥」残留 | 仅存于 ¥ 城市（东京 economy / 北京 comfort / 北京 budget）✅ |
| 巴黎/伦敦/纽约出现「约¥」 | **0** ✅ |
| 新增硬编码颜色（diff 检查） | **0** ✅ |
| `[object Object]` | **0** ✅ |
| 94 页完整性 | sitemap 94 / HTML 94 ✅ |

## P4 · Build 验证 ✅

- 临时 OUT_DIR 构建：**Built 94 pages + sitemap.xml**
- pages = 94、sitemap = 94、build.js **零改动**（git diff 0 行）
- 产物已写回 `public/`（4 个 route-plan 页更新；东京 economy 输出与旧版一致故无 diff）

## 改动清单

```
 M src/templates/body-route-plan.html      ← 唯一代码改动（6 处货币数据驱动）
 M public/china/beijing/route-plan/comfort.html   ← 构建产物（货币输出不变）
 M public/france/paris/route-plan/economy.html    ← 构建产物（¥→€）
 M public/uk/london/route-plan/economy.html       ← 构建产物（¥→£）
 M public/us/new-york/route-plan/economy.html     ← 构建产物（¥→$）
```

## 纪律确认

- ✅ 未处理搜索框（B1 按指示暂缓）
- ✅ 未新增功能、未修改任何数据文件
- ✅ 未 commit / push / deploy

## 遗留

- [ ] B1 首页搜索框（待决策：JS 过滤 / 移除改 CTA / 保持）
- [ ] P12 Phase 0 C 类可选优化（listing 页头 / Free Experiences 空态 / fixed 背景 / stats 口径）

**按要求暂停，等待 Release 指令。**
