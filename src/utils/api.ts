/**
 * Backend API — simple file-based store for subscriptions.
 *
 * Endpoints:
 *   POST /api/subscribe     — email subscription
 *   POST /api/download      — track download (requires subscription)
 *   GET  /api/updates       — list recent updates
 *
 * In production, replace with a real database.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const SUBSCRIBERS_FILE = join(DATA_DIR, "subscribers.json");
const UPDATES_FILE = join(DATA_DIR, "updates.json");

/* ── Types ── */

interface Subscriber {
  email: string;
  subscribedAt: string;
  downloads: string[]; // paths downloaded
}

interface Update {
  id: string;
  title: string;
  date: string;
  summary: string;
  noteSlug?: string;
}

/* ── Helpers ── */

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

async function readJSON<T>(filepath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filepath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJSON(filepath: string, data: unknown): Promise<void> {
  await ensureDataDir();
  await writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
}

/* ── API Handlers ── */

export async function handleSubscribe(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const subscribers: Subscriber[] = await readJSON(SUBSCRIBERS_FILE, []);

  const existing = subscribers.find(
    (s) => s.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    return { success: false, message: "该邮箱已订阅。" };
  }

  subscribers.push({
    email: email.toLowerCase(),
    subscribedAt: new Date().toISOString(),
    downloads: [],
  });

  await writeJSON(SUBSCRIBERS_FILE, subscribers);
  return { success: true, message: "订阅成功！" };
}

export async function handleDownload(
  email: string,
  filePath: string
): Promise<{ success: boolean; message: string }> {
  const subscribers: Subscriber[] = await readJSON(SUBSCRIBERS_FILE, []);
  const sub = subscribers.find(
    (s) => s.email.toLowerCase() === email.toLowerCase()
  );

  if (!sub) {
    return { success: false, message: "请先订阅后再下载。" };
  }

  if (!sub.downloads.includes(filePath)) {
    sub.downloads.push(filePath);
    await writeJSON(SUBSCRIBERS_FILE, subscribers);
  }

  return { success: true, message: "下载开始。" };
}

export async function handleGetUpdates(): Promise<Update[]> {
  return readJSON<Update[]>(UPDATES_FILE, [
    {
      id: "1",
      title: "第一期更新 — Obsidian 双向链接教程",
      date: "2026-06-10",
      summary: "详解 Obsidian 双向链接的用法与最佳实践。",
      noteSlug: "obsidian-bidirectional-links",
    },
    {
      id: "2",
      title: "新笔记：移动端适配指南",
      date: "2026-06-08",
      summary: "如何让你的网页在手机浏览器里媲美原生APP。",
      noteSlug: "mobile-first-guide",
    },
  ]);
}

export { readJSON, writeJSON, ensureDataDir };
