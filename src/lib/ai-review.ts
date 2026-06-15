/**
 * AI Article Review Module
 * 
 * Automatically reviews submitted articles:
 * 1. Analyzes content to generate SEO-friendly tags for Google search
 * 2. Checks content quality
 * 3. Decides whether to auto-approve or flag for manual review
 * 
 * Uses free AI backends: OpenAI (if API key set) or simulated analysis
 */

import type { Article } from "./db";
import { getArticleById, updateArticle, getPendingArticles } from "./db";

export interface ReviewResult {
  approved: boolean;
  tags: string[];
  seoTags: string[]; // SEO-friendly tags for Google search
  reason: string;
  score: number; // 0-100 quality score
  needsManualReview: boolean;
  analyzedAt: string;
}

export interface ReviewConfig {
  autoApproveThreshold: number; // Minimum score to auto-approve (default: 70)
  minContentLength: number; // Minimum content length (default: 100)
  maxTags: number; // Maximum tags to generate (default: 8)
}

// SEO-friendly keyword mappings for Google search
// These are optimized for Google search queries
const SEO_KEYWORDS: Record<string, {
  keywords: string[];
  seoTags: string[]; // Tags that will be used for SEO
}> = {
  // Programming Languages - High search volume
  javascript: {
    keywords: ["JavaScript", "JS", "前端", "Web开发", "ECMAScript"],
    seoTags: ["javascript", "js", "web-development", "frontend", "ecmascript"],
  },
  typescript: {
    keywords: ["TypeScript", "TS", "前端", "类型系统", "类型安全"],
    seoTags: ["typescript", "ts", "type-safe", "frontend", "web-development"],
  },
  python: {
    keywords: ["Python", "后端", "AI", "数据科学", "机器学习"],
    seoTags: ["python", "ai", "machine-learning", "data-science", "backend"],
  },
  rust: {
    keywords: ["Rust", "系统编程", "性能", "内存安全", "WebAssembly"],
    seoTags: ["rust", "systems-programming", "memory-safe", "webassembly"],
  },
  golang: {
    keywords: ["Go", "Golang", "后端", "并发", "云原生"],
    seoTags: ["go", "golang", "backend", "concurrency", "cloud-native"],
  },
  java: {
    keywords: ["Java", "后端", "企业级", "JVM", "Spring"],
    seoTags: ["java", "jvm", "enterprise", "spring-boot", "backend"],
  },
  
  // Frameworks - High search volume
  react: {
    keywords: ["React", "前端", "UI框架", "组件化", "ReactJS"],
    seoTags: ["react", "reactjs", "frontend", "ui-framework", "component-library"],
  },
  vue: {
    keywords: ["Vue", "Vue.js", "前端", "响应式", "渐进式"],
    seoTags: ["vue", "vuejs", "frontend", "reactive", "progressive-framework"],
  },
  nextjs: {
    keywords: ["Next.js", "React框架", "服务端渲染", "SSR"],
    seoTags: ["nextjs", "react-framework", "server-side-rendering", "ssr"],
  },
  astro: {
    keywords: ["Astro", "静态站点", "SSG", "前端框架"],
    seoTags: ["astro", "static-site-generator", "ssg", "frontend-framework"],
  },
  
  // Topics - SEO optimized
  ai: {
    keywords: ["AI", "人工智能", "机器学习", "深度学习", "LLM", "大语言模型"],
    seoTags: ["ai", "artificial-intelligence", "machine-learning", "deep-learning", "llm", "large-language-model"],
  },
  web: {
    keywords: ["Web", "互联网", "前端", "后端", "网站开发"],
    seoTags: ["web", "web-development", "website", "internet-technology"],
  },
  database: {
    keywords: ["数据库", "SQL", "NoSQL", "数据存储", "MySQL", "PostgreSQL"],
    seoTags: ["database", "sql", "nosql", "mysql", "postgresql", "data-storage"],
  },
  devops: {
    keywords: ["DevOps", "CI/CD", "自动化", "部署", "Docker", "Kubernetes"],
    seoTags: ["devops", "cicd", "automation", "docker", "kubernetes", "deployment"],
  },
  cloud: {
    keywords: ["云计算", "AWS", "云服务", "服务器", "云原生"],
    seoTags: ["cloud", "cloud-computing", "aws", "cloud-services", "cloud-native"],
  },
  mobile: {
    keywords: ["移动开发", "iOS", "Android", "小程序", "React Native"],
    seoTags: ["mobile", "mobile-development", "ios", "android", "react-native"],
  },
  security: {
    keywords: ["安全", "加密", "隐私", "防护", "网络安全"],
    seoTags: ["security", "cybersecurity", "encryption", "privacy", "web-security"],
  },
  ux: {
    keywords: ["用户体验", "UI设计", "交互", "界面", "设计系统"],
    seoTags: ["ux", "user-experience", "ui-design", "design-system", "interaction-design"],
  },
  open_source: {
    keywords: ["开源", "社区", "协作", "GitHub", "开源项目"],
    seoTags: ["open-source", "github", "community", "oss", "open-source-project"],
  },
  
  // Content Types - SEO optimized
  tutorial: {
    keywords: ["教程", "指南", "学习", "入门", "How to", "tutorial"],
    seoTags: ["tutorial", "guide", "how-to", "learn", "beginner", "getting-started"],
  },
  opinion: {
    keywords: ["观点", "思考", "见解", "讨论", "analysis"],
    seoTags: ["opinion", "analysis", "thoughts", "discussion", "insights"],
  },
  news: {
    keywords: ["新闻", "资讯", "动态", "更新", "latest"],
    seoTags: ["news", "update", "latest", "trends", "technology-news"],
  },
  tips: {
    keywords: ["技巧", "提示", "最佳实践", "优化", "performance"],
    seoTags: ["tips", "best-practices", "optimization", "performance", "tricks"],
  },
  review: {
    keywords: ["评测", "评论", "对比", "review", "comparison"],
    seoTags: ["review", "comparison", "review-guide", "product-review"],
  },
};

/**
 * Extract key topics from content using SEO keyword matching
 */
function extractTopics(content: string, title: string): string[] {
  const text = (title + " " + content).toLowerCase();
  const topics: Set<string> = new Set();
  
  for (const [topic, data] of Object.entries(SEO_KEYWORDS)) {
    for (const keyword of data.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        topics.add(topic);
        break;
      }
    }
  }
  
  return Array.from(topics);
}

/**
 * Extract SEO-friendly tags from title
 * Google search optimized - uses common search queries
 */
function extractTagsFromTitle(title: string): string[] {
  const tags: Set<string> = new Set();
  const lowerTitle = title.toLowerCase();
  
  // Check for common SEO patterns in title
  const seoPatterns = [
    { pattern: /如何|how to|how-to/i, tags: ["how-to", "guide"] },
    { pattern: /教程|tutorial|guide/i, tags: ["tutorial", "guide"] },
    { pattern: /入门|beginner|getting started/i, tags: ["beginner", "getting-started"] },
    { pattern: /实战|hands-on|practice/i, tags: ["hands-on", "practice"] },
    { pattern: /优化|optimize|performance/i, tags: ["optimization", "performance"] },
    { pattern: /详解|deep dive|detailed/i, tags: ["deep-dive", "detailed"] },
    { pattern: /总结|summary|review/i, tags: ["summary", "review"] },
    { pattern: /对比|vs|comparison/i, tags: ["comparison", "vs"] },
    { pattern: /最佳实践|best practices/i, tags: ["best-practices"] },
    { pattern: /案例|case study/i, tags: ["case-study", "example"] },
    { pattern: /源码|source code|code/i, tags: ["source-code", "code"] },
    { pattern: /原理|principle|mechanism/i, tags: ["principle", "mechanism"] },
    { pattern: /设计模式|design pattern/i, tags: ["design-pattern", "architecture"] },
    { pattern: /面试|interview/i, tags: ["interview", "questions"] },
    { pattern: /算法|algorithm/i, tags: ["algorithm", "data-structures"] },
  ];
  
  for (const { pattern, tags: patternTags } of seoPatterns) {
    if (pattern.test(title)) {
      patternTags.forEach(t => tags.add(t));
    }
  }
  
  // Extract keywords from title (split by common separators)
  const titleWords = lowerTitle
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && w.length <= 20);
  
  // Common technical terms to include
  const techTerms = [
    "javascript", "typescript", "python", "react", "vue", "node", 
    "webpack", "vite", "css", "html", "api", "graphql", "rest",
    "docker", "kubernetes", "aws", "azure", "firebase", "mongodb",
    "mysql", "postgres", "redis", "nginx", "linux", "git", "github"
  ];
  
  for (const word of titleWords) {
    if (techTerms.includes(word)) {
      tags.add(word);
    }
  }
  
  return Array.from(tags);
}

/**
 * Generate SEO-friendly tags based on content analysis
 */
function generateSEOTags(title: string, content: string, existingTags: string[]): string[] {
  const tags: Set<string> = new Set();
  
  // Add existing tags (clean them for SEO)
  for (const tag of existingTags) {
    const cleanTag = cleanTagForSEO(tag);
    if (cleanTag) tags.add(cleanTag);
  }
  
  // Add topic-based tags from SEO keywords
  const topics = extractTopics(content, title);
  for (const topic of topics) {
    const seoData = SEO_KEYWORDS[topic];
    if (seoData) {
      seoData.seoTags.forEach(tag => tags.add(tag));
    }
  }
  
  // Add tags extracted from title
  const titleTags = extractTagsFromTitle(title);
  titleTags.forEach(tag => tags.add(tag));
  
  // Add content-based analysis tags
  if (content.includes("代码") || content.includes("```") || content.includes("code")) {
    tags.add("code-example");
  }
  if (content.includes("安装") || content.includes("setup") || content.includes("install")) {
    tags.add("installation");
  }
  if (content.includes("配置") || content.includes("config") || content.includes("configure")) {
    tags.add("configuration");
  }
  if (content.includes("错误") || content.includes("error") || content.includes("bug")) {
    tags.add("troubleshooting");
  }
  if (content.includes("性能") || content.includes("performance") || content.includes("optimize")) {
    tags.add("performance");
  }
  
  // Limit to max 8 tags for SEO best practices
  return Array.from(tags).slice(0, 8);
}

/**
 * Clean tag for SEO - convert to lowercase, replace spaces with hyphens
 */
function cleanTagForSEO(tag: string): string | null {
  if (!tag || typeof tag !== "string") return null;
  
  // Remove special characters, convert to lowercase
  let cleaned = tag.toLowerCase().trim();
  
  // Replace spaces with hyphens
  cleaned = cleaned.replace(/\s+/g, '-');
  
  // Remove special characters (keep only alphanumeric and hyphens)
  cleaned = cleaned.replace(/[^a-z0-9-]/g, '');
  
  // Remove consecutive hyphens
  cleaned = cleaned.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  cleaned = cleaned.replace(/^-|-$/g, '');
  
  // Minimum 2 characters
  return cleaned.length >= 2 ? cleaned : null;
}

/**
 * Calculate content quality score
 */
function calculateQualityScore(title: string, content: string): { score: number; reasons: string[] } {
  let score = 50; // Base score
  const reasons: string[] = [];
  
  // Length checks
  if (content.length < 100) {
    score -= 30;
    reasons.push("内容过短");
  } else if (content.length >= 500) {
    score += 10;
    reasons.push("内容长度适中");
  }
  
  // Title quality
  if (title.length < 10) {
    score -= 10;
    reasons.push("标题过短");
  } else if (title.length >= 20) {
    score += 5;
    reasons.push("标题长度合适");
  }
  
  // Check for proper formatting indicators
  const hasHeaders = content.includes("#") || content.includes("##") || content.includes("**");
  if (hasHeaders) {
    score += 10;
    reasons.push("有良好的格式");
  }
  
  // Check for code blocks
  const hasCode = content.includes("```") || content.includes("`");
  if (hasCode) {
    score += 5;
    reasons.push("包含代码示例");
  }
  
  // Check for links
  const hasLinks = content.includes("http") || content.includes("[[");
  if (hasLinks) {
    score += 5;
    reasons.push("包含引用链接");
  }
  
  // Penalize for gibberish/nonsense
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 0) {
    const avgWordLength = content.replace(/\s/g, "").length / wordCount;
    if (avgWordLength < 2) {
      score -= 20;
      reasons.push("疑似乱码内容");
    }
  }
  
  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));
  
  return { score, reasons };
}

/**
 * Analyze content sentiment/relevance
 */
function analyzeSentiment(content: string): { positive: boolean; reason: string } {
  const positiveKeywords = [
    "帮助", "有用", "感谢", "分享", "学习", "解决",
    "helpful", "thanks", "share", "learn", "solve", "great", "good"
  ];
  
  const negativeKeywords = [
    "垃圾", "骗人", "无用", "抄袭", "垃圾内容",
    "spam", "scam", "useless", "copy"
  ];
  
  const text = content.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const kw of positiveKeywords) {
    if (text.includes(kw)) positiveCount++;
  }
  
  for (const kw of negativeKeywords) {
    if (text.includes(kw)) negativeCount++;
  }
  
  if (negativeCount > positiveCount) {
    return { positive: false, reason: "检测到可疑内容" };
  }
  
  return { positive: true, reason: "内容审核通过" };
}

/**
 * Main AI review function
 */
export async function reviewArticle(
  article: Article,
  config: Partial<ReviewConfig> = {}
): Promise<ReviewResult> {
  const cfg: ReviewConfig = {
    autoApproveThreshold: 70,
    minContentLength: 100,
    maxTags: 8,
    ...config,
  };
  
  const { title, content, tags = [] } = article;
  const analyzedAt = new Date().toISOString();
  
  // Step 1: Generate SEO-friendly tags for Google search
  const seoTags = generateSEOTags(title, content, tags);
  
  // Step 2: Calculate quality score
  const { score, reasons } = calculateQualityScore(title, content);
  
  // Step 3: Sentiment analysis
  const sentiment = analyzeSentiment(content);
  
  // Step 4: Determine approval
  let approved = false;
  let needsManualReview = false;
  let reason = "";
  
  // Auto-reject if sentiment is negative
  if (!sentiment.positive) {
    approved = false;
    reason = `内容审核未通过: ${sentiment.reason}`;
    needsManualReview = true;
  }
  // Auto-reject if content is too short
  else if (content.length < cfg.minContentLength) {
    approved = false;
    reason = `内容过短 (${content.length} 字符)，需要至少 ${cfg.minContentLength} 字符`;
    needsManualReview = true;
  }
  // Auto-approve if quality score is high enough
  else if (score >= cfg.autoApproveThreshold) {
    approved = true;
    reason = `AI审核通过 (质量分数: ${score}/100)。${reasons.join("，")}。`;
    needsManualReview = false;
  }
  // Medium score - needs manual review
  else if (score >= 40) {
    approved = false;
    reason = `内容质量中等 (${score}/100)，需要人工审核。${reasons.join("，")}。`;
    needsManualReview = true;
  }
  // Low score - auto reject
  else {
    approved = false;
    reason = `内容质量较低 (${score}/100)，建议修改后重新提交。${reasons.join("，")}。`;
    needsManualReview = true;
  }
  
  return {
    approved,
    tags: seoTags,
    seoTags, // Return SEO tags separately for reference
    reason,
    score,
    needsManualReview,
    analyzedAt,
  };
}

/**
 * Process pending articles and auto-approve if they pass AI review
 */
export async function processPendingArticles(env: any): Promise<{
  processed: number;
  autoApproved: number;
  flagged: number;
  results: Array<{ articleId: string; result: ReviewResult }>;
}> {
  const pendingArticles = await getPendingArticles(env);
  
  const results: Array<{ articleId: string; result: ReviewResult }> = [];
  let autoApproved = 0;
  let flagged = 0;
  
  for (const article of pendingArticles) {
    const result = await reviewArticle(article);
    
    // Auto-approve if passed review
    if (result.approved) {
      await updateArticle(article.id, {
        status: "approved",
        tags: result.tags.length > 0 ? result.tags : article.tags,
        reviewedAt: result.analyzedAt,
        reviewedBy: "AI_AUTOMATED",
      }, env);
      autoApproved++;
    } else {
      flagged++;
    }
    
    results.push({ articleId: article.id, result });
  }
  
  return {
    processed: pendingArticles.length,
    autoApproved,
    flagged,
    results,
  };
}

/**
 * Quick review for a single article (used when article is submitted)
 */
export async function quickReview(article: Article, env: any): Promise<ReviewResult> {
  const result = await reviewArticle(article);
  
  // If auto-approved, update the article immediately
  if (result.approved) {
    await updateArticle(article.id, {
      status: "approved",
      tags: result.tags.length > 0 ? result.tags : article.tags,
      reviewedAt: result.analyzedAt,
      reviewedBy: "AI_AUTOMATED",
    }, env);
  }
  
  return result;
}
