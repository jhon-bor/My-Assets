export const prerender = false;

import type { APIRoute } from "astro";
import { getApprovedArticles } from "../../../lib/db";

/** GET /api/articles/public — public, no auth needed */
export const GET: APIRoute = async () => {
  try {
    const articles = await getApprovedArticles();
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
