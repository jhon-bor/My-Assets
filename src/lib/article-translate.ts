/**
 * On-demand article translation with DB caching.
 *
 * When a reader views an article in a language different from the source,
 * we translate title/summary/content on the fly and cache the result in
 * the DB so subsequent readers get it instantly.
 */

import { translate, SUPPORTED_LANGS } from "./translate";
import type { Lang } from "./translate";
import { readDB, writeDB } from "./db";
import type { Article } from "./db";

export interface ArticleTranslation {
  title: string;
  summary: string;
  content: string;
  translated: boolean;
  backend?: string;
}

/**
 * Get article content in the target language.
 * Returns cached translation if available, otherwise translates on the fly.
 */
export async function getArticleInLang(
  article: Article,
  targetLang: string
): Promise<ArticleTranslation> {
  const sourceLang = (article.sourceLang || "zh") as Lang;

  // Same language — return original
  if (targetLang === sourceLang) {
    return {
      title: article.title,
      summary: article.summary,
      content: article.content,
      translated: false,
    };
  }

  // Check if cached translation exists
  const cachedTitle = article[`title_${targetLang}` as keyof Article] as string | undefined;
  const cachedSummary = article[`summary_${targetLang}` as keyof Article] as string | undefined;
  const cachedContent = article[`content_${targetLang}` as keyof Article] as string | undefined;

  if (cachedTitle && cachedContent) {
    return {
      title: cachedTitle,
      summary: cachedSummary || article.summary,
      content: cachedContent,
      translated: true,
      backend: article.translationBackend,
    };
  }

  // Need to translate — do all three in parallel
  const [titleResult, summaryResult, contentResult] = await Promise.all([
    translate({ text: article.title, from: sourceLang, to: targetLang as Lang }),
    article.summary?.trim()
      ? translate({ text: article.summary, from: sourceLang, to: targetLang as Lang })
      : Promise.resolve(null),
    translate({ text: article.content, from: sourceLang, to: targetLang as Lang }),
  ]);

  const titleText = titleResult.success ? titleResult.text : article.title;
  const summaryText = summaryResult?.success ? summaryResult.text : article.summary;
  const contentText = contentResult.success ? contentResult.text : article.content;
  const backend = titleResult.backend !== "none" ? titleResult.backend : "unknown";
  const anySuccess = titleResult.success || contentResult.success;

  // Only cache if at least one translation actually succeeded (not original fallback)
  if (anySuccess) {
    try {
      const db = await readDB();
      const a = db.articles.find((a) => a.id === article.id);
      if (a) {
        const tk = `title_${targetLang}` as keyof Article;
        const sk = `summary_${targetLang}` as keyof Article;
        const ck = `content_${targetLang}` as keyof Article;
        if (titleResult.success) (a as any)[tk] = titleText;
        if (summaryResult?.success) (a as any)[sk] = summaryText;
        if (contentResult.success) (a as any)[ck] = contentText;
        a.translatedAt = new Date().toISOString();
        a.translationBackend = a.translationBackend || backend;
        await writeDB(db);
      }
    } catch {
      // Non-fatal: cache write failure
    }
  }

  return {
    title: titleText,
    summary: summaryText || article.summary,
    content: contentText,
    translated: true,
    backend,
  };
}

/**
 * Translate a single field (for client-side incremental translation).
 */
export async function translateArticleField(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  const result = await translate({ text, from, to });
  return result.success ? result.text : text;
}
