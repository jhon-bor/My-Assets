/**
 * Server-side i18n helper for Astro SSR pages.
 * Imports locale JSON files and provides a synchronous t(lang, key) function.
 *
 * Usage in Astro frontmatter:
 *   import { t } from "../../i18n/server";
 *   const label = t(lang, "note.author");
 */

import zhCommon from "./locales/zh.json";
import enCommon from "./locales/en.json";
import jaCommon from "./locales/ja.json";
import frCommon from "./locales/fr.json";
import esCommon from "./locales/es.json";
import ptCommon from "./locales/pt.json";
import deCommon from "./locales/de.json";
import itCommon from "./locales/it.json";

type LocaleData = { common: Record<string, string> };

const locales: Record<string, LocaleData> = {
  zh: zhCommon as LocaleData,
  en: enCommon as LocaleData,
  ja: jaCommon as LocaleData,
  fr: frCommon as LocaleData,
  es: esCommon as LocaleData,
  pt: ptCommon as LocaleData,
  de: deCommon as LocaleData,
  it: itCommon as LocaleData,
};

/**
 * Get a translated string for the given language and key.
 * Falls back to Chinese ("zh") if the language or key is not found.
 */
export function t(lang: string, key: string): string {
  const data = locales[lang] || locales.zh;
  return data.common[key] || locales.zh.common[key] || key;
}

/** Translate a folder name for the given language */
export function translateFolder(folderName: string, lang: string): string {
  const map: Record<string, Record<string, string>> = {
    zh: { "技术笔记":"技术笔记","生活随笔":"生活随笔","关于":"关于","未分类":"未分类","测试":"测试","公告":"公告","技術ノート":"技术笔记" },
    en: { "技术笔记":"Tech Notes","生活随笔":"Life","关于":"About","未分类":"Uncategorized","测试":"Test","公告":"Announcement","技術ノート":"Tech Notes" },
    ja: { "技术笔记":"技術ノート","生活随笔":"ライフ","关于":"概要","未分类":"未分類","测试":"テスト","公告":"お知らせ","技術ノート":"技術ノート" },
    fr: { "技术笔记":"Notes tech","生活随笔":"Vie","关于":"À propos","未分类":"Non classé","测试":"Test","公告":"Annonce","技術ノート":"Notes tech" },
    es: { "技术笔记":"Notas técnicas","生活随笔":"Vida","关于":"Acerca de","未分类":"Sin categoría","测试":"Prueba","公告":"Anuncio","技術ノート":"Notas técnicas" },
    pt: { "技术笔记":"Notas técnicas","生活随笔":"Vida","关于":"Sobre","未分类":"Sem categoria","测试":"Teste","公告":"Anúncio","技術ノート":"Notas técnicas" },
    de: { "技术笔记":"Tech-Notizen","生活随笔":"Leben","关于":"Über","未分类":"Unkategorisiert","测试":"Test","公告":"Ankündigung","技術ノート":"Tech-Notizen" },
    it: { "技术笔记":"Note tech","生活随笔":"Vita","关于":"Info","未分类":"Non classificato","测试":"Test","公告":"Annuncio","技術ノート":"Note tech" },
  };
  return (map[lang] || map.zh)[folderName] || folderName;
}

/**
 * Get the native name of a language code.
 */
export function langNativeName(code: string): string {
  const names: Record<string, string> = {
    zh: "中文",
    en: "English",
    ja: "日本語",
    fr: "Français",
    es: "Español",
    pt: "Português",
    de: "Deutsch",
    it: "Italiano",
  };
  return names[code] || code;
}
