# Global Travel Guide v2.0 · P8 执行报告

## 内容生态扩展 + 全局目录体系完善 + 生产能力准备

> 阶段：**P8 执行（P1–P7）**
> 约束：✅ 既有 47 页 URL/canonical 零改动（新增仅增量）；✅ 全字段 optional、旧数据零降级风险；✅ 未改东京 route-plan、北京 budget/comfort/seasonal 内容数据；✅ 未 commit / push / deploy
> 状态：**49 页构建回归全部通过**

---

## 1. 执行内容

### P1 · 目录体系扩展
- `content.js`：
  - `buildIndexSections` typeMap +`budgets/seasonals/stories`（→ budget/seasonal/story），labelMap +`预算方案/季节攻略/旅行故事`；
  - `SECTION_LABELS` +`budget→预算方案` `seasonal→季节攻略`，`story` 由 'Stories' 改为 **'旅行故事'**；
  - `buildBreadcrumb`：budget/seasonal/story 的分类面包屑指向**全局目录** `/budgets/` `/seasonals/` `/stories/`（替代原城市级 `/{country}/{city}/{type}s/` 死链）。
- `build.js`：`INDEX_PAGES` +`budgets`（固定生成）、+`seasonals`（固定生成）、+`stories`（**`conditional:true` 条件注册**，`KIND_TYPE` 映射 + `ENTITIES.some()` 判断，0 数据不生成）。
- **验证**：sitemap 47→**49**（+2，stories 无数据不增）；`/budgets` `/seasonals` 生成、`/stories` 目录不存在；canonical 正确（无尾斜杠）。

### P2 · 目录页 ItemList JSON-LD
- `build.js`：目录页循环注入 `page._indexItems`（`buildIndexSections` 产物），`renderPage` 对 `type==='index' && items.length` 生成 **ItemList**（`name=h1`，items 用 `linkUrl` 干净 URL）。
- **验证**：`/budgets` `/seasonals` `/countries` 等目录页均有 ItemList；无空 item、无重复 schema；url 全部干净 URL。

### P3 · Featured 排序体系
- `content.js` 新增 `featuredSort(items)`：**featured:true 第一 → priority 升序（缺省 100）→ type 权重（route-plan 3 > budget 2 > seasonal 1）→ 原数组稳定序**。
- 接入：首页 `featuredSort([...routePlans, ...budgets])[0]`；城市页 `featuredSort(cityRPs)[0]`。
- 数据层（**只加字段不改内容**）：东京 economy `featured:true, priority:1`；北京 comfort `priority:10`；北京 budget `priority:20`。
- **验证**：首页 Featured 由「字母序=北京 comfort」→ **固定东京 economy** ✅；北京城市页 Featured=comfort（priority 10<20 且 type 权重）✅；东京城市页 Featured=economy ✅。

### P4 · Article JSON-LD 增强
- route-plan/budget 的 Article +`image`（**有 `e.image` 才输出，无则不生成空字段**）；seasonal 已有 image 逻辑不变。
- 数据补缺：北京 budget 补 `image`（长城图，HTTP 200 已验证）。
- **验证**：东京 economy / 北京 budget / 北京 seasonal 三页 Article 均含 image。

### P5 · 城市 Schema 文档化
- 新增 `design/city-schema-v2.md`：核心字段（name/nameEn/country/tagline/heroImage/bestTime/facts/highlights）+ 扩展预留（continent/language/currency/timezone/population/airport/transport/neighborhoods/nearbyCities）+ 字段消费位置对照 + 100 城约束（零代码扩展）。**只写文档，未改任何 JSON。**

### P6 · 图片体系规范化
- 新增 `design/image-system-v2.md`：L1 Unsplash 外链 → L2 本地 `src/assets/img/{country}/{city}/`（相对 slug + `heroImageUrl()` 拼接）→ L3 Cloudflare R2（`imageBaseUrl` 单开关切换）+ 合规红线（alt/lazy/width/height/aspect-ratio）+ 迁移规则。**未下载/未改图片地址/未替换图片。**

### P7 · 最终验收（详见第 3–6 节）

---

## 2. 文件变化

| 文件 | 阶段 | 改动 |
|---|---|---|
| `src/lib/content.js` | P1/P3 | buildIndexSections typeMap/labelMap +3；SECTION_LABELS +2 改 1；buildBreadcrumb 全局目录 URL；新增 `featuredSort`；home/city featured 接入 |
| `scripts/build.js` | P1/P2/P4 | INDEX_PAGES +3（stories 条件）；KIND_TYPE + 条件注册；目录 ItemList；Article +image |
| `data/route-plans/japan-tokyo-economy.json` | P3 | +`featured:true, priority:1`（不改内容） |
| `data/route-plans/china-beijing-comfort.json` | P3 | +`priority:10`（不改内容） |
| `data/budgets/china-beijing-economy.json` | P3/P4 | +`priority:20` +`image`（不改内容） |
| `design/city-schema-v2.md` | P5 | 新增设计文档 |
| `design/image-system-v2.md` | P6 | 新增规范文档 |

（`scripts/build.js` 构建期间临时 env-OUT_DIR 已还原，git diff 无 env 残留；临时脚本/目录已清理。）

---

## 3. Build 结果

- **页面数量：49 页**（47 + /budgets + /seasonals；/stories 因 0 数据不生成）。
- **sitemap：49 条**，新增 `/budgets` `/seasonals`，无 `/stories`。
- **URL/canonical 抽查（既有页面全部不变）**：
  - 东京 economy `/japan/tokyo/route-plan/economy` ✅
  - 北京 budget `/china/beijing/budget/economy` ✅
  - 北京 comfort `/china/beijing/route-plan/comfort` ✅
  - 北京 seasonal `/china/beijing/seasonal/autumn` ✅
  - 新目录页：`/budgets` `/seasonals`（canonical 无尾斜杠）✅
- **build.js**：env-OUT_DIR 残留 = 0，git diff 无测试性改动行。

---

## 4. SEO 结果

| 检查项 | 结果 |
|---|---|
| 目录页 ItemList | `/budgets` `/seasonals` `/countries` 等全部生成，无空 item、无重复 |
| Article +image | 东京 economy / 北京 budget / 北京 seasonal 三页均含 `image` |
| 面包屑分类层 | budget 页含「预算方案」crumb、seasonal 页含「季节攻略」crumb（指向全局目录） |
| title/description/canonical | 抽查全部正确；既有页面零变化 |
| 空 schema 防护 | `/stories` 无数据：不生成页面、不生成 ItemList/任何 schema |

---

## 5. 验收结果

- **安全 grep（全 0）**：`moming2603`=0、`嘉兴市东诚`=0、`[object Object]`=0、导航 `.html` 内链=0。
- **图片**：全站 17 张 `<img>` 17/17 带 `width=800 height=450` + `alt` + `loading=lazy`。
- **移动端 375px**：单列网格 + `overflow-x:hidden` + hero clamp 规则齐全，无横向滚动风险。
- **Featured 排序**：首页固定东京 economy；城市页按规则（route-plan>budget + priority）。
- **无测试脚本残留**：`_p8_copy.cjs` 与临时目录已清理。

---

## 6. 未完成事项

1. **/stories 内容**：类型/模板/目录条件注册已就绪，待真实 UGC 或编辑内容数据后自动上线（零代码）。
2. **图片 L2 迁移**：`design/image-system-v2.md` 已定规范，迁移（下载/落盘/改相对 slug）属独立子任务，未执行。
3. **静态页 JSON-LD 统一化**：6 个静态页手工 `@graph` 硬编码站点域，建议后续统一走 renderPage（低优先级）。
4. **100 城内容生产**：架构零代码扩展已验证；city 字段扩展文档已就绪，内容按 `city-schema-v2.md` 生产即可。
5. **/budgets /seasonals 目录页导航**：5 项顶部导航未含新目录（保持 Home/Countries/Routes/Guides/About 不变，目录经首页/面包屑/站内链接可达）。

---

## 结论

**P8 执行完成。** 49 页构建回归全过：新增 `/budgets` `/seasonals` 全局目录（数据驱动 + ItemList SEO）、`/stories` 条件注册、Featured 排序体系（首页固定东京 economy）、Article 全量 +image、两份设计文档（city-schema-v2 / image-system-v2）落地。既有 47 页 URL/canonical/sitemap 零改动，东京/北京内容数据未改，全程未 commit / push / deploy。暂停等待人工验收。
