# Global Travel Guide v2.0 · City Hub 模块数据来源映射（city-module-map）

> P9 Phase 0 只读分析产出（`src/lib/content.js` buildCitySections / buildCityBody 实测）
> 说明：全部模块**数据驱动**——新增城市只要补对应数据文件，Hub 自动展示；缺数据自动隐藏/空态。**零模板改动**。

---

## 1. 模块 → 数据来源总表

| # | Hub 模块（body-city.html 渲染） | 数据来源 | 字段/实体 | 缺失时行为 |
|---|---|---|---|---|
| 1 | **City Hero** | `city` 实体 | `name` / `nameEn` / `tagline` / `heroImage` | 无 nameEn 隐藏英文行；无 heroImage 用全局 SITE.heroImage |
| 2 | **About** | `city` 实体 | `description`（优先）→ `lead` | 两者皆无 → 整块隐藏 |
| 3 | **About · Highlights chips** | `city` 实体 | `highlights[]`（字符串数组） | 空数组 → chips 隐藏 |
| 4 | **About · Facts bar** | `city` 实体 | `facts[{label,value}]` **优先** → 顶层 `continent/language/currency/timezone` 回退 | 皆无 → 整块隐藏 |
| 5 | **Best Time** | `best-time` 实体 + `city` 实体 | `data/best-times/{id}.json`（type:best-time，country/city 匹配）；`city.bestTime.description` 作 summary | 无 best-time 实体 → 区块消失 |
| 6 | **Featured Routes** | `route` + `route-plan` + `budget` 实体 | 派生：`路线规划` + `完整路书`；大卡=`featuredSort(cityRPs)[0]`（route-plan>budget） | 该城无任何路线 → 区块消失 |
| 7 | **Budget Plans** | `budget` 实体 | `data/budgets/{id}.json`（type:budget，country/city 匹配）；展示 title/days/budgetTiers[0].estimate.range | 无 → **空态**（Budget Plans Coming Soon） |
| 8 | **Seasonal Guides** | `seasonal` 实体 | `data/seasonals/{id}.json`（type:seasonal，country/city 匹配）；展示 season/months/heroImage | 无 → **空态** |
| 9 | **Top Attractions** | `attraction` 实体 | 派生 `景点攻略`（country/city 匹配的 attractions） | 无 → 区块消失 |
| 10 | **Planning Guides** | `guide` 实体 | 派生 `实用攻略`（country/city 匹配的 guides） | 无 → 区块消失 |
| 11 | **Traveler Stories** | `story` 实体 | `data/stories/{id}.json`（type:story，country/city 匹配） | 无 → **空态** |
| 12 | **Related Cities** | `city` 实体 | `relatedCities[]` 显式（id 引用）**优先** → 同国其他 city 自动 | 同国无其他城 → 区块隐藏 |
| 13 | **Free Experiences** | （预留） | 无真实数据源 | 恒 **空态**（待 Free 类型/字段） |

## 2. 数据派生链路（buildCitySections）

```
kids = entities.filter(country==city.country && city==city.city && type!=='city')
groups = [attraction→景点攻略, route→路线规划, guide→实用攻略,
          best-time→最佳旅行时间, budget→预算方案, seasonal→季节攻略]
→ 每组 items = kids.filter(type==group.type).map({title:h1||name, desc:lead, url:linkUrl})
→ 有 items 才 push；空组自动消失
```

- `buildCityBody` 在上述派生基础上叠加富化区块（Featured 大卡 / Budget 富卡 / Seasonal 富卡 / Story 卡 / Related）。
- 结论：**新城市 Hub = 城市 JSON + 各类子实体 JSON 自动组装**，100 城扩展零代码。

## 3. 关键约束

- **缺数据 ≠ 空页面**：无实体则区块消失或优雅空态（Budget/Seasonal/Stories 三处为空态，其余隐藏），不会产生空白页。
- **匹配规则**：所有子实体必须携带 `country` + `city` slug 与城市一致（如 `china-beijing-xxx` 系列）；新增城市时子实体文件放对应目录并写对 slug 即可。
- **facts 双轨**：`facts[]` 存在优先展示；顶层 `continent/language/currency/timezone` 为回退（北京/东京均已用 facts[]，顶层为扩展兼容）。

---

*P9 Phase 0 产出（只读），未修改任何文件。*
