# Phase B 分析报告
## 城市数据增强与旅行视觉素材体系建设 · 只读分析

> 阶段：Phase 0（只读，未修改任何文件）
> 范围：为 Phase B（数据 optional 字段 + 图片体系）提供依据；不动 URL / canonical / sitemap / type / 既有字段 / P0 / P0.5 / Phase A / 东京 route-plan。

---

## 一、当前数据结构（实测）

| 实体 | 文件 | 现有关键字段 |
|---|---|---|
| country | `data/countries/{china,japan}.json` | id/type/country/name/nameEn/title/description/keywords/h1/lead（+日本含 continent/language/currency/timezone） |
| city | `data/cities/{china-beijing,japan-tokyo}.json` | id/type/country/city/name/nameEn(仅东京)/title/description/keywords/h1/lead/related（+东京含 continent/language/currency/timezone） |
| route | `data/routes/*.json`（5 个） | id/type/country/city/slug/title/description/keywords/h1/lead/blocks |
| guide | `data/guides/*.json`（8 个） | 同 route 结构（blocks） |
| route-plan | `data/route-plans/japan-tokyo-economy.json` | 12 模块旗舰；`cover` 为**对象**（tag/title/subtitle/tone/info，非图片 URL） |

**结论**：country/city/route/guide 均无图片字段；city 的 nameEn/facts 字段只有东京完整（北京缺，Phase A 已优雅降级）。

## 二、可新增的 optional 字段（全部可选，缺省即 fallback，不触碰已有字段）

| 实体 | 新增字段 | 说明 |
|---|---|---|
| city | `nameEn` | 英文名（北京补 Beijing） |
| city | `tagline` | 一句定位语（Hero 主文案，fallback→lead） |
| city | `heroImage` | Hero 大图 URL（string；fallback→site.heroImage） |
| city | `bestTime: {season, description}` | 最佳时间摘要（Best Time 区 + JSON-LD） |
| city | `facts: [{label, value}]` | 事实条（fallback→既有 continent/language/currency/timezone） |
| city | `highlights: []` | 城市亮点（About 区 chips） |
| city | `relatedCities: []` | 相关城市 id 列表（fallback→自动派生同国城市） |
| country | `heroImage` | 国家卡图 |
| route | `image` | 路线封面图 |
| guide | `category` | 指南分类（交通/住宿/美食/预算/贴士，卡片徽标） |

## 三、图片体系设计（Phase 4 约定）

```jsonc
// 统一图片字段（R2 就绪）——当前阶段用 string 简化：
"heroImage": "https://images.unsplash.com/photo-xxx?w=1200&q=80"  // 或未来 "https://img.mootlsv.com/tokyo.jpg"
// 完整对象形态（未来支持 alt/credit/source）：
"image": { "src": "", "alt": "", "credit": "", "source": "" }
```

- 加载约定：卡片图 `<img>` 一律 `loading="lazy"` `decoding="async"` + `aspect-ratio:16/9` + 必填 `alt`；Hero 用 CSS `background-image`（`--hero-image` 变量按页覆盖，失效时渐变兜底不破版）。
- 无图 fallback：卡片沿用 tint 底色 + 文字（Phase A 设计），**禁止空白**。

## 四、已验证图片源（Unsplash，HTTP 200）

| 用途 | 图片 ID | URL 模板 |
|---|---|---|
| 东京 city / 东京路线 | `photo-1542051841857-5f90071e7989` | `https://images.unsplash.com/{id}?auto=format&fit=crop&w=1200&q=80` |
| 北京 city / 北京路线 / 中国 | `photo-1508804185872-d7badad00f7d` | 同上 |
| 日本 country | `photo-1490806843957-31f4c9a91c65` | 同上 |
| 中国 country（现代天际线） | `photo-1537996194471-e657df975ab4` | 同上 |
| 备选（日本街道） | `photo-1503899036084-c55cdd92da26` | 同上 |

## 五、Phase B 执行要点

1. **只加不改**：数据层仅 merge 新 optional 字段；`content.js` 消费新字段时对缺省值全部 fallback。
2. **Hero 个性化**：tagline 数据驱动（Tokyo「未来都市与传统文化交织的日本首都」/ Beijing「千年历史与现代中国交汇之城」），模板不写城市文案。
3. **SEO**：TouristDestination 追加 image/availableLanguage/bestTime——**无数据不生成空字段**；卡片 `<img>` 必带 alt。
4. **验证**：Build 46 页；URL/canonical/sitemap 不变；抽查首页/东京/北京/国家页。

> 本报告为只读产物，未修改任何文件。
