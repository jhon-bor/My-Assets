/**
 * Extract the first image URL from markdown content.
 * Supports: ![alt](url), <img src="url">, ![](url)
 */
export function extractFirstImage(content: string): string | null {
  // Markdown image: ![alt](url)
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[1];

  // HTML img tag
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*\/?>/i);
  if (htmlMatch) return htmlMatch[1];

  return null;
}

/**
 * Extract all images from markdown content.
 */
export function extractAllImages(content: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // Markdown images
  const mdRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdRe.exec(content)) !== null) {
    if (!seen.has(m[1])) {
      images.push(m[1]);
      seen.add(m[1]);
    }
  }

  // HTML img tags
  const htmlRe = /<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi;
  while ((m = htmlRe.exec(content)) !== null) {
    if (!seen.has(m[1])) {
      images.push(m[1]);
      seen.add(m[1]);
    }
  }

  return images;
}
