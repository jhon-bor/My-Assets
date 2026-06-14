/**
 * Obsidian Markdown Parser Utilities
 *
 * Handles:
 *   [[wikilinks]] and [[wikilink|alias]]
 *   ![[image embeds]]
 *   > [!callout] blocks
 */

/* ── Wikilink regex ── */
const WIKILINK_RE = /\[\[([^\]|#]+?)(?:#([^\]|]+?))?(?:\|([^\]]+?))?\]\]/g;
const EMBED_RE = /!\[\[([^\]]+?)\]\]/g;

/* ── Callout regex ── */
const CALLOUT_RE = /^> \[!(\w+)\](.*?)\n(?:>(.*?)\n?)*/gm;

export interface WikilinkMatch {
  raw: string;
  target: string;
  heading: string | null;
  alias: string | null;
}

export interface CalloutMatch {
  type: string;
  title: string;
  content: string;
}

/**
 * Extract all wikilinks from text.
 */
export function extractWikilinks(text: string): WikilinkMatch[] {
  const links: WikilinkMatch[] = [];
  for (const match of text.matchAll(WIKILINK_RE)) {
    links.push({
      raw: match[0],
      target: slugify(match[1]),
      heading: match[2] || null,
      alias: match[3] || null,
    });
  }
  return links;
}

/**
 * Transform [[wikilinks]] into proper <a> tags in HTML content.
 * Handles aliases: [[page|My Title]] -> <a href="...">My Title</a>
 *
 * Called on the already-rendered HTML from Astro's markdown pipeline.
 */
export function resolveWikilinks(
  html: string,
  allSlugs: Map<string, string>
): string {
  return html.replace(WIKILINK_RE, (_full, target, _heading, alias) => {
    const slug = slugify(target);
    const url = allSlugs.has(slug) ? `/notes/${slug}/` : `/notes/${slug}/`;
    const label = alias || target;
    return `<a href="${url}" class="wikilink" data-wikilink="${slug}">${label}</a>`;
  });
}

/**
 * Transform ![[image.png]] embeds into <img> tags.
 */
export function resolveEmbeds(html: string): string {
  return html.replace(EMBED_RE, (_full, filename) => {
    const src = `/images/${filename.trim()}`;
    return `<figure class="embed-image">
      <img src="${src}" alt="${filename.trim()}" loading="lazy"
           class="rounded-lg cursor-zoom-in"
           onclick="this.requestFullscreen?.()" />
      <figcaption class="text-sm text-center text-muted mt-2">${filename.trim()}</figcaption>
    </figure>`;
  });
}

/**
 * Pre-process callout syntax before markdown rendering.
 * Converts Obsidian-style callouts to a custom HTML format
 * that survives markdown parsing.
 */
export function preprocessCallouts(markdown: string): string {
  // We handle this by wrapping callouts in a special div that
  // survives the markdown pipeline, using raw HTML.
  const lines = markdown.split("\n");
  const output: string[] = [];
  let inCallout = false;
  let calloutType = "";
  let calloutTitle = "";
  let calloutLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const calloutStart = line.match(/^>\s*\[!(\w+)\]\s*(.*)/);

    if (calloutStart && !inCallout) {
      // Start of callout
      inCallout = true;
      calloutType = calloutStart[1].toLowerCase();
      calloutTitle = calloutStart[2] || calloutType;
      calloutLines = [];
    } else if (inCallout && line.startsWith(">")) {
      // Inside callout — strip the leading '>' (and optional space)
      const content = line.replace(/^>\s?/, "");
      calloutLines.push(content);
    } else if (inCallout && !line.startsWith(">")) {
      // End of callout — emit the transformed HTML
      output.push(renderCalloutHTML(calloutType, calloutTitle, calloutLines));
      output.push(line);
      inCallout = false;
      calloutLines = [];
      calloutType = "";
      calloutTitle = "";
    } else {
      output.push(line);
    }
  }

  // Handle callout at EOF
  if (inCallout) {
    output.push(renderCalloutHTML(calloutType, calloutTitle, calloutLines));
  }

  return output.join("\n");
}

/* ── Callout icon & color map ── */
const CALLOUT_STYLES: Record<
  string,
  { icon: string; border: string; bg: string }
> = {
  note: { icon: "📝", border: "#4f46e5", bg: "#eef2ff" },
  info: { icon: "ℹ️", border: "#0ea5e9", bg: "#f0f9ff" },
  tip: { icon: "💡", border: "#10b981", bg: "#ecfdf5" },
  hint: { icon: "💡", border: "#10b981", bg: "#ecfdf5" },
  warning: { icon: "⚠️", border: "#f59e0b", bg: "#fffbeb" },
  caution: { icon: "⚠️", border: "#f59e0b", bg: "#fffbeb" },
  danger: { icon: "🔥", border: "#ef4444", bg: "#fef2f2" },
  error: { icon: "❌", border: "#ef4444", bg: "#fef2f2" },
  success: { icon: "✅", border: "#10b981", bg: "#ecfdf5" },
  check: { icon: "✅", border: "#10b981", bg: "#ecfdf5" },
  done: { icon: "✅", border: "#10b981", bg: "#ecfdf5" },
  question: { icon: "❓", border: "#8b5cf6", bg: "#f5f3ff" },
  help: { icon: "❓", border: "#8b5cf6", bg: "#f5f3ff" },
  faq: { icon: "❓", border: "#8b5cf6", bg: "#f5f3ff" },
  abstract: { icon: "📋", border: "#64748b", bg: "#f8fafc" },
  summary: { icon: "📋", border: "#64748b", bg: "#f8fafc" },
  tldr: { icon: "📋", border: "#64748b", bg: "#f8fafc" },
  example: { icon: "📎", border: "#6366f1", bg: "#eef2ff" },
  quote: { icon: "💬", border: "#94a3b8", bg: "#f8fafc" },
  cite: { icon: "💬", border: "#94a3b8", bg: "#f8fafc" },
};

function renderCalloutHTML(
  type: string,
  title: string,
  lines: string[]
): string {
  const style = CALLOUT_STYLES[type] || CALLOUT_STYLES["note"];
  const content = lines.join("\n");
  return [
    `<div class="callout" data-callout="${type}" style="border-left-color:${style.border}">`,
    `<div class="callout-title">${style.icon} ${title}</div>`,
    `<div class="callout-content">`,
    ``,
    content,
    ``,
    `</div>`,
    `</div>`,
  ].join("\n");
}

/* ── Helpers ── */

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build a map of { slug -> file path } from all note files.
 * Used to resolve wikilinks.
 */
export function buildSlugMap(
  slugs: { slug: string; id: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const { slug, id } of slugs) {
    map.set(slug, id);
  }
  return map;
}

/**
 * Check if a wikilink target exists.
 */
export function isValidWikilink(
  target: string,
  slugMap: Map<string, string>
): boolean {
  return slugMap.has(target);
}
