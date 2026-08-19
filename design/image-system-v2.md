# Global Travel Guide v2.0 · Image System v2

> 图片资源体系规范（100 城规模化）
> 状态：**规范文档**（P8-P6），本阶段不迁移图片、不下载、不改现有地址。

---

## 1. 现状（P7 验收后）

| 项 | 现状 |
|---|---|
| 图源 | Unsplash 完整 URL 直接写入 JSON（`heroImage` / `image` 字段） |
| 卡片图 | 全站 17 张 `<img>`：`width=800 height=450` + `alt` + `loading=lazy`（合规） |
| Hero | `layout.html:24` `--hero-image:url("{{heroImageUrl}}")` CSS 背景；city 页内联 `--hero-image` |
| 预留结构 | `site.imageBaseUrl: "/assets/img"` + `heroImageUrl()/ogImage()` 函数（`content.js:108-116`） |
| 数量预估 | 每城 2–3 图（hero 1600×900 + card 800×450 + 可选 social 1200×630）→ 100 城 ≈ 200–300 对象 |

## 2. 三层演进

### L1 · Unsplash 外链（当前）

- 适用：0–30 城验证期。
- 写法：JSON 直接存完整 URL：
  ```jsonc
  "heroImage": "https://images.unsplash.com/photo-xxx?auto=format&fit=crop&w=1600&q=80"
  ```
- 约束：卡片图统一 `w=800&q=70`，hero 统一 `w=1600&q=80`；alt 用「城市名+主题」模板（如 `东京 旅行目的地`）。
- 风险：外链稳定性依赖 Unsplash；无品牌视觉资产沉淀。

### L2 · 本地图库（推荐规模化前落地）

- 目录约定：
  ```
  src/assets/img/{country}/{city}/hero.jpg      # 1600×900
  src/assets/img/{country}/{city}/card.jpg      # 800×450
  src/assets/img/{country}/{city}/social.jpg    # 1200×630（og:image，可选）
  ```
- 数据写法（相对 slug，由 `heroImageUrl()` 拼接）：
  ```jsonc
  "heroImage": "japan/tokyo/hero"        // → {imageBaseUrl}/{slug}.jpg
  "image":     "japan/tokyo/card"
  ```
- 单开关：`site.imageBaseUrl` 改为 `/assets/img`（**已是当前值**，L2 即「把数据从完整 URL 改为相对 slug + 图落盘」）。
- 收益：零外链、可自管版权、build 产物自带图（`copyDir(ASSETS_DIR)` 已含 assets）。

### L3 · Cloudflare R2（规模期）

- 结构：R2 public bucket 域名（如 `https://img.mootlsv.com`）→ 把 `site.imageBaseUrl` 改成 R2 域名（**单开关切换，零代码改动**）。
- 对象命名与 L2 一致：`{country}/{city}/hero.jpg`、`{country}/{city}/card.jpg`、`{city}-social.jpg`。
- 迁移方式：L2 目录整体上传 R2 → 改 `imageBaseUrl` → 验证 → 保留本地兜底。

## 3. imageBaseUrl 迁移规则

```jsonc
// data/site.json
"imageBaseUrl": "/assets/img"                    // L1/L2：本地静态资源
"imageBaseUrl": "https://img.mootlsv.com"        // L3：R2 public bucket
```

- `heroImageUrl(e, site)`：`e.image` 存在 → `${imageBaseUrl}/${e.image}.jpg`；否则 `site.heroImage`。
- `ogImage(e, site)`：`socialImage` → `image-social` → `defaultSocialImage` 三级回退。
- **迁移顺序**：数据层（完整 URL → 相对 slug）→ 图落盘（L2）→ 上传 R2（L3）。任何一步回滚只需还原 `imageBaseUrl`。

## 4. 图片合规红线（所有层级通用）

1. 每张 `<img>`：`alt`（必填，语义化）+ `loading="lazy"` + `width`/`height`（显式尺寸防 CLS）+ CSS `aspect-ratio:16/9`。
2. Hero 用 CSS 背景（非 `<img>`），不占 LCP 预算外资源。
3. 无图数据 → 组件隐藏（`{{#if image}}`）或全局 `SITE.heroImage` 兜底，**禁止留空 src / 假图占位**。
4. 图片版权：L1 仅用 Unsplash 许可图；L2/L3 自管素材需留存授权记录。

## 5. 本阶段（P8-P6）结论

- **不迁移**：不下载图片、不改现有 17 张图地址、不新增图库目录。
- **已固化的能力**：`imageBaseUrl` 单开关 + `heroImageUrl()/ogImage()` 双函数 + L2 目录约定，为 100 城图片管理提供零重构迁移路径。

---

*规范文档（P8-P6），未迁移任何图片。*
