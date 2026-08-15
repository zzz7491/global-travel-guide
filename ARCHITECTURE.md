# Architecture — Global Travel Guide

> 当前为 **纯静态** 站点：Cloudflare Pages 直接托管 `scripts/build.js` 生成的
> `public/`。本文件说明内容模型与目录设计，以及如何 **不改动内容模型**、平滑
> 扩展到 Cloudflare 生态（D1 / R2 / Workers / AI）。

---

## 1. 设计目标

| # | 要求 | 当前做法 |
|---|------|----------|
| 1 | 清晰内容模型：国家 / 城市 / 景点 / 路线 / 最佳旅行时间 | `data/*.json` 单一数据源 |
| 2 | HTML 页面结构不写死数据逻辑 | 数据与展示分离：模板只放 `{{token}}`，逻辑在 `src/lib/content.js` |
| 3 | 未来平滑迁移到 D1 + Workers 动态生成 | 渲染层（URL 映射 / 图片解析 / 区块渲染）与数据来源解耦 |
| 4 | 图片资源预留 R2 迁移路径 | `site.imageBaseUrl` 一处切换（本地 `/assets/img` → R2 域名） |
| 5 | 现在**不**引入数据库 | 构建期读 JSON，`public/` 全量生成 |
| 6 | 先做可扩展静态架构 | 共享 ESM 模块，Worker 直接复用 |

---

## 2. 内容模型（单一数据源）

所有内容都在 `data/`，每个文件是一个「实体」。字段即未来 D1 表的列。

| 类型 `type` | 文件目录 | 关键字段 | 未来 D1 表 |
|-------------|----------|----------|------------|
| `home` | `data/home.json` | sections | （生成首页，不入表） |
| `country` | `data/countries/*.json` | country, name, sections_json | `countries` |
| `city` | `data/cities/*.json` | country, city, name, related | `cities` |
| `attraction` | `data/attractions/*.json` | slug, blocks, image | `attractions` |
| `route` | `data/routes/*.json` | slug, blocks | `routes` |
| `guide` | `data/guides/*.json` | slug, blocks | `guides` |
| `best-time` | `data/best-times/*.json` | blocks | `best_times` |

嵌套结构（区块、章节、关联）统一以 **JSON 文本** 存储：
- `blocks`: `[{kind:"section"|"notes"|"related", title, html|items|refs}]`
- `sections`: `[{title, items:[{title,desc,url}]}]`
- `related`: `["<entity-id>", ...]`

> 新增一篇攻略 = 在 `data/guides/` 加一个 JSON。**无需改任何 HTML/模板**，城市落地页的「实用攻略」栏目会自动出现该卡片。

---

## 3. 目录布局

```
.
├── data/                     # 内容模型（JSON，未来 D1 种子）
│   ├── site.json             # 站点级配置：siteUrl / brand / imageBaseUrl / nav
│   ├── home.json
│   ├── countries/  cities/  attractions/  routes/  guides/  best-times/
├── src/
│   ├── templates/
│   │   ├── layout.html        # 共享骨架（SEO meta / nav / hero / footer）
│   │   ├── body-content.html  # 内容页正文（景点/路线/攻略/最佳时间）
│   │   ├── body-listing.html   # 列表页正文（国家/城市落地页）
│   │   └── render.js          # ⭐ 零依赖模板引擎（Node & Worker 共用）
│   ├── lib/
│   │   └── content.js         # ⭐ 内容逻辑（URL 映射/图片解析/区块渲染）
│   ├── assets/css/style.css   # 共享主题
│   └── static/                # 长图文页（路书）原样拷贝，不入数据模型
│       └── china/beijing/{normal,budget}.html
├── scripts/build.js          # 构建入口（ESM，清空 public/ 后全量生成）
├── migrations/0001_init.sql  # D1 建表（与 JSON 模型 1:1 对应）
├── wrangler.toml             # Cloudflare 生态预留配置（当前全注释）
├── public/                   # ⚙️ 生成产物，由 Pages 托管（构建期全量覆盖）
└── package.json              # "type":"module", "build":"node scripts/build.js"
```

---

## 4. 构建流程（`scripts/build.js`）

```
data/*.json ──► INDEX (id→实体)
     │
     ├─ urlFor(e)              # 类型 → URL（与未来 Worker 路由参数一致）
     ├─ heroImageUrl / ogImage # R2 就绪图片解析
     ├─ buildContentBody       # 内容页：blocks → 区块 HTML
     ├─ buildCitySections      # 城市页：从数据模型推导栏目（无硬编码卡片）
     └─ buildListingBody       # 国家/城市列表页
            │
            ▼
   render.js 渲染 layout + body → public/**.html
   + copyDir(src/static) + copyDir(src/assets) + sitemap.xml
```

构建会先 **清空 `public/`** 再全量生成，避免旧手工结构的孤儿文件残留。

运行：

```bash
npm run build        # 或 node scripts/build.js
```

---

## 5. 模板引擎（零依赖）

`src/templates/render.js` 支持 4 种 token，**纯函数、无 `fs`/`process`**，因此
Node 与 Workers 运行时通用：

```
{{var}}        转义输出变量
{{{raw}}}       原样输出（用于预渲染的区块 HTML）
{{#each name}}  … {{/each}}    遍历数组
{{#if cond}}    … {{else}} … {{/if}}   条件
```

模板只负责排版，所有数据逻辑都在 `src/lib/content.js`。这意味着「改数据结构」
与「改页面长相」互不影响。

---

## 6. R2 图片迁移路径

`site.json` 中：

```json
"imageBaseUrl": "/assets/img"
```

- 现在：图片放 `src/assets/img/<key>.jpg`，`heroImageUrl` 输出 `/assets/img/<key>.jpg`。
- 迁移 R2 时：把图片上传到 R2 桶，绑定自定义域（如 `img.mootlsv.com`），
  仅把 `imageBaseUrl` 改为 `"https://img.mootlsv.com"`。**模板与渲染代码零改动。**

`wrangler.toml` 已预留 `[[r2_buckets]]`（binding `IMAGES`，建议桶 `global-travel-guide-img`）。

---

## 7. 平滑迁移到 D1 + Workers（动态生成）

> 目标：把「构建期读 JSON」换成「请求期查 D1」，**不改内容模型、不改模板**。

### 步骤 1 — 建库与建表
```bash
npx wrangler d1 create global-travel-guide
npx wrangler d1 execute global-travel-guide --file=./migrations/0001_init.sql
```

### 步骤 2 — 把 JSON 灌入 D1（一次性种子）
写一个小脚本遍历 `data/*.json`，按 `type` 写入对应表，`blocks/sections/related`
以 `JSON()` 存入 `*_json` 列。内容模型无需任何调整。

### 步骤 3 — 启用 `wrangler.toml` 的 D1 / R2 绑定
取消注释 `[[d1_databases]]`（binding `DB`）与 `[[r2_buckets]]`（binding `IMAGES`）。

### 步骤 4 — 添加 Pages Functions（复用渲染层）
在 `functions/` 下放置渲染函数，例如
`functions/[country]/[city]/attractions/[slug].html.js`：

```js
import { renderTemplate } from "../../../../../src/templates/render.js";
import {
  urlFor, heroImageUrl, ogImage, buildContentBody,
} from "../../../../../src/lib/content.js";

export async function onRequest({ params, env }) {
  const row = await env.DB
    .prepare("SELECT * FROM attractions WHERE slug=? AND country=? AND city=?")
    .bind(params.slug, params.country, params.city).first();
  if (!row) return new Response("Not found", { status: 404 });

  const e = { ...row, blocks: JSON.parse(row.blocks_json) };
  const ctx = {
    site: SITE, index: await loadIndex(env.DB),
    entities: await loadAll(env.DB), home: HOME_PAGE, itineraries: ITINERARIES,
    tpl: { content: await loadTpl("body-content.html"), /* … */ },
  };
  const body = buildContentBody(e, ctx);     // ← 与静态构建完全相同的渲染
  return new Response(renderTemplate(layout, { /* … */ bodyHtml: body }),
    { headers: { "content-type": "text/html; charset=utf-8" } });
}
```

`urlFor` / `heroImageUrl` / `ogImage` / `buildContentBody` **原样复用**，
只有「数据从哪来」变了。SEO、`sitemap`、城市落地页推导逻辑全部保持一致。

### 步骤 5 — 渐进切换
可先让 Functions 仅覆盖少数动态页，其余仍由 `public/` 静态托管；验证无误后
逐步把渲染全部交给 Worker，最终 `scripts/build.js` 退化为「种子/预览」工具。

---

## 8. AI 服务（未来）

同一套 Workers 入口可挂载 AI 能力，例如：
- **智能行程生成**：调用 Workers AI，根据城市/天数/偏好动态生成 `route` 内容。
- **内容翻译**：D1 行 + AI 翻译，按需输出多语言落地页。
- **摘要/SEO 文案**：在 Functions 层用 AI 补全 `description` / `lead`。

因为渲染层与数据层已解耦，AI 产出的内容只要符合 JSON 模型字段，即可直接喂给
`buildContentBody` 渲染，无需新增页面模板。

---

## 9. 本地构建 / 部署 / 提交

```bash
# 1) 本地构建并预览
npm run build
npx wrangler pages dev public        # 或任意静态服务器

# 2) Cloudflare Pages 构建设置
#    Build command : node scripts/build.js
#    Output dir    : public

# 3) 提交（先本地 commit；push 需用户确认）
git add -A
git commit -m "feat: extensible static architecture (data model + SSG + D1/R2 scaffolding)"
```

> 约束（来自历史约定）：不使用 `git reset`；不使用 PAT；除新增子域外不改
> Cloudflare / DNS。提交后如需推送，请显式确认。
