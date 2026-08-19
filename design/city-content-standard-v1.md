# Global Travel Guide v2.0 · 城市内容生产规范 v1（city-content-standard-v1）

> P9 设计产出：100 城城市实体 JSON 生产标准
> 原则：**全部字段 optional**；最小可发布 = `id/type/country/city/name`；缺字段页面优雅降级；新增城市零代码。

---

## 1. 模板（完整城市 JSON）

```jsonc
{
  // ===== 标识（必填）=====
  "id": "france-paris",
  "type": "city",
  "country": "france",
  "city": "paris",

  // ===== 基础信息 =====
  "name": "巴黎",
  "nameEn": "Paris",
  "continent": "欧洲",
  "language": "法语",
  "currency": "欧元 (EUR)",
  "timezone": "UTC+1",

  // ===== 视觉 =====
  "heroImage": "https://images.unsplash.com/photo-xxx?auto=format&fit=crop&w=1600&q=80",
  "gallery": [
    "https://images.unsplash.com/photo-yyy?w=800&q=70",
    "https://images.unsplash.com/photo-zzz?w=800&q=70"
  ],

  // ===== SEO =====
  "title": "巴黎旅行攻略 | Global Travel Guide",
  "description": "巴黎旅游攻略与自由行路线全指南：……",
  "keywords": "巴黎旅游攻略,巴黎自由行,巴黎景点,巴黎美食",
  "h1": "巴黎",
  "lead": "……（首页/城市页引言）",

  // ===== 旅行 =====
  "tagline": "浪漫之都与艺术之都的完美融合",
  "bestTime": {
    "season": "春季（4-6月）",
    "description": "气候宜人、游客相对适中……"
  },
  "highlights": ["埃菲尔铁塔", "卢浮宫", "塞纳河游船", "香榭丽舍大街"],
  "facts": [
    { "label": "Continent", "value": "欧洲" },
    { "label": "Language", "value": "法语" },
    { "label": "Currency", "value": "欧元 (EUR)" },
    { "label": "Timezone", "value": "UTC+1" }
  ],

  // ===== 扩展（可选）=====
  "airport": "CDG / ORY",
  "transport": "地铁 + RER + 公交",
  "neighborhoods": ["玛黑区", "蒙马特", "拉丁区"],
  "nearbyCities": ["france-versailles"],

  // ===== 关联（可选）=====
  "related": ["france-paris-eiffel", "france-paris-best-time"],
  "relatedCities": []
}
```

## 2. 字段说明

### 2.1 基础信息
| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | 全局唯一：`{country}-{city}`，如 `france-paris` |
| `type` | ✅ | 恒为 `"city"` |
| `country` | ✅ | 国家 slug（必须存在于 `data/countries/{country}.json` 或随城新增） |
| `city` | ✅ | 城市 slug（URL 段，小写连字符） |
| `name` | ✅ | 中文名（显示） |
| `nameEn` | 推荐 | 英文名（hero 品牌字） |
| `continent/language/currency/timezone` | 推荐 | 顶层四件套（facts 回退源；日本有、中国缺——新国家建议补齐） |

### 2.2 视觉
| 字段 | 必填 | 说明 |
|---|---|---|
| `heroImage` | 推荐 | hero 大图 1600×900（L1 完整 URL / L2 相对 slug，见 image-system-v2） |
| `gallery[]` | 可选 | 图集（未来 Gallery 区块；卡片图 800×450） |

### 2.3 SEO
| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | `<title>`，建议「{城市}旅行攻略 \| Global Travel Guide」 |
| `description` | ✅ | meta description，120–160 字 |
| `keywords` | 可选 | 逗号分隔关键词 |
| `h1` | ✅ | 页面 H1（通常=name） |
| `lead` | ✅ | 页面引言（About 兜底） |

### 2.4 旅行
| 字段 | 必填 | 说明 |
|---|---|---|
| `tagline` | 推荐 | hero 定位语，8–18 字 |
| `bestTime` | 推荐 | `{season, description}`；另有独立 best-time 实体详页 |
| `highlights[]` | 推荐 | 5 个左右亮点（chips 展示，字符串数组） |
| `facts[]` | 推荐 | `[{label,value}]`，建议 4 项（Continent/Language/Currency/Timezone） |

### 2.5 扩展
| 字段 | 说明 |
|---|---|
| `airport` | 机场代码（未来实用信息区） |
| `transport` | 市内交通概况（未来实用信息区） |
| `neighborhoods[]` | 主要区域（未来区域卡） |
| `nearbyCities[]` | 近邻城市 id（Related Cities 扩充，跨国家） |

## 3. 同城子实体生产清单（每城建议）

| 子实体 | 目录 | 数量建议 | 说明 |
|---|---|---|---|
| 国家 | `data/countries/` | 1 | 新国家随首城创建 |
| 景点 | `data/attractions/` | 5–8 | `{country}-{city}-{slug}.json` |
| 路线 | `data/routes/` | 2–3 | 3日/5日等 |
| 攻略 | `data/guides/` | 3–5 | 交通/住宿/美食/贴士 |
| 最佳时间 | `data/best-times/` | 1 | `{country}-{city}-best-time.json` |
| 路书/预算 | `data/route-plans/` `data/budgets/` | 0–2 | 旗舰内容（S 级城） |
| 季节 | `data/seasonals/` | 0–1 | 有明显季节性的城 |

## 4. 质量红线

1. 所有事实字段（continent/language/currency/时区）必须**真实准确**，禁止虚构。
2. `facts[]` 与顶层四件套**保持一致**（双轨同值，facts 优先展示）。
3. `heroImage/gallery` 图源合规（Unsplash 许可图或自管素材），alt 用「{城市} {主题}」模板。
4. `related`/`relatedCities` 引用必须是**已存在实体的 id**，否则过滤（不会报错但无效）。
5. 城市 slug 与文件命名：`data/cities/{country}-{city}.json`。

---

*P9 设计产出（只读），未创建任何城市数据。*
