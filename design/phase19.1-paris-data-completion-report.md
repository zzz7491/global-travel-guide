# Phase 19.1 — Paris Data Completion

**Date**: 2026-08-29
**Mode**: 数据内容补全（只读审计后的执行阶段；未修改 build.js / 模板 / 核心渲染逻辑，未下载或生成图片，未 Commit / Push / Deploy）
**Status**: COMPLETE — 巴黎数据达到与 Beijing v1.0 同等的完整内容规模

---

## 1. 待确认事项决策（用户授权由我默认决策）

| # | 事项 | 决策 | 依据 |
|---|------|------|------|
| ① | 7 个新景点候选 | 全部采纳：notre-dame / arc-de-triomphe / musee-orsay / versailles / seine-cruise / marais / centre-pompidou | 19.0 报告候选，均为真实、高辨识度巴黎地标 |
| ② | city 是否 `featured: true` | **添加** `featured: true` | 与 Beijing / Tokyo 一致；使巴黎进入首页精选城市排序（纯数据字段，非图片） |
| ③ | 5 个故事 slug | seine-evening / montmartre-artist / marais-weekend / versailles-day / latin-quarter-night | 全部避开现有 10 个 slug（arashiyama-morning, autumn-palace, family, first-time, food-tour, gion-stay, great-wall-sunrise, hiking, hutong-walk, spring-2026） |

**图片字段策略**：19.1 新建实体**不含**图片字段（heroImage / socialImage / gallery / cover / heroImage），由后续 19.2 / 19.3 图片阶段统一回填。理由：严格符合「本阶段只处理数据内容」；避免引入指向不存在图片的 404；与 19.0 计划的「19.2/19.3 创建图片 + 回填 JSON」分工一致。

---

## 2. 修改了什么

- 修改 `data/cities/france-paris.json`：新增 `"featured": true`（1 处，纯数据字段）。
- 现有 4 景点 / 4 指南 / 2 路线 / 1 route-plan / 1 seasonal / 1 best-time 的**文本与图片字段均未改动**（19.0 审计认定文本真实可用，图片回填留给 19.2/19.3）。

## 3. 新增了什么（19 个文件）

| 类型 | 数量 | slug |
|------|------|------|
| Attractions | 7 | notre-dame, arc-de-triomphe, musee-orsay, versailles, seine-cruise, marais, centre-pompidou |
| Guides | 2 | culture-etiquette, shopping |
| Routes | 1 | romantic-paris |
| Budgets | 1 | economy |
| Seasonals | 3 | summer, autumn, winter |
| Stories | 5 | seine-evening, montmartre-artist, marais-weekend, versailles-day, latin-quarter-night |

内容均为真实、可靠的巴黎旅行信息（地标历史、交通、博物馆、节庆、街区、预算估算区间，明确标注「估算/参考」）；5 篇故事为编辑型创作，作者署名为「旅行编辑部」，未伪造具体真实人物身份。

## 4. 页面数量变化

| 指标 | 阶段前 | 阶段后 | 增量 |
|------|--------|--------|------|
| 全站 sitemap URL | 181 | **200** | +19 |
| 巴黎页面（含 /france/paris/ 与 /stories/ 巴黎） | 14 | **33** | +19 |
| 巴黎数据结构 | City 1 / Attr 4 / Guide 4 / Route 2 / RP 1 / Best 1 / Season 1 / Story 0 | City 1 / Attr **11** / Guide **6** / Route **3** / RP 1 / Best 1 / Season **4** / Budget **1** / Story **5** | 对齐 Beijing v1.0 |

> 巴黎 URL 分布（sitemap）：city 1 + best-time 1 + attractions 11 + guides 6 + routes 3 + route-plan 1 + budget 1 + seasonals 4 = 28（city-path），+ 5 个 /stories/ 巴黎故事 = 33。

## 5. 验证结果

### 5.1 数据一致性（D 阶段，脚本全量校验）
- 19 个新文件 + 1 个城市编辑，全部 JSON 解析通过。
- 必填字段（id / type / country=france / city=paris / title / description；story 用 summary 代替 description，符合 Beijing 既有 schema）齐全。
- 所有 `blocks[].related.refs` 内部引用均指向已存在的实体 id（含本阶段新建实体），无悬空引用。
- 占位符扫描（TODO/TBD/占位/Lorem/placeholder）：**无真实占位符**（唯一命中「提前占位」为正常中文词，非标记）。
- 他城引用扫描（北京/京都/东京/上海…）：**0 处**。

### 5.2 Build（E 阶段）
- `node scripts/build.js` → **Built 200 pages + sitemap.xml into /public**（沙箱外执行，因 cleanOutDir 的 safe-delete trash 拦截属环境问题，非数据问题；未改动 build.js）。
- 无构建错误，所有新页面模板正常渲染。

### 5.3 页面抽查（F 阶段，本地 public 产物）
抽取 10 个新页面（覆盖 8 类页面类型）验证：
- `<title>` / meta description / canonical / og:title：**全部正确**，canonical 均指向正确巴黎 URL。
- JSON-LD：**PARSE-OK**，1 个 schema 块/页，`@context`/`@type` 合法。
- 内部链接：autoLink 已为同城市实体自动生成相关链接。

### 5.4 京都 / 北京隔离
- `data/*kyoto*`、`data/*beijing*`：**零触碰**（git status 无改动）。
- 全量 rebuild 重新生成了 `public/` 下京都/北京 HTML，但 `git diff --ignore-all-space` 显示**内容与已提交版本完全一致**（字节数 23758=23758），差异仅为构建产物的换行符（CRLF/LF）噪声，属预存构建行为，非内容变更。
- 京都/北京页面 OG、内容、图片均未受影响。

## 6. 剩余问题（均 NON-BLOCKER，记录不修复）

| # | 问题 | 说明 | 计划处理阶段 |
|---|------|------|--------------|
| P1 | 新巴黎实体 OG 图回退到站点默认图 | 新建实体未设 `socialImage`/`heroImage`，og:image 统一为 `photo-1599571234909`（站点默认）。与现有 4 个巴黎景点行为一致 | 19.4（图片阶段补 socialImage） |
| P2 | 巴黎本地图片资产仍为 0 | `src/assets/images/paris/` 尚未创建；当前 100% 依赖远程 Unsplash（city/guide/route/seasonal 既有远程引用） | 19.2 / 19.3 |
| P3 | 故事/季节/景点/指南/budget 图片字段缺失 | 按本阶段策略，图片字段由 19.2/19.3 回填 | 19.2 / 19.3 |

## 7. 本阶段修改确认

- 新增数据文件：**19 个**（均 `data/` 下，巴黎专属）。
- 修改数据文件：**1 个**（`data/cities/france-paris.json` 加 `featured: true`）。
- 新增报告：`design/phase19.0-paris-replication-baseline.md`（19.0 已建）、`design/phase19.1-paris-data-completion-report.md`（本报告）。
- 未修改：`build.js`、模板、`src/lib`、`scripts/` 其他逻辑；京都/北京数据。
- 未下载/生成任何图片；未 Commit / Push / Tag / Deploy。

---

*Report completed: 2026-08-29*
*Status: 暂停，等待下一阶段（Phase 19.2 — Paris Images Batch 1）指令。*
