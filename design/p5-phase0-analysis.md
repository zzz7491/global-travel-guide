# P5 Phase 0 分析：城市 Hub 深度完善 + 首页内容聚合优化
## 只读复核（未修改任何文件）

---

## 1. 实体数量（数据模型实测）

| 类型 | 数量 | 说明 |
|---|---|---|
| countries | 2 | 中国 / 日本 |
| cities | 2 | 北京 / 东京 |
| attractions | 12 | 北京 4 + 东京 8 |
| routes | 5 | 北京 3 + 东京 2 |
| guides | 8 | 北京 4 + 东京 4 |
| best-times | 2 | 北京 / 东京 |
| route-plans | 2 | 东京 economy / 北京 comfort |
| budgets | 1 | 北京 economy |
| seasonals | 1 | 北京 autumn |
| **页面合计** | **47** | sitemap 47 条 |

## 2. 首页体系（buildHomeBody / body-home.html）现状

| 区块 | 数据驱动 | 固定结构 | 增强点（P5） |
|---|---|---|---|
| Hero / 统计 | 统计为实体派生 | Hero 文案常量 | 保持 |
| Featured Destinations | ✅ 国家/城市卡（图+alt） | 卡内 desc=lead | **卡内显示 tagline**（城市 tagline 已有数据） |
| Popular Routes | ✅ featured=首个 route-plan + routes 网格 | — | **网格加入 route-plan（非 featured）与 budget**，卡显示 城市/天数/类型 badge |
| Travel Planning Guides | ✅ 指南卡 + category badge | — | 保持 |
| Seasonal Experiences | ⚠️ 当前 best-time+seasonal 混用 | — | **只显示真实 seasonal**（城市/季节/月份/图片） |
| Traveler Stories | — | 空态 | 保持 |

## 3. 城市 Hub（buildCityBody / buildCitySections）现状

| 区块 | 真实数据 | 空态 | 增强点（P5） |
|---|---|---|---|
| City Hero / About | ✅ | — | 保持 |
| Best Time | ✅（best-time 实体） | — | 保持 |
| Featured Routes | ✅ featured=route-plan + routes | — | **优先级 route-plan→budget** |
| Budget Plans | ✅（P2 已切真实） | 无数据时 | **富卡片：title/days/budget range** |
| Seasonal Guides | ✅（P4 样例） | 无数据时 | **富卡片：season/months/image** |
| Free Experiences | — | 空态 | 保持（无 type） |
| Traveler Content | — | 空态 | 保持（P6 UGC） |
| Related Cities | ✅ 有数据才显示 | 无数据隐藏 | **确认：北京/东京无 related → 已隐藏** |

## 4. 其他

- **卡片系统**：`.card-img` 已 16:9 + lazy + alt；`.dest-card/.route-card` 已有 hover/radius tokens；缺 `.budget-card` 统一变体。
- **SEO**：首页 ItemList JSON-LD 缺失（待加）；route-plan/budget 无 Article/Trip schema（待加）；城市 TouristDestination 已有；seasonal Article 已有。
- **移动端**：responsive.css 单列 + overflow-x:hidden 已就位；新卡片沿用即可。

> 本文件为只读产物，未修改任何文件。
