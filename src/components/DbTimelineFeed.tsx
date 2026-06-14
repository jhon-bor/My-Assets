import { useState, useEffect } from "react";

interface DbArticle {
  id: string;
  title: string;
  slug: string;
  folder: string;
  tags: string[];
  summary: string;
  createdAt: string;
  authorEmail: string;
  sourceLang?: string;
  title_en?: string; title_ja?: string; title_fr?: string;
  title_es?: string; title_pt?: string; title_de?: string; title_it?: string;
  summary_en?: string; summary_ja?: string; summary_fr?: string;
  summary_es?: string; summary_pt?: string; summary_de?: string; summary_it?: string;
}

function getStoredLang(): string {
  if (typeof window === "undefined") return "zh";
  const s = localStorage.getItem("lookfinde_lang");
  const all = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
  return all.includes(s || "") ? s! : "zh";
}

function getLangField(article: DbArticle, field: "title" | "summary", lang: string): string {
  const src = article.sourceLang || "zh";
  // Viewing in author's original language → return original
  if (lang === src) return article[field] || "";
  // Viewing in different language → try translated field, fallback to original
  const key = `${field}_${lang}` as keyof DbArticle;
  return (article[key] as string) || article[field] || "";
}

interface Props { lang?: string; }

export default function DbTimelineFeed({ lang: urlLang }: Props = {}) {
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const activeLang = urlLang || "zh";

  useEffect(() => {
    fetch("/api/articles/public")
      .then((r) => r.json())
      .then((data) => {
        setArticles(
          data.sort(
            (a: DbArticle, b: DbArticle) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Re-render on language change to update month label locale
  useEffect(() => {
    const handler = () => setArticles((prev) => [...prev]);
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);

  if (loading || articles.length === 0) return null;

  // Group by month
  const storedLang = getStoredLang();
  const lang = storedLang;
  const dateLocale = lang === "zh" ? "zh-CN" : lang;
  const groups: { label: string; articles: DbArticle[] }[] = [];
  let cur: typeof groups[0] | null = null;
  for (const a of articles) {
    const d = new Date(a.createdAt);
    const label = d.toLocaleString(dateLocale, { year: "numeric", month: "long" });
    if (!cur || cur.label !== label) {
      cur = { label, articles: [] };
      groups.push(cur);
    }
    cur.articles.push(a);
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.label} className="timeline-group" style={{ marginBottom: "2.5rem" }}>
          <div className="timeline-header" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#10b981", flexShrink: 0, boxShadow: "0 0 0 5px rgba(16,185,129,0.15)" }}></div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{g.label}</h2>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 6px", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700, background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}>{g.articles.length}</span>
          </div>
          <div style={{ position: "relative", marginLeft: 6, paddingLeft: "2rem", borderLeft: "2px solid var(--color-border)" }}>
            {g.articles.map((a) => {
              const d = new Date(a.createdAt);
              const tlTitle = getLangField(a, "title", lang);
              const tlSummary = getLangField(a, "summary", lang);
              return (
                <a
                  key={a.id}
                  href={`/${activeLang}/notes/db/${a.slug}/`}
                  style={{
                    position: "relative", display: "flex", gap: "1rem",
                    padding: "1.1rem 1.25rem", marginBottom: "0.75rem",
                    borderRadius: "var(--radius-lg)", textDecoration: "none", color: "inherit",
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-card)", transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ position: "absolute", left: "-2.15rem", top: "1.4rem", width: 10, height: 10, borderRadius: "50%", background: "#10b981", border: "2.5px solid var(--color-bg)" }}></div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 40, textAlign: "center" }}>
                    <span style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1, color: "var(--color-text)" }}>{d.getDate()}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 500, marginTop: 2, color: "var(--color-text-muted)" }}>
                      {d.toLocaleString(dateLocale, { weekday: "short" })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.4, color: "var(--color-text)" }}>{tlTitle}</h3>
                    {tlSummary && <p className="line-clamp-2 mt-1" style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{tlSummary}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {a.folder && <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.7rem", fontWeight: 500, padding: "0.15rem 0.55rem", borderRadius: "9999px", background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>📁 {a.folder}</span>}
                      {a.tags.slice(0, 2).map((t: string) => (
                        <span key={t} style={{ display: "inline-flex", alignItems: "center", fontSize: "0.7rem", fontWeight: 500, padding: "0.15rem 0.55rem", borderRadius: "9999px", background: "#dcfce7", color: "#16a34a" }}>#{t}</span>
                      ))}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
