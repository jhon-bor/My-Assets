/**
 * Global language management - shared across all pages and components.
 * Ensures consistent language handling throughout the application.
 */

export type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

const ALL_LANGS: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];

/** Extract language from URL path (e.g. /ja/notes -> "ja") */
export function getLangFromUrl(): Lang | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/([a-z]{2})\//);
  if (match && ALL_LANGS.includes(match[1] as Lang)) {
    return match[1] as Lang;
  }
  return null;
}

/** Get current language - URL takes priority */
export function getCurrentLang(): Lang {
  const urlLang = getLangFromUrl();
  if (urlLang) return urlLang;
  
  const stored = localStorage.getItem("lookfinde_lang");
  if (stored && ALL_LANGS.includes(stored as Lang)) {
    return stored as Lang;
  }
  
  const browserLang = navigator.language?.toLowerCase().replace(/-.*/, "");
  if (browserLang && ALL_LANGS.includes(browserLang as Lang)) {
    return browserLang as Lang;
  }
  
  return "zh";
}

/** Update all page elements to the current language */
export function updateAllContent(): void {
  const lang = getCurrentLang();
  document.documentElement.setAttribute("data-lang", lang);
  
  // Update [data-i] elements (UI text)
  updateDataIElements(lang);
  
  // Update [data-i18n] elements
  updateDataI18nElements(lang);
  
  // Update folder names
  updateFolderNames(lang);
  
  // Update note titles
  updateNoteTitles(lang);
  
  // Update card titles/summaries
  updateCardContent(lang);
  
  // Update timeline items
  updateTimelineItems(lang);
  
