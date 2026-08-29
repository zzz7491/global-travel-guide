# Phase 19.5.1 — Kyoto Image Blocker Fix (Candidate A)

**日期**: 2026-08-29
**授权范围**: 仅修复 6 个 Kyoto Guide JSON 的错误 `/images/kyoto/...` 本地图片引用
**执行状态**: 授权部分 PASS；执行中发现新异常，按规则停止，未扩大范围

---

## 1. 已完成的修复（授权范围）

将以下 6 个 Kyoto Guide JSON 中的错误本地引用 `/images/kyoto/X.webp`
（路径缺 `assets/`，且无对应资产，永久 404）恢复为 HEAD 提交前实际使用的
有效远程图 `https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?auto=format&fit=crop&w=1200&h=630&q=80`
（已实测 HTTP 200）：

- `data/guides/japan-kyoto-accommodation.json`
- `data/guides/japan-kyoto-culture-etiquette.json`
- `data/guides/japan-kyoto-food.json`
- `data/guides/japan-kyoto-shopping.json`
- `data/guides/japan-kyoto-tips.json`
- `data/guides/japan-kyoto-transport.json`

每个文件仅替换 `image`/`socialImage` 字符串值，未改动其他字段/结构/正文/SEO/Schema。

## 2. 验证结果（Build 后）

| 检查项 | 结果 |
|---|---|
| 6 个 Kyoto Guide og:image | ✅ 全部变为有效远程图（不再 404） |
| JSON 解析 | ✅ 6 个文件全部合法 |
| 数据残留 `/images/kyoto/`（无 assets） | ✅ 6 个 guide 文件已清零 |
| Build 总页数 | ✅ 200 pages + sitemap |
| `/assets/img/https://` 错误路径 | ✅ 0 |
| Sitemap | ✅ 正常（Paris 28 + stories 15，总计 200 `<loc>`） |
| Paris 33 页面（28+5） | ✅ 无回归；three-days OG 仍 200 |
| Beijing 数据/产物 | ✅ 未触碰（UNTOUCHED） |
| build.js / content.js / 模板 | ✅ 未修改 |
| Git 修改范围 | ✅ 仅 6 个 Kyoto guide 数据文件（其余 data 改动均为 Paris 19.2/19.3 遗留、本次未动） |

## 3. ⚠️ 新发现的 Kyoto 异常（按规则已停止，未修复）

验证过程中发现：**除 6 个 guide 外，还有 5 个 Kyoto Story JSON 使用了完全相同的错误路径
`/images/kyoto/...`（无 `assets/`）**，且已在构建产物中渲染为破图：

- `data/stories/japan-kyoto/arashiyama-morning.json`
- `data/stories/japan-kyoto/food-tour.json`
- `data/stories/japan-kyoto/gion-stay.json`
- `data/stories/japan-kyoto/hiking.json`
- `data/stories/japan-kyoto/spring-2026.json`

Build 后 `public/stories/*.html` 中这 5 个页的 `og:image` 仍为：
`/images/kyoto/kyoto-story-*-cover-placeholder.webp` / `kyoto-cover-*-cover-*.webp`
→ 线上封面/OG 图 404。

**根因同源**：与 guide 一致，均为「数据路径错误（`/images/` 缺 `assets/`）+ 资产缺失」，
属提交态既有的预存在缺陷。此前 Phase 19.5 调查因 `--include="*kyoto*.json"` 通配符
（story 文件名如 `food-tour.json` 不含 "kyoto"）而漏检，本次校验才暴露。

**按用户规则「出现新的 Kyoto 异常立即停止，不扩大修改范围」，已停止，未修改这 5 个文件。**

## 4. 对 Phase 19.6 的影响

- 若仅以「授权 6 guide」为范围：Kyoto guide 已修复，但 **Kyoto story 仍有 5 页 404**，
  整体仓库尚不具备无 BLOCKER 进入 Release 的条件。
- 建议：单独授权「Kyoto Story 同源修复（候选 A）」——将这 5 个 story 的
  `/images/kyoto/...` 引用同样改为有效远程图（或已有可用的 `socialImage`/`heroImage`），
  与本次 6 guide 同理、同范围、同低风险。修复后 Kyoto 才完整干净。

## 5. 当前状态

- 6 个 Kyoto guide 修复已落地（working tree 未提交），经 Build 验证有效。
- 5 个 Kyoto story 破图问题已定位、已报告，**等待授权**。
- 未 Commit / Push / Deploy（遵守约束）。
- 下一步：等待用户对「Kyoto Story 同源修复」的授权，后再评估 Phase 19.6 Release 条件。
