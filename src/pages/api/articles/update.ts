/**
 * PUT /api/articles/update
 * Body: { articleId: string; title?: string; content?: string; folder?: string; tags?: string[]; summary?: string }
 * Only the article author can edit their own articles. Admins can edit any.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { getArticleById, updateArticle } from "../../../lib/db";
import { requireAuth, authErrorResponse, slugify } from "../../../lib/auth";

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    const session = requireAuth(request);

    const { articleId, title, content, folder, tags, summary } = await request.json() as {
      articleId?: string; title?: string; content?: string; folder?: string; tags?: string[]; summary?: string;
    };

    if (!articleId) {
      return new Response(JSON.stringify({ error: "缺少文章ID" }), {
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

    if (article.authorId !== session.userId && session.role !== "admin") {
      return new Response(JSON.stringify({ error: "无权修改此文章" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates: Record<string, any> = {};
    if (title !== undefined) {
      updates.title = title.trim();
      updates.slug = slugify(title.trim());
    }
    if (content !== undefined) updates.content = content.trim();
    if (folder !== undefined) updates.folder = folder.trim();
    if (tags !== undefined) updates.tags = tags;
    if (summary !== undefined) updates.summary = summary.trim();

    // Clear translations so they get re-generated on next view
    updates.title_en = undefined; updates.title_ja = undefined; updates.title_fr = undefined;
    updates.title_es = undefined; updates.title_pt = undefined; updates.title_de = undefined; updates.title_it = undefined;
    updates.content_en = undefined; updates.content_ja = undefined; updates.content_fr = undefined;
    updates.content_es = undefined; updates.content_pt = undefined; updates.content_de = undefined; updates.content_it = undefined;
    updates.summary_en = undefined; updates.summary_ja = undefined; updates.summary_fr = undefined;
    updates.summary_es = undefined; updates.summary_pt = undefined; updates.summary_de = undefined; updates.summary_it = undefined;
    updates.translatedAt = undefined;
    updates.translationBackend = undefined;

    const updated = await updateArticle(articleId, updates, env);

    return new Response(
      JSON.stringify({ success: true, article: { id: updated?.id, slug: updated?.slug } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};