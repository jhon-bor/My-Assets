/**
 * Auth utilities — sessions, JWT, password hashing.
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// Simple session tokens (in production, use JWT or a proper session store)
const sessions = new Map<string, { userId: string; role: string; email: string; expiresAt: number }>();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a session token. Returns the token. */
export function createSession(userId: string, role: string, email: string): string {
  const token = crypto.randomUUID();
  sessions.set(token, {
    userId,
    role,
    email,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
}

/** Validate a session token. Returns session data or null. */
export function validateSession(token: string): { userId: string; role: string; email: string } | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return { userId: session.userId, role: session.role, email: session.email };
}

/** Invalidate a session */
export function destroySession(token: string): void {
  sessions.delete(token);
}

/** Extract bearer token from request */
export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

/** Require auth — returns session or throws 401 */
export function requireAuth(request: Request): { userId: string; role: string; email: string } {
  const token = getTokenFromRequest(request);
  if (!token) throw new AuthError("请先登录。", 401);
  const session = validateSession(token);
  if (!session) throw new AuthError("登录已过期，请重新登录。", 401);
  return session;
}

/** Require admin role */
export function requireAdmin(request: Request): { userId: string; role: string; email: string } {
  const session = requireAuth(request);
  if (session.role !== "admin") throw new AuthError("需要管理员权限。", 403);
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function authErrorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "服务器错误。" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

/** Generate a slug from title */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-+|-+$/, "");
}
