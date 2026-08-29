# Phase 19.3 — Paris Gallery / Story / Seasonal Images 报告

日期：2026-08-29
前置阶段：Phase 19.2 已完成并 PASS（24 张 City/Attraction Hero + OG 已验证）。本阶段不重复 19.0～19.2 审计。

## 1. 实际缺口计算（基于当前 JSON 实际字段）

- **City Gallery**：`data/cities/france-paris.json` 的 `gallery` 含 4 个远程 Unsplash URL → 替换为 4 张本地 `paris/city/city-gallery-0N.webp`。
- **Attraction Gallery**：11 个景点 JSON 均无 `gallery` 字段 → 每个新增 2 张 → `paris/attractions/{slug}-gallery-0N.webp`（共 22）。
- **Story 图片**：5 个 Story 均无 `cover` 字段 → 每个新增 1 张 `paris/stories/{slug}-cover.webp`（同时写 `cover` 与 `heroImage`，遵循北京 schema；content.js 使用 `cover`）。
- **Seasonal 图片**：summer / autumn / winter 无 `heroImage` → 各 1 张 `paris/seasonals/{season}-hero.webp`（共 3）。spring 已有远程 Unsplash heroImage，属本阶段范围外，未改动（见第 5 节）。

实际新增图片总数：**34 张**（City Gallery 4 + Attraction Gallery 22 + Story 5 + Seasonal 3）。

## 2. 新增 / 修改

- 新增图片资产：`src/assets/images/paris/` 下 **34 个 webp 文件**（city 4 + attractions 22 + stories 5 + seasonals 3）。
- 修改数据文件：1 个城市 + 11 个景点 + 5 个 Story + 3 个 Seasonal（仅图片字段：`gallery` / `cover`+`heroImage` / `heroImage`）。
- 未修改：build.js、模板、核心渲染逻辑、京都/北京数据、巴黎已有正文、标题/description、已有 19.2 Hero/OG（已验证 12 张 OG、11 张景点 Hero、1 张 City Hero 原封未动）。

## 3. 图片来源与真实性

- 全部通过 Wikipedia `prop=images` 取得条目真实图片列表，再用 `prop=imageinfo`（iiurlwidth）取得真实缩略图地址（upload.wikimedia.org），逐项核对地点。
- 所有图片均为巴黎真实地点；无京都/北京复用、无张冠李戴、无占位图、无虚构景点照片。
- 跨景点未复用同一张照片；每张 gallery/cover/hero 均为独立真实照片。

## 4. 验证结果

| 检查项 | 结果 |
|--------|------|
| 新增图片文件存在 | ✅ 34/34 |
| 图片尺寸/格式正确（Gallery 1200×800 / Hero 1920×1080 / webp quality 82） | ✅ 0 异常 |
| 所有 JSON 可解析（20 个文件） | ✅ 0 解析失败 |
| 所有巴黎图片引用都能解析到实际文件 | ✅ 0 缺失 |
| Build 成功 | ✅ 200 页 + sitemap.xml |
| 页面数量保持 200 页（本阶段未新增页面） | ✅ 一致 |
| 全站本地巴黎图片引用 404 | ✅ 0（HTML 中 46 个巴黎图片引用全部命中） |
| `/assets/img/https://` 错误路径 | ✅ 全站 0 处 |
| Kyoto / Beijing 数据文件 | ✅ 无修改 |
| 京都 public HTML 变动 | ⚠️ 仅重建换行符噪声（与 19.2 一致，非数据改动） |
| Paris 图片全部属于巴黎 | ✅ 0 混入京都/北京 |
| 19.2 已有 24 张 Hero/OG 未被覆盖 | ✅ 验证通过 |

## 5. 剩余问题（均 NON-BLOCKER，记录不处理）

1. **centre-pompidou 与 marais 的专属 Wikipedia 页面在抓取阶段持续被 Wikimedia 限流（HTTP 429）**，其 gallery 与 marais-weekend 故事封面回退使用「Paris」条目图片池（真实巴黎照片，但非该具体地标专属图）。属真实巴黎图片，不影响交付，建议后续限流解除后补抓地标专属图。
2. **巴黎 spring seasonal 仍使用远程 Unsplash heroImage**（Phase 19.2 遗留，本阶段范围仅 3 个新季节）。非 BLOCKER，记录待后续统一本地化。
3. 城市页/景点页仍含少量其他城市（东京、伦敦、纽约等）卡片的远程 Unsplash 图——来自共享导航/页脚模块，非巴黎图、非 404（同 19.2 第 5 节记录项）。

## 6. 结论

**PASS — Phase 19.3 Paris Gallery / Story / Seasonal Images**

- 实际新增图片数量：**34 张**
- City Gallery 数量：**4**
- Attraction Gallery 数量：**22**
- Story 图片数量：**5**
- Seasonal 图片数量：**3**
- Build 页数：**200**
- 404 检查：**0**
- 异常：**无 BLOCKER**（仅上述 NON-BLOCKER 记录项）
- Git 状态：**未提交**（working tree 含本阶段修改，按规则未 commit / push / deploy）

状态：暂停，等待下一步指令。
