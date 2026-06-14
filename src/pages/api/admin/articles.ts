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
import { readDB, writeDB } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
  try {
    requireAdmin(request);

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";

    const db = await readDB();

    let articles = db.articles;

    // Filter by status if provided (include "deleted" for trash)
    if (status && ["pending", "approved", "rejected", "deleted"].includes(status)) {
      articles = articles.filter(a => a.status === status);
    }

    // Sort by createdAt descending (newest first)
    articles.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    requireAdmin(request);

    const { articleId, permanent } = await request.json();

    if (!articleId) {
      return new Response(JSON.stringify({ error: "文章 ID 不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await readDB();
    const articleIndex = db.articles.findIndex((a) => a.id === articleId);

    if (articleIndex === -1) {
      return new Response(JSON.stringify({ error: "文章不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const article = db.articles[articleIndex];

    if (permanent) {
      // Permanent delete
      db.articles.splice(articleIndex, 1);
      await writeDB(db);
      return new Response(
        JSON.stringify({
          success: true,
          message: `文章 "${article.title}" 已永久删除`,
          deletedId: articleId,
          permanent: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Soft delete - move to trash (change status to "deleted")
      article.status = "deleted";
      article.deletedAt = new Date().toISOString();
      article.deletedBy = "admin";
      await writeDB(db);
      return new Response(
        JSON.stringify({
          success: true,
          message: `文章 "${article.title}" 已移至回收站`,
          deletedId: articleId,
          permanent: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return authErrorResponse(err);
  }
};
