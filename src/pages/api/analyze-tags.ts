export const prerender = false;

import type { APIRoute } from "astro";
import { requireAuth, authErrorResponse } from "../../lib/auth";
import { analyzeContentForTags } from "../../lib/tag-analyzer";

/** POST /api/analyze-tags — AI analyze content → SEO tags */
export const POST: APIRoute = async ({ request }) => {
  try {
    requireAuth(request);
    const { title, content } = await request.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "内容不能为空。" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = analyzeContentForTags(title || "", content);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
};
