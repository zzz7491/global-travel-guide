# Phase 19.2 — Paris Images Batch 1 报告

日期：2026-08-29
阶段目标：为 Paris 城市页 + 11 个景点补齐第一批真实本地图片（City Hero / City OG / 11×Attraction Hero / 11×Attraction OG = 24 张），并更新对应 JSON 图片字段。

## 1. 做了什么

### 图片来源（全部来自 Wikimedia Commons，逐项核对地点）
通过 Wikipedia `pageimages` 与 Commons 搜索 API 取得各条目真实主图，确认对应关系：

| slug | 对应真实地点 | Commons 文件 |
|------|-------------|--------------|
| city | 巴黎（埃菲尔铁塔自圣雅克塔视角） | La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques |
| eiffel-tower | 埃菲尔铁塔 | Tour_Eiffel_Wikimedia_Commons (cropped) |
| louvre | 卢浮宫 | Louvre_Museum_Wikimedia_Commons |
| montmartre | 蒙马特圣心堂 | Basilique_du_Sacré-Cœur_de_Montmartre |
| latin-quarter | 拉丁区 / 索邦 | Sorbonne,_Latin_Quarter |
| arc-de-triomphe | 凯旋门 | Arc_de_Triomphe,_Paris |
| centre-pompidou | 蓬皮杜中心 | Space_invader_centre_pompidu_metro_rambuteau (蓬皮杜中心立面) |
| musee-orsay | 奥赛博物馆 | Pont_Royal_and_Musée_d'Orsay |
| notre-dame | 巴黎圣母院 | Notre-Dame_de_Paris |
| seine-cruise | 塞纳河游船（Bateaux Mouches） | Paris_...Bateaux_Mouches_at_night |
| marais | 玛黑区 | Le_Marais @ Paris |
| versailles | 凡尔赛宫 | Vue_aérienne_du_domaine_de_Versailles |

> 说明：Centre Pompidou 与 Seine 的首轮 API/搜索结果（logo SVG、Vernon 非巴黎游船）均被排除，改用明确对应图。所有图均为巴黎真实地点，无京都/北京复用、无张冠李戴。

### 下载与转换
- 用 `Special:FilePath?width=2000` 轻量端点下载（Wikimedia 限流，已加延迟+重试；centre-pompidou 换备选候选后成功）。
- 用 Pillow `cover` 裁剪：Hero `1920×1080`、OG `1200×630`，统一输出 `.webp`（quality 82）。
- 全部 24 张尺寸校验通过（见第 4 节）。

### JSON 字段更新（仅图片字段，未改正文/SEO/Schema）
- `data/cities/france-paris.json`：`heroImage` 由远程 Unsplash 改为 `/assets/images/paris/city/city-hero.webp`，新增 `socialImage: /assets/images/paris/og/city-og.webp`。
- 11 个 `data/attractions/france-paris-*.json`：在 `lead` 后插入 `heroImage` 与 `socialImage`（本地 `/assets/images/paris/...` 路径）。
- 12 个文件均重新解析通过，路径前缀全部为 `/assets/images/paris/`。

## 2. 新增 / 修改

- 新增图片资产：`src/assets/images/paris/` 下 **24 个 webp 文件**（city 1 + og/city 1 + attractions 11 + og 11）。
- 修改数据文件：1 个城市 + 11 个景点（仅 heroImage/socialImage 字段）。
- 未修改：build.js、模板、核心渲染逻辑、京都/北京数据、巴黎已有正文内容。

## 3. 页面数量变化
- Build：**200 pages + sitemap.xml**（与 Phase 19.1 一致；本批仅补充图片，无新页面）。
- 巴黎 URL：28（city-path）+ 5 stories = 33，无异常变化。

## 4. 验证结果

| 检查项 | 结果 |
|--------|------|
| 24 张图片文件存在 | ✅ 24/24 |
| 尺寸正确（Hero 1920×1080 / OG 1200×630） | ✅ 0 异常 |
| Build 成功 | ✅ 200 页 |
| 巴黎页面 HTML 引用本地图 | ✅ 全部指向 `/assets/images/paris/...` |
| 本地图片引用 404 | ✅ 0（24 个引用全部存在） |
| `/assets/img/https://` 错误路径 | ✅ 全站 0 处 |
| City/Attraction OG 指向本地 | ✅ `og:image` = `/assets/images/paris/og/*.webp` |
| Kyoto / Beijing 数据被修改 | ✅ 无（git diff 仅 public HTML 换行符噪声，数据文件零改动） |
| 巴黎图片混入京都/北京 | ✅ 无 |

## 5. 剩余问题（均 NON-BLOCKER，记录不处理）
1. 城市页/景点页仍含少量其他城市（东京、伦敦、纽约、首尔、上海等）卡片的远程 Unsplash 图——来自共享导航/页脚“其它城市”模块，非巴黎图、非 404，不在 19.2 范围。
2. 4 个原始巴黎景点的 `image` 字段仍为远程 URL（用于相关推荐卡，相关逻辑优先用 heroImage 本地图，已生效）；可在后续图片阶段统一处理。
3. 巴黎 Gallery / Story / Seasonal 本地图尚未建设（属 Phase 19.3 范围）。

## 6. 结论
**PASS — Phase 19.2 Paris Images Batch 1**

- 实际图片数量：**24 张**（全部真实巴黎地点，尺寸规范，无 404）
- Build 页数：**200**
- 404 检查：**0**
- 异常：**无 BLOCKER**（仅上述 NON-BLOCKER 记录项）
- 报告路径：`design/phase19.2-paris-images-batch1-report.md`

未执行 Git commit / push / Cloudflare Deploy。

状态：暂停，等待下一步指令（建议 Phase 19.3 — Paris Gallery / Story / Seasonal 图片建设）。
