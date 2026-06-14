/**
 * Language prefix middleware
 *
 * Language is carried IN the URL path, making links shareable with language baked in:
 * - /              →  redirect to /{browserLang}/  (first visit, no cookie)
 * - /{lang}/       →  pass through, set cookie
 * - /{lang}/notes/foo  →  pass through, set cookie
 * - /notes/foo     →  redirect to /{lang}/notes/foo  (lang from cookie/browser)
 *
 * Shared links like /ja/notes/foo always open in Japanese, regardless of the
 * viewer's browser language or stored preference.
 */

import { defineMiddleware } from "astro:middleware";

const LANGS = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"] as const;
type Lang = (typeof LANGS)[number];

function detectBrowserLang(acceptLang: string | null): Lang {
  if (!acceptLang) return "zh";
  const langs = acceptLang
    .split(",")
    .map((l) => l.trim().split(";")[0].replace(/-.*/, ""))
    .filter(Boolean);
  for (const lang of langs) {
    if (LANGS.includes(lang as Lang)) return lang as Lang;
  }
  return "zh";
}

function getStoredLang(cookieHeader: string): Lang | null {
  const match = cookieHeader.match(/(?:^|;\s*)lookfinde_lang=([^;]+)/);
  if (!match) return null;
  return LANGS.includes(match[1] as Lang) ? (match[1] as Lang) : null;
}

function hasLangPrefix(pathname: string): Lang | null {
  const m = pathname.match(/^\/([a-z]{2})\//);
  if (!m) return null;
  return LANGS.includes(m[1] as Lang) ? (m[1] as Lang) : null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  const pathname = url.pathname;
  const cookieHeader = request.headers.get("cookie") || "";

  // API routes and static files — pass through without language prefix
  if (pathname.startsWith("/api/") || pathname.includes(".")) {
    return next();
  }

  // Root: always redirect to language-prefixed version
  if (pathname === "/") {
    const storedLang = getStoredLang(cookieHeader);
    const lang = storedLang || detectBrowserLang(request.headers.get("accept-language"));
    return context.redirect(`/${lang}/`, 302);
  }

  // Has valid language prefix — set cookie and pass through
  const urlLang = hasLangPrefix(pathname);
  if (urlLang) {
    context.cookies.set("lookfinde_lang", urlLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return next();
  }

  // No language prefix — redirect to language-prefixed version
  // Use stored preference or browser language
  const storedLang = getStoredLang(cookieHeader);
  const lang = storedLang || detectBrowserLang(request.headers.get("accept-language"));
  const target = `/${lang}${pathname}${url.search}`;
  return context.redirect(target, 302);
});