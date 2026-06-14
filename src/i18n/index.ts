/**
 * i18next configuration + all UI translations
 * Languages: zh(中文) en(English) ja(日本語) fr(Français) es(Español) pt(Português) de(Deutsch) it(Italiano)
 *
 * Translation files live in ./locales/{lang}.json
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhTranslations from "./locales/zh.json";
import enTranslations from "./locales/en.json";
import jaTranslations from "./locales/ja.json";
import frTranslations from "./locales/fr.json";
import esTranslations from "./locales/es.json";
import ptTranslations from "./locales/pt.json";
import deTranslations from "./locales/de.json";
import itTranslations from "./locales/it.json";

export const LANGUAGES = [
  { code: "zh", label: "中文", nativeLabel: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", flag: "🇯🇵" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇧🇷" },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italian", nativeLabel: "Italiano", flag: "🇮🇹" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

const NS = "common";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resources: Record<string, any> = {
  zh: zhTranslations,
  en: enTranslations,
  ja: jaTranslations,
  fr: frTranslations,
  es: esTranslations,
  pt: ptTranslations,
  de: deTranslations,
  it: itTranslations,
};

let initialized = false;

export async function initI18n() {
  if (initialized) return i18n;
  initialized = true;

  await i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      resources,
      fallbackLng: "zh",
      defaultNS: NS,
      ns: [NS],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "cookie", "navigator"],
        lookupLocalStorage: "lookfinde_lang",
        lookupCookie: "lookfinde_lang",
        caches: ["localStorage", "cookie"],
        checkWhitelist: true,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
}

export default i18n;