export const prerender = false;

import type { APIRoute } from "astro";
import { findUserByEmail, createUser } from "../../../lib/db";
import { hashPassword, createSession } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "请输入邮箱和密码。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "密码至少需要6个字符。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return new Response(JSON.stringify({ error: "该邮箱已注册。" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      role: "subscriber",
      displayName: displayName || email.split("@")[0],
    });

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
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "注册失败，请稍后重试。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
