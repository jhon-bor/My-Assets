export const prerender = true;

import type { APIRoute } from "astro";

// Upload API temporarily disabled - using R2 storage
// This endpoint is now static and returns a message
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: "上传功能暂时禁用。" }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ message: "Upload API - coming soon with R2 storage." }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};