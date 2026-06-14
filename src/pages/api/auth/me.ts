export const prerender = false;

import type { APIRoute } from "astro";
import { requireAuth, authErrorResponse } from "../../../lib/auth";
import { findUserById } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = requireAuth(request);
    const user = await findUserById(session.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "用户不存在。" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
};
