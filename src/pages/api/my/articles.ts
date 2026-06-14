/**
 * GET /api/my/articles
 * 
 * 获取当前登录用户的所有文章
 * 需要携带 Authorization header
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { getTokenFromRequest, validateSession, authErrorResponse } from "../../../lib/auth";
import { readDB } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. 验证用户身份
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return new Response(JSON.stringify({ error: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const session = validateSession(token);
    
    if (!session) {
      return new Response(JSON.stringify({ error: "登录已过期，请重新登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 从数据库读取所有文章
    const db = await readDB();
    
    // 3. 筛选当前用户的文章
    const myArticles = db.articles
      .filter(article => article.authorId === session.userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    // 4. 计算统计数据
    const stats = {
      total: myArticles.length,
      published: myArticles.filter(a => a.status === "approved").length,
      pending: myArticles.filter(a => a.status === "pending").length,
      rejected: myArticles.filter(a => a.status === "rejected").length,
      deleted: myArticles.filter(a => a.status === "deleted").length,
    };

    // 5. 返回用户的文章列表和统计
    return new Response(JSON.stringify({
      articles: myArticles,
      stats: stats
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("获取用户文章失败:", err);
    return authErrorResponse(err);
  }
};
