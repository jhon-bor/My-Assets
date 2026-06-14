/**
 * PUT /api/admin/articles
 * Body: { 
 *   articleId: string, 
 *   title?: string,
 *   tags?: string[],
 *   folder?: string,
 *   summary?: string
 * }
 * 
 * Update article metadata (title, tags, folder, summary)
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { requireAdmin, authErrorResponse, slugify } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";

export const PUT: APIRoute = async ({ request }) => {
  try {
    requireAdmin(request);
    
    const { articleId, title, tags, folder, summary } = await request.json();
    
    if (!articleId) {
      return new Response(JSON.stringify({ error: "文章 ID 不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const db = await readDB();
    const article = db.articles.find((a) => a.id === articleId);
    
    if (!article) {
      return new Response(JSON.stringify({ error: "文章不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Track changes
    const changes: string[] = [];
    
    // Update title
    if (title !== undefined && title.trim()) {
      const newTitle = title.trim();
      if (newTitle !== article.title) {
        article.title = newTitle;
        // Update slug if title changes
        const newSlug = slugify(newTitle);
        if (newSlug !== article.slug) {
          article.slug = newSlug;
          changes.push(`slug 更新为 "${newSlug}"`);
        }
        changes.push(`标题更新为 "${newTitle}"`);
        
        // Also update language-specific titles
        const langFields = ['title_zh', 'title_en', 'title_ja', 'title_fr', 'title_es', 'title_pt', 'title_de', 'title_it'];
        for (const field of langFields) {
          // Check if the original title matches any language-specific title
          if ((article as any)[field] === article.title || !article[field]) {
            // Don't auto-update language-specific titles, let translation handle it
          }
        }
      }
    }
    
    // Update tags
    if (tags !== undefined && Array.isArray(tags)) {
      const newTags = tags.map(t => t.trim()).filter(Boolean);
      const tagsChanged = JSON.stringify(article.tags.sort()) !== JSON.stringify(newTags.sort());
      if (tagsChanged) {
        article.tags = newTags;
        changes.push(`标签更新为 [${newTags.join(", ")}]`);
      }
    }
    
    // Update folder
    if (folder !== undefined) {
      const newFolder = folder.trim() || "未分类";
      if (newFolder !== article.folder) {
        article.folder = newFolder;
        changes.push(`分类更新为 "${newFolder}"`);
      }
    }
    
    // Update summary
    if (summary !== undefined) {
      const newSummary = summary.trim();
      if (newSummary !== article.summary) {
        article.summary = newSummary;
        changes.push("摘要已更新");
      }
    }
    
    // Save changes
    await writeDB(db);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: changes.length > 0 ? changes.join("；") : "没有需要更新的内容",
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          tags: article.tags,
          folder: article.folder,
          summary: article.summary,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};
