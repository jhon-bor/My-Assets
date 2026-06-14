/**
 * Astro integration — injects i18next and translation data into every page.
 * Also provides server-side translation helper.
 */
import type { AstroIntegration } from "astro";
import { initI18n } from "./index";

const LANGS = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"] as const;
type Lang = (typeof LANGS)[number];

/** Parse a note's markdown body into language sections */
export function splitBodyByLang(body: string): Record<Lang, string> {
  const sections = body.split(/<!-- (EN|JA|FR|ES|PT|DE|IT) -->/gi);
  // sections[0] = before first delimiter = ZH
  // sections[1] = first delimiter label
  // sections[2] = content between first and second delimiter
  // etc.
  const result: Record<Lang, string> = { zh: "", en: "", ja: "", fr: "", es: "", pt: "", de: "", it: "" };

  if (sections.length === 1) {
    result.zh = sections[0].trim();
    return result;
  }

  // sections alternates: [content, label, content, label, content, ...]
  let currentLang: Lang = "zh";
  let currentContent = "";

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (i % 2 === 0) {
      // Content block
      currentContent += s;
    } else {
      // Lang label — save previous lang's content
      result[currentLang] = currentContent.trim();
      currentLang = s.toLowerCase() as Lang;
      if (!LANGS.includes(currentLang)) currentLang = "zh";
      currentContent = "";
    }
  }
  result[currentLang] = currentContent.trim();
  return result;
}

/** Get title for a specific language, fallback chain: requested → all other langs → zh */
export function getTitle(note: any, lang: Lang): string {
  if (!note) return "";
  
  // Get all available titles (non-empty)
  const allTitles = [
    note.data.title_zh,
    note.data.title_en,
    note.data.title_ja,
    note.data.title_fr,
    note.data.title_es,
    note.data.title_pt,
    note.data.title_de,
    note.data.title_it,
  ].filter(Boolean);
  
  // First try requested lang
  const map: Record<Lang, string | undefined> = {
    zh: note.data.title_zh,
    en: note.data.title_en,
    ja: note.data.title_ja,
    fr: note.data.title_fr,
    es: note.data.title_es,
    pt: note.data.title_pt,
    de: note.data.title_de,
    it: note.data.title_it,
  };
  
  // Return requested lang, or any available title, or empty string
  return map[lang] || allTitles[0] || "";
}

export function getSummary(note: any, lang: Lang): string {
  if (!note) return "";
  
  // Get all available summaries (non-empty)
  const allSummaries = [
    note.data.summary_zh,
    note.data.summary_en,
    note.data.summary_ja,
    note.data.summary_fr,
    note.data.summary_es,
    note.data.summary_pt,
    note.data.summary_de,
    note.data.summary_it,
  ].filter(Boolean);
  
  const map: Record<Lang, string | undefined> = {
    zh: note.data.summary_zh,
    en: note.data.summary_en,
    ja: note.data.summary_ja,
    fr: note.data.summary_fr,
    es: note.data.summary_es,
    pt: note.data.summary_pt,
    de: note.data.summary_de,
    it: note.data.summary_it,
  };
  
  return map[lang] || allSummaries[0] || "";
}

export { LANGS };
export type { Lang };