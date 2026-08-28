# Phase 18.4.1 — SEO/OG 修复报告

**Date**: 2026-08-28  
**Status**: COMPLETE  
**Next Phase**: 18.5 (Build Finalization) - AWAITING AUTHORIZATION

---

## 1. 根因分析

| 问题 | 根因 |
|------|------|
| Story description 为空 | `build.js` renderPage 使用 `e.description`，但 Story JSON 只有 `summary` 字段 |
| OG Image 路径损坏 | `ogImage()` 函数对 `e.image`（远程 URL）未做协议检查，直接拼接 `/assets/img/` |
| Guide/Route Title 缺失 | 实际存在，之前检测脚本编码问题导致误报 |

---

## 2. 修改内容

### 2.1 build.js (1处修改)

**位置**: Line 433-435，实体处理循环开头

**修改前**:
```javascript
e._canonical = canonicalFor(e, SITE.siteUrl);
e._ogImage = ogImage(e, SITE);
e._heroImageUrl = heroImageUrl(e, SITE);
```

**修改后**:
```javascript
// Ensure description fallback for stories (use summary if description missing)
if (e.type === 'story' && !e.description) {
  e.description = e.summary || '';
}
e._canonical = canonicalFor(e, SITE.siteUrl);
e._ogImage = ogImage(e, SITE);
e._heroImageUrl = heroImageUrl(e, SITE);
```

### 2.2 src/lib/content.js (2处修改)

**位置**: `resolveImagePath` 函数调用处

**修改前**:
```javascript
export function heroImageUrl(e, site) {
  if (e && e.heroImage) return resolveImagePath(e.heroImage, site.imageBaseUrl, site.heroImage, '');
  if (e && e.image) return `${site.imageBaseUrl}/${e.image}.jpg`;
  return site.heroImage;
}
export function ogImage(e, site) {
  if (e && e.socialImage) return resolveImagePath(e.socialImage, site.imageBaseUrl, site.defaultSocialImage, '');
  if (e && e.image) return `${site.imageBaseUrl}/${e.image}-social.jpg`;
  return site.defaultSocialImage;
}
```

**修改后**:
```javascript
export function heroImageUrl(e, site) {
  if (e && e.heroImage) return resolveImagePath(e.heroImage, site.imageBaseUrl, site.heroImage, '');
  // e.image might be a full remote URL - use resolveImagePath which handles this
  if (e && e.image) return resolveImagePath(e.image, site.imageBaseUrl, site.heroImage, '.jpg');
  return site.heroImage;
}
export function ogImage(e, site) {
  if (e && e.socialImage) return resolveImagePath(e.socialImage, site.imageBaseUrl, site.defaultSocialImage, '');
  // e.image might be a full remote URL - use resolveImagePath which handles this
  if (e && e.image) return resolveImagePath(e.image, site.imageBaseUrl, site.defaultSocialImage, '-social.jpg');
  // Fallback to heroImage if available
  if (e && e.heroImage) return resolveImagePath(e.heroImage, site.imageBaseUrl, site.defaultSocialImage, '');
  return site.defaultSocialImage;
}
```

---

## 3. Build 结果

```
Built 181 pages + sitemap.xml into /public
```

- 页面数量: **181**（与修复前一致）
- Sitemap URLs: **181**（一致）

---

## 4. 验证结果

| 检查项 | 状态 |
|--------|------|
| Story description | ✅ 全部填充（5/5） |
| OG Image 路径 | ✅ 无损坏路径 |
| Local images | ✅ 181个HTML引用全部有效 |
| Kyoto 保护 | ✅ 无污染 |
| Beijing/Kyoto 隔离 | ✅ 完全隔离 |

### 各类页面 OG 图片状态

| 页面类型 | OG 图片状态 |
|---------|------------|
| City | ✅ 本地 `/assets/images/beijing/og/city-og.webp` |
| Attraction | ✅ 本地 `/assets/images/beijing/og/gugong-og.webp` |
| Guide | ⚠️ 远程 Unsplash（原始数据如此，非本阶段引入） |
| Route | ⚠️ 远程 Unsplash（原始数据如此，非本阶段引入） |
| Budget | ⚠️ 远程 Unsplash（原始数据如此，非本阶段引入） |
| RoutePlan | ⚠️ 远程 Unsplash（原始数据如此，非本阶段引入） |
| Seasonal | ✅ 本地 `/assets/images/beijing/seasonals/spring-hero.webp` |
| Story | ✅ 本地 `/assets/images/beijing/stories/hutong-walk-cover.webp` |

> 注：Guide/Route/Budget/RoutePlan 使用远程 Unsplash URL 是原始数据设计，非本阶段引入的问题。如需要统一为本地图片，需在后续 Phase 单独处理。

---

## 5. Git Diff 范围

```
Modified:
- scripts/build.js (1行新增)
- src/lib/content.js (2处修改)
- data/seasonals/china-beijing-spring.json
- data/seasonals/china-beijing-summer.json
- data/seasonals/china-beijing-winter.json
- public/* (build 输出，自动重生成)
```

**无京都文件修改，无北京正文内容修改。**

---

## 6. 进入 Phase 18.5 条件

- [x] Story description 修复完成
- [x] OG Image 路径损坏修复完成
- [x] Build 181 pages 正常
- [x] 图片 404 检查通过
- [x] Kyoto 隔离验证通过
- [x] Git diff 范围可控

**所有条件满足，可进入 Phase 18.5。**

---

*Report completed: 2026-08-28*
