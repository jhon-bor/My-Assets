export const prerender = false;

import type { APIRoute } from "astro";
import { requireAdmin, authErrorResponse } from "../../../lib/auth";
import { updateArticleStatus } from "../../../lib/db";

/** POST /api/admin/review { articleId, action: "approve" | "reject" } */
export const POST: APIRoute = async ({ request }) => {
  try {
    const session = requireAdmin(request);
    const { articleId, action } = await request.json();

    if (!articleId || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "参数错误。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const status = action === "approve" ? "approved" : "rejected";
    const article = await updateArticleStatus(articleId, status, session.userId);

    if (!article) {
      return new Response(JSON.stringify({ error: "文章不存在。" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "approve" ? "文章已通过审核并发布。" : "文章已驳回。",
        article,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};
