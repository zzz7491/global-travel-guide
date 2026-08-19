# P13 Phase 0 分析 — 批次 1 城市生产确认

- 日期：2026-08-19
- 批次：京都 / 上海 / 首尔
- 性质：只读确认（未创建数据 / 未改模板 / 未 build）

---

## 1. 项目基线

| 项 | 值 |
|---|---|
| HEAD | `de174b5`（P12 currency fix） |
| Tags | p12-production-optimization-20260819 → de174b5 |
| 线上页数 | **94** |
| 国家 | 5（china/japan/france/uk/us） |
| 城市 | 5（东京/北京/巴黎/伦敦/纽约） |

## 2. Schema 确认

### Country schema（japan/china 已含全部字段）

```
id, type, country, name, nameEn, title, description, keywords,
h1, lead, code, continent, language, currency, timezone, visa, transport, heroImage, featured
```

> japan/china **字段完整无需修改**；仅需新增 `south-korea.json`（按同 schema）。

### City schema（tokyo 模板）

```
id, type, country, city, name, nameEn, title, description, keywords,
h1, lead, continent, language, currency, timezone, related, tagline,
heroImage, bestTime, facts, highlights, gallery, relatedCities, featured
```

- facts：Continent/Language/Currency/Timezone 4 项
- bestTime：`{season, description}`
- gallery：4 张（16:9）
- highlights：数组

## 3. P12 内容大纲映射（3 城）

| 城市 | 国家 | 国家动作 | 内容要点（P12 大纲） |
|---|---|---|---|
| 京都 | japan | 复用 | 清水寺/伏见稻荷/金阁寺/祇园；美食/交通/住宿/贴士；3 日经典+寺庙神社 2 日；春秋双高峰；春季 seasonal；4 日经济版 JPY |
| 上海 | china | 复用 | 外滩/豫园/陆家嘴/武康路；美食/交通/住宿/贴士；3 日经典+海派街区 2 日；春秋；秋季 seasonal；4 日经济版 CNY |
| 首尔 | south-korea | **新增** | 景福宫/北村韩屋/南山塔/明洞；美食/交通/住宿/贴士；3 日经典+韩流 2 日；春秋；春季 seasonal；4 日经济版 KRW |

## 4. 图片基线（P12 已验证图库）

| 城市 | 已验证候选 | 缺口 |
|---|---|---|
| 京都 | 5 张（1493976040374/1545569341/1478436127897/1536098561742/1513407030348） | 生产补齐 ~4 张 |
| 上海 | 4 张（1474181487882/1548919973/1521737604893/1545893835） | ~5 张 |
| 首尔 | 3 张（1517154421773/1538485399081/1516117172878） | ~6 张 |

> 生产时按需补充候选并逐张验证 200；跨城/跨实体零复用；alt 中性。

## 5. 生产计划（P13 Phase 1–7）

| 阶段 | 内容 | 产出 |
|---|---|---|
| P1 国家 | 新增 south-korea.json（7 基础字段 + 内容字段） | 1 文件 |
| P2 城市 | 京都/上海/首尔 city JSON | 3 文件 |
| P3 子实体 | 3 城 × 13（4 attractions + 4 guides + 2 routes + 1 best-time + 1 seasonal + 1 route-plan） | 39 文件 |
| P4 校验 | JSON 合法/id 唯一/refs/图片 200/validate | — |
| P5 Build | 临时 OUT_DIR：94 → **137** 页、sitemap 137 | — |
| P6 安全 | [object Object]=0/.html 内链=0/alt 完整/375px | — |
| P7 报告 | design/p13-report.md | 1 文件 |

**合计新增**：43 文件（1 国家 + 3 城市 + 39 子实体）→ **页面 94 → 137（+43）**

## 6. 纪律

- 仅生产数据层；不改模板/CSS/构建逻辑
- 不虚构评分/价格（估算区间 + 货币字段）
- 不 commit / push / deploy
