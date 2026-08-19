# P4 报告：Seasonal Type 骨架注册与系统接入
## Global Travel Guide v2.0 · 季节攻略能力建设（骨架阶段）

> 阶段：**P4 执行完成并通过验证**
> 约束遵守：✅ 未动东京 route-plan / 北京 budget / 北京 comfort route-plan / P0 / P0.5 / Phase A / Phase B / P1 / P2；✅ 未 commit / push / deploy；✅ safe-delete 绕行构建；✅ 未进入 P5 批量内容生产 / UGC / 用户系统 / 全局目录页。
> 前置：`design/p4-seasonal-phase0-analysis.md`（Phase 0 只读复核）。

---

## 1. 修改文件列表

| 文件 | 改动 |
|---|---|
| `src/lib/content.js` | `urlFor`/`linkUrl` +`seasonal` case（`/{country}/{city}/seasonal/{slug}`）；`LEAF_TYPES` +`seasonal`；**新增** `buildSeasonalBody()`；`buildHomeBody` seasons 合并 `best-time + seasonal` |
| `scripts/build.js` | `ENTITIES` +`loadDir(data/seasonals)`；`tpl.seasonal: readTpl('body-seasonal.html')`；渲染分支 +`seasonal → renderTemplate(tpl.seasonal, buildSeasonalBody())`；JSON-LD +`Article`（headline/description/url/image，无虚假日期） |
| `src/templates/body-seasonal.html` | **新增**：Seasonal Guide 模板（Hero + Season Overview / Weather & Best Time / Season Highlights / Events & Experiences / Travel Tips / 可选 blocks），全部 Design System 组件、零页面私有 CSS、375px 友好 |
| `data/seasonals/china-beijing-autumn.json` | **新增（1 条骨架验证样例）**：北京秋季，内容源自现有 best-time / Phase B 数据（不虚构），用于端到端验证 skeleton |

> `buildCitySections` seasonal 组与 `buildCityBody` 空态切换已在 P2 完成，本阶段仅验证无需改动。

## 2. Schema（`data/seasonals/`，全 optional、无数据不生成页面）

```jsonc
{ "type":"seasonal", "country":"", "city":"", "slug":"",
  "title":"", "description":"", "season":"", "months":[],
  "heroImage":"", "weather":"", "highlights":[], "events":[{"name","time","place","note"}],
  "tips":[], "blocks":[{"kind":"section","title":"","html":""}] }
```

## 3. 系统接入点

| 接入点 | 机制 |
|---|---|
| URL | `/china/beijing/seasonal/autumn`（urlFor/linkUrl +case） |
| 面包屑 | LEAF_TYPES 含 seasonal → 首页/国家/城市/末级 crumb 自动 |
| 城市 Hub | buildCitySections「季节攻略」组 + buildCityBody 真实/空态切换（P2 已就位） |
| 首页 | buildHomeBody `seasons = best-time + seasonal` → Seasonal Experiences 区块自动含秋季攻略 |
| sitemap | 实体自动收录（47 条，含 seasonal/autumn） |

## 4. SEO 验证

| 项 | 结果 |
|---|---|
| seasonal 页 title / description / canonical | ✅ `北京秋季攻略｜金秋北京怎么玩` / `…/china/beijing/seasonal/autumn` |
| JSON-LD | ✅ WebSite+Org+Breadcrumb + **Article**（headline「北京秋季旅行攻略」） |
| sitemap | ✅ 47 条自动收录 seasonal/autumn |
| 空页 | ✅ 无 seasonal 数据的城市不生成页面（仅北京有样例） |

## 5. Build 验证

- `node scripts/build.js`（临时 OUT_DIR + 写回 + 还原）→ **Built 47 pages**（46 + 1 seasonal）。
- 页面结构：Season Overview / Weather & Best Time / Season Highlights / Events & Experiences / Travel Tips / 季节玩法建议（blocks）全部渲染。
- 北京 Hub：Seasonal Guides 显示**真实卡**（`/china/beijing/seasonal/autumn`，非空态）。
- 首页：Seasonal Experiences 含北京秋季卡。
- grep：`[object Object]` = 0；邮箱/运营主体 = 0；`build.js` 环境残留 = 0。
- 既有页面未受影响：东京 economy / 北京 budget economy / 北京 comfort canonical 全部不变。

## 6. 未修改内容确认

- ✅ 东京 route-plan、北京 budget、北京 comfort —— 未动
- ✅ 既有 type / URL / canonical / sitemap 逻辑 —— 未动
- ✅ P0 / P0.5 / Phase A / Phase B / P1 / P2 成果 —— 未受影响
- ✅ 未批量生产季节内容（仅 1 条骨架验证样例，源自现有数据）
- ✅ 未 commit / push / deploy

## 7. 遗留事项（后续阶段）

1. **P5（内容生产）**：按城市扩充 seasonal 内容（东京春季/秋季等），自动进入 Hub / 首页 / sitemap，无需改代码。
2. **待确认**：`/seasonals` 全局目录页是否新增（当前未加，避免死链面包屑）。
3. **可选**：seasonal 页面可加更多 `blocks` 长文模块（模板已支持）。

> 结论：P4 完成——seasonal type 能力就位（注册/模板/接入/SEO 全链路），1 条骨架验证样例证明端到端可用，47 页 build 通过、零回归。**按要求暂停，等待确认。**
