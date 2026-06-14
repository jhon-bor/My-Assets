---
title_zh: "Astro + Tailwind CSS 极简建站"
title_en: "Minimal Website Building with Astro + Tailwind CSS"
date: 2026-05-20
tags: ["Astro", "Tailwind", "前端"]
folder: "技术笔记"
summary_zh: "从零搭建一个移动端优先、加载速度极快的个人博客。"
summary_en: "Build a mobile-first, lightning-fast personal blog from scratch."
---

## 为什么选 Astro？

> [!info] Astro 的核心优势
> - 默认零 JS 输出
> - 支持多框架组件（React、Vue、Svelte）
> - 出色的内容集合（Content Collections）
> - 极快的构建速度

### 项目初始化

```bash
npm create astro@latest my-site
cd my-site
npm install
```

### 配置内容集合

```typescript
import { defineCollection, z } from "astro:content";

const notes = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { notes };
```

### 创建你的第一篇笔记

在 `src/content/notes/` 目录下创建 markdown 文件，添加 frontmatter：

```yaml
---
title: "我的第一篇笔记"
date: 2026-06-13
tags: ["入门"]
---
```

---

相关笔记：[[移动端适配指南]] · [[你好，这是我的数字花园]]

![Web开发](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800)

<!-- EN -->

## Why Choose Astro?

> [!info] Astro's Core Advantages
> - Zero JS by default
> - Multi-framework components (React, Vue, Svelte)
> - Excellent Content Collections
> - Extremely fast build speeds

### Project Setup

```bash
npm create astro@latest my-site
cd my-site
npm install
```

### Configure Content Collections

```typescript
import { defineCollection, z } from "astro:content";

const notes = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { notes };
```

### Create Your First Note

Create a markdown file in `src/content/notes/` and add frontmatter:

```yaml
---
title: "My First Note"
date: 2026-06-13
tags: ["Getting Started"]
---
```

---

Related notes: [[移动端适配指南]] · [[你好，这是我的数字花园]]

![Web Development](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800)