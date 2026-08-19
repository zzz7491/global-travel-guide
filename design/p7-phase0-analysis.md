# Global Travel Guide v2.0 · P7 Phase 0 只读分析
## 全站体验优化 + SEO 收口 + 生产准备

> 阶段：**只读分析**（未修改任何文件 / 未 build / 未 commit）
> 约束：✅ 不新增内容 / 不创建虚假故事 / 不接数据库与登录 / 不改 URL / canonical / sitemap 数量；✅ 不影响东京 route-plan 与北京 budget/comfort/seasonal。

---

## 1. 当前架构评分

| 维度 | 评分 | 依据 |
|---|---|---|
| SEO 结构 | **A** | 全站 JSON-LD 齐备（WebSite/Org/Breadcrumb + ItemList + TouristDestination + Article×3 + story 预留）；47 页 title/description/canonical 全在；sitemap 47 条单一来源 |
| URL / IA | **A** | 全量 47 URL 验证通过；目录带 `/`、叶子无尾斜杠；无重复入口；story 无数据不生成 |
| 内容模型扩展 | **A** | 新增城市/国家 **零代码改动**（见 §6） |
| 图片系统 | **B+** | 14 张 `<img>` 全 alt + lazy；CSS aspect-ratio 兜底无 CLS；但无显式 width/height、无本地兜底 |
| Design System | **B+** | tokens 唯一来源基本达成；发现 body-route-plan **3 处自引用 alias 循环**（见 §5） |
| UX（375px） | **B+** | hero/卡片/断词/溢出规则齐全；东京 Hub 无图视觉偏弱（见 §3） |

**总体：生产可部署，无 P0/P1 阻断项；P7 执行以「中低风险收口」为主。**

---

## 2. SEO 检查结果

### 2.1 JSON-LD 实况（实测）
- **首页**：WebSite + Organization + BreadcrumbList + ItemList(4 dests) ✅
- **城市页**（东京/北京）：+ TouristDestination（image/availableLanguage/bestTime 按数据生成）✅
- **route-plan / budget**：+ Article（headline/description/url）✅
- **seasonal**：+ Article（含 image）✅
- **story**：预留 Article 分支（image/author/datePublished 逐字段有数据才生成，无数据零页面）✅
- **静态页**（about/services/contact 等 6 页）：自带手工 `@graph`（WebSite + Organization + BreadcrumbList），语义与 SSG 一致，**每页仅一份 script，无重复/冲突** ✅

### 2.2 title / description / canonical（抽查 4 个 leaf 页全过）
- 故宫 / 北京5日 / 北京美食 / 东京最佳时间：title、description、canonical（干净 URL）均正确。

### 2.3 发现的风险/改进项
| # | 级别 | 问题 | 建议 |
|---|---|---|---|
| S1 | 低 | 静态页 JSON-LD 内**硬编码** `travel.mootlsv.com`（与 SSG 从 site.json 取不一致源） | P7 不改内容；仅文档标注「换域需同步 6 个静态页」 |
| S2 | 低 | `og:type` 固定 `website`（route-plan/budget 内容页宜为 `article`） | P7 可选：按类型动态输出 |
| S3 | 低 | `og:image` 全站统一默认图（1200×630 Unsplash），无逐页差异 | 可接受（社交分享一致性）；逐页差异属 Phase B 数据增强后续 |
| S4 | 信息 | 无 `hreflang`（站点为中文为主 + 英文品牌词） | 多语言未规划，P7 不做 |

---

## 3. UX / 页面体验检查

### 3.1 重点页面（实测）
- **首页**：Hero（大图 + `Explore the world.`/`Plan your journey.` + 搜索框 + 2 枚 CTA + 统计条）→ Featured Destinations（国家/城市卡带图带 tagline）→ Popular Routes（旗舰大卡 + 8 卡）→ Guides（分类徽标）→ Seasonal → Traveler Stories 空态。**CTA 明确、层级完整** ✅
- **东京城市页**：Hub 结构完整（Hero/About/Best Time/Featured Routes/…/Traveler Stories 空态）✅；但 **全页 0 张 `<img>`**——Featured 大卡（route-card--featured）无封面图，Best Time 纯文字。**视觉明显弱于北京页**（北京有 Budget/Seasonal 带图富卡）。
- **北京城市页**：Budget Plans（5天·¥1,612 起 + 图）、Seasonal Guides（秋季·9月/10月 + 图）、Featured comfort 大卡 → 最丰富 ✅
- **东京 economy / 北京 budget / 北京 comfort**：route-plan 12 模块 + Chart.js 均正常 ✅
- **空态**：Traveler Stories（首页 + Hub）统一「Coming Soon」文案，无假内容 ✅

### 3.2 风险列表
| # | 级别 | 问题 |
|---|---|---|
| U1 | 中 | 城市页 Featured 大卡无封面图（数据有 heroImage 但模板未用）→ 东京页首屏下半视觉空白 |
| U2 | 低 | 首页 Popular Routes 旗舰卡取 `routePlans[0]`（loadDir 字母序 → 北京 comfort）；100 城后需显式 featured 标记（P5 遗留待确认项） |
| U3 | 低 | 卡片 hover 微交互统一（已由组件统一）——无问题，仅记录 |

### 3.3 375px 移动端（responsive.css 实测规则齐全）
hero `clamp(24px,7vw,32px)`、hero--city `40vh`、`.hero-actions` 列排、`.hero-search` 100%、`.dest-grid/.route-grid/.cards` 单列、`overflow-x:hidden` ✅ 无横向滚动、无拆词（keep-all 全局）。

---

## 4. 图片系统检查

- **合规**：14 张 `<img>`（首页 12 + 北京 Hub 2）**100%** 有 `alt` + `loading="lazy"` + `decoding="async"`；0 张无 alt。
- **尺寸**：卡片 w=800、Hero/大卡 w=1600（Unsplash 参数）；CSS `.card-img{aspect-ratio:16/9}` 已消除布局偏移（CLS 风险低）。
- **缺口**：0 张有 HTML `width/height`（Google 推荐显式尺寸，虽 CSS aspect-ratio 已等效兜底）。
- **外链稳定性**：5 张 Unsplash 图全部 HTTP 200（已验证）；`images.unsplash.com` 本身是全球 CDN（ImgIX 系），**无需再引入图片 CDN 层**。
- **兜底**：图片加载失败时卡片为背景色 `--line`（可接受）；无 onerror 本地占位。
- **未来 R2**：`imageBaseUrl`/`heroImageUrl` 单开关预留已存在（content.js:101），迁移仅需改 site.json 一处。

### 性能风险
| # | 级别 | 问题 | 建议 |
|---|---|---|---|
| P1 | 低 | img 无显式 width/height（虽有 CSS aspect-ratio） | P7 模板加 `width="800" height="450"`（16:9）双保险 |
| P2 | 低 | 无本地兜底图 | 可选：onerror → 单色占位 |
| P3 | 低 | Chart.js 走 jsdelivr CDN（3 处） | 可接受；如需离线可本地化（可选） |

---

## 5. Design System 最终检查

- **tokens.css**：40 个 token（色/字/间距/圆角/阴影）✅
- **components.css**：硬编码色仅 `#fff`/`rgba(255,255,255,*)`（深底白字语义色）与 `rgba` 阴影，**无品牌色残留** ✅
- **style.css**：仅 1 处残留 `#c9bda7`（卡片 hover 边框色）——微收口项。
- **重复组件**：`.topnav`/footer 已收口（P0.5）；无 `.nav` 重复；卡片类（dest/route/guide/season/budget/story/city-card）均引用 tokens，无重复定义。
- **⚠️ 已确认缺陷（中）**：`body-route-plan.html` 的 `:root` 存在 **3 处自引用 alias 循环**：
  ```css
  --ink:var(--ink);        /* 自引用 → invalid */
  --ink-light:var(--ink-light);
  --shadow-lg:var(--shadow-lg);
  ```
  循环引用使这 3 个变量计算值无效 → 模板中 `var(--ink)`(12处)/`var(--ink-light)`(18处) 实际退化（文本色可能落回黑 #000 而非品牌 `--ink:#2B2B2B`）。**P7 修复：删除这 3 行 alias**（tokens 的 --ink/--ink-light/--shadow-lg 自动生效），重建后比对色值。
- **100 城扩展**：组件化 + tokens 已达标。

---

## 6. 内容模型扩展检查（100 城风险）

**新增 1 个城市**（如巴黎）：
- 建 `data/cities/france-paris.json` + 可选子实体（attractions/routes/guides/best-time…）
- **代码改动：0 行**——`urlFor/linkUrl`（动态 country/city）、`buildCitySections/buildCityBody`（自动派生）、目录页 `buildIndexSections`（自动收录）、sitemap（自动）、Hub 空态（自动降级）

**新增 1 个国家**（如法国）：
- 建 `data/countries/france.json` + 城市
- **代码改动：0 行**

**仅当新增类型**（budget/seasonal/story 已验证）才需 +1 case（urlFor/linkUrl/LEAF_TYPES/渲染分支），属每类型一次性成本 ~10 行。

**100 城风险：低。** 唯一内容层待决策项：首页 Featured 旗舰卡选取规则（当前 loadDir 顺序），建议未来加 `featured:true` 标记（P5 遗留）。

---

## 7. 下一阶段 P7 执行计划（待确认）

| # | 项 | 级别 | 说明 |
|---|---|---|---|
| E1 | 修复 body-route-plan 自引用 alias（删 3 行） | 中 | 恢复品牌文本色，重建后比对 |
| E2 | 城市 Hub Featured 大卡加封面图（route-card--featured 支持 image） | 中 | 东京页补上首图，视觉对齐北京 |
| E3 | 模板 `<img>` 加 width/height（800×450，16:9） | 低 | 满足 Google 显式尺寸建议 |
| E4 | style.css `#c9bda7` → `var(--line)` | 低 | Design System 唯一来源闭环 |
| E5 | 47 页回归 + 375px 实机 + 全站 grep 验收 | — | 页面数/canonical/sitemap/邮箱/[object Object]/.html 内链 |
| E6 | 输出 `design/p7-report.md` | — | 含改动清单/验证/遗留 |

**不做**：新增内容、虚假故事、数据库/登录、URL/canonical/sitemap 变更、东京/北京内容改动、commit/push/deploy。

---

Phase 0 完成。等待确认后进入 P7 执行。
