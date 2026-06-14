/**
 * PUT /api/articles/update
 * Body: { articleId: string; title?: string; content?: string; folder?: string; tags?: string[]; summary?: string }
 * Only the article author can edit their own articles. Admins can edit any.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { readDB, writeDB } from "../../../lib/db";
import { requireAuth, authErrorResponse, slugify } from "../../../lib/auth";

export const PUT: APIRoute = async ({ request }) => {
  try {
    const session = requireAuth(request);
    const db = await readDB();

    const { articleId, title, content, folder, tags, summary } = await request.json() as {
      articleId?: string; title?: string; content?: string; folder?: string; tags?: string[]; summary?: string;
    };

    if (!articleId) {
      return new Response(JSON.stringify({ error: "缺少文章ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const article = db.articles.find((a) => a.id === articleId);
    if (!article) {
      return new Response(JSON.stringify({ error: "文章不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only author or admin can edit
    if (article.authorId !== session.userId && session.role !== "admin") {
      return new Response(JSON.stringify({ error: "无权修改此文章" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update fields
    if (title !== undefined) {
      article.title = title.trim();
      article.slug = slugify(title.trim());
    }
    if (content !== undefined) article.content = content.trim();
    if (folder !== undefined) article.folder = folder.trim();
    if (tags !== undefined) article.tags = tags;
    if (summary !== undefined) article.summary = summary.trim();

    // Clear translations so they get re-generated on next view
    const transFields = Object.keys(article).filter((k) =>
      k.startsWith("title_") || k.startsWith("content_") || k.startsWith("summary_")
    );
    for (const k of transFields) delete (article as any)[k];
    article.translatedAt = undefined;
    article.translationBackend = undefined;

    await writeDB(db);

    return new Response(
      JSON.stringify({ success: true, article: { id: article.id, slug: article.slug } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};
