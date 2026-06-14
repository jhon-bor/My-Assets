import { useState, useEffect } from "react";

type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

interface NoteContentProps {
  html_zh: string;
  html_en?: string;
  html_ja?: string;
  html_fr?: string;
  html_es?: string;
  html_pt?: string;
  html_de?: string;
  html_it?: string;
  slug: string;
  title_zh?: string; title_en?: string; title_ja?: string; title_fr?: string;
  title_es?: string; title_pt?: string; title_de?: string; title_it?: string;
  prevNote_zh?: string;
  prevNote_en?: string;
  prevNote_ja?: string;
  prevNote_fr?: string;
  prevNote_es?: string;
  prevNote_pt?: string;
  prevNote_de?: string;
  prevNote_it?: string;
  prevSlug?: string;
  nextNote_zh?: string;
  nextNote_en?: string;
  nextNote_ja?: string;
  nextNote_fr?: string;
  nextNote_es?: string;
  nextNote_pt?: string;
  nextNote_de?: string;
  nextNote_it?: string;
  nextSlug?: string;
  pageUrl: string;
  /** Language prefix for internal links (e.g. "zh", "en") */
  lang?: string;
}

const COPY: Record<Lang, { copyLink: string; share: string; prev: string; next: string; copied: string }> = {
  zh: { copyLink: "复制链接", share: "分享", prev: "上一篇", next: "下一篇", copied: "已复制" },
  en: { copyLink: "Copy link", share: "Share", prev: "Previous", next: "Next", copied: "Copied!" },
  ja: { copyLink: "リンクをコピー", share: "シェア", prev: "前へ", next: "次へ", copied: "コピーしました" },
  fr: { copyLink: "Copier le lien", share: "Partager", prev: "Précédent", next: "Suivant", copied: "Copié !" },
  es: { copyLink: "Copiar enlace", share: "Compartir", prev: "Anterior", next: "Siguiente", copied: "¡Copiado!" },
  pt: { copyLink: "Copiar link", share: "Compartilhar", prev: "Anterior", next: "Próximo", copied: "Copiado!" },
  de: { copyLink: "Link kopieren", share: "Teilen", prev: "Vorherige", next: "Nächste", copied: "Kopiert!" },
  it: { copyLink: "Copia link", share: "Condividi", prev: "Precedente", next: "Successivo", copied: "Copiato!" },
};

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const s = localStorage.getItem("lookfinde_lang");
  const all: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
  return all.includes(s as Lang) ? (s as Lang) : "zh";
}

function getPrevNext(lang: Lang, props: NoteContentProps) {
  const prevMap: Record<Lang, string | undefined> = {
    zh: props.prevNote_zh, en: props.prevNote_en, ja: props.prevNote_ja,
    fr: props.prevNote_fr, es: props.prevNote_es, pt: props.prevNote_pt,
    de: props.prevNote_de, it: props.prevNote_it,
  };
  const nextMap: Record<Lang, string | undefined> = {
    zh: props.nextNote_zh, en: props.nextNote_en, ja: props.nextNote_ja,
    fr: props.nextNote_fr, es: props.nextNote_es, pt: props.nextNote_pt,
    de: props.nextNote_de, it: props.nextNote_it,
  };
  return {
    prevTitle: prevMap[lang] || props.prevNote_zh,
    nextTitle: nextMap[lang] || props.nextNote_zh,
  };
}

function getHtml(lang: Lang, props: NoteContentProps): string {
  // Get all available HTML content
  const allHtml = [
    props.html_zh,
    props.html_en,
    props.html_ja,
    props.html_fr,
    props.html_es,
    props.html_pt,
    props.html_de,
    props.html_it,
  ].filter(Boolean);
  
  // First try requested lang
  const htmlMap: Record<Lang, string | undefined> = {
    zh: props.html_zh,
    en: props.html_en,
    ja: props.html_ja,
    fr: props.html_fr,
    es: props.html_es,
    pt: props.html_pt,
    de: props.html_de,
    it: props.html_it,
  };
  
  // Return requested lang, or any available content, or empty string
  return htmlMap[lang] || allHtml[0] || "";
}

const ALL_LANGS: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];

export default function NoteContent(props: NoteContentProps) {
  // Initialize from URL prop first (for SSR consistency), fall back to stored lang
  const initLang: Lang = (props.lang && ALL_LANGS.includes(props.lang as Lang))
    ? (props.lang as Lang)
    : getStoredLang();
  const [lang, setLang] = useState<Lang>(initLang);

  useEffect(() => {
    // Prefer URL lang over stored lang (URL is the source of truth)
    const urlLang = (props.lang && ALL_LANGS.includes(props.lang as Lang)) ? props.lang : null;
    const stored = getStoredLang();
    // Only override if URL lang matches stored (don't downgrade URL lang to stored)
    if (urlLang) {
      setLang(urlLang as Lang);
      localStorage.setItem("lookfinde_lang", urlLang); // sync storage to URL
    } else {
      setLang(stored);
    }
    const handler = (e: Event) => {
      const l = (e as CustomEvent<string>).detail;
      if (l && ALL_LANGS.includes(l as Lang)) setLang(l as Lang);
    };
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);

  const { prevTitle, nextTitle } = getPrevNext(lang, props);
  const copy = COPY[lang];

  return (
    <>
      <article className="reading-article" dangerouslySetInnerHTML={{ __html: getHtml(lang, props) }} />

      {/* Footer actions */}
      <div className="flex items-center gap-3 mt-10 pt-8 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button
          data-copy-url={props.pageUrl}
          className="copy-link-btn inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-4 py-2 transition-all"
          style={{
            background: "var(--color-bg-tertiary)",
            color: "var(--color-text-secondary)",
            border: "none",
            cursor: "pointer",
            minHeight: 40,
            fontSize: "0.8rem",
          }}
        >
          🔗 {copy.copyLink}
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("")}&url=${encodeURIComponent(props.pageUrl)}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-4 py-2 transition-all"
          style={{
            background: "var(--color-bg-tertiary)",
            color: "var(--color-text-secondary)",
            textDecoration: "none",
            minHeight: 40,
            fontSize: "0.8rem",
          }}
        >
          𝕏 {copy.share}
        </a>
      </div>

      {/* Prev / Next */}
      <nav className="mt-10 pt-8 border-t grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderColor: "var(--color-border)" }}>
        {props.prevSlug ? (
          <a href={`/${props.lang || "zh"}/notes/${props.prevSlug}/`} className="group rounded-xl p-4 transition-all border border-transparent hover:border-[var(--color-border)] hover:shadow-sm" style={{ background: "var(--color-surface)", textDecoration: "none" }}>
            <span className="text-xs block mb-1" style={{ color: "var(--color-text-muted)" }}>← {copy.prev}</span>
            <span className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" style={{ color: "var(--color-text)" }}>{prevTitle}</span>
          </a>
        ) : <div />}
        {props.nextSlug && (
          <a href={`/${props.lang || "zh"}/notes/${props.nextSlug}/`} className="group rounded-xl p-4 text-right transition-all border border-transparent hover:border-[var(--color-border)] hover:shadow-sm" style={{ background: "var(--color-surface)", textDecoration: "none" }}>
            <span className="text-xs block mb-1" style={{ color: "var(--color-text-muted)" }}>{copy.next} →</span>
            <span className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" style={{ color: "var(--color-text)" }}>{nextTitle}</span>
          </a>
        )}
      </nav>

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('.copy-link-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var url = btn.getAttribute('data-copy-url') || window.location.href;
            navigator.clipboard.writeText(url).then(function() {
              var lang = localStorage.getItem('lookfinde_lang') || 'zh';
              var copied = {zh:'已复制',en:'Copied!',ja:'コピーしました',fr:'Copié !',es:'¡Copiado!',pt:'Copiado!',de:'Kopiert!',it:'Copiato!'}[lang] || '已复制';
              btn.textContent = '✓ ' + copied;
              setTimeout(function() {
                var orig = {zh:'🔗 复制链接',en:'🔗 Copy link',ja:'🔗 リンクをコピー',fr:'🔗 Copier le lien',es:'🔗 Copiar enlace',pt:'🔗 Copiar link',de:'🔗 Link kopieren',it:'🔗 Copia link'}[lang] || '🔗 复制链接';
                btn.textContent = orig;
              }, 2000);
            });
          });
        });
      `}} />
    </>
  );
}