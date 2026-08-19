# 🌏 Global Travel Guide

> 一个数据驱动、静态生成、面向全球城市旅行规划的内容平台。

---

## ✨ 项目简介

**Global Travel Guide** 是一个以「城市旅行规划」为核心的国际化内容平台：从目的地探索、城市信息、路线路书、预算方案到季节攻略，全部由 **JSON 数据驱动 + 静态站点生成**，为旅行者提供结构化、可执行的出行参考。

- **项目目标**：把「攻略集合」升级为「旅行规划入口」——用户 3 秒内找到目的地，1–2 次点击触达一条深度路书。
- **解决的问题**：传统攻略站内容散乱、无层级、难扩展；本平台以统一数据模型 + 自动派生页面，让内容生产与站点扩展完全解耦。
- **面向用户**：计划自由行的旅行者；以及希望按统一标准批量生产城市内容的内容团队。
- **当前版本**：**v2.0 Foundation Release**（基础平台已定型，正在向 100 城规模化扩展）。

## 🌍 核心功能

- 🏠 **首页旅行探索入口**：Hero + 精选目的地 + 旗舰路书 + 指南聚合
- 🏙️ **城市 Travel Hub**：每城一个主页（Hero / About / Gallery / Best Time / 路线 / 预算 / 季节 / 攻略 / Stories）
- 🗂️ **国家 / 城市目录**：`/countries`、`/cities` 全局目录，自动收录
- 🗺️ **路线规划 Route Plan**：5 日经济版 / 舒适版等深度路书（含时间轴、图表）
- 💰 **经济旅行 Budget Plan**：分档预算方案（经济 / 平衡 / 完整）
- 🍂 **季节旅行 Seasonal Guide**：按季节与月份精选玩法
- 📖 **Traveler Stories 内容生态预留**：UGC 故事类型/模板已就绪，待内容上线（无虚假内容）
- 🖼️ **Gallery 图片体系**：城市图集（hero / gallery[]），alt + lazy + 显式尺寸全合规
- 🔍 **SEO 优化**：canonical / sitemap / BreadcrumbList / ItemList / TouristDestination / Article JSON-LD
- ⚡ **静态站点生成**：纯静态输出，全球 CDN 托管，零服务器成本

## 🏗️ 技术架构

| 层 | 技术 |
|---|---|
| 静态站点生成 | 自研 Node ESM SSG（`scripts/build.js`，零依赖） |
| 数据驱动 | 全部内容存于 `data/*.json`，页面由数据自动派生 |
| 模板引擎 | 轻量 `{{var}}` / `{{#each}}` / `{{#if}}` 模板（`src/templates/render.js`） |
| Design System | `tokens.css` + `components.css` + `responsive.css` 三件套（单一视觉来源） |
| 部署 | Cloudflare Pages（Git 集成自动构建发布） |

```
global-travel-guide/
├── data/            # 内容数据（countries / cities / routes / guides / route-plans / budgets / seasonals / stories）
├── src/
│   ├── templates/   # HTML 模板（layout / home / city / route-plan / seasonal / story）
│   ├── lib/         # 内容逻辑（content.js：URL、面包屑、区块派生、JSON-LD）
│   ├── design-system/  # Design System 三件套
│   ├── static/      # 静态页（about / contact / privacy / terms 等）
│   └── assets/      # 静态资源
├── scripts/         # build.js（构建）/ validate-city-schema.js（城市数据校验）
├── design/          # 产品与架构设计文档
├── public/          # 构建产物（部署目录）
└── package.json
```

## 📊 当前版本

**Version:** `v2.0 Foundation Release`

**Pages:** `49 pages`

包含内容类型：

- ✅ Home（首页探索入口）
- ✅ Countries（国家页 + 全局目录）
- ✅ Cities（城市 Travel Hub + 全局目录）
- ✅ Routes（路线页）
- ✅ Budget（经济预算方案 + `/budgets` 目录）
- ✅ Seasonal（季节攻略 + `/seasonals` 目录）
- ✅ Stories Architecture（类型/模板/目录条件注册已就绪，待内容）

## 📁 数据结构

所有内容均为 JSON 文件，按类型存放于 `data/`：

```
data/
├── countries/     # 国家（code / continent / language / currency / timezone / visa / transport）
├── cities/        # 城市（nameEn / tagline / heroImage / gallery / facts / highlights / bestTime）
├── attractions/   # 景点
├── routes/        # 路线
├── guides/        # 实用攻略
├── best-times/    # 最佳旅行时间
├── route-plans/   # 旗舰路书（多日时间轴 + 预算 + 图表）
├── budgets/       # 预算方案
├── seasonals/     # 季节攻略
└── stories/       # 旅行者故事（预留）
```

城市数据示例（`data/cities/france-paris.json` 风格）：

```jsonc
{
  "id": "france-paris",
  "type": "city",
  "country": "france",
  "city": "paris",
  "name": "巴黎",
  "nameEn": "Paris",
  "tagline": "浪漫之都与艺术之都的完美融合",
  "heroImage": "https://…",              // hero 大图（L1 外链 / L2 本地 / L3 R2）
  "gallery": [                            // 城市图集（可选）
    { "src": "https://…", "alt": "巴黎 埃菲尔铁塔", "credit": "Unsplash" }
  ],
  "facts": [                              // 城市事实条（或顶层 continent/language/currency/timezone）
    { "label": "Language", "value": "法语" }
  ],
  "highlights": ["埃菲尔铁塔", "卢浮宫", "塞纳河"],
  "bestTime": { "season": "春季（4-6月）", "description": "气候宜人……" }
}
```

> 全部字段 **optional**：缺少任一字段时页面自动降级（区块隐藏 / 优雅空态），不会产生空页面或报错。

## 🧩 扩展能力

- 🏙️ **100+ 城市扩展**：新增城市只需添加 `country.json` + `city.json`（+ 可选子实体），**零核心代码改动**
- ⚙️ **自动生成**：城市 Hub、国家页、目录页、sitemap、SEO Schema（Breadcrumb / ItemList / TouristDestination / Article）全部数据驱动自动派生
- 🧪 **数据校验**：`scripts/validate-city-schema.js` 检查必填字段 / slug 格式 / 图片 URL / gallery 结构，输出 PASS/FAIL
- 🖼️ **图片体系三层演进**：Unsplash 外链 → 本地图库 → Cloudflare R2（`imageBaseUrl` 单开关切换）

## 🚀 本地开发

```bash
# 安装依赖（当前零第三方依赖，Node >= 20 即可）
npm install

# 构建静态站点到 public/
npm run build

# 本地预览构建产物（任选静态服务器）
npx serve public
```

开发流程：修改 `data/*.json` 或 `src/templates/` → `npm run build` → 刷新 `public/` 产物。

## ☁️ 部署

部署于 **Cloudflare Pages**（Git 集成，push 至 `main` 自动构建发布）：

| 配置 | 值 |
|---|---|
| 构建命令 | `npm run build` |
| 输出目录 | `public` |
| 生产域名 | `travel.mootlsv.com` |

## 🛣️ Roadmap

**已完成：**

- [x] Foundation Architecture（SSG + 数据模型 + 模板引擎）
- [x] Design System（tokens / components / responsive）
- [x] Home / City Hub（首页探索入口 + 城市主页）
- [x] Route Plan（旗舰路书）
- [x] Budget（预算方案）
- [x] Seasonal（季节攻略）
- [x] Gallery（城市图集体系）
- [x] SEO System（JSON-LD / sitemap / canonical）

**规划中：**

- [ ] 100 城扩展（巴黎 / 伦敦 / 纽约为首批）
- [ ] 城市批量生产工具
- [ ] 图片 CDN / R2 迁移
- [ ] Traveler Stories 用户内容上线
- [ ] 多语言支持（i18n）

## 🤝 Contribution

欢迎参与共建：

- 🏙️ **城市内容贡献**：按 `design/city-content-standard-v1.md` 规范提供城市 JSON 数据
- 📊 **数据完善**：补充景点 / 路线 / 攻略 / 预算 / 季节内容
- 🌐 **翻译**：英文等语言的内容本地化
- 🖼️ **图片资源**：合规图源贡献与整理

请提交 PR 前运行 `npm run build` 与 `node scripts/validate-city-schema.js`（城市数据校验）确保通过。

## 📄 License

MIT License
