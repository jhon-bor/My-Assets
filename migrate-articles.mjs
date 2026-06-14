/**
 * Migration: re-translate all existing articles via the translate API.
 * Dev server must be running on localhost:4321.
 * Run: node migrate-articles.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const DB_PATH = "./data/db.json";
const API_BASE = "http://localhost:4321/api/translate";
const LANGS = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];

async function translateViaAPI(text, from, to) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from, to }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  if (data.success) return data.text;
  throw new Error(data.error || "Translation failed");
}

async function translateAllViaAPI(text, from) {
  const results = {};
  for (const to of LANGS) {
    if (to === from) continue;
    try {
      const translated = await translateViaAPI(text, from, to);
      results[to] = { text: translated, success: true };
      console.log(`    → ${to}: ${translated.slice(0, 60)}...`);
    } catch (err) {
      console.log(`    → ${to}: FAILED - ${err.message}`);
      results[to] = { text: text, success: false };
    }
  }
  return results;
}

async function main() {
  console.log("📚 Reading database...");
  const raw = await readFile(DB_PATH, "utf-8");
  const db = JSON.parse(raw);

  const articles = db.articles || [];
  if (articles.length === 0) {
    console.log("No articles found.");
    return;
  }

  console.log(`Found ${articles.length} articles.\n`);

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const sourceLang = a.sourceLang || "zh";
    const preview = a.title.slice(0, 50);
    console.log(`[${i + 1}/${articles.length}] "${preview}" (source: ${sourceLang})`);

    try {
      console.log("  📝 Title:");
      const tRes = await translateAllViaAPI(a.title, sourceLang);
      for (const [lang, r] of Object.entries(tRes)) {
        if (r.success) a[`title_${lang}`] = r.text;
      }

      if (a.summary?.trim()) {
        console.log("  📄 Summary:");
        const sRes = await translateAllViaAPI(a.summary, sourceLang);
        for (const [lang, r] of Object.entries(sRes)) {
          if (r.success) a[`summary_${lang}`] = r.text;
        }
      }

      if (a.content?.trim()) {
        console.log("  📃 Content:");
        const cRes = await translateAllViaAPI(a.content, sourceLang);
        for (const [lang, r] of Object.entries(cRes)) {
          if (r.success) a[`content_${lang}`] = r.text;
        }
      }

      a.sourceLang = sourceLang;
      a.translatedAt = new Date().toISOString();
      a.translationBackend = "migration";

      const translatedLangs = Object.keys(a).filter(k => k.startsWith("title_") && a[k]);
      console.log(`  ✅ Done: ${translatedLangs.map(k => k.replace("title_", "")).join(", ")}\n`);
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
    }
  }

  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  console.log(`💾 Saved to ${DB_PATH}`);
}

main().catch(console.error);
