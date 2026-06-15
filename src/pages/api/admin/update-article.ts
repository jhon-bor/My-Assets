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
import { getArticleById, updateArticle } from "../../../lib/db";

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    requireAdmin(request);
    
    const { articleId, title, tags, folder, summary } = await request.json();
    
    if (!articleId) {
      return new Response(JSON.stringify({ error: "文章 ID 不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const article = await getArticleById(articleId, env);
    
    if (!article) {
      return new Response(JSON.stringify({ error: "文章不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const changes: string[] = [];
    const updates: Record<string, any> = {};
    
    if (title !== undefined && title.trim()) {
      const newTitle = title.trim();
      if (newTitle !== article.title) {
        updates.title = newTitle;
        const newSlug = slugify(newTitle);
        if (newSlug !== article.slug) {
          updates.slug = newSlug;
          changes.push(`slug 更新为 "${newSlug}"`);
        }
        changes.push(`标题更新为 "${newTitle}"`);
      }
    }
    
    if (tags !== undefined && Array.isArray(tags)) {
      const newTags = tags.map(t => t.trim()).filter(Boolean);
      const tagsChanged = JSON.stringify(article.tags.sort()) !== JSON.stringify(newTags.sort());
      if (tagsChanged) {
        updates.tags = newTags;
        changes.push(`标签更新为 [${newTags.join(", ")}]`);
      }
    }
    
    if (folder !== undefined) {
      const newFolder = folder.trim() || "未分类";
      if (newFolder !== article.folder) {
        updates.folder = newFolder;
        changes.push(`分类更新为 "${newFolder}"`);
      }
    }
    
    if (summary !== undefined) {
      const newSummary = summary.trim();
      if (newSummary !== article.summary) {
        updates.summary = newSummary;
        changes.push("摘要已更新");
      }
    }
    
    const updated = await updateArticle(articleId, updates, env);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: changes.length > 0 ? changes.join("；") : "没有需要更新的内容",
        article: {
          id: updated?.id,
          title: updated?.title,
          slug: updated?.slug,
          tags: updated?.tags,
          folder: updated?.folder,
          summary: updated?.summary,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};