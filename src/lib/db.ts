/**
 * File-based JSON database.
 * Simple, zero-dependency, works everywhere.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const DATA_DIR = join(process.cwd(), "data");

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
  // Primary content (author's original language)
  title: string;
  content: string;
  folder: string;
  tags: string[];
  summary: string;
  // Author's original writing language (defaults to "zh" for legacy articles)
  sourceLang?: string;
  status: "pending" | "approved" | "rejected";
  authorId: string;
  authorEmail: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  // Auto-translated versions
  title_en?: string; title_ja?: string; title_fr?: string;
  title_es?: string; title_pt?: string; title_de?: string; title_it?: string;
  content_en?: string; content_ja?: string; content_fr?: string;
  content_es?: string; content_pt?: string; content_de?: string; content_it?: string;
  summary_en?: string; summary_ja?: string; summary_fr?: string;
  summary_es?: string; summary_pt?: string; summary_de?: string; summary_it?: string;
  // Translation metadata
  translatedAt?: string;
  translationBackend?: string;
}

interface DB {
  users: User[];
  articles: Article[];
}

const INITIAL_DB: DB = {
  users: [],
  articles: [],
};

async function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readDB(): Promise<DB> {
  await ensureDir();
  const file = join(DATA_DIR, "db.json");
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { users: [], articles: [] };
  }
}

export async function writeDB(db: DB): Promise<void> {
  await ensureDir();
  const file = join(DATA_DIR, "db.json");
  await writeFile(file, JSON.stringify(db, null, 2), "utf-8");
}

/* ── User helpers ── */

export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  const db = await readDB();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  const db = await readDB();
  return db.users.find((u) => u.id === id);
}

export async function createUser(
  user: Omit<User, "id" | "createdAt">
): Promise<User> {
  const db = await readDB();
  const newUser: User = {
    ...user,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  await writeDB(db);
  return newUser;
}

/* ── Article helpers ── */

export async function getArticlesByStatus(
  status: Article["status"]
): Promise<Article[]> {
  const db = await readDB();
  return db.articles
    .filter((a) => a.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getApprovedArticles(): Promise<Article[]> {
  return getArticlesByStatus("approved");
}

export async function getPendingArticles(): Promise<Article[]> {
  return getArticlesByStatus("pending");
}

export async function createArticle(
  article: Omit<Article, "id" | "createdAt" | "status" | "reviewedAt" | "reviewedBy">
): Promise<Article> {
  const db = await readDB();
  const newArticle: Article = {
    ...article,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.articles.push(newArticle);
  await writeDB(db);
  return newArticle;
}

export async function updateArticleStatus(
  id: string,
  status: Article["status"],
  reviewerId: string
): Promise<Article | null> {
  const db = await readDB();
  const article = db.articles.find((a) => a.id === id);
  if (!article) return null;
  article.status = status;
  article.reviewedAt = new Date().toISOString();
  article.reviewedBy = reviewerId;
  await writeDB(db);
  return article;
}

/** Admin direct publish — bypasses review, immediately approved */
export async function adminPublish(
  article: Omit<Article, "id" | "createdAt" | "status" | "reviewedAt" | "reviewedBy">,
  adminId: string
): Promise<Article> {
  const db = await readDB();
  const newArticle: Article = {
    ...article,
    id: crypto.randomUUID(),
    status: "approved",
    createdAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId,
  };
  db.articles.push(newArticle);
  await writeDB(db);
  return newArticle;
}

/** Seed admin account if none exists */
export async function seedAdmin(): Promise<void> {
  const existing = await findUserByEmail("admin@lookfinde.com");
  if (existing) return; // already seeded

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("admin123", 10);

  await createUser({
    email: "admin@lookfinde.com",
    passwordHash,
    role: "admin",
    displayName: "管理员",
  });

  console.log("✅ 默认管理员已创建: admin@lookfinde.com / admin123");
}
