export const prerender = false;

import type { APIRoute } from "astro";
import { findUserByEmail, seedAdmin } from "../../../lib/db";
import { verifyPassword, createSession } from "../../../lib/auth";

let seeded = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env || (locals as any).env;
    if (!seeded) { await seedAdmin(env); seeded = true; }
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "请输入邮箱和密码。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await findUserByEmail(email, env);
    if (!user) {
      return new Response(JSON.stringify({ error: "邮箱或密码错误。" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return new Response(JSON.stringify({ error: "邮箱或密码错误。" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = createSession(user.id, user.role, user.email);

    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "登录失败，请稍后重试。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};