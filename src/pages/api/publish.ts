export const prerender = false;

import type { APIRoute } from "astro";
import { requireAuth, authErrorResponse, slugify } from "../../lib/auth";
import { createArticle, adminPublish, readDB, writeDB } from "../../lib/db";
import { SUPPORTED_LANGS } from "../../lib/translate";
import type { Lang } from "../../lib/translate";
import { quickReview } from "../../lib/ai-review";

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = requireAuth(request);
    const { title, folder, tags, summary, content, sourceLang: reqSourceLang } = await request.json();
    const sourceLang: Lang = SUPPORTED_LANGS.includes(reqSourceLang as Lang) ? (reqSourceLang as Lang) : "zh";

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "标题和内容不能为空。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = slugify(title);
    const baseData = {
      title: title.trim(),
      slug,
      content: content.trim(),
      folder: folder?.trim() || "未分类",
      tags: tags || [],
      summary: summary?.trim() || "",
      sourceLang,
      authorId: session.userId,
      authorEmail: session.email,
    };

    // Translation happens on-demand when readers view the article,
    // NOT at publish time. This avoids API rate limits and speeds up publishing.

    if (session.role === "admin") {
      // Admin publishes directly
      const article = await adminPublish(baseData, session.userId);
      return new Response(
        JSON.stringify({
          success: true,
          message: "文章已直接发布！",
          article: { id: article.id, slug: article.slug, status: article.status },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Regular user publishes - create pending article first
      const article = await createArticle(baseData);

      // Trigger AI auto-review for the new article
      const reviewResult = await quickReview(article);

      // Get the updated article status
      const db = await readDB();
      const updatedArticle = db.articles.find(a => a.id === article.id);
      const finalStatus = updatedArticle?.status || "pending";
      const finalTags = updatedArticle?.tags || article.tags;

      // Determine response message based on AI review result
      let message = "文章已提交审核，管理员审核通过后即可发布。";
      let aiReviewInfo: { approved: boolean; reason: string; score: number } | null = null;

      if (reviewResult.approved) {
        message = "文章已通过 AI 自动审核并发布！";
      } else if (reviewResult.needsManualReview) {
        message = `文章已提交审核。AI 审核建议: ${reviewResult.reason}`;
        aiReviewInfo = {
          approved: false,
          reason: reviewResult.reason,
          score: reviewResult.score,
        };
      }

      return new Response(
        JSON.stringify({
          success: true,
          message,
          article: { 
            id: article.id, 
            slug: article.slug, 
            status: finalStatus,
            tags: finalTags,
          },
          aiReview: aiReviewInfo,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return authErrorResponse(err);
  }
};
