/**
 * Translation engine with multi-backend support.
 * Priority: Google Translate (free) → MyMemory (free) → Cloudflare → DeepL → OpenAI
 *
 * Google Translate and MyMemory work WITHOUT any API keys.
 * For higher quality/volume, optionally set:
 *   CLOUDFLARE_API_TOKEN   – Cloudflare API token (Workers AI)
 *   CLOUDFLARE_ACCOUNT_ID  – Cloudflare account ID
 *   DEEPL_API_KEY          – DeepL API key
 *   OPENAI_API_KEY         – OpenAI API key (GPT-4o mini)
 */

export type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

export const SUPPORTED_LANGS: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];

// ISO 639-1 → Cloudflare model target format
const CF_LANG_MAP: Record<Lang, string> = {
  zh: "ZH",
  en: "EN",
  ja: "JA",
  fr: "FR",
  es: "ES",
  pt: "PT",
  de: "DE",
  it: "IT",
};

// DeepL target codes
const DEEPL_LANG_MAP: Record<Lang, string> = {
  zh: "ZH",
  en: "EN-US",
  ja: "JA",
  fr: "FR",
  es: "ES",
  pt: "PT-BR",
  de: "DE",
  it: "IT",
};

export interface TranslateOptions {
  text: string;
  from?: string;
  to: Lang;
}

export interface TranslateResult {
  text: string;
  lang: Lang;
  success: boolean;
  error?: string;
  backend: string;
}

// ─── Cloudflare Workers AI ───────────────────────────────────────────────────

async function translateCloudflare(text: string, to: Lang): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) throw new Error("Cloudflare credentials not configured");

  const model = "@cf/meta/llama-3.2-3b-instruct";
  const langNames: Record<Lang, string> = {
    zh: "Chinese", en: "English", ja: "Japanese", fr: "French",
    es: "Spanish", pt: "Portuguese", de: "German", it: "Italian",
  };
  const targetName = langNames[to] || to;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Translate to ${targetName}. Output ONLY the translation, no extra text.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare API error: ${res.status} ${err}`);
  }

  const data = await res.json() as { result?: { response?: string } };
  return data.result?.response ?? text;
}

// ─── DeepL ────────────────────────────────────────────────────────────────

async function translateDeepL(text: string, to: Lang): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error("DeepL API key not configured");

  const targetLang = DEEPL_LANG_MAP[to];

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      text,
      target_lang: targetLang,
      // Preserve formatting
      tag_handling: "xml",
      outline_detection: "0",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL API error: ${res.status} ${err}`);
  }

  const data = await res.json() as { translations: Array<{ text: string }> };
  return data.translations?.[0]?.text ?? text;
}

// ─── OpenAI ───────────────────────────────────────────────────────────────

async function translateOpenAI(text: string, to: Lang): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const langNames: Record<Lang, string> = {
    zh: "Chinese",
    en: "English",
    ja: "Japanese",
    fr: "French",
    es: "Spanish",
    pt: "Portuguese",
    de: "German",
    it: "Italian",
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate to ${langNames[to]}. Preserve all markdown formatting. Output only the translation.`,
        },
        { role: "user", content: text },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? text;
}

// ─── Google Translate (free, unofficial API) ───────────────────────────────

const GOOGLE_LANG_MAP: Record<Lang, string> = {
  zh: "zh-CN", en: "en", ja: "ja", fr: "fr", es: "es", pt: "pt", de: "de", it: "it",
};

async function translateGoogle(text: string, from: string, to: Lang): Promise<string> {
  const sl = GOOGLE_LANG_MAP[from as Lang] || "auto";
  const tl = GOOGLE_LANG_MAP[to];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LookFinde/1.0)" },
  });

  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);

  const data = await res.json() as any[];
  // Response format: [[["translated text", "original", ...]], ...]
  const sentences = (data[0] as any[]) || [];
  const translated = sentences.map((s: any[]) => s[0] || "").join("");
  return translated || text;
}

// ─── MyMemory (free tier, no API key) ──────────────────────────────────────

const MYMEMORY_LANG_MAP: Record<Lang, string> = {
  zh: "zh-CN", en: "en", ja: "ja", fr: "fr", es: "es", pt: "pt", de: "de", it: "it",
};

async function translateMyMemory(text: string, from: string, to: Lang): Promise<string> {
  const langPair = `${MYMEMORY_LANG_MAP[from as Lang] || "zh"}|${MYMEMORY_LANG_MAP[to]}`;
  // Split long text into chunks (MyMemory limit ~500 chars per request)
  const chunks = splitText(text, 400);
  const results: string[] = [];

  for (const chunk of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langPair}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

    const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
    if (data.responseStatus === 200 || data.responseStatus === 403) {
      results.push(data.responseData?.translatedText || chunk);
    } else {
      throw new Error(`MyMemory status ${data.responseStatus}`);
    }
  }

  return results.join("") || text;
}

/** Split text into chunks at sentence boundaries to stay under char limit */
function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?。！？\n])\s*/);
  let current = "";
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current) {
      chunks.push(current);
      current = s;
    } else {
      current += s;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Translate text to target language, trying backends in order.
 * Returns the translated text or the original if all backends fail.
 */
export async function translate(options: TranslateOptions): Promise<TranslateResult> {
  const { text, to } = options;
  const from = options.from || "zh";
  if (!text.trim()) return { text: "", lang: to, success: true, backend: "none" };

  const backends = [
    { fn: (t: string, l: Lang) => translateGoogle(t, from, l), name: "google" },
    { fn: (t: string, l: Lang) => translateMyMemory(t, from, l), name: "mymemory" },
    { fn: translateCloudflare, name: "cloudflare" },
    { fn: translateDeepL, name: "deepl" },
    { fn: translateOpenAI, name: "openai" },
  ];

  for (const { fn, name } of backends) {
    try {
      const translated = await fn(text, to);
      return { text: translated, lang: to, success: true, backend: name };
    } catch (err) {
      // Try next backend
      console.warn(`[translate] ${name} failed:`, (err as Error).message);
    }
  }

  return {
    text,
    lang: to,
    success: false,
    error: "All translation backends failed",
    backend: "none",
  };
}

/**
 * Translate content to all supported languages (except source).
 * Returns a record of lang → translated text.
 */
export async function translateToAll(
  text: string,
  sourceLang: Lang = "zh"
): Promise<Record<Lang, TranslateResult>> {
  const targets = SUPPORTED_LANGS.filter((l) => l !== sourceLang);
  const results = await Promise.all(targets.map((lang) => translate({ text, to: lang })));

  const map: Record<Lang, TranslateResult> = {} as any;
  targets.forEach((lang, i) => {
    map[lang] = results[i];
  });
  return map;
}