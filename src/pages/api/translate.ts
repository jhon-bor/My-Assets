export const prerender = false;

import type { APIRoute } from "astro";
import { translate, translateToAll, SUPPORTED_LANGS } from "../../lib/translate";
import type { Lang } from "../../lib/translate";

/**
 * POST /api/translate
 * Body: { text: string; to: Lang }
 * Returns: { text: string; lang: Lang; success: boolean; backend: string }
 *
 * GET /api/translate?text=...&to=en
 * Returns all-language translations as { en: {...}, ja: {...}, ... }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { text, to } = await request.json() as { text?: string; to?: string };

    if (!text || !to) {
      return new Response(JSON.stringify({ error: "text and to are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!SUPPORTED_LANGS.includes(to as Lang)) {
      return new Response(
        JSON.stringify({ error: `Unsupported language: ${to}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await translate({ text, to: to as Lang });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const text = url.searchParams.get("text");
  const to = url.searchParams.get("to");
  const fromParam = url.searchParams.get("from");
  const from: Lang = fromParam && SUPPORTED_LANGS.includes(fromParam as Lang) ? (fromParam as Lang) : "zh";

  if (!text) {
    return new Response(JSON.stringify({ error: "text param is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If 'to' is specified and is a single lang, translate to that lang only
  if (to && SUPPORTED_LANGS.includes(to as Lang)) {
    const result = await translate({ text, from, to: to as Lang });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Otherwise translate to ALL languages
  const results = await translateToAll(text, from);
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};