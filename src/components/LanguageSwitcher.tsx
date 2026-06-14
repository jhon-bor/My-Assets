import { useState, useEffect, useRef } from "react";
import { LANGUAGES } from "../i18n/index";

type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

interface Props {
  /** Current language from the URL path */
  currentLang?: string;
}

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const s = localStorage.getItem("lookfinde_lang");
  const all: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
  return all.includes(s as Lang) ? (s as Lang) : "zh";
}

/**
 * Navigate to the same path but with a different language prefix.
 * E.g. /en/notes/foo → /ja/notes/foo
 *      /notes/foo    → /ja/notes/foo  (if currentLang is absent but path has /en/...)
 */
function navigateToLang(newLang: Lang, currentLang?: string) {
  const pathname = window.location.pathname;

  // Try to replace existing language prefix in the path
  const langPattern = /^\/([a-z]{2})(\/|$)/;
  const match = pathname.match(langPattern);

  if (match) {
    // Path already has a language prefix — replace it
    const newPath = `/${newLang}${pathname.slice(match[0].length - match[2].length)}`;
    window.location.href = newPath + window.location.search + window.location.hash;
  } else {
    // No language prefix — prepend it
    window.location.href = `/${newLang}${pathname}${window.location.search}${window.location.hash}`;
  }
}

export default function LanguageSwitcher({ currentLang }: Props) {
  const [lang, setLang] = useState<Lang>("zh");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prefer URL language, fall back to stored language
    const urlLang = currentLang as Lang;
    const all: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
    if (urlLang && all.includes(urlLang)) {
      setLang(urlLang);
    } else {
      setLang(getStoredLang());
    }

    function onLangChange(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail && all.includes(detail as Lang)) setLang(detail as Lang);
    }
    window.addEventListener("langchange", onLangChange);
    return () => window.removeEventListener("langchange", onLangChange);
  }, [currentLang]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const toggle = (code: Lang) => {
    // Update localStorage for i18next UI translation
    localStorage.setItem("lookfinde_lang", code);
    window.dispatchEvent(new CustomEvent("langchange", { detail: code }));
    setLang(code);
    setOpen(false);
    // Navigate to same path with new language prefix
    navigateToLang(code, currentLang);
  };

  return (
    <div ref={ref} className="lang-switcher-wrap" style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="lang-switch-btn"
        aria-label="Switch language"
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          padding: "0.35rem 0.75rem", borderRadius: "var(--radius-sm)",
          fontSize: "0.78rem", fontWeight: 700,
          color: "var(--color-text-secondary)", background: "transparent",
          border: "1px solid var(--color-border)", cursor: "pointer",
          minHeight: 36,
        }}
      >
        <span>{current.flag}</span>
        <span style={{ fontSize: "0.7rem" }}>{current.code.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="lang-dropdown"
          style={{
            position: "absolute", top: "100%", right: 0, zIndex: 200,
            marginTop: "6px", minWidth: 160,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
            animation: "fadeIn 0.15s ease",
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => toggle(l.code as Lang)}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                width: "100%", padding: "0.6rem 0.85rem",
                fontSize: "0.82rem", fontWeight: l.code === lang ? 700 : 500,
                color: l.code === lang ? "var(--color-primary)" : "var(--color-text)",
                background: l.code === lang ? "var(--color-primary-light)" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                transition: "background 0.1s",
                minHeight: 42,
              }}
              onMouseEnter={(e) => { if (l.code !== lang) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-secondary)"; }}
              onMouseLeave={(e) => { if (l.code !== lang) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <span style={{ fontSize: "1.1rem" }}>{l.flag}</span>
              <span style={{ flex: 1 }}>{l.nativeLabel}</span>
              {l.code === lang && <span style={{ fontSize: "0.7rem" }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}