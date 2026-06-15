/**
 * POST /api/articles/translate
 * Body: { articleId: string; lang: string }
 *
 * Translates an article's title/summary/content to the target language
 * and caches in DB. Returns the translated fields.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { getArticleById, updateArticle } from "../../../lib/db";
import { getArticleInLang } from "../../../lib/article-translate";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    const { articleId, lang } = await request.json() as { articleId?: string; lang?: string };

    if (!articleId || !lang) {
      return new Response(JSON.stringify({ error: "articleId and lang are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const article = await getArticleById(articleId, env);
    if (!article) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await getArticleInLang(article, lang);

    // Cache the translation back to D1
    const prefix = lang === "en" ? "" : `_${lang}`;
    await updateArticle(articleId, {
      [`title${prefix}`]: result.title,
      [`summary${prefix}`]: result.summary,
      [`content${prefix}`]: result.content,
    }, env);

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