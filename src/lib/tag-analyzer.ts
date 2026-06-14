/**
 * AI Tag Analyzer — Extracts SEO-optimized tags from article content.
 *
 * Strategy:
 *  1. Chinese: extract 2-4 character n-grams, score by frequency & specificity
 *  2. English: extract words/phrases, score by TF & length
 *  3. Combine & deduplicate
 *  4. Rank by SEO relevance (specificity, search volume potential)
 *  5. Return top 5-10 tags
 */

/* ── Chinese stop words ── */
const CN_STOP = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
  "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着",
  "没有", "看", "好", "自己", "这", "他", "她", "它", "们", "那", "些",
  "什么", "怎么", "如何", "为什么", "可以", "这个", "那个", "哪个",
  "因为", "所以", "但是", "而且", "然后", "如果", "虽然", "不过",
  "已经", "正在", "将", "把", "被", "让", "给", "对", "从", "向",
  "与", "或", "及", "以及", "等", "等等", "其他", "其中", "之类",
  "进行", "使用", "通过", "需要", "能够", "可能", "应该", "可以",
  "用于", "作为", "具有", "不同", "相同", "一样", "一种", "各种",
  "一些", "一点", "很多", "很少", "更多", "更", "最", "非常", "比较",
  "太", "真", "绝对", "完全", "基本", "主要", "重要", "关键",
  "目前", "现在", "以前", "以后", "之后", "之前", "当时", "最近",
  "今天", "明天", "昨天", "今年", "去年", "明年",
  "这年", "这个月", "上个月", "下个月",
  "大家", "人们", "我们", "他们", "你们", "她们", "它",
  "文章", "本文", "内容", "介绍", "总结", "概述", "说明",
]);

/* ── English stop words ── */
const EN_STOP = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "under", "again",
  "then", "once", "here", "there", "when", "where", "why", "how",
  "all", "both", "each", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than",
  "too", "very", "just", "because", "but", "and", "or", "if", "while",
  "this", "that", "these", "those", "it", "its", "he", "she", "they",
  "them", "their", "we", "you", "i", "my", "your", "our", "me", "us",
  "about", "also", "get", "make", "made", "use", "using", "used",
  "one", "two", "like", "even", "still", "much", "well", "way", "part",
]);

/* ── Tech keyword boost ── */
const TECH_KEYWORDS = new Set([
  "javascript", "typescript", "python", "react", "vue", "angular", "node",
  "css", "html", "api", "docker", "kubernetes", "aws", "git", "github",
  "sql", "nosql", "mongodb", "redis", "graphql", "rest", "http",
  "前端", "后端", "全栈", "数据库", "服务器", "云计算", "人工智能",
  "机器学习", "深度学习", "AI", "API", "UI", "UX", "DevOps", "CI/CD",
  "小程序", "移动端", "响应式", "微服务", "容器", "部署", "测试",
  "性能优化", "安全", "加密", "认证", "架构", "设计模式", "算法",
  "SEO", "Obsidian", "Markdown", "Git", "VS Code", "Linux", "Mac",
]);

/* ── Chinese phrase extraction ── */
function extractChinesePhrases(text: string): Map<string, number> {
  const scores = new Map<string, number>();
  // Keep only Chinese chars
  const clean = text.replace(/[^一-鿿]/g, "");

  // 2-gram
  for (let i = 0; i < clean.length - 1; i++) {
    const bigram = clean.slice(i, i + 2);
    if (!CN_STOP.has(bigram)) {
      scores.set(bigram, (scores.get(bigram) || 0) + 1);
    }
  }

  // 3-gram
  for (let i = 0; i < clean.length - 2; i++) {
    const trigram = clean.slice(i, i + 3);
    if (!trigram.match(/^(.)\\1+$/)) {
      scores.set(trigram, (scores.get(trigram) || 0) + 3); // boost longer phrases
    }
  }

  // 4-gram
  for (let i = 0; i < clean.length - 3; i++) {
    const quad = clean.slice(i, i + 4);
    scores.set(quad, (scores.get(quad) || 0) + 5);
  }

  return scores;
}

/* ── English phrase extraction ── */
function extractEnglishPhrases(text: string): Map<string, number> {
  const scores = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s#.\-+/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !EN_STOP.has(w));

  // Single words (TF)
  for (const w of words) {
    scores.set(w, (scores.get(w) || 0) + 1);
  }

  // Bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (words[i].length >= 2 && words[i + 1].length >= 2) {
      scores.set(bigram, (scores.get(bigram) || 0) + 2);
    }
  }

  return scores;
}

/* ── Extract tags from headings ── */
function extractHeadingKeywords(text: string): string[] {
  const headings = text.match(/^#{1,4}\s+(.+)$/gm);
  if (!headings) return [];
  const keywords: string[] = [];
  for (const h of headings) {
    const clean = h.replace(/^#+\s+/, "").trim();
    if (clean.length >= 2 && clean.length <= 20) {
      keywords.push(clean);
    }
  }
  return keywords;
}

/* ── Extract hashtag-style tags from content ── */
function extractExistingTags(text: string): string[] {
  const matches = text.match(/#[\w一-鿿]+/g);
  if (!matches) return [];
  return matches.map((t) => t.slice(1)).filter((t) => t.length >= 2 && t.length <= 15);
}

/* ── Main: analyze content → SEO tags ── */
export function analyzeContentForTags(
  title: string,
  content: string
): { tags: string[]; reasoning: string } {
  const fullText = `${title}\n${content}`;

  // 1. Collect candidates from multiple sources
  const cnPhrases = extractChinesePhrases(fullText);
  const enPhrases = extractEnglishPhrases(fullText);
  const headingWords = extractHeadingKeywords(fullText);
  const hashtagTags = extractExistingTags(fullText);

  // 2. Merge & score
  const allScores = new Map<string, number>();

  for (const [phrase, score] of cnPhrases) {
    allScores.set(phrase, (allScores.get(phrase) || 0) + score);
  }
  for (const [phrase, score] of enPhrases) {
    allScores.set(phrase, (allScores.get(phrase) || 0) + score * 2); // English gets slight boost
  }
  for (const kw of headingWords) {
    allScores.set(kw, (allScores.get(kw) || 0) + 10); // heading words strong boost
  }
  for (const kw of hashtagTags) {
    allScores.set(kw, (allScores.get(kw) || 0) + 8);
  }

  // 3. Boost tech keywords
  for (const [phrase, score] of allScores) {
    if (TECH_KEYWORDS.has(phrase.toLowerCase())) {
      allScores.set(phrase, score * 3);
    }
  }

  // 4. Penalize too-short or too-long
  for (const [phrase, score] of allScores) {
    if (phrase.length < 2) allScores.set(phrase, 0);
    if (phrase.length > 15) allScores.set(phrase, score * 0.3);
    // Penalize pure numbers
    if (/^\d+$/.test(phrase)) allScores.set(phrase, 0);
  }

  // 5. Sort & pick top tags
  const sorted = Array.from(allScores.entries())
    .filter(([_, score]) => score >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // 6. Format tags — clean, lowercase, SEO-friendly
  const tags = sorted.map(([phrase]) => {
    let tag = phrase.trim().toLowerCase();
    // Remove markdown syntax
    tag = tag.replace(/[#*`\[\]()（）>!\-\|\/\\]/g, "").trim();
    // Capitalize English proper nouns
    tag = tag.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    return tag;
  }).filter((t) => t.length >= 3 && t.length <= 16 && !/^\d+$/.test(t));

  // Deduplicate: prefer longer, more specific tags
  const sorted_by_len = tags.sort((a, b) => b.length - a.length);
  const final: string[] = [];
  for (const tag of sorted_by_len) {
    // Skip if fully contained in an existing tag
    const isSubstring = final.some((existing) => existing.includes(tag));
    // Skip if it shares >70% characters with a shorter existing tag (n-gram overlap)
    const isOverlap = final.some((existing) => {
      if (existing === tag) return false;
      const overlap = [...tag].filter((c) => existing.includes(c)).length;
      return overlap > tag.length * 0.65 || overlap > existing.length * 0.65;
    });
    if (!isSubstring && !isOverlap && !final.includes(tag)) {
      final.push(tag);
    }
  }

  // 7. Generate reasoning
  const reasoning = [
    `从 ${fullText.replace(/\s/g, "").length} 字中提取`,
    `${cnPhrases.size} 个中文短语 + ${enPhrases.size} 个英文词`,
    headingWords.length > 0
      ? `标题关键词: ${headingWords.slice(0, 3).join(", ")}`
      : "",
    hashtagTags.length > 0 ? `已有标签: ${hashtagTags.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return { tags: final.slice(0, 8), reasoning };
}
