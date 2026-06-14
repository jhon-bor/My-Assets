/* ── Language persistence ── */
import type { Lang } from "./translations";

const STORAGE_KEY = "lookfinde_lang";

export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const stored = localStorage.getItem(STORAGE_KEY);
  const all: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
  return all.includes(stored as Lang) ? (stored as Lang) : "zh";
}

export function setStoredLang(lang: Lang): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
  // Dispatch event so all components react
  window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
}

export function onLangChange(callback: (lang: Lang) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => callback((e as CustomEvent).detail);
  window.addEventListener("langchange", handler);
  return () => window.removeEventListener("langchange", handler);
}
