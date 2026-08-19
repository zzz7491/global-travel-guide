# Home-City Phase A 分析报告
## Global Travel Guide v2.0 首页与城市入口重构 · 只读分析

> 阶段：Phase 0（只读，未修改任何文件）
> 范围：为「表现层升级（Phase A）」提供依据；不动 URL / canonical / sitemap / type / 数据模型 / P0 / P0.5 / 东京 route-plan。

---

## 一、首页现状（基于代码 + 渲染产物实测）

| 检查项 | 现状 | 结论 |
|---|---|---|
| 首页模板 | `body-listing.html`（与目录页同模板）：`h1 + lead + {{#each sections}}(.block > .cards)` | **需要独立首页模板** `body-home.html` |
| 首页数据来源 | `data/home.json`（h1/lead/描述）+ `buildHomeSections(ctx)`（content.js:223）从 entities 派生 4 区块 | 派生机制保留；首页改为 bespoke 渲染 |
| hero 当前实现 | **无独立 hero 区**；视觉来自 `style.css` `body` 背景 `--hero-image` + 90% 不透明白渐变 | **需新增 `.hero` 组件区块**（不动 layout/body 背景） |
| destination section | 「世界目的地」国家+城市混排一张卡网 | 拆为 **国家→城市两级**（`buildHomeBody` 分两组） |
| route section | 「精选路线」纯文字卡列表 | 升级为 **Popular Routes + 旗舰路书大卡**（route-plan 实体） |
| 可复用组件 | `.cards/.card/.btn/.topnav/.site-footer/.section-block` | 需新增 hero/stats/dest/route/guide/season/empty/section-header/breadcrumb 组件 |

## 二、城市页现状

| 检查项 | 现状 | 结论 |
|---|---|---|
| city 模板 | `body-listing.html`（build.js:226 `buildListingBody(e, buildCitySections(e,ctx), tpl.listing)`） | **需独立 `body-city.html`** |
| buildCitySections | content.js:154 按 `country+city` 派生：景点攻略/路线规划/实用攻略/最佳旅行时间/完整路书（含 itineraries 过滤） | **复用为 hub 的数据输入**，不动函数 |
| 城市 JSON | `name/nameEn(东京有)/lead/description/continent(东京有)/language/currency/timezone(东京有)/related` | Phase A 不改数据；北京缺 nameEn/facts 时优雅降级（Phase B 补齐） |
| 当前城市页 HTML | h1 + lead + 5 组文字卡 | 升级为 City Travel Hub 九区（另保留 景点/攻略 两区防回归） |

## 三、设计系统现状与缺口

| 组件 | 现状 | Phase A |
|---|---|---|
| tokens/components/responsive | ✅ 三件套（topnav/footer/btn/table-scroll；keep-all/balance/移动端 footer） | 追加组件（见下） |
| `.hero/.stats-bar/.dest-card/.route-card/.guide-card/.season-card/.empty-state/.section-header/.breadcrumb/.badge` | ❌ 缺失 | **components.css 追加，全部引用 tokens，禁页面私有 CSS** |

## 四、关键结论（Phase A 执行依据）

1. **不改任何 URL / canonical / sitemap / type / 数据模型**：全部改动在「模板 + content.js 新增函数 + build.js 接线 + CSS」层。
2. **新增（纯表现层）**：`body-home.html`、`body-city.html`、`buildHomeBody()`、`buildCityBody()`、components.css/responsive.css 追加；build.js 首页/城市页接线 + 城市页 JSON-LD 加 TouristDestination（可选、无假数据）。
3. **复用（不动）**：`buildCitySections`（作为 hub 数据源）、`buildHomeSections`（保留）、`urlFor/linkUrl/buildBreadcrumb`、layout.html、P0/P0.5 全部成果、东京 route-plan。
4. **诚实降级**：统计用数据实计（Destinations=国家+城市、Curated Routes=路线+路书+itineraries、Guides=攻略数）；无图卡片用 tint 底色+文字；空态（Budget/Seasonal/Free/Traveler/Stories）优雅占位，**不制造虚假内容**。
5. **移动端**：hero 限高、卡片单列、H1 24–32px、正文 16px、无横向滚动（复用 overflow-x:hidden）。

> 本报告为只读产物，未修改任何文件。
