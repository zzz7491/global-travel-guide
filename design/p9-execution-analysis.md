# Global Travel Guide v2.0 · P9 执行分析（Phase 0 产出）

## 100 城扩展基础设施建设 — 执行前锚点确认

> 阶段：**P9 Phase 0（只读，未修改任何文件）**
> 执行范围（已确认）：① 国家模型补齐 ② City Gallery 数据体系 ③ 北京对齐东京 ④ 生产工具
> 暂不执行：批次 1 新城市内容、L2/L3 图片迁移、R2 部署
> 状态：等待确认后进入 P1–P7

---

## 1. 修改锚点清单（全部实测）

### P1 · 国家模型标准化（纯数据层，零代码）

| 锚点 | 现状 | 改动 |
|---|---|---|
| `data/countries/china.json` | 缺顶层四件套/visa/transport/code | 补齐（只加字段） |
| `data/countries/japan.json` | 顶层四件套齐备 | +`code`/`visa`/`transport`（optional） |
| `buildCountrySections`（content.js:198） | 国家页=「热门城市」listing | **不改**（P1 仅数据层，国家页渲染不变，无数据不渲染） |
| `body-listing.html` | 国家页模板 | **不改** |

### P2+P3 · Gallery 数据体系与 Hub 模块

| 锚点 | 位置 | 改动 |
|---|---|---|
| `buildCityBody` return 对象（content.js:548-561） | `bestTime` 之后 | +`gallery` 映射（`city.gallery.map` 透传 src/alt/caption/type） |
| `body-city.html` | **38 行（About `{{/if}}`）与 40 行（`{{#each sections}}`）之间** | 插入 `{{#if gallery}}` City Gallery 区块（Hero→About→**Gallery**→Best Time 顺序符合要求） |
| `components.css` 尾部（424 行后） | 文件末尾 | +`.gallery-grid` `.gallery-card` `.gallery-caption`（全 tokens） |
| 现有城市 JSON | `data/cities/*.json` | 东京/北京 +`gallery[]`（optional） |

**Gallery 区块结构（body-city.html 插入）**：
```html
{{#if gallery}}
<section class="block home-block">
  <div class="section-header"><h2>City Gallery</h2></div>
  <div class="gallery-grid">
    {{#each gallery}}
    <figure class="gallery-card">
      <img class="card-img" width="800" height="450" src="{{src}}" alt="{{alt}}" loading="lazy" decoding="async">
      <figcaption class="gallery-caption">{{#if caption}}{{caption}}{{else}}{{alt}}{{/if}}</figcaption>
    </figure>
    {{/each}}
  </div>
</section>
{{/if}}
```

### P4 · 北京对齐（纯数据）

| 锚点 | 现状 | 改动 |
|---|---|---|
| `data/cities/china-beijing.json` | 有 nameEn/facts，无顶层四件套/gallery | +`continent/language/currency/timezone`（与 facts 同值）+`gallery[]`；其余内容零改动 |

### P5 · 生产工具（新增文件）

| 锚点 | 改动 |
|---|---|
| `scripts/validate-city-schema.js` | 新建：JSON 合法性 / 必填字段（id/type/country/city/name）/ slug 格式（小写连字符）/ 图片 URL（http 前缀）/ gallery 格式（src/alt/type∈5 枚举）/ 输出 PASS/FAIL；对 `data/cities/*` 全量跑通 |

### P6 · SEO 收口

| 锚点 | 位置 | 改动 |
|---|---|---|
| `scripts/build.js` TouristDestination（262-279） | `if (e.heroImage) td.image = e.heroImage;`（274 行） | 追加：`td.image` 合并 `heroImage + gallery[].src` 去重（有数据才输出） |

## 2. 数据驱动原则核对

- Gallery 区块 `{{#if gallery}}` 包裹 → **无 gallery 城市零影响**（现有 49 页不变）。
- gallery 元素 `src/alt/caption/type` 全 optional 透传 → 旧数据（无 gallery）自动隐藏。
- P1/P4 全部「只加字段」→ JSON 合法、内容不变、URL/canonical/sitemap 零影响。
- P6 有数据才输出 image[] → 无 gallery 城市 JSON-LD 与现状一致。

## 3. 验收口径（P7）

- Build **49 页不变**（零增量：无新页面类型、无新城市）。
- sitemap 49 不变、URL/canonical 零变化。
- 东京/北京城市页含 Gallery 区块 + 图；无 gallery 的页面不受影响。
- JSON-LD 正常（TouristDestination image[] 有数据才输出）。
- `[object Object]=0`；图片 alt/lazy/width/height 全合规；375px 无横向滚动。
- `scripts/validate-city-schema.js` 对 2 城 PASS。
- build.js 无 env 残留、无测试脚本。

## 4. 风险

- Gallery 图片 URL 需逐个 HTTP 200 验证（P2 要求）。
- 北京顶层四件套与 facts 同值需人工核对（不引入事实错误）。
- components.css 新增 3 类 → 确认无重名（已 grep：gallery* 不存在）。

---

*P9 Phase 0 完成，等待确认后进入 P1–P7。*
