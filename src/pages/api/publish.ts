export const prerender = false;

import type { APIRoute } from "astro";
import { requireAuth, authErrorResponse, slugify } from "../../lib/auth";
import { createArticle, adminPublish, getArticleById, updateArticle } from "../../lib/db";
import { SUPPORTED_LANGS } from "../../lib/translate";
import type { Lang } from "../../lib/translate";
import { quickReview } from "../../lib/ai-review";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
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

    if (session.role === "admin") {
      const article = await adminPublish(baseData, session.userId, env);
      return new Response(
        JSON.stringify({
          success: true,
          message: "文章已直接发布！",
          article: { id: article.id, slug: article.slug, status: article.status },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      const article = await createArticle(baseData, env);
      const reviewResult = await quickReview(article, env);
      const updatedArticle = await getArticleById(article.id, env);
      const finalStatus = updatedArticle?.status || "pending";
      const finalTags = updatedArticle?.tags || article.tags;

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