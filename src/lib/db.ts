/**
 * Cloudflare D1 Database Layer
 * Replaces node:fs based JSON database
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "subscriber";
  displayName: string;
  createdAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  summary: string;
  sourceLang?: string;
  status: "pending" | "approved" | "rejected";
  authorId: string;
  authorEmail: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  title_en?: string; title_ja?: string; title_fr?: string;
  title_es?: string; title_pt?: string; title_de?: string; title_it?: string;
  content_en?: string; content_ja?: string; content_fr?: string;
  content_es?: string; content_pt?: string; content_de?: string; content_it?: string;
  summary_en?: string; summary_ja?: string; summary_fr?: string;
  summary_es?: string; summary_pt?: string; summary_de?: string; summary_it?: string;
  translatedAt?: string;
  translationBackend?: string;
}

/** Create a D1 database client from the Cloudflare env binding */
function getDB(env: any) {
  return env.my_assets_db;
}

/* ── User helpers ── */

export async function findUserByEmail(email: string, env: any): Promise<User | null> {
  const db = getDB(env);
  const result = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (!result) return null;
  return {
    id: result.id,
    email: result.email,
    passwordHash: result.password_hash,
    role: result.role,
    displayName: result.display_name,
    createdAt: result.created_at,
  };
}

export async function findUserById(id: string, env: any): Promise<User | null> {
  const db = getDB(env);
  const result = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  if (!result) return null;
  return {
    id: result.id,
    email: result.email,
    passwordHash: result.password_hash,
    role: result.role,
    displayName: result.display_name,
    createdAt: result.created_at,
  };
}

export async function createUser(
  user: Omit<User, "id" | "createdAt">,
  env: any
): Promise<User> {
  const db = getDB(env);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.prepare(
    "INSERT INTO users (id, email, password_hash, role, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, user.email.toLowerCase(), user.passwordHash, user.role, user.displayName, createdAt).run();
  return { id, createdAt, ...user };
}

export async function seedAdmin(env: any): Promise<void> {
  const existing = await findUserByEmail("admin@lookfinde.com", env);
  if (existing) return;
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("admin123", 10);
  await createUser({
    email: "admin@lookfinde.com",
    passwordHash,
    role: "admin",
    displayName: "管理员",
  }, env);
  console.log("✅ 默认管理员已创建: admin@lookfinde.com / admin123");
}

/* ── Article helpers ── */

function rowToArticle(row: any): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    folder: row.folder,
    tags: row.tags ? JSON.parse(row.tags) : [],
    summary: row.summary,
    sourceLang: row.source_lang,
    status: row.status,
    authorId: row.author_id,
    authorEmail: row.author_email,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    title_en: row.title_en, title_ja: row.title_ja, title_fr: row.title_fr,
    title_es: row.title_es, title_pt: row.title_pt, title_de: row.title_de, title_it: row.title_it,
    content_en: row.content_en, content_ja: row.content_ja, content_fr: row.content_fr,
    content_es: row.content_es, content_pt: row.content_pt, content_de: row.content_de, content_it: row.content_it,
    summary_en: row.summary_en, summary_ja: row.summary_ja, summary_fr: row.summary_fr,
    summary_es: row.summary_es, summary_pt: row.summary_pt, summary_de: row.summary_de, summary_it: row.summary_it,
    translatedAt: row.translated_at,
    translationBackend: row.translation_backend,
  };
}

export async function getApprovedArticles(env: any): Promise<Article[]> {
  const db = getDB(env);
  const result = await db.prepare("SELECT * FROM articles WHERE status = 'approved' ORDER BY created_at DESC").all();
  return result.results.map(rowToArticle);
}

export async function getPendingArticles(env: any): Promise<Article[]> {
  const db = getDB(env);
  const result = await db.prepare("SELECT * FROM articles WHERE status = 'pending' ORDER BY created_at DESC").all();
  return result.results.map(rowToArticle);
}

export async function createArticle(
  article: Omit<Article, "id" | "createdAt" | "status" | "reviewedAt" | "reviewedBy">,
  env: any
): Promise<Article> {
  const db = getDB(env);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.prepare(`
    INSERT INTO articles (id, slug, title, content, folder, tags, summary, source_lang, status, author_id, author_email, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).bind(id, article.slug, article.title, article.content, article.folder, JSON.stringify(article.tags), article.summary, article.sourceLang || "zh", article.authorId, article.authorEmail, createdAt).run();
  return { id, status: "pending", createdAt, ...article };
}

export async function updateArticleStatus(
  id: string,
  status: Article["status"],
  reviewerId: string,
  env: any
): Promise<Article | null> {
  const db = getDB(env);
  const reviewedAt = new Date().toISOString();
  await db.prepare("UPDATE articles SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?")
    .bind(status, reviewedAt, reviewerId, id).run();
  const result = await db.prepare("SELECT * FROM articles WHERE id = ?").bind(id).first();
  return result ? rowToArticle(result) : null;
}

export async function adminPublish(
  article: Omit<Article, "id" | "createdAt" | "status" | "reviewedAt" | "reviewedBy">,
  adminId: string,
  env: any
): Promise<Article> {
  const db = getDB(env);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const reviewedAt = createdAt;
  await db.prepare(`
    INSERT INTO articles (id, slug, title, content, folder, tags, summary, source_lang, status, author_id, author_email, created_at, reviewed_at, reviewed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?)
  `).bind(id, article.slug, article.title, article.content, article.folder, JSON.stringify(article.tags), article.summary, article.sourceLang || "zh", article.authorId, article.authorEmail, createdAt, reviewedAt, adminId).run();
  return { id, status: "approved", createdAt, reviewedAt, reviewedBy: adminId, ...article };
}

export async function getArticleById(id: string, env: any): Promise<Article | null> {
  const db = getDB(env);
  const result = await db.prepare("SELECT * FROM articles WHERE id = ?").bind(id).first();
  return result ? rowToArticle(result) : null;
}

export async function getArticlesByStatus(status: string, env: any): Promise<Article[]> {
  const db = getDB(env);
  const result = await db.prepare("SELECT * FROM articles WHERE status = ? ORDER BY created_at DESC").bind(status).all();
  return result.results.map(rowToArticle);
}

export async function getArticlesByAuthor(authorId: string, env: any): Promise<Article[]> {
  const db = getDB(env);
  const result = await db.prepare("SELECT * FROM articles WHERE author_id = ? ORDER BY created_at DESC").bind(authorId).all();
  return result.results.map(rowToArticle);
}

export async function deleteArticle(id: string, permanent: boolean, env: any): Promise<boolean> {
  const db = getDB(env);
  if (permanent) {
    await db.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
  } else {
    await db.prepare("UPDATE articles SET status = 'deleted', deleted_at = ?, deleted_by = 'admin' WHERE id = ?")
      .bind(new Date().toISOString(), id).run();
  }
  return true;
}

export async function updateArticle(id: string, updates: Partial<Article>, env: any): Promise<Article | null> {
  const db = getDB(env);
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.title) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.content) { fields.push("content = ?"); values.push(updates.content); }
  if (updates.slug) { fields.push("slug = ?"); values.push(updates.slug); }
  if (updates.folder) { fields.push("folder = ?"); values.push(updates.folder); }
  if (updates.tags) { fields.push("tags = ?"); values.push(JSON.stringify(updates.tags)); }
  if (updates.summary) { fields.push("summary = ?"); values.push(updates.summary); }
  if (updates.status) { fields.push("status = ?"); values.push(updates.status); }
  if (updates.title_en) { fields.push("title_en = ?"); values.push(updates.title_en); }
  if (updates.content_en) { fields.push("content_en = ?"); values.push(updates.content_en); }
  if (updates.summary_en) { fields.push("summary_en = ?"); values.push(updates.summary_en); }
  if (fields.length === 0) return getArticleById(id, env);
  values.push(id);
  await db.prepare(`UPDATE articles SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  return getArticleById(id, env);
}