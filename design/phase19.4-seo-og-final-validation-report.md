# Phase 19.4 — Paris SEO / OG Final Validation 报告

日期：2026-08-29
前置阶段：Phase 19.3 已完成并 PASS（34 张 Gallery/Story/Seasonal 本地图，Build 200 页）。本阶段不重复 19.0～19.3 审计，只针对 19.4 范围做只读检查 + 必要修复。

> 说明：用户提到"Paris 33 页面"，实际构成为 **28 个 `/france/paris/` 页面 + 5 个 `/stories/` 下的巴黎故事页**（Story 生成路径为 `/stories/{slug}.html`，不在 `/france/paris/` 下）。本报告按真实 33 个巴黎页面验证。

## 1. 检查范围与方法

- 只读检查 33 个巴黎页面的渲染 HTML：`<title>`、`meta description`、`<link canonical>`、`og:title`、`og:description`、`og:image`、`application/ld+json`。
- 检查全站 `/assets/img/https://` 错误路径。
- HEAD 实测所有远程 `og:image` URL 是否可达。
- 检查 Story `description` 是否使用 `summary` fallback。
- 检查 Sitemap 覆盖与 canonical 一致性。
- JSON-LD 全部 `json.loads` 校验合法性。
- 修复后重新 Build 并复验，确认无回归、京都/北京数据零改动、核心代码零改动。

## 2. 结果总览

| 检查项 | 结果 |
|--------|------|
| 33 页 title / description / canonical | ✅ 全部巴黎专属、正确 |
| 33 页 og:title / og:description | ✅ 与 title/description 一致 |
| og:image 存在性 | ✅ 33/33 均存在 |
| og:image 可达性 | ✅ 修复后 33/33 可达（见 §3） |
| `/assets/img/https://` 错误路径 | ✅ 全站 0 处 |
| Story description 使用 summary fallback | ✅ 5 个 story 均正确 |
| Seasonal 图片引用 | ⚠️ autumn/summer/winter 本地 webp；spring 仍远程 Unsplash（NON-BLOCKER，见 §5） |
| Sitemap 覆盖 | ✅ 28 个 `/france/paris/` URL + 5 个 `/stories/` 巴黎 URL，均为无扩展名 canonical 形式 |
| JSON-LD 合法性 | ✅ 抽样页面均合法（WebSite / Organization / BreadcrumbList，相关页含 Article / TouristDestination） |
| Kyoto / Beijing 数据改动 | ✅ 0 |
| build.js / 模板 / 核心代码改动 | ✅ 0 |
| Build | ✅ 200 页 + sitemap.xml（EXIT=0） |

## 3. 发现的 BLOCKER 与修复

### 问题：routes/three-days.html 的 og:image 返回 404

- 渲染值：`https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80-social.jpg` → **HTTP 404**
- 根因分析：JSON 中的 `image` 字段本身是**有效的** Unsplash 照片 ID（`photo-1522093007474-d86e9bf7ba6f` 裸 URL 实测 200）。但 `src/lib/content.js` 的 `resolveImagePath` 逻辑：远程 URL 若**不以图片扩展名结尾**，会追加 `-social.jpg`（或 `.jpg` / `.webp`）。该 URL 以 `q=80` 结尾，被追加 `-social.jpg` 后变成 `…q=80-social.jpg`，Unsplash 拒绝 → 404。
- 范围说明：这是 `content.js` 核心逻辑对"非扩展名结尾远程 URL"的系统性行为。按规则 19.4 **不修改核心代码**。本次仅 1 个巴黎页面实际破裂（three-days）；另两个带 `-social.jpg` 的 route/route-plan 远程图实测为 200，不受影响。

### 修复（数据层最小修改，不改核心代码）

将 `data/routes/france-paris-three-days.json` 的 `image` 字段改为**以 `.jpg` 结尾的等价 URL**：

```
"image": "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80.jpg"
```

- 该 URL 实测 **HTTP 200**。
- 因以 `.jpg` 结尾，`resolveImagePath` 会**直接采用**、不再追加后缀，渲染出 `…q=80.jpg`（200）。

### 复验

- three-days.html 渲染 og:image = `…q=80.jpg` → HEAD 实测 **200** ✅
- 全站 `/assets/img/https://` = 0 ✅
- Build 200 页，EXIT=0 ✅

## 4. 其余 og:image 分布（确认无其它破裂）

- **本地巴黎 webp（正确）**：11 个景点 OG、城市 OG、5 个 Story cover、autumn/summer/winter 季节性 hero —— 共 22 个本地图，均为既有资产，Build 期已验证存在。
- **远程但实测 200**：默认站点 OG（9 页共用，见 §5）、spring 季节性 hero、museum-route / route-plan-economy 的 `image`（带 `-social.jpg` 尾巴但实测 200）。
- **修复后无 404 og:image**。

## 5. 记录但**未处理**的 NON-BLOCKER（不擅自扩大范围）

1. **9 个巴黎页面回退到默认站点 OG 图**（通用远程 Unsplash `photo-1599571234909…`，实测 200，非巴黎专属）：`best-time`、`budget/economy`、6 个 guides、`routes/romantic-paris`。这些页面 JSON 无 `socialImage`/`heroImage`/`image` 字段，og:image 走 `site.defaultSocialImage` 兜底。图片有效、非破裂，但非巴黎专属。修复需为这些页面生成巴黎专属 OG 图（属图片生产任务，超出本阶段验证范围），记录待后续阶段。
2. **spring 季节性 heroImage 仍为远程 Unsplash**（Phase 19.2 遗留，19.3 已记录）。实测 200，非破裂。
3. **centre-pompidou / marais 的 Gallery 用 Paris 图片池回退**（真实巴黎照片，非地标专属；Phase 19.3 遗留）。非破裂。
4. **museum-route / route-plan-economy 的 og:image 带 `-social.jpg` 畸形尾巴**（resolveImagePath 系统性行为），实测 200，暂不影响；属核心逻辑范畴，不在 19.4 内改动。

## 6. 结论

**PASS — Phase 19.4 Paris SEO / OG Final Validation**

- 实际验证页面数：**33**（28 个 `/france/paris/` + 5 个 `/stories/` 巴黎故事）
- 修复 BLOCKER：**1**（three-days route og:image 404 → 已修复为可达 URL）
- 无其它破裂 og:image、无错误路径、Schema 合法、Sitemap 正确、京都/北京零影响
- 记录 NON-BLOCKER：4 项（均非破裂，待后续阶段或用户授权后处理）
- Build：200 页 + sitemap.xml
- Git 状态：**未提交**（working tree 含 19.3 遗留修改 + 本阶段 1 处数据修复；按规则未 commit / push / deploy）

状态：暂停，等待下一步指令。
