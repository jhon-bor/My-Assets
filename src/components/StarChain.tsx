import { useState, useEffect } from "react";

interface ChainNode {
  slug: string;
  title: string;
  tags: string[];
  id: string;
  authorEmail: string;
}

interface Props {
  content: string;
  slug: string;
  lang: string;
  type: "note" | "db";
  authorEmail?: string;
  articleId?: string;
  tags?: string[];
}

const T: Record<string, Record<string, string>> = {
  zh: { starChain: "知识星链", assets: "全网资产", links: "连接", countUnit: "条", authorChain: "我的资产", assetsUnit: "资产", authorEmpty: "✨ 发布更多文章，创建我的资产", globalChain: "全网星链", docs: "文献", globalEmpty: "🌍 等待更多社区文章加入知识网络", loading: "🪐 加载星链...", howTo: "在文章中使用 [[文章标题]] 创建星链连接", wikilink: "链接", tag: "标签", title: "标题" },
  en: { starChain: "Knowledge Star Chain", assets: "Network Assets", links: "Links", countUnit: "", authorChain: "My Assets", assetsUnit: "assets", authorEmpty: "✨ Publish more articles to build your assets", globalChain: "Global Chain", docs: "docs", globalEmpty: "🌍 Waiting for more community articles", loading: "🪐 Loading star chain...", howTo: "Use [[title]] in articles to create connections", wikilink: "link", tag: "tag", title: "title" },
  ja: { starChain: "知識スターリンク", assets: "ネットワーク資産", links: "接続", countUnit: "本", authorChain: "著者リンク", assetsUnit: "資産", authorEmpty: "✨ 記事を投稿してリンクを作成", globalChain: "グローバルリンク", docs: "文献", globalEmpty: "🌍 コミュニティの記事を待っています", loading: "🪐 ロード中...", howTo: "記事内で [[タイトル]] を使って接続を作成", wikilink: "リンク", tag: "タグ", title: "タイトル" },
  fr: { starChain: "Chaîne de Connaissances", assets: "Actifs Réseau", links: "Connexions", countUnit: "", authorChain: "Chaîne Auteur", assetsUnit: "actifs", authorEmpty: "✨ Publiez plus d'articles pour créer votre chaîne", globalChain: "Chaîne Globale", docs: "docs", globalEmpty: "🌍 En attente d'articles de la communauté", loading: "🪐 Chargement...", howTo: "Utilisez [[titre]] dans les articles pour créer des liens", wikilink: "lien", tag: "étiquette", title: "titre" },
  es: { starChain: "Cadena de Conocimiento", assets: "Activos de Red", links: "Conexiones", countUnit: "", authorChain: "Cadena del Autor", assetsUnit: "activos", authorEmpty: "✨ Publica más artículos para crear tu cadena", globalChain: "Cadena Global", docs: "docs", globalEmpty: "🌍 Esperando más artículos de la comunidad", loading: "🪐 Cargando...", howTo: "Usa [[título]] en artículos para crear conexiones", wikilink: "enlace", tag: "etiqueta", title: "título" },
  pt: { starChain: "Cadeia de Conhecimento", assets: "Ativos de Rede", links: "Conexões", countUnit: "", authorChain: "Cadeia do Autor", assetsUnit: "ativos", authorEmpty: "✨ Publique mais artigos para criar sua cadeia", globalChain: "Cadeia Global", docs: "docs", globalEmpty: "🌍 Aguardando mais artigos da comunidade", loading: "🪐 Carregando...", howTo: "Use [[título]] nos artigos para criar conexões", wikilink: "link", tag: "tag", title: "título" },
  de: { starChain: "Wissenskette", assets: "Netzwerk-Assets", links: "Verbindungen", countUnit: "", authorChain: "Autorenkette", assetsUnit: "Assets", authorEmpty: "✨ Veröffentliche mehr Artikel für deine Kette", globalChain: "Globale Kette", docs: "Dokumente", globalEmpty: "🌍 Warte auf weitere Community-Artikel", loading: "🪐 Laden...", howTo: "Nutze [[Titel]] in Artikeln für Verbindungen", wikilink: "Link", tag: "Tag", title: "Titel" },
  it: { starChain: "Catena di Conoscenza", assets: "Risorse di Rete", links: "Connessioni", countUnit: "", authorChain: "Catena Autore", assetsUnit: "risorse", authorEmpty: "✨ Pubblica più articoli per creare la tua catena", globalChain: "Catena Globale", docs: "documenti", globalEmpty: "🌍 In attesa di altri articoli della comunità", loading: "🪐 Caricamento...", howTo: "Usa [[titolo]] negli articoli per creare connessioni", wikilink: "link", tag: "tag", title: "titolo" },
};

const PLANET_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#8b5cf6", "#ef4444", "#06b6d4", "#f97316",
  "#14b8a6", "#e11d48",
];

function slugToTitle(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Connection {
  from: ChainNode;
  to: ChainNode;
  reason: "wikilink" | "tag" | "title";
}

export default function StarChain({ content, slug, lang, authorEmail, articleId, tags = [] }: Props) {
  const [allArticles, setAllArticles] = useState<ChainNode[]>([]);
  const [hoveredNode, setHovered] = useState<string | null>(null);
  const t = T[lang] || T.zh;

  useEffect(() => {
    fetch("/api/articles/public")
      .then((r) => r.json())
      .then((data) => {
        const nodes: ChainNode[] = (data || []).map((a: any) => ({
          slug: a.slug,
          title: a.title,
          tags: a.tags || [],
          id: a.id,
          authorEmail: a.authorEmail || "",
        }));
        setAllArticles(nodes);
      })
      .catch(() => {});
  }, []);

  if (allArticles.length === 0) {
    return (
      <section style={{
        margin: "3rem calc(50% - 50vw)", padding: "3rem 1.5rem", width: "100vw",
        background: `url('https://img95.699pic.com/photo/40151/9222.gif_wh300.gif') center/cover no-repeat, linear-gradient(180deg, #06060f 0%, #0a0a1a 30%, #0d0d25 60%, #08081a 100%)`,
        borderTop: "1px solid rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.08)",
        textAlign: "center",
      }}>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>{t.loading}</p>
      </section>
    );
  }

  // --- Author's chain: articles by same author ---
  const authorArticles = authorEmail
    ? allArticles.filter((a) => a.authorEmail === authorEmail && a.id !== articleId)
    : [];
  const authorConnections: Connection[] = [];
  // Connect current article to author's other articles
  const current: ChainNode = {
    slug, title: slugToTitle(slug), tags, id: articleId || slug, authorEmail: authorEmail || "",
  };

  for (const a of authorArticles) {
    // wikilink connection
    if (content.toLowerCase().includes(a.slug.toLowerCase()) || content.includes(a.title)) {
      authorConnections.push({ from: current, to: a, reason: "wikilink" });
    } else {
      // tag connection
      const sharedTags = a.tags.filter((t) => tags.includes(t));
      if (sharedTags.length > 0) {
        authorConnections.push({ from: current, to: a, reason: "tag" });
      }
    }
  }
  // If not enough connections, link nearby author articles
  const extraAuthor = authorArticles.filter((a) => !authorConnections.some((c) => c.to.id === a.id));
  for (const a of extraAuthor.slice(0, 4)) {
    authorConnections.push({ from: current, to: a, reason: "tag" });
  }

  // --- Global chain: community-wide connections ---
  const otherArticles = allArticles.filter((a) => a.id !== articleId && a.slug !== slug);
  const globalConnections: Connection[] = [];

  for (const a of otherArticles) {
    const reasons: string[] = [];
    if (content.includes(a.slug) || content.toLowerCase().includes(a.title.toLowerCase())) reasons.push("wikilink");
    const sharedTags = a.tags.filter((t) => tags.includes(t));
    if (sharedTags.length > 0) reasons.push("tag");
    if (a.title.toLowerCase().includes(slugToTitle(slug).toLowerCase().slice(0, 4))) reasons.push("title");
    if (reasons.length > 0) {
      globalConnections.push({ from: current, to: a, reason: reasons[0] as Connection["reason"] });
    }
  }
  // Fill up to reasonable number
  const topGlobal = globalConnections.slice(0, 10);

  return (
    <section style={{
      margin: "3rem calc(50% - 50vw)", padding: "2rem 1.5rem 3rem", width: "100vw", position: "relative", overflow: "hidden",
      background: `url('https://img95.699pic.com/photo/40151/9222.gif_wh300.gif') center/cover no-repeat, linear-gradient(180deg, #06060f 0%, #0a0a1a 30%, #0d0d25 60%, #08081a 100%)`,
      borderTop: "1px solid rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.08)",
    }}>
      {/* Ambient stars overlay */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.3 }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const sx = ((i * 137 + 50) % 100);
          const sy = ((i * 251 + 30) % 100);
          return (
            <circle key={`bg${i}`} cx={`${sx}%`} cy={`${sy}%`} r={Math.random() * 1.2 + 0.3} fill="white">
              <animate attributeName="opacity" values={`${Math.random() * 0.4 + 0.2};0.05;${Math.random() * 0.4 + 0.2}`} dur={`${Math.random() * 2 + 2}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <h3 style={{ color: "rgba(255,255,255,0.85)", fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>🪐 {t.starChain}</h3>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", padding: "0.2rem 0.7rem", borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {t.assets} {allArticles.length} · {t.links} {authorConnections.length + topGlobal.length} {t.countUnit}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* ===== LEFT: Author's Chain ===== */}
          <div style={{
            background: "rgba(99,102,241,0.04)", borderRadius: "var(--radius-2xl)",
            border: "1px solid rgba(99,102,241,0.1)", padding: "1.5rem 1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h4 style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>
                👤 {t.authorChain}
              </h4>
              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 700 }}>
                📦 {authorArticles.length + 1} {t.assetsUnit}
              </span>
            </div>
            {authorConnections.length > 0 ? (
              <AuthorGraph
                center={current}
                connections={authorConnections}
                lang={lang}
                hovered={hoveredNode}
                setHovered={setHovered}
                colors={PLANET_COLORS}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                {t.authorEmpty}
              </div>
            )}
          </div>

          {/* ===== RIGHT: Global Knowledge Graph ===== */}
          <div style={{
            background: "rgba(16,185,129,0.04)", borderRadius: "var(--radius-2xl)",
            border: "1px solid rgba(16,185,129,0.1)", padding: "1.5rem 1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h4 style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>
                🌏 {t.globalChain}
              </h4>
              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(16,185,129,0.2)", color: "#6ee7b7", fontWeight: 700 }}>
                📚 {allArticles.length} {t.docs}
              </span>
            </div>
            {topGlobal.length > 0 ? (
              <GlobalGraph
                center={current}
                connections={topGlobal}
                lang={lang}
                hovered={hoveredNode}
                setHovered={setHovered}
                colors={PLANET_COLORS}
                t={t}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                {t.globalEmpty}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Author Graph (compact tree) ---
function AuthorGraph({ center, connections, lang, hovered, setHovered, colors }: {
  center: ChainNode; connections: Connection[]; lang: string;
  hovered: string | null; setHovered: (s: string | null) => void; colors: string[];
}) {
  const cx = 150, cy = 120, r = 80;
  const nodes = connections.map((c) => c.to);
  return (
    <div style={{ position: "relative", height: 260 }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {nodes.map((n, i) => {
          const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
          const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
          const color = colors[i % colors.length], isH = hovered === n.id;
          return (
            <g key={n.id}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={isH ? color : "rgba(255,255,255,0.1)"} strokeWidth={isH ? 2 : 0.5} strokeDasharray={isH ? "none" : "4 3"} style={{ transition: "all 0.3s ease" }} />
              <circle cx={x} cy={y} r={isH ? 8 : 5} fill={isH ? color : "rgba(255,255,255,0.12)"} stroke={isH ? color : "rgba(255,255,255,0.2)"} strokeWidth={isH ? 2 : 1} style={{ cursor: "pointer", pointerEvents: "auto", transition: "all 0.3s ease" }} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={12} fill="#a5b4fc" stroke="#fff" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={12} fill="none" stroke="#a5b4fc" strokeWidth="1.5">
          <animate attributeName="r" values="12;22;12" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
      {nodes.map((n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        return (
          <a key={n.id} href={`/${lang}/notes/db/${n.slug}/`}
            style={{
              position: "absolute",
              left: cx + r * Math.cos(angle) - 48, top: cy + r * Math.sin(angle) - 12,
              width: 96, zIndex: 2, fontSize: "0.6rem", fontWeight: hovered === n.id ? 700 : 500,
              textAlign: "center", textDecoration: "none", padding: "0.2rem 0.3rem",
              borderRadius: "var(--radius-full)", background: hovered === n.id ? `${colors[i % colors.length]}20` : "rgba(255,255,255,0.04)",
              border: `1px solid ${hovered === n.id ? colors[i % colors.length] : "rgba(255,255,255,0.08)"}`,
              color: hovered === n.id ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.3s ease",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
            onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}>
            {n.title.slice(0, 8)}
          </a>
        );
      })}
      <div style={{ position: "absolute", left: cx - 52, top: cy + 16, width: 104, textAlign: "center" }}>
        <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.5)", background: "rgba(99,102,241,0.2)", padding: "0.1rem 0.4rem", borderRadius: "var(--radius-full)" }}>
          {center.title.slice(0, 10)}
        </span>
      </div>
    </div>
  );
}

// --- Global Graph (scattered web) ---
function GlobalGraph({ center, connections, lang, hovered, setHovered, colors, t }: {
  center: ChainNode; connections: Connection[]; lang: string;
  hovered: string | null; setHovered: (s: string | null) => void; colors: string[];
  t: Record<string, string>;
}) {
  const cx = 150, cy = 120, r = 90;
  const nodes = connections.map((c) => c.to);
  const reasonLabels: Record<string, string> = { wikilink: `🔗${t.wikilink}`, tag: `🏷️${t.tag}`, title: `📝${t.title}` };
  return (
    <div style={{ position: "relative", height: 260 }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {nodes.map((n, i) => {
          const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
          const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
          const color = colors[i % colors.length], isH = hovered === n.id;
          return (
            <g key={n.id}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={isH ? color : "rgba(16,185,129,0.12)"} strokeWidth={isH ? 2 : 0.5} strokeDasharray={isH ? "none" : "3 5"} style={{ transition: "all 0.3s ease" }} />
              <circle cx={x} cy={y} r={isH ? 8 : 5} fill={isH ? color : "rgba(255,255,255,0.1)"} stroke={isH ? color : "rgba(16,185,129,0.25)"} strokeWidth={isH ? 2 : 1} style={{ cursor: "pointer", pointerEvents: "auto", transition: "all 0.3s ease" }} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={12} fill="#6ee7b7" stroke="#fff" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={12} fill="none" stroke="#6ee7b7" strokeWidth="1.5">
          <animate attributeName="r" values="12;24;12" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
      {nodes.map((n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        const conn = connections[i];
        return (
          <a key={n.id} href={`/${lang}/notes/db/${n.slug}/`}
            style={{
              position: "absolute",
              left: cx + r * Math.cos(angle) - 48, top: cy + r * Math.sin(angle) - 12,
              width: 96, zIndex: 2, fontSize: "0.6rem", fontWeight: hovered === n.id ? 700 : 500,
              textAlign: "center", textDecoration: "none", padding: "0.2rem 0.3rem",
              borderRadius: "var(--radius-full)", background: hovered === n.id ? `${colors[i % colors.length]}20` : "rgba(255,255,255,0.04)",
              border: `1px solid ${hovered === n.id ? colors[i % colors.length] : "rgba(255,255,255,0.08)"}`,
              color: hovered === n.id ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.3s ease",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
            onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}>
            {reasonLabels[conn.reason] || ""} {n.title.slice(0, 6)}
          </a>
        );
      })}
      <div style={{ position: "absolute", left: cx - 52, top: cy + 16, width: 104, textAlign: "center" }}>
        <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.5)", background: "rgba(16,185,129,0.2)", padding: "0.1rem 0.4rem", borderRadius: "var(--radius-full)" }}>
          {center.title.slice(0, 10)}
        </span>
      </div>
    </div>
  );
}
