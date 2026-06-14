export const prerender = false;

import type { APIRoute } from "astro";
import { requireAuth, authErrorResponse } from "../../lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const POST: APIRoute = async ({ request }) => {
  try {
    requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "未找到文件。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: `不支持的格式: ${file.type}。支持: PNG, JPEG, GIF, WebP, SVG。`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: "文件过大，最大 10MB。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Ensure uploads directory
    const uploadDir = join(process.cwd(), "public", "images");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, name);
    await writeFile(filePath, buffer);

    const url = `/images/${name}`;

    return new Response(JSON.stringify({ success: true, url, name }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return authErrorResponse(err);
  }
};
