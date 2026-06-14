import { useState, useEffect, useCallback } from "react";
import { translateText } from "../utils/client-translate";

type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

interface DbArticle {
  id: string; slug: string; folder: string;
  tags: string[]; createdAt: string; authorEmail: string;
  title: string; summary: string; content: string;
  sourceLang?: string;
  title_en?: string; title_ja?: string; title_fr?: string;
  title_es?: string; title_pt?: string; title_de?: string; title_it?: string;
  content_en?: string; content_ja?: string; content_fr?: string;
  content_es?: string; content_pt?: string; content_de?: string; content_it?: string;
  summary_en?: string; summary_ja?: string; summary_fr?: string;
  summary_es?: string; summary_pt?: string; summary_de?: string; summary_it?: string;
}

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const s = localStorage.getItem("lookfinde_lang");
  const all: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
  return (all.includes(s as Lang) ? s : "zh") as Lang;
}

interface Props { lang?: string; }

function getLangField(article: DbArticle, field: "title" | "summary" | "content", lang: Lang): string {
  const src = article.sourceLang || "zh";
  if (lang === src) return article[field] || "";
  const key = `${field}_${lang}` as keyof DbArticle;
  return (article[key] as string) || article[field] || "";
}

function hasTranslation(article: DbArticle, lang: Lang): boolean {
  const src = article.sourceLang || "zh";
  if (lang === src) return true;
  return !!(article[`title_${lang}` as keyof DbArticle]);
}

function extractFirstImage(content: string): string | null {
  const md = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (md) return md[1];
  const html = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*\/?>/i);
  return html ? html[1] : null;
}

export default function DbArticlesFeed({ lang: urlLang }: Props = {}) {
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("zh");
  const [translating, setTranslating] = useState<Set<string>>(new Set());

  // Load articles
  useEffect(() => {
    fetch("/api/articles/public")
      .then((r) => r.json())
      .then((data) => setArticles(data.sort((a: DbArticle, b: DbArticle) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(() => {})
      .finally(() => setLoading(false));

    const initialLang = (urlLang as Lang) || getStoredLang();
    setLang(initialLang);
    const onLangChange = () => setLang(getStoredLang());
    window.addEventListener("langchange", onLangChange);
    return () => window.removeEventListener("langchange", onLangChange);
  }, []);

  // On-demand translation when lang or articles change
  useEffect(() => {
    if (loading || articles.length === 0) return;

    const needsTranslation = articles.filter((a) => !hasTranslation(a, lang) && (a.sourceLang || "zh") !== lang);

    if (needsTranslation.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const a of needsTranslation) {
        if (cancelled) break;
        const src = a.sourceLang || "zh";
        setTranslating((prev) => new Set(prev).add(a.id));

        try {
          // Try server API first (caches in DB for everyone)
          const res = await fetch("/api/articles/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ articleId: a.id, lang }),
          });
          const data = await res.json();
          if (data.translated && data.title !== a.title && !cancelled) {
            setArticles((prev) =>
              prev.map((art) =>
                art.id === a.id
                  ? { ...art, [`title_${lang}`]: data.title, [`summary_${lang}`]: data.summary }
                  : art
              )
            );
            continue; // success — skip client fallback
          }
        } catch { /* server failed, try client */ }

        // Client-side fallback: translate title & summary via browser
        try {
          const [tTitle, tSummary] = await Promise.all([
            translateText(a.title, src, lang),
            a.summary ? translateText(a.summary, src, lang) : Promise.resolve(""),
          ]);
          if (!cancelled && tTitle !== a.title) {
            setArticles((prev) =>
              prev.map((art) =>
                art.id === a.id
                  ? { ...art, [`title_${lang}`]: tTitle, [`summary_${lang}`]: tSummary || a.summary }
                  : art
              )
            );
          }
        } catch { /* client fallback also failed */ }

        setTranslating((prev) => {
          const next = new Set(prev);
          next.delete(a.id);
          return next;
        });
      }
    })();

    return () => { cancelled = true; };
  }, [lang, articles.length > 0]);

  if (loading || articles.length === 0) return null;

  const srcLangNames: Record<string, string> = { zh: "中文", en: "EN", ja: "日本語", fr: "FR", es: "ES", pt: "PT", de: "DE", it: "IT" };

  return (
    <>
      {articles.map((a) => {
        const title = getLangField(a, "title", lang);
        const summary = getLangField(a, "summary", lang);
        const content = getLangField(a, "content", lang);
        const img = extractFirstImage(content);
        const dateLocale = lang === "zh" ? "zh-CN" : lang;
        const date = new Date(a.createdAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });
        const articleSrc = a.sourceLang || "zh";
        const isArticleTranslated = lang !== articleSrc && title !== a.title;
        const isTranslating = translating.has(a.id);

        return (
          <a key={a.id} href={`/${lang}/notes/db/${a.slug}/`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <article style={{
              borderRadius: "var(--radius-xl)", background: "var(--color-surface)",
              border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
              transition: "all 0.3s ease", overflow: "hidden", opacity: isTranslating ? 0.7 : 1,
            }}>
              {img ? (
                <div style={{ position: "relative", aspectRatio: "2/1", overflow: "hidden", background: "var(--color-bg-secondary)" }}>
                  <img src={img} alt={title} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)", pointerEvents: "none" }}></div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.25rem", color: "#fff", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      {a.folder && <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "9999px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}>📁 {a.folder}</span>}
                      {a.tags.slice(0, 3).map((t: string) => (
                        <span key={t} style={{ display: "inline-flex", alignItems: "center", fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "9999px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}>#{t}</span>
                      ))}
                      {isArticleTranslated && <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "9999px", background: "rgba(99,102,241,0.35)", backdropFilter: "blur(6px)" }}>🌐 {srcLangNames[articleSrc] || articleSrc.toUpperCase()}</span>}
                      {isTranslating && <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "9999px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}>🔄</span>}
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 750, lineHeight: 1.3, marginBottom: "0.35rem", color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.3)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {title}
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                      {date} · {a.authorEmail.split("@")[0]}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "1.25rem 1.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "#dcfce7", color: "#16a34a" }}>🌐 投稿</span>
                    {isArticleTranslated && <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "var(--color-primary-light)", color: "var(--color-primary)" }}>🌐 {srcLangNames[articleSrc] || articleSrc.toUpperCase()}</span>}
                    {isTranslating && <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>🔄</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    {a.folder && <span style={{ fontSize: "0.7rem", fontWeight: 500, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>📁 {a.folder}</span>}
                    {a.tags.slice(0, 2).map((t: string) => (
                      <span key={t} style={{ fontSize: "0.7rem", fontWeight: 500, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>#{t}</span>
                    ))}
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 750, lineHeight: 1.35, marginBottom: "0.4rem", color: "var(--color-text)" }}>{title}</h3>
                  {summary && <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{summary}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <time style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)" }}>{date}</time>
                  </div>
                </div>
              )}
            </article>
          </a>
        );
      })}
    </>
  );
}
