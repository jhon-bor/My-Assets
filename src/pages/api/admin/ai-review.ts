/**
 * POST /api/admin/ai-review
 * 
 * Manually trigger AI review for all pending articles
 * or for a specific article
 * 
 * Body (optional): { articleId?: string }
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { requireAdmin, authErrorResponse } from "../../../lib/auth";
import { readDB, writeDB } from "../../../lib/db";
import { processPendingArticles, reviewArticle } from "../../../lib/ai-review";

export const POST: APIRoute = async ({ request }) => {
  try {
    requireAdmin(request);
    
    const body = await request.json().catch(() => ({}));
    const { articleId } = body as { articleId?: string };
    
    if (articleId) {
      // Review a specific article
      const db = await readDB();
      const article = db.articles.find(a => a.id === articleId);
      
      if (!article) {
        return new Response(JSON.stringify({ error: "文章不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const result = await reviewArticle(article);
      
      // Update article with review results
      if (result.tags.length > 0) {
        article.tags = result.tags;
      }
      
      if (result.approved) {
        article.status = "approved";
        article.reviewedAt = result.analyzedAt;
        article.reviewedBy = "AI_MANUAL_REVIEW";
        await writeDB(db);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          articleId,
          result,
          message: result.approved 
            ? "AI 审核通过，文章已自动发布" 
            : `AI 建议需要人工审核: ${result.reason}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Process all pending articles
      const results = await processPendingArticles();
      
      return new Response(
        JSON.stringify({
          success: true,
          processed: results.processed,
          autoApproved: results.autoApproved,
          flagged: results.flagged,
          results: results.results.map(r => ({
            articleId: r.articleId,
            approved: r.result.approved,
            score: r.result.score,
            reason: r.result.reason,
            tags: r.result.tags,
          })),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return authErrorResponse(err);
  }
};
