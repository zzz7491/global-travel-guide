# Phase 19.5.2 — Kyoto Story Image Blocker Fix (Candidate A, 同源)

**日期**: 2026-08-29
**授权范围**: 仅修复 5 个 Kyoto Story JSON 的错误 `/images/kyoto/...` 图片引用
**执行状态**: 全部通过（PASS）

---

## 1. 修复内容

将以下 5 个 Kyoto Story JSON 中的 `coverImage` 与 `socialImage`（对应页面封面/og:image）
错误本地引用 `/images/kyoto/X.webp`（路径缺 `assets/`、无对应资产、永久 404）
恢复为已验证 HTTP 200 的有效远程图：

`https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?auto=format&fit=crop&w=1200&h=630&q=80`

- `data/stories/japan-kyoto/arashiyama-morning.json`
- `data/stories/japan-kyoto/food-tour.json`
- `data/stories/japan-kyoto/gion-stay.json`
- `data/stories/japan-kyoto/hiking.json`
- `data/stories/japan-kyoto/spring-2026.json`

每个文件仅替换 `coverImage`/`socialImage` 字符串值，未改动其他字段/结构/正文/SEO/Schema。
（与 Phase 19.5.1 的 6 个 guide 修复完全同源、同值、同低风险。）

## 2. 验证结果

| 检查项 | 结果 |
|---|---|
| 5 个 Story JSON 解析 | ✅ 全部合法 |
| 数据残留 `/images/kyoto/`（无 assets） | ✅ 全站 data/ 已清零（NONE） |
| Build 总页数 | ✅ 200 pages + sitemap.xml |
| Kyoto 5 Story og:image | ✅ 全部变为有效远程图（不再 404） |
| Kyoto 全站 public 破引用 `"/images/kyoto/` | ✅ 0（33 处匹配均为正确的 `/assets/images/kyoto/`） |
| Paris 33 页（28+5） | ✅ 无回归；three-days OG 仍 200 |
| Beijing 数据/产物 | ✅ 未触碰（UNTOUCHED） |
| `/assets/img/https://` 错误路径 | ✅ 0 |
| Sitemap | ✅ 200 `<loc>`；Paris 28 + Stories 15 |
| build.js / content.js / 模板 | ✅ 未修改 |
| Git 修改范围 | ✅ 仅 5 个 Kyoto story 数据文件（+ 正常 Build 产物）；无其他 Kyoto/Paris/Beijing 数据改动 |

## 3. 累计结论（结合 19.5.1）

- Phase 19.5.1：修复 6 个 Kyoto Guide（PASS）
- Phase 19.5.2：修复 5 个 Kyoto Story（PASS）
- 至此，提交态既有的「`/images/kyoto/`（无 assets）」破图缺陷在 **data 层已全数清零**，
  Kyoto guide + story 共 11 个页面的封面/og:image 404 全部消除。

## 4. 状态

- 全部改动 working tree 未提交（遵守约束：不 Commit / Push / Deploy）。
- 未发现新的 Kyoto 异常；未扩大修改范围。
- **Kyoto 已完整干净，仓库已具备进入 Phase 19.6 Release 的条件。**

## 5. 可选后续（非本阶段，需另行授权）

仍记录的 NON-BLOCKER（不影响 Release）：
1. 9 个 Paris 页面回退默认站点通用 OG 图（best-time/budget/6 guides/romantic-paris）
2. Paris `spring` seasonal 的 heroImage 仍为远程 Unsplash
3. centre-pompidou/marais Gallery 用 Paris 图片池回退真实图
4. museum-route/route-plan-economy og:image 带 `-social.jpg` 畸形尾巴（实测 200）
5. Kyoto guide/story 现统一使用站点默认 OG 图（非京都专属），如需京都专属 OG 需另起图片生成任务。
