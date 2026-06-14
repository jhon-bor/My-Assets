/**
 * POST /api/articles/translate
 * Body: { articleId: string; lang: string }
 *
 * Translates an article's title/summary/content to the target language
 * and caches in DB. Returns the translated fields.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { readDB, writeDB } from "../../../lib/db";
import type { Article } from "../../../lib/db";
import { getArticleInLang } from "../../../lib/article-translate";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { articleId, lang } = await request.json() as { articleId?: string; lang?: string };

    if (!articleId || !lang) {
      return new Response(JSON.stringify({ error: "articleId and lang are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await readDB();
    const article = db.articles.find((a) => a.id === articleId);
    if (!article) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await getArticleInLang(article, lang);

    return new Response(
      JSON.stringify({
        title: result.title,
        summary: result.summary,
        translated: result.translated,
        backend: result.backend,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
