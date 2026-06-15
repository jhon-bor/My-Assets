/**
 * POST /api/admin/restore
 * Body: { articleId: string }
 *
 * Restore a deleted article from trash
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { requireAdmin, authErrorResponse } from "../../../lib/auth";
import { getArticleById, updateArticle } from "../../../lib/db";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    requireAdmin(request);

    const { articleId } = await request.json();

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

    if (article.status !== "deleted") {
      return new Response(
        JSON.stringify({ error: "文章不在回收站中，无需恢复" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updated = await updateArticle(articleId, { status: "approved" }, env);

    return new Response(
      JSON.stringify({
        success: true,
        message: `文章 "${article.title}" 已恢复发布`,
        articleId: articleId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};