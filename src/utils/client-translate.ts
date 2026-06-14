/**
 * Client-side translation using Google Translate (works from browser).
 * Uses translate.googleapis.com which is accessible from browsers globally.
 */
export type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

const LANG_MAP: Record<string, string> = {
  zh: "zh-CN", en: "en", ja: "ja", fr: "fr", es: "es", pt: "pt", de: "de", it: "it",
};

const cache = new Map<string, string>();

/**
 * Translate text from source language to target language using Google Translate.
 * Works in the browser (where translate.googleapis.com is accessible).
 * Results are cached in memory.
 */
export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  const cacheKey = `${from}:${to}:${text}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Try server API first (for DB caching)
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, from, to }),
    });
    const data = await res.json();
    if (data.success) {
      cache.set(cacheKey, data.text);
      return data.text;
    }
  } catch {
    // Server API failed, try Google Translate directly
  }

  // Fallback: Google Translate from browser
  try {
    const sl = LANG_MAP[from] || "auto";
    const tl = LANG_MAP[to] || to;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const sentences = (data[0] as any[]) || [];
      const translated = sentences.map((s: any[]) => s[0] || "").join("");
      if (translated && translated !== text) {
        cache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch {
    // Google Translate also failed
  }

  return text; // All backends failed, return original
}
