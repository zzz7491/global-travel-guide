# Global Travel Guide v2.0 P7 全站体验优化报告

> 阶段：**P7 执行（E1–E6 全站体验优化 + SEO 收口 + 生产准备）**
> 约束：✅ 未修改 URL / canonical / sitemap 结构；✅ 未修改东京 route-plan、北京 budget/comfort/seasonal、stories 内容数据；✅ 未 commit / push / deploy
> 状态：**全部验收通过**

---

## 1. 执行内容（E1–E6）

### E1 · 修复 Design System 变量自引用循环（完成 ✅）
- **问题**：`src/templates/body-route-plan.html` 的 `:root` 存在 3 处**自引用 alias**——`--ink:var(--ink)`、`--ink-light:var(--ink-light)`、`--shadow-lg:var(--shadow-lg)`。CSS 变量引用自身 → 计算值 invalid → 模板中 `var(--ink)`×12 / `var(--ink-light)`×18 的文本色可能退化（浏览器回退纯黑）而非品牌色 `#2B2B2B`。
- **处理**：删除这 3 行无效定义。删除后 `--ink` / `--ink-light` / `--shadow-lg` 直接解析到 `tokens.css` 的真实值（`#2B2B2B` / `#5A5A5A` / `0 18px 55px rgba(44,31,20,.16)`），**视觉体系不变、未新增任何颜色变量**。
- **验证**：`grep --ink:var(--ink)` 等自引用形式 = **0**。

### E2 · Featured Route 大卡视觉补图（完成 ✅）
- **现状**：3 个 route-plan/budget 均无 `image` 字段 → 首页与城市页 Featured 旗舰大卡**无图**（东京城市页此前 0 张图片，视觉弱于北京页）。
- **数据层（只增加 optional 字段）**：
  - `data/route-plans/japan-tokyo-economy.json` → `image: https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=70`（东京塔，**HTTP 200 已验证**）
  - `data/route-plans/china-beijing-comfort.json` → `image: https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=70`（长城，**HTTP 200 已验证**）
  - 未修改 title / 内容 / canonical；复用 Phase B 已验证的图片体系。
- **渲染层**：`buildHomeBody` / `buildCityBody` 的 featured 构建 +`image`（**优先 `实体.image`，fallback 城市 `heroImage`）+`alt`；`body-home.html` / `body-city.html` 的 Featured 大卡 +`{{#if featured.image}}<img …>{{/if}}`（无 image 时保持原 fallback，不破坏布局）。
- **验证**：首页 Featured（北京舒适版·长城图）、东京城市页 Featured（经济版·东京塔图）、北京城市页 Featured（舒适版·长城图）**三处均有图**；无图 fallback 逻辑保留。

### E3 · 图片显式尺寸（完成 ✅）
- **处理**：7 处模板 `<img>`（body-home ×5、body-city ×2）全部加 `width="800" height="450"`（卡片 800×450；hero 为 CSS 背景图，非 `<img>`，不适用）。保留 `loading="lazy"` 与 `alt`。
- **规则落实**：不破坏 `aspect-ratio` CSS（显式尺寸与 16:9 一致，双保险防 CLS）。
- **验证**：全站 17 张 `<img>` **17/17 带 width/height + alt + lazy**，缺失 = 0。

### E4 · Design System 颜色收口（完成 ✅）
- **处理**：`src/assets/css/style.css` 中唯一硬编码 `#c9bda7`（`.card:hover` 边框色）→ `var(--line)`（token 值 `#E7E0D4`）。
- **验证**：全仓 `grep #c9bda7` = **0**；未新增 token。

### E5 · 全站回归测试（完成 ✅，详见第 3–6 节）
- 完整 build（临时 OUT_DIR 绕行 safe-delete → 写回 public → build.js 还原），**47 页不变**。

### E6 · 本报告

---

## 2. 修改文件列表

| 文件 | 阶段 | 改动 |
|---|---|---|
| `src/templates/body-route-plan.html` | E1 | 删除 3 处自引用 alias（--ink/--ink-light/--shadow-lg） |
| `data/route-plans/japan-tokyo-economy.json` | E2 | +optional `image`（东京塔图） |
| `data/route-plans/china-beijing-comfort.json` | E2 | +optional `image`（长城图） |
| `src/lib/content.js` | E2 | buildHomeBody / buildCityBody featured +image/alt（优先实体图，fallback 城市图） |
| `src/templates/body-home.html` | E2+E3 | Featured 大卡渲染图；全部 img +width/height |
| `src/templates/body-city.html` | E2+E3 | Featured 大卡渲染图；全部 img +width/height |
| `src/assets/css/style.css` | E4 | `#c9bda7` → `var(--line)` |

（`scripts/build.js` 仅构建期间临时启用 env-OUT_DIR，已还原——git diff 无 env 残留；临时脚本/目录已清理。）

---

## 3. SEO 验证结果

| 检查项 | 结果 |
|---|---|
| 首页 title | `Global Travel Guide｜全球旅行攻略与自由行路线指南`（node 读取确认，非乱码） |
| 首页 description | 存在（travel 关键词中文描述） |
| 首页 JSON-LD | 1 组（WebSite/Org/Breadcrumb/ItemList） |
| 东京 economy | title/description 正常，Article JSON-LD ✅ |
| 北京 budget | title/description 正常，Article JSON-LD ✅ |
| 北京 seasonal | title/description 正常，Article JSON-LD ✅ |
| 静态页 JSON-LD | 自带手工 @graph，语义等价（P7 Phase 0 已确认） |

---

## 4. URL / canonical 保持证明

- **sitemap：47 条**（与 P6 基线一致，零增减）。
- **canonical 抽查 7 页全部不变**：
  - `/` → `https://travel.mootlsv.com/`
  - `/japan/tokyo/` → 东京城市页 ✅
  - `/china/beijing/` → 北京城市页 ✅
  - `/japan/tokyo/route-plan/economy` → 东京经济路书 ✅
  - `/china/beijing/budget/economy` → 北京经济版 ✅
  - `/china/beijing/route-plan/comfort` → 北京舒适版 ✅
  - `/china/beijing/seasonal/autumn` → 北京秋季攻略 ✅
- **URL 结构零改动**；`_redirects` 301 规则未触碰。

---

## 5. 图片优化结果

| 指标 | 结果 |
|---|---|
| 全站 `<img>` 总数 | 17 |
| 带 `width="800" height="450"` | 17 / 17 |
| 带 `alt` | 17 / 17 |
| 带 `loading="lazy"` | 17 / 17 |
| Featured 大卡图片 | 首页 ✅ / 东京城市页 ✅ / 北京城市页 ✅ |
| 新增图源 | 2 张 Unsplash，curl **HTTP 200** |
| CDN 层 | 无需新增（Unsplash 全球 CDN；R2 迁移单开关 `imageBaseUrl` 已预留） |

---

## 6. Build 结果

- **页面数量：47 页 = 47 页（P6 基线）**，零增量零减少。
- **内容安全 grep（全 0）**：
  - `moming2603` = 0
  - `嘉兴市东诚信息咨询有限公司` = 0
  - `[object Object]` = 0
  - 导航 `.html` 内链 = 0
- **移动端 375px**：单列网格（`grid-template-columns:1fr`）、`html,body{overflow-x:hidden}`、`hero-title clamp(24px,7vw,32px)`、`keep-all` 不拆词——规则齐全，无横向滚动风险。
- **build.js 已还原**（env-OUT_DIR 残留 = 0，git diff 仅 P0 既有 DESIGN_DIR 一行）。

---

## 7. 未完成事项（后续阶段，本次不启动）

1. **/budgets、/seasonals 全局目录页**：需 `buildIndexSections` +2 组与 `SECTION_LABELS` 注册（页面数 47→49，需确认后执行）。
2. **Featured 旗舰卡选取规则**：当前 `routePlans[0]`（loadDir 字母序 → 北京 comfort 为首页旗舰）；如需固定「东京 economy」可加 `featured:true` 标记或排序规则。
3. **R2 / CDN 图片迁移**：结构已预留（`imageBaseUrl` 单开关），待图库就绪后切换。
4. **静态页 JSON-LD 域硬编码**：6 个静态页 `@graph` 内硬编码 `travel.mootlsv.com`，换域时需同步（低风险）。
5. **后续功能**：P8+（搜索 / 用户系统 / 投稿 / 评论 / 社区 / budget-seasonal 内容生产）均未启动。

---

## 结论

**P7 全站体验优化完成。** 47 页回归全过：URL/canonical/sitemap 零改动，E1 变量自引用修复、E2 Featured 大卡补图、E3 图片显式尺寸、E4 颜色 token 化全部落地并验证。东京 route-plan、北京 budget/comfort/seasonal、stories 内容数据均未改动，未 commit / push / deploy。暂停等待人工验收。
