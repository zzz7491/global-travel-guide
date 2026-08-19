# Global Travel Guide v2.0 · P10 执行报告

## City Expansion Release（巴黎 / 伦敦 / 纽约）· 55 页回归通过

> 阶段：**P10 执行（P1–P7）**
> 约束：✅ 未修改东京/北京既有内容（仅加 featured 标记）；✅ 全部数据驱动零硬编码；✅ 未 commit/push/deploy
> 状态：**55 页构建回归全部通过**

---

## 1. 执行内容

### P1 · 国家数据创建（3 国）
`data/countries/france.json` / `uk.json` / `us.json`——严格复用 P9 country schema，全字段就位：

| 国家 | code | continent | language | currency | timezone | visa | transport |
|---|---|---|---|---|---|---|---|
| 法国 | FR | 欧洲 | 法语 | 欧元 (EUR) | UTC+1 | 申根签证 | TGV+地铁 |
| 英国 | GB | 欧洲 | 英语 | 英镑 (GBP) | UTC+0 | 英国签证 | 城际铁路+地铁 |
| 美国 | US | 北美洲 | 英语 | 美元 (USD) | UTC-5 | 签证/ESTA | 航空+长途巴士 |

- heroImage 3 张（巴黎天际线/伦敦地标/纽约天际线）**HTTP 200 已验证**；未修改既有国家数据。

### P2 · 城市数据创建（3 城）
`data/cities/france-paris.json` / `uk-london.json` / `us-new-york.json`——严格复用东京/北京 schema，必含 `id/type/country/city/name/tagline/heroImage/gallery/facts/highlights/bestTime/relatedCities`：

- **图片体系**：gallery 4 张/城（两批共 24 张候选、**16 张 HTTP 200 采用**、8 张 404 弃用）；三城 gallery **完全独立无跨城复用**；过程中修正纽约误用巴黎埃菲尔铁塔图的错误。
- **alt 中性**：「巴黎 城市街景」「伦敦 河畔建筑」「纽约 城市天际线」等——不虚构地标断言/评分/人口/排名。
- 事实准确性：UTC 时区、货币与语言人工核对无误。

### P3 · 首页 Featured 规则优化
- 数据层：中国/日本 country、东京/北京 city 标 `featured: true`（4 文件仅加字段）；新 3 国 3 城不标。
- 代码层：`buildHomeBody` 新增 `featuredOnly(type)`——**有 featured 标记时只显示精选，无任何标记时显示全部**（向后兼容 P8/P9 数据）。
- **效果**：首页 Featured Destinations 保持精选 2 国 2 城；新城市经 `/cities` 目录（自动收录）可达。东京/北京页面零影响。

### P4 · 校验工具增强
`scripts/validate-city-schema.js`（保持 ESM）新增 4 项检查：
1. **country 文件存在**（`data/countries/{country}.json`）
2. **heroImage 必填**（P10 新标准）
3. **gallery ≥ 1**（P10 新标准）
4. **slug 唯一性**（跨文件 Map 检查 country-city 无重复）
- 验证：**5/5 PASS**（东京/北京/巴黎/伦敦/纽约）+ 坏文件反向测试正确 FAIL（缺 country 文件 + 缺 gallery 均命中）。

### P5 · SEO 与数据验证（build 后实测）
- **sitemap 自动生成**：55 条，含 6 个新 URL（`/france/` `/uk/` `/us/` + 3 城市页）✅
- **canonical 不变化**：新页 canonical 正确（无尾斜杠）；既有 5 页（首页/东京/北京/东京 economy/北京 budget）逐一比对**零变化** ✅
- **TouristDestination JSON-LD**：新城市自动输出（name/description/image[]=hero+gallery 去重），无虚假 geo/rating ✅

### P6 · Build 回归
- 临时 OUT_DIR 构建：**Built 55 pages + sitemap.xml**（49 + 3 国家页 + 3 城市页）✅
- 写回 public、build.js 还原（env 残留 = 0）
- 巴黎 Hub 渲染实测：**Hero / About / Gallery + Budget/Seasonal/Free/Stories 空态**；无子实体区块（Best Time/Featured Routes/Attractions）自动隐藏——零模板改动、零城市特殊判断

### P7 · 最终验收（全过）

| 检查项 | 结果 |
|---|---|
| 页面数量 | **55 页**（sitemap 55 条） |
| 首页精选 | 仅 2 国 2 城（china/japan/beijing/tokyo），新城市走目录 ✅ |
| `[object Object]` | 0 |
| 导航 `.html` 内链 | 0 |
| 内容安全关键词（moming2603/嘉兴市东诚） | 0 |
| 图片 | **37 张**（25 原有 + 12 新 gallery）全部 width/height + alt + lazy |
| 375px 移动端 | overflow-x:hidden + 单列网格规则在，无横向溢出 |
| build.js | env 残留 = 0，无临时脚本 |

---

## 2. 文件变更清单

| 文件 | 阶段 | 改动 |
|---|---|---|
| `data/countries/france.json` / `uk.json` / `us.json` | P1 | **新增**（P9 schema 全字段） |
| `data/cities/france-paris.json` / `uk-london.json` / `us-new-york.json` | P2 | **新增**（gallery 4 图/城） |
| `data/countries/china.json` / `japan.json` | P3 | +`featured: true`（仅加字段） |
| `data/cities/china-beijing.json` / `japan-tokyo.json` | P3 | +`featured: true`（仅加字段） |
| `src/lib/content.js` | P3 | buildHomeBody +`featuredOnly()` 过滤（向后兼容） |
| `scripts/validate-city-schema.js` | P4 | +country 存在/heroImage 必填/gallery≥1/slug 唯一 |

（build.js 构建期间临时 env-OUT_DIR 已还原；临时脚本/目录已清理；public 产物已更新。）

---

## 3. 未完成事项

1. **三城子实体**：巴黎/伦敦/纽约暂为纯城市页（无景点/路线/攻略/best-time 实体）——按 `city-content-standard-v1.md` 补充后 Hub 自动出区块。
2. **批次 2 城市**：京都/上海/首尔等（`city-expansion-roadmap.md` A 级）。
3. **图片 L2/L3 迁移**：本地图库 / R2（image-system-v2 规范就绪，未迁移）。
4. **/stories 内容**：类型就绪待内容。
5. **部署**：本阶段未 commit/push/deploy；public 已含 55 页产物，push 后自动上线。

---

## 结论

**P10 执行完成。** 55 页构建回归全过：法国/英国/美国三国 + 巴黎/伦敦/纽约三城全部数据驱动接入（零核心代码新增），首页 Featured 精选机制落地（向后兼容），校验工具增强至 7 项检查（5/5 PASS），sitemap/canonical/JSON-LD 全自动且既有页面零变化。东京/北京内容未改（仅加 featured 标记）。未 commit/push/deploy，暂停等待人工验收。
