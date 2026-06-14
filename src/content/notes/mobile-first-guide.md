---
title_zh: "移动端适配完全指南"
title_en: "Complete Guide to Mobile-First Responsive Design"
date: 2026-06-08
tags: ["CSS", "移动端", "前端"]
folder: "技术笔记"
summary_zh: "如何让你的网页在手机浏览器里媲美原生 APP 体验。详解移动端优先设计、触摸适配、性能优化。"
summary_en: "Make your web pages feel like native apps on mobile browsers. Mobile-first design, touch adaptation, and performance optimization."
featured: true
---

## 移动端优先设计原则

> [!tip] 核心理念
> 先写手机版 CSS，再用媒体查询适配大屏。这样能确保基础体验在任何设备上都完美。

### 1. 视口设置

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 2. 触摸友好设计

所有可交互元素的最小触摸区域应为 **48px × 48px**（符合 Apple HIG 和 Material Design 规范）。

```css
button, a.btn {
  min-height: 48px;
  min-width: 48px;
}
```

### 3. 排版优化

- 正文行高 ≥ 1.6
- 字体大小 ≥ 16px（防止 iOS 自动缩放）
- 段落间距 ≥ 1em

### 4. 性能预算

- 首屏加载 < 1 秒
- 关键 CSS 内联
- 图片使用 WebP 格式
- 延迟加载非关键资源

### 5. 测试设备

| 设备 | 屏幕宽度 | 测试要点 |
|------|----------|----------|
| iPhone SE | 375px | 最小屏适配 |
| iPhone 14 Pro | 393px | 主流机型 |
| Android 小屏 | 360px | 兼容性 |
| iPad | 768px+ | 平板适配 |

---

相关阅读：[[你好，这是我的数字花园]]

<!-- EN -->

## Mobile-First Design Principles

> [!tip] Core Philosophy
> Write mobile CSS first, then use media queries for larger screens. This ensures the best experience on any device.

### 1. Viewport Setup

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 2. Touch-Friendly Design

All interactive elements should have a minimum touch area of **48px × 48px** (Apple HIG and Material Design compliant).

```css
button, a.btn {
  min-height: 48px;
  min-width: 48px;
}
```

### 3. Typography Optimization

- Body line-height ≥ 1.6
- Font size ≥ 16px (prevents iOS auto-zoom)
- Paragraph spacing ≥ 1em

### 4. Performance Budget

- First screen load < 1 second
- Inline critical CSS
- Use WebP for images
- Lazy-load non-critical resources

### 5. Test Devices

| Device | Screen Width | Key Test Points |
|--------|--------------|-----------------|
| iPhone SE | 375px | Smallest screen |
| iPhone 14 Pro | 393px | Mainstream device |
| Android small | 360px | Compatibility |
| iPad | 768px+ | Tablet adaptation |

---

Related: [[你好，这是我的数字花园]]