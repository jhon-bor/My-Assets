-- Cloudflare D1 Schema for My-Assets

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'subscriber',
  display_name TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folder TEXT NOT NULL,
  tags TEXT,  -- JSON array stored as text
  summary TEXT,
  source_lang TEXT DEFAULT 'zh',
  status TEXT NOT NULL DEFAULT 'pending',
  author_id TEXT NOT NULL,
  author_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,
  -- Auto-translated versions
  title_en TEXT,
  title_ja TEXT,
  title_fr TEXT,
  title_es TEXT,
  title_pt TEXT,
  title_de TEXT,
  title_it TEXT,
  content_en TEXT,
  content_ja TEXT,
  content_fr TEXT,
  content_es TEXT,
  content_pt TEXT,
  content_de TEXT,
  content_it TEXT,
  summary_en TEXT,
  summary_ja TEXT,
  summary_fr TEXT,
  summary_es TEXT,
  summary_pt TEXT,
  summary_de TEXT,
  summary_it TEXT,
  -- Translation metadata
  translated_at TEXT,
  translation_backend TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Add soft delete columns (run separately if needed)
ALTER TABLE articles ADD COLUMN deleted_at TEXT;
ALTER TABLE articles ADD COLUMN deleted_by TEXT;