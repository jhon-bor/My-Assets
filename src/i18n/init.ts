/**
 * Global i18next initializer — imported in BaseLayout head.
 * Returns a promise that resolves when i18next is ready.
 */
import { initI18n, LANGUAGES } from "./index";

const STORAGE_KEY = "lookfinde_lang";

export async function init(): Promise<ReturnType<typeof initI18n>> {
  const i18n = await initI18n();

  // Expose i18n instance globally for components
  (window as any).__i18n = i18n;
  (window as any).__LANGUAGES = LANGUAGES;

  // Override i18next changeLanguage to also fire langchange event
  const original = i18n.changeLanguage.bind(i18n);
  i18n.changeLanguage = (lang: string) => {
    return original(lang).then(() => {
      localStorage.setItem(STORAGE_KEY, lang);
      window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
    });
  };

  return i18n;
}

export default init;