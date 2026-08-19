# Global Travel Guide v2.0 · P9 Phase 0 分析

## 100 城扩展基础设施建设（只读分析 + 设计产出）

> 阶段：**P9 Phase 0（只读分析，未修改任何代码 / JSON / 模板 / build / sitemap）**
> 产出：`city-module-map.md`、`city-content-standard-v1.md`、`city-expansion-roadmap.md`（本文档为汇总）
> 状态：等待人工确认后进入 P9 执行

---

## 1. 当前 schema 状态（实测）

### 1.1 城市模型（`data/cities/` 2 城）

**东京**：`id/type/country/city/name/nameEn/title/description/keywords/h1/lead/continent/language/currency/timezone/related/tagline/heroImage/bestTime/facts/highlights/relatedCities`（22 字段，**全量齐备**）
**北京**：同上 minus 顶层四件套（用 `facts[]` 表达，21 字段，降级兼容）

**已覆盖**（Phase B/P8 已落地）：`name/nameEn/country/tagline/heroImage/facts/highlights/bestTime/relatedCities` —— 与需求清单完全一致 ✅

### 1.2 国家模型（`data/countries/` 2 国）

| 字段 | china | japan |
|---|---|---|
| `continent/language/currency/timezone` | ❌ 缺失 | ✅ 齐备 |
| `visa` / `transport` | ❌ | ❌ |
| `heroImage` | ✅ | ✅ |

**结论**：国家层支持顶层四件套（日本为样板），但**中国缺失、visa/transport 未建模**——按需求「如不支持，只提出 schema，不立即修改」→ 已在 `city-expansion-roadmap.md` 第 2 节提出国家 JSON 建议 schema（含可选 `visa`/`transport`）。

### 1.3 Hub 模块数据来源

完整映射见 **`design/city-module-map.md`**（12 模块逐条：来源字段/实体 + 缺失行为）。核心结论：
- **全部数据驱动**：新增城市 = 城市 JSON + 子实体 JSON 自动组装，**零代码**；
- 缺数据行为：无实体→区块消失；Budget/Seasonal/Stories 三处→优雅空态；
- 匹配规则：子实体必须带 `country`+`city` slug 与城市一致。

---

## 2. 100 城扩展风险

| # | 风险 | 等级 | 缓解 |
|---|---|---|---|
| 1 | 国家模型缺口：中国缺顶层四件套；新国家需随城创建 | 中 | 路线图第 2 节国家先行；schema 模板化 |
| 2 | `facts[]` 手工维护重复劳动 | 中 | 顶层四件套 + facts 回退已实现；新城建议顶层字段 + 自动派生 facts |
| 3 | `related`/`relatedCities` 引用易错 | 低 | 缺省自动同国；无效引用静默过滤 |
| 4 | 首页卡片 100 城溢出 | 中 | P8 已建 `featuredSort`；首页仅展示 featured 精选，全量走 `/cities` 目录 |
| 5 | 图片 200–300 对象管理 | 中 | image-system-v2 三层演进（L1 现状 → L2 本地 → L3 R2） |
| 6 | 内容准确性（时区/货币/语言） | 高 | 内容生产规范 + 人工校验清单（S 级城重点） |
| 7 | 空页面风险 | 低 | 缺数据自动隐藏/空态机制已内建；build 后 grep 验收 |

---

## 3. 缺失字段（设计建议，不立即修改）

### 3.1 城市级
| 字段 | 状态 | 建议 |
|---|---|---|
| `gallery[]` | ❌ 未建模 | **新增**（见第 5 节图片体系） |
| `population/airport/transport/neighborhoods/nearbyCities` | ❌ 未建模 | P8 已文档化（city-schema-v2），本期可选落地 |
| 顶层 `continent/language/currency/timezone` | 北京缺 | 北京补齐（与 facts 同值）——随数据生产，非代码 |

### 3.2 国家级
| 字段 | 状态 | 建议 |
|---|---|---|
| `continent/language/currency/timezone` | 中国缺 | 补齐；新国家随城创建时必带 |
| `visa` / `transport` | ❌ | schema 预留（可选，内容生产时填） |

---

## 4. 推荐执行路线（P9 执行候选）

| # | 任务 | 改动 | 优先级 |
|---|---|---|---|
| 1 | 国家模型补齐：china +visa/transport 顶层字段、新国家模板 | 数据（只加字段） | 高（批次 1 前置） |
| 2 | city `gallery[]` 字段 + body-city Gallery 区块（可选展示） | 数据可选 + 模板小改 | 中 |
| 3 | 北京顶层四件套补齐（对齐东京） | 数据（只加字段） | 中 |
| 4 | 批次 1：巴黎/伦敦/纽约 + 3 国家 | 全数据生产 | 高（按路线图） |
| 5 | 生产模板/校验脚本（city JSON 模板 + 字段校验） | 工具（scripts/） | 中 |
| 6 | 首页 Featured 精选子集规则固化（100 城防溢出） | 代码小改 | 低（P8 已可用） |

> 说明：P9 执行阶段**默认只做 1/2/3 + 生产工具**（基建），批次 1 城市内容生产可并入或单独一批——待确认范围。

---

## 5. 图片体系规划（gallery）

基于 P8 `image-system-v2.md`，城市级图片字段设计（**不迁移图片**）：

### 5.1 字段设计
```jsonc
"heroImage": "japan/tokyo/hero",     // 1600×900（hero 大图，L1 现为完整 URL）
"thumbnail": "japan/tokyo/thumb",    // 400×225（卡片/列表小图，可选）
"gallery": [                         // 图集（未来 Gallery 区块，可选）
  { "src": "japan/tokyo/gallery-1", "alt": "东京塔夜景", "credit": "Unsplash" },
  { "src": "japan/tokyo/gallery-2", "alt": "浅草寺", "credit": "Unsplash" }
]
```
- `gallery[]` 元素为**对象**（含 src/alt/credit），与单字段 `heroImage`/`thumbnail` 字符串区分；
- alt 模板：「{城市} {主题}」，credit 记录来源（合规红线）；
- L1（现状）：`src` 为完整 Unsplash URL；L2/L3：`src` 为相对 slug，由 `imageBaseUrl` 拼接（`heroImageUrl()` 已有能力）。

### 5.2 命名规范（L2 本地目录）
```
src/assets/img/{country}/{city}/hero.jpg        # 1600×900
src/assets/img/{country}/{city}/thumb.jpg       # 400×225
src/assets/img/{country}/{city}/gallery-1.jpg   # 800×450
```

### 5.3 展示规划（未来，本期不做）
- Hub 新增「Gallery」区块：横向滚动图集（`<img>` 全 alt+lazy+width/height+aspect-ratio 16:9）；
- `gallery` 缺省 → 区块隐藏；`thumbnail` 缺省 → 卡片用 `heroImage` 兜底。

---

## 6. 汇总

- **当前 schema 状态**：城市模型已满足 100 城基础（全字段 optional + 自动降级）；国家模型需补齐顶层四件套（中国）并预留 visa/transport。
- **100 城扩展风险**：7 项，中低为主（内容准确性为最高关注）。
- **缺失字段**：city `gallery[]/thumbnail`、country 顶层四件套 + visa/transport（均设计建议，未改文件）。
- **推荐执行路线**：国家补齐 → gallery 字段+区块 → 北京对齐 → 批次 1 城市（巴黎/伦敦/纽约）→ 生产工具。

**本阶段零改动**：代码 / JSON / 模板 / build / sitemap 均未修改，未 commit/push/deploy。等待确认后进入 P9 执行。

---

*P9 Phase 0 完成。产出文档：city-module-map.md · city-content-standard-v1.md · city-expansion-roadmap.md · p9-phase0-analysis.md*
