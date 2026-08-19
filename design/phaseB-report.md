# Phase B 报告
## 城市数据增强与旅行视觉素材体系建设

> 阶段：**Phase B 执行完成并通过验证**
> 约束遵守：✅ 未改 URL / canonical / sitemap / type / 既有数据字段；✅ 未影响东京 route-plan / P0 / P0.5 / Phase A；✅ 未 commit / push / deploy；✅ 未实现 budget/seasonal type、UGC、搜索、用户系统。
> 前置：`design/phaseB-analysis.md`（Phase 0 只读分析 + 图片源验证）。

---

## 1. 数据字段变化（全部 optional、只加不改）

| 文件 | 新增字段 |
|---|---|
| `data/cities/japan-tokyo.json` | `tagline`（未来都市与传统文化交织的日本首都）、`heroImage`（东京塔）、`bestTime{season,description}`、`facts[4]`、`highlights[5]`、`relatedCities[]`（空） |
| `data/cities/china-beijing.json` | `nameEn: Beijing`、`tagline`（千年历史与现代中国交汇之城）、`heroImage`（长城）、`bestTime`、`facts[4]`（含 Language 中文，修复 Phase A 降级）、`highlights[5]`、`relatedCities[]`（空） |
| `data/countries/china.json` | `heroImage`（现代天际线） |
| `data/countries/japan.json` | `heroImage`（神社） |
| `data/routes/*.json`（5 个） | `image`（北京路线→长城图；东京路线→东京塔图） |
| `data/guides/*.json`（8 个） | `category`（交通/住宿/美食/预算/贴士） |

- 全部为新增 key，未触碰任何既有字段；无图片/无数据时页面自动 fallback（tint 底色 + 文字，无空白）。
- 已对 17 个 JSON 逐一 JSON.parse 校验通过。

## 2. 页面效果变化

**首页**（`body-home.html` + `buildHomeBody`）：
- Featured Destinations：国家卡 / 城市卡均带**封面图**（`<img>` alt + lazy + 16:9），国家（中国天际线 / 日本神社）→ 城市（北京长城 / 东京塔）两级。
- Popular Routes：5 条路线卡带**路线封面图**；旗舰路书大卡保持深绿 tint 设计。
- Travel Planning Guides：8 张指南卡带**分类徽标**（交通/住宿/美食/预算/贴士）。

**城市页**（`body-city.html` + `buildCityBody`）：
- **Hero 个性化**：每城独立大图（东京塔 / 长城）+ 数据驱动 tagline（Tokyo「未来都市与传统文化交织的日本首都」/ Beijing「千年历史与现代中国交汇之城」），模板零城市文案。
- About City：新增**亮点 chips**（东京：浅草寺与雷门…；北京：故宫博物院…）。
- Best Time：新增**季节摘要行**（如「春秋气候宜人，樱花与红叶季最受欢迎…」）。
- Facts：消费 `facts[]`（东京/北京各 4 项），无 facts 时回退 flat 字段。

## 3. 图片体系

- **统一图片字段约定**（R2 就绪）：
  ```jsonc
  "heroImage": "https://images.unsplash.com/photo-xxx?w=1600&q=80"  // 或未来 "https://img.mootlsv.com/tokyo.jpg"
  // 完整对象形态（未来）：
  "image": { "src": "", "alt": "", "credit": "", "source": "" }
  ```
- 加载约定：卡片 `<img>` 全部 `loading="lazy"` `decoding="async"` + `aspect-ratio:16/9` + 必填 `alt`（实测 9 张图全部合规，alt 缺失 = 0）；Hero 用 CSS `background-image`（`--hero-image` 按页内联覆盖，图失效时渐变兜底不破版）。
- 图片来源：5 张 Unsplash 已验证 HTTP 200（东京塔/长城/中国天际线/日本神社/备选街道），卡片 w=800、Hero w=1600。
- 无图 fallback：tint 底色 + 文字（Phase A 设计），禁止空白。

## 4. SEO 变化

- **TouristDestination JSON-LD 增强**（无数据不生成空字段）：
  - `image`（东京/北京均生成）
  - `availableLanguage`（东京「日语」/ 北京「中文」，从 `facts[]` 推导）
  - `bestTime`（`bestTime.description`，两城均生成）
- 卡片图 alt 全部为描述性文本（如「东京 城市旅行」「北京5日游路线 路线封面」）。
- title / description / canonical / Breadcrumb / sitemap **全部不变**。

## 5. Build 验证

- `node scripts/build.js` → **Built 46 pages + sitemap.xml**（46 = 46）。
- 构建方式：临时 OUT_DIR 构建 + 写回 `public`（safe-delete 绕行）；`build.js` 已还原（`grep process.env.OUT_DIR` = 0）。
- 抽查：首页（图/徽标/统计）、东京（hero 个性化/亮点/摘要/facts）、北京（hero/亮点/JSON-LD）、国家页（仍 listing 模板）、东京 route-plan（canonical 不变、`new Chart` 2 处完好）、北京 budget/normal（canonical 不变）。
- grep：邮箱/公司 = 0；`[object Object]` = 0；img 无 alt = 0；.html 导航链接 = 0。

## 6. 未修改内容确认

- ✅ URL / canonical / sitemap / type / schemaVersion —— 零改动
- ✅ 既有数据字段 —— 零改动（仅新增 optional key）
- ✅ 东京 route-plan 内容与渲染 —— 未动
- ✅ 北京 budget/normal 静态路书 —— 未动
- ✅ 国家页/目录页/内容页模板 —— 未动
- ✅ P0 / P0.5 / Phase A 成果 —— 未受影响（Phase B 为增量扩展）
- ✅ 未 commit / push / deploy
- ✅ 未实现 budget/seasonal type、UGC、搜索、用户系统（后续阶段）

---

> 结论：Phase B 完成——城市/国家/路线/指南数据完成 optional 字段增强，首页与城市页从「模板高级」升级为「内容高级」（独立 Hero 图与 tagline、亮点、季节摘要、卡片封面图、指南分类、图片 SEO 体系），46 页构建通过，URL/SEO/sitemap 零改动。等待人工确认后进入 P1（budget/seasonal type）或 P2（UGC）。
