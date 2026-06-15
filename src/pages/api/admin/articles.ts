/**
 * GET /api/admin/articles?status=pending|approved|rejected|deleted
 *
 * Get articles by status for admin management
 *
 * DELETE /api/admin/articles
 * Body: { articleId: string, permanent?: boolean }
 *
 * Soft delete (move to trash) or permanently delete an article
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { requireAdmin, authErrorResponse } from "../../../lib/auth";
import { getArticlesByStatus, deleteArticle } from "../../../lib/db";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    requireAdmin(request);

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";

    if (!["pending", "approved", "rejected", "deleted"].includes(status)) {
      return new Response(JSON.stringify({ error: "无效的状态" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const articles = await getArticlesByStatus(status, env);

    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    requireAdmin(request);

    const { articleId, permanent } = await request.json();

    if (!articleId) {
      return new Response(JSON.stringify({ error: "文章 ID 不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await deleteArticle(articleId, !!permanent, env);

    return new Response(
      JSON.stringify({
        success: true,
        message: permanent ? `文章已永久删除` : `文章已移至回收站`,
        deletedId: articleId,
        permanent: !!permanent,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};