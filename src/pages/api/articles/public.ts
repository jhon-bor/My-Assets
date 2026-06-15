export const prerender = false;

import type { APIRoute } from "astro";
import { getApprovedArticles } from "../../../lib/db";

/** GET /api/articles/public — public, no auth needed */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    const articles = await getApprovedArticles(env);
    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};