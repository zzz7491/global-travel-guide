# Global Travel Guide v2.0 · P6 Phase 0 只读分析
## Traveler Stories / UGC 内容生态结构预留

> 阶段：**只读分析**（未修改任何文件 / 未 build / 未 commit）
> 约束：✅ 不改 URL / canonical / 47 页构建结果；✅ 不创建虚假用户内容；✅ 不接登录/评论/后台/数据库；✅ 不影响东京 route-plan、北京 budget/comfort/seasonal。

---

## 1. 数据目录结构（实测）

| 目录 | JSON 数 | 说明 |
|---|---|---|
| `data/countries` | 2 | 中国 / 日本 |
| `data/cities` | 2 | 北京 / 东京 |
| `data/attractions` | 12 | 景点实体 |
| `data/routes` | 5 | 路线实体 |
| `data/guides` | 8 | 实用指南（含 category） |
| `data/best-times` | 2 | 最佳旅行时间 |
| `data/route-plans` | 2 | 东京 economy / 北京 comfort |
| `data/budgets` | 1 | 北京 economy 预算 |
| `data/seasonals` | 1 | 北京秋季 |
| `data/stories` | **不存在** | P6 只做加载能力预留，不创建内容 |

**关键结论**：`build.js` 的 `loadDir(dir)`（54 行）对不存在的目录返回 `[]`（fail-safe）→ 注册 `data/stories` 加载后，**无数据 = 零页面增量**，完全符合"无数据不生成页面"。

## 2. Traveler 空态现状位置

### 首页（body-home.html:117–125）—— 硬编码区块
```html
<section class="block home-block">
  <div class="section-header"><h2>Traveler Stories</h2></div>
  <div class="empty-state">
    <strong>Traveler Stories Coming Soon</strong>
    <span>真实旅行者的路线分享与体验评价即将上线，敬请期待。</span>
  </div>
</section>
```
- 固定 section + empty-state，SEO 友好（`<h2>` 真实存在）。
- P3 改造点：仅优化文案为「真实旅行经验将在未来开放」，保留 section/h2 结构。

### 城市 Hub（content.js:495–499，buildCityBody 内）—— 数据驱动空态
```js
hub.push({
  title: 'Traveler Content', empty: true,
  emptyTitle: 'Traveler Stories Coming Soon',
  note: '真实旅行者的路线分享与体验评价即将上线。',
});
```
- body-city.html:45–49 通用 empty-state 渲染（`{{#if empty}}` → `{{emptyTitle}}`/`{{note}}`）；有数据时走 59–67 通用卡片渲染（`cardClass` 可指定 `story-card`）。
- P4 改造点：`Traveler Content` → `Traveler Stories`；按 `country/city` 过滤 `data/stories` 有数据出卡、无数据出空态。

## 3. Story Type 接入点（代码锚点）

| 位置 | 现状 | P6 改动 |
|---|---|---|
| `content.js:16 urlFor` | 9 个 case | +`story → /stories/{slug}.html` |
| `content.js:34 linkUrl` | 9 个 case | +`story → /stories/{slug}` |
| `content.js:54 SECTION_LABELS` | 仅 attraction/route/guide | +`story: 'Stories'` |
| `content.js:59 LEAF_TYPES` | 7 类 | +`story` |
| `content.js:73–78 buildBreadcrumb` | SECTION_LABELS url = `/{country}/{city}/{type}s/` | **story 需特殊处理**：无 country/city、无目录页 → url = `/stories/` |
| `build.js:69–79 ENTITIES` | 9 个 loadDir | +`...loadDir(data/stories)`（目录不存在 → []，零增量） |
| `build.js:283–287 渲染分支` | city/country/route-plan/budget/seasonal/content | +`story → renderTemplate(tpl.story, buildStoryBody(e, ctx))` |
| `build.js:140–146 tpl` | 6 模板 | +`story: readTpl('body-story.html')` |
| `build.js:154–222 JSON-LD` | WebSite/Org/Breadcrumb/ItemList/Article/TouristDestination | +story → Article（headline/image/author/datePublished，无数据不生成空字段） |
| `build.js:321–327 sitemap` | 实体数组自动收录 | 零改动，story 自动进 sitemap |

**Story 页面渲染方案**：`story` URL 是全局式（`/stories/{slug}`，无 country/city 层级），与现有叶子类型不同。新增 `buildStoryBody(e, ctx)`（仿 `buildSeasonalBody`，537 行模式）+ `body-story.html` 骨架模板（Hero + Story meta + Highlights + blocks），全部 optional 优雅降级。

## 4. Schema 设计（P1，只设计不建内容）

```
data/stories/<slug>.json
{
  "type": "story",
  "slug": "",
  "city": "beijing",          // 与城市实体关联（可选）
  "country": "china",         // 与城市实体关联（可选）
  "title": "",
  "summary": "",
  "author": { "name": "" },   // 不虚构，缺省则隐藏 author 区
  "travelStyle": "",          // 如 budget / comfort / family
  "season": "",
  "days": 0,
  "highlights": [],           // 字符串数组
  "cover": "",                // 图片 URL（可选）
  "publishedAt": "",          // ISO 日期（可选）
  "status": "draft"           // 预留审核状态
}
```
- 全字段 optional；无 author/publishedAt 不渲染对应 UI 与 JSON-LD 字段。
- 禁止虚构作者 / 经历 / 评分；`status: draft` 预留未来审核流。

## 5. 约束核对

- 47 页不变：`data/stories` 无内容 → 零新增页 ✅
- URL/canonical 零变化：story case 是新增 switch 分支，不触碰现有 9 类 ✅
- 东京 route-plan / 北京 budget/comfort/seasonal：渲染分支仅新增 `else if`，现有分支不动 ✅
- 无数据库 / 无登录 / 无评论：纯 SSG 静态预留 ✅

## 6. 风险点

1. **面包屑死链**：story 无 country/city 与目录页，SECTION_LABELS 若照搬通用 url 构造会生成 `//stories/` 或死链 —— 必须在 buildBreadcrumb 对 story 特判 `/stories/`。
2. **空态冲突**：首页硬编码空态与城市 Hub 数据驱动空态并存，改动需分开进行（P3 文案 / P4 逻辑）。
3. **[object Object]**：highlights 若传对象会二次包裹（既有约定：字符串数组），`buildStoryBody` 按 `{text}` 包装。
4. **safe-delete**：沿用临时 OUT_DIR 构建 + 写回 + 还原。

---

Phase 0 完成。等待进入 P1–P7 实施。
