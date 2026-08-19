# Global Travel Guide v2.0 · P6 执行报告
## Traveler Stories / UGC 内容生态结构预留

> 阶段：**P6 执行完成**（架构预留，未上线用户系统 / 未接数据库 / 未新增真实用户内容）
> 约束：✅ 不改 URL / canonical / 47 页构建结果；✅ 不创建虚假用户内容；✅ 不接登录/评论/后台/数据库；✅ 不影响东京 route-plan、北京 budget/comfort/seasonal；❌ 未 commit / push / deploy

---

## 1. 修改文件列表

| 文件 | 改动 |
|---|---|
| `src/lib/content.js` | urlFor/linkUrl +`story` case（全局 URL `/stories/{slug}`）；`SECTION_LABELS` +`story:'Stories'`；`LEAF_TYPES` +`story`；`buildBreadcrumb` story 特判 crumb url=`/stories/`（防死链）；新增 `buildStoryBody`；`buildCityBody` Traveler Content → **Traveler Stories**（数据驱动卡/空态） |
| `scripts/build.js` | ENTITIES +`loadDir(data/stories)`（目录不存在 → []，零页面增量）；`tpl.story` 注册；渲染分支 +`story → body-story`；JSON-LD +story Article（headline/image/author/datePublished，无数据不生成空字段） |
| `src/templates/body-story.html` | **新增**：story 骨架模板（Hero + 面包屑 + Story meta + Highlights + blocks，全 optional 降级，Design System 无私有 CSS） |
| `src/templates/body-home.html` | Traveler Stories 空态文案 →「真实旅行经验将在未来开放」（保留 SEO 友好 `<section><h2>`） |
| `src/design-system/components.css` | +`.hero-meta` / `.story-card` / `.story-meta` / `.author-badge` / `.hero--story`（全部 tokens） |

## 2. Schema 设计（P1，只设计不生产内容）

```
data/stories/<slug>.json
{
  "type": "story",
  "slug": "",
  "city": "beijing",        // 与城市实体关联（可选）
  "country": "china",       // 与城市实体关联（可选）
  "title": "",
  "summary": "",
  "author": { "name": "" }, // 不虚构；缺省则隐藏 author 区与 JSON-LD author
  "travelStyle": "",
  "season": "",
  "days": 0,
  "highlights": [],         // 字符串数组
  "cover": "",              // 图片 URL（可选）
  "publishedAt": "",        // ISO 日期（可选）
  "status": "draft"         // 预留审核状态
}
```
- 全字段 optional；禁止虚构作者/经历/评分。

## 3. Story Type 注册（P2，仅架构）

- `urlFor` → `/stories/{slug}.html`（磁盘）；`linkUrl` → `/stories/{slug}`（canonical/内链/sitemap，干净 URL）。
- **注意**：story 是全局式 URL（无 country/city 段），与既有叶子类型不同——`buildBreadcrumb` 对 story 特判生成 `/stories/` crumb，避免 `//stories/` 或死链。
- `loadDir(data/stories)`：目录不存在返回 `[]` → **无数据 = 零页面**，47 页不变。

## 4. 首页 / 城市 Hub（P3/P4）

- **首页**：Traveler Stories 区块保持空态，文案优化为「真实旅行经验将在未来开放，敬请期待」，`<h2>Traveler Stories</h2>` 结构保留（SEO 友好）。
- **城市 Hub**：`Traveler Content` → **`Traveler Stories`**；有 story 数据时按 `country/city` 过滤出卡（cover / title / author·travelStyle，`story-card`）；无数据统一 empty-state。北京/东京当前均为空态（无虚假内容）。

## 5. SEO 预留（P5）

- story 页面有数据时生成 **Article JSON-LD**：`headline / description / url / image(cover) / author(Person) / datePublished`——逐字段有数据才生成，无 author/publishedAt 不产生空字段。
- 无数据 → 不生成页面、不进 sitemap、不生成空 schema（实测 `stories/` 在 sitemap = 0）。
- canonical：现有 5 个抽查页全部不变。

## 6. Design System（P6）

- `components.css` 新增：`.hero-meta`（story hero 副信息行）、`.story-card`、`.story-meta`、`.author-badge`（含 accent 圆点）、`.hero--story`（min-height 与 hero--city 同级）；375px 下 `.cards` 单列规则已覆盖 story-card。零页面私有 CSS、零新颜色变量。

## 7. Build 验证（P7，全过）

| 项 | 结果 |
|---|---|
| 页面数量 | **47 = 47**（零增量） |
| sitemap | **47 条不变**；`stories/` = 0 |
| URL | 零变化（`/stories/` 无页面不产生） |
| canonical | 首页 / 东京 economy / 北京 budget / comfort / seasonal **全部不变** |
| grep 邮箱/公司 | 0 |
| `[object Object]` | 0 |
| `.html` 内链 | 0 |
| build.js | 已还原（无 `process.env.OUT_DIR` 残留） |
| 既有页面 | 东京 route-plan（canonical 未变）、北京 budget/comfort/seasonal 正常 |

## 8. 未修改内容确认

- URL / canonical / sitemap 逻辑：零改动。
- 东京 route-plan、北京 budget / comfort / seasonal 内容与渲染：零改动。
- 数据模型既有字段：零改动（story 为新增类型，未触碰任何既有实体）。
- 未 commit / push / deploy；未建 `data/stories` 内容；未接登录 / 评论 / 后台 / 数据库；未生成 `/stories/` 目录页。

## 9. 遗留与后续（未来 P7/P8，不在本期）

- 真实用户投稿 / 审核流（`status: draft` 预留）。
- 未来若上线故事：可加 `/stories` 聚合目录页（届时 sitemap 47→48，需显式决策）。
- UGC 的社区功能（评论/点赞/登录）需后端能力，不在 SSG 范围内。

---

P6 完成，暂停等待人工确认。未进入任何用户系统 / 内容生产阶段。
