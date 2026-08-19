# Global Travel Guide v2.0 · City Schema v2

> 城市实体数据模型规范（100 城规模化扩展）
> 状态：**设计文档**（P8-P5），仅定义字段约定，不修改任何现有 JSON。

---

## 1. 设计原则

1. **全部字段 optional**：城市 JSON 只需 `id/type/country/city/name` 即可构建页面，其余字段缺失时页面优雅降级（模板 `{{#if}}` 自动隐藏区块）。
2. **展示层零依赖**：新增字段不要求模板改动——Hub 各区块按「有数据才显示」设计。
3. **不删除既有字段**：`id/type/country/city/name/nameEn/title/description/keywords/h1/lead/related` 为 v1 既有字段，保持兼容。
4. **顶层字段优先于 facts[]**：`continent/language/currency/timezone` 可直接写入顶层；`facts[]` 存在时优先展示，否则回退顶层字段（`buildCityBody` 已实现该回退）。

---

## 2. 核心字段（v2.0 已落地）

```jsonc
{
  // —— 标识（必填）——
  "id": "japan-tokyo",            // 唯一 ID：{country}-{city}
  "type": "city",
  "country": "japan",             // 所属国家 slug
  "city": "tokyo",                // 城市 slug（URL 段）
  "name": "东京",                  // 中文名（显示）
  "nameEn": "Tokyo",              // 英文名（hero 品牌字）

  // —— 展示层（Phase A/B 已落地，全部 optional）——
  "title": "东京旅行攻略 | Global Travel Guide",   // SEO title
  "description": "……",             // SEO description
  "keywords": "东京,日本自由行",     // SEO keywords
  "h1": "东京",                    // 页面 H1
  "lead": "……",                   // 页面引言
  "tagline": "未来都市与传统文化交织的日本首都",  // hero 定位语
  "heroImage": "https://…",        // hero 大图（L1 完整 URL / L2 相对 slug）
  "bestTime": {                    // 最佳旅行时间（hero/summary 使用）
    "season": "春季",
    "description": "3-5 月樱花季，气候宜人……"
  },
  "facts": [                       // 城市事实条（有则优先，无则回退顶层字段）
    { "label": "Language", "value": "Japanese" },
    { "label": "Currency", "value": "JPY" }
  ],
  "highlights": ["历史古建", "现代都市", "美食之都"],  // 亮点 chips（数组字符串）
  "relatedCities": ["china-beijing"]   // 显式相关城市（缺省自动同国城市）
}
```

## 3. 扩展预留字段（v2.1+，100 城规模化）

```jsonc
{
  // —— 顶层事实（与 facts[] 双轨兼容，推荐直接用顶层）——
  "continent": "Asia",            // 大洲（hero/facts）
  "language": "Japanese",         // 官方语言
  "currency": "JPY",              // 货币代码
  "timezone": "UTC+9",            // 时区

  // —— 规模化增强（本期只设计，不创建数据）——
  "population": "约 1,400 万",     // 人口（facts 卡）
  "airport": "HND / NRT",         // 机场代码（交通攻略区）
  "transport": "地铁 + JR + 巴士",  // 市内交通概况
  "neighborhoods": ["新宿", "浅草", "银座"],  // 主要区域（区域卡，未来）
  "nearbyCities": ["japan-osaka"]  // 近邻城市（跨国家，Related Cities 扩充）
}
```

## 4. 字段消费位置对照

| 字段 | 展示位置 | 实现 |
|---|---|---|
| `name/nameEn/tagline/heroImage` | City Hero | `body-city.html` |
| `description/lead` | About 区 | `buildCityBody` → `about` |
| `highlights[]` | About 区 chips | `buildCityBody` → `highlights` |
| `facts[]` / 顶层四件套 | About 区 facts bar | `buildCityBody` → `facts`（facts 优先→顶层回退） |
| `bestTime` | Best Time 区 summary | `buildCityBody` → `summary` |
| `relatedCities[]` | Related Cities（缺省同国自动） | `buildCityBody` → `relatedCities` |
| `airport/transport/population` | 未来「实用信息」区 | 预留（本期无模板） |
| `neighborhoods/nearbyCities` | 未来区域卡 / 近邻城市 | 预留 |

## 5. 100 城扩展约束

- **新增城市零代码改动**：`urlFor`/`linkUrl`/`buildCountrySections`/`buildCitySections`/`buildCityBody`/sitemap 全数据驱动自动派生。
- **每城最小 JSON**：`id/type/country/city/name` + 可选 `nameEn/tagline/heroImage` 即构成可发布城市页。
- **内容优先级**：`heroImage` 缺省 → `SITE.heroImage` 全局兜底；`relatedCities` 缺省 → 自动同国城市；`facts` 缺省 → 顶层字段回退（再缺则隐藏）。
- **禁止**：创建与既有字段冲突的新字段；依赖文件顺序的展示逻辑。

---

*规范文档（P8-P5），未修改任何数据文件。*
