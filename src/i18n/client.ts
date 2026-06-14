/**
 * Client-side i18n — lightweight, no framework needed.
 * Reads lang from localStorage, scans [data-i18n] elements,
 * replaces text on page load and on lang change.
 */

type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

type Translations = Record<Lang, Record<string, string>>;

const ALL_LANGS: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];

const TRANSLATIONS: Translations = {
  zh: {},
  en: {},
  ja: {},
  fr: {},
  es: {},
  pt: {},
  de: {},
  it: {},
};

let currentLang: Lang = "zh";

export function registerTranslations(translations: Translations): void {
  for (const lang of ALL_LANGS) {
    Object.assign(TRANSLATIONS[lang], translations[lang] || {});
  }
}

export function getLang(): Lang {
  const s = localStorage.getItem("lookfinde_lang");
  if (ALL_LANGS.includes(s as Lang)) return s as Lang;
  const browserLang = navigator.language?.toLowerCase().replace(/-.*/, "");
  if (ALL_LANGS.includes(browserLang as Lang)) return browserLang as Lang;
  return "zh";
}

export function t(key: string): string {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.zh[key] || key;
}

export function updatePage(): void {
  currentLang = getLang();
  document.documentElement.setAttribute("data-lang", currentLang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n")!;
    const text = t(key);
    if (text) el.textContent = text;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder")!;
    const text = t(key);
    if (text) (el as HTMLInputElement).placeholder = text;
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title")!;
    const text = t(key);
    if (text) el.setAttribute("title", text);
  });

  document.querySelectorAll("[data-i]").forEach((el) => {
    const key = el.getAttribute("data-i")!;
    const text = t(key);
    if (text) {
      const count = el.getAttribute("data-count");
      el.textContent = count ? count + " " + text : text;
    }
  });
}

export function initI18n(translations?: Translations): void {
  if (translations) registerTranslations(translations);
  updatePage();
  window.addEventListener("langchange", updatePage);
}
