---
title_zh: "Obsidian 双向链接使用教程"
title_en: "Obsidian Bidirectional Links Tutorial"
date: 2026-06-10
tags: ["Obsidian", "教程", "知识管理"]
folder: "技术笔记"
summary_zh: "详解 Obsidian 双向链接的用法与最佳实践，打造你的知识网络。"
summary_en: "Master Obsidian bidirectional links — usage and best practices for building your knowledge graph."
premium: true
attachments:
  - "obsidian-cheatsheet.pdf"
---

## 什么是双向链接？

> [!note] 定义
> 双向链接（Bidirectional Links）是 Obsidian 的核心功能，允许你在笔记之间建立连接，形成知识图谱。

### 基本语法

使用 `[[笔记名]]` 创建一个链接：

```
这篇笔记参考了 [[另一篇笔记]] 的内容。
```

### 链接别名

使用 `|` 可以给链接设置别名：

```
参考 [[移动端适配指南|适配指南]] 的内容。
```

显示为：参考 [[移动端适配指南|适配指南]] 的内容。

### 反向链接

当 A 笔记链接到 B 笔记时，B 笔记会自动显示"被 A 笔记引用"，这就是反向链接。

> [!tip] 最佳实践
> 1. 用双向链接代替文件夹分类
> 2. 为每个概念创建独立的笔记
> 3. 链接密度适中，不要过度链接

### 知识网络

通过双向链接，你的笔记会自然形成一个网状结构：

- [[你好，这是我的数字花园]] — 网站介绍
- [[移动端适配指南]] — 相关技术文章

---

> [!warning] 注意
> 避免创建孤立笔记（没有任何链接的笔记），它们会成为知识网络中的"孤岛"。

<!-- EN -->

## What Are Bidirectional Links?

> [!note] Definition
> Bidirectional Links are a core Obsidian feature that let you connect notes, forming a knowledge graph.

### Basic Syntax

Use `[[note name]]` to create a link:

```
This note references [[another note]].
```

### Link Aliases

Use `|` to set an alias for a link:

```
See [[移动端适配指南|the adaptation guide]] for details.
```

Renders as: See [[移动端适配指南|适配指南]] 的内容。

### Backlinks

When Note A links to Note B, Note B automatically shows "referenced by Note A" — that's a backlink.

> [!tip] Best Practices
> 1. Use bidirectional links instead of folder hierarchies
> 2. Create a separate note for each concept
> 3. Moderate link density — don't over-link

### Knowledge Graph

Through bidirectional links, your notes naturally form a networked structure:

- [[你好，这是我的数字花园]] — Website Introduction
- [[移动端适配指南]] — Related Technical Article

---

> [!warning] Note
> Avoid creating orphan notes (notes with no links) — they become isolated islands in your knowledge network.