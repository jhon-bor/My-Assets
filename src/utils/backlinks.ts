/**
 * Backlink computation.
 *
 * Scans all notes for [[wikilinks]] and builds a reverse index
 * so each note knows which other notes link to it.
 */

import { extractWikilinks, slugify } from "./obsidian";

export interface Backlink {
  slug: string;
  title: string;
  context: string; // Snippet of text around the link
}

/**
 * Build a backlink index from all notes.
 *
 * @param notes - Array of { slug, title, rawContent }
 * @returns Map<noteSlug, Backlink[]>
 */
export function buildBacklinkIndex(
  notes: { slug: string; title: string; rawContent: string }[]
): Map<string, Backlink[]> {
  const index = new Map<string, Backlink[]>();

  for (const note of notes) {
    const wikilinks = extractWikilinks(note.rawContent);

    for (const link of wikilinks) {
      const targetSlug = slugify(link.target);
      if (!index.has(targetSlug)) {
        index.set(targetSlug, []);
      }

      // Extract context snippet (the sentence containing the link)
      const context = extractContext(note.rawContent, link.raw);

      index.get(targetSlug)!.push({
        slug: note.slug,
        title: note.title,
        context,
      });
    }
  }

  return index;
}

/**
 * Extract a short text snippet around a wikilink occurrence.
 */
function extractContext(content: string, linkRaw: string): string {
  const idx = content.indexOf(linkRaw);
  if (idx === -1) return "";

  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + linkRaw.length + 40);
  let snippet = content.slice(start, end).replace(/\n/g, " ").trim();

  if (start > 0) snippet = "…" + snippet;
  if (end < content.length) snippet = snippet + "…";

  // Highlight the link in the snippet
  snippet = snippet.replace(
    linkRaw,
    `<mark>${linkRaw}</mark>`
  );

  return snippet;
}
