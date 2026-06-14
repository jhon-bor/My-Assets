/**
 * 用户文章管理页面
 * 显示当前登录用户的所有文章
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Article {
  id: string;
  title: string;
  slug: string;
  folder: string;
  tags: string[];
  summary: string;
  status: "pending" | "approved" | "rejected" | "deleted";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface Stats {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  deleted: number;
}

interface User {
  id: string;
  email: string;
  role: string;
}

export default function MyArticles({ token, user }: { token: string; user: User }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, pending: 0, rejected: 0, deleted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "pending" | "rejected">("all");

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/my/articles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles);
        setStats(data.stats);
      } else {
        const data = await res.json();
        setError(data.error || "加载文章失败");
      }
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    if (filter === "all") return true;
    if (filter === "published") return article.status === "approved";
    if (filter === "pending") return article.status === "pending";
    if (filter === "rejected") return article.status === "rejected";
    return true;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: { bg: "#10b981", text: "已发布", icon: "✅" },
      pending: { bg: "#f59e0b", text: "审核中", icon: "⏳" },
      rejected: { bg: "#dc2626", text: "未通过", icon: "❌" },
      deleted: { bg: "#6b7280", text: "已删除", icon: "🗑️" },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: "#dc2626" }}>{error}</p>
          <button
            onClick={loadArticles}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: "#6366f1" }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            📝 我的文章
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            管理您发布的文章和草稿
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "总计", value: stats.total, icon: "📚", color: "#6366f1" },
            { label: "已发布", value: stats.published, icon: "✅", color: "#10b981" },
            { label: "审核中", value: stats.pending, icon: "⏳", color: "#f59e0b" },
            { label: "未通过", value: stats.rejected, icon: "❌", color: "#dc2626" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-6"
              style={{ background: "var(--color-bg-secondary)", border: `2px solid ${stat.color}20` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "全部", count: stats.total },
            { key: "published", label: "已发布", count: stats.published },
            { key: "pending", label: "审核中", count: stats.pending },
            { key: "rejected", label: "未通过", count: stats.rejected },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: filter === tab.key ? "#6366f1" : "var(--color-bg-tertiary)",
                color: filter === tab.key ? "#fff" : "var(--color-text-secondary)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredArticles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 rounded-2xl"
                style={{ background: "var(--color-bg-secondary)" }}
              >
                <p className="text-4xl mb-4">📝</p>
                <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
                  {filter === "all" ? "您还没有发布任何文章" : "没有符合条件的文章"}
                </p>
                <a
                  href="/zh/publish/"
                  className="inline-block mt-4 px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: "#6366f1" }}
                >
                  发布新文章
                </a>
              </motion.div>
            ) : (
              filteredArticles.map((article, index) => {
                const badge = getStatusBadge(article.status);
                return (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl p-6 transition-all hover:shadow-lg"
                    style={{ background: "var(--color-bg-secondary)" }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ background: badge.bg + "20", color: badge.bg }}
                          >
                            {badge.icon} {badge.text}
                          </span>
                          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                            {article.folder}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                          {article.title}
                        </h3>
                        
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                          {article.summary}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {article.tags?.slice(0, 5).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded text-xs"
                              style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          发布于 {formatDate(article.createdAt)}
                          {article.reviewedAt && (
                            <span> · 审核于 {formatDate(article.reviewedAt)}</span>
                          )}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 md:flex-col">
                        {article.status === "approved" && (
                          <a
                            href={`/zh/notes/${article.slug}/`}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                            style={{ background: "#10b981" }}
                          >
                            查看
                          </a>
                        )}
                        <button
                          className="px-4 py-2 rounded-xl text-sm font-medium"
                          style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text)" }}
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Publish Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <a
            href="/zh/publish/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", boxShadow: "0 4px 20px #6366f140" }}
          >
            ✍️ 发布新文章
          </a>
        </motion.div>
      </div>
    </div>
  );
}
