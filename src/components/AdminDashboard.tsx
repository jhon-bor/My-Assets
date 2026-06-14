import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  folder: string;
  tags: string[];
  summary: string;
  status: "pending" | "approved" | "rejected" | "deleted";
  authorEmail: string;
  createdAt: string;
  deletedAt?: string;
}

interface AIReviewResult {
  approved: boolean;
  reason: string;
  score: number;
}

export default function AdminDashboard() {
  const [token, setToken] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "deleted">("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    processed: number;
    autoApproved: number;
    flagged: number;
  } | null>(null);

  // Edit modal state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  // Open edit modal
  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditTags(article.tags.join(", "));
    setEditFolder(article.folder);
    setEditSummary(article.summary);
    setEditMessage("");
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingArticle(null);
    setEditMessage("");
  };

  // Save article edits
  const saveArticleEdits = async () => {
    if (!editingArticle) return;
    setEditSaving(true);
    setEditMessage("");

    try {
      const res = await fetch("/api/admin/update-article", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          articleId: editingArticle.id,
          title: editTitle,
          tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
          folder: editFolder,
          summary: editSummary,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEditMessage("✅ " + data.message);
        // Refresh list
        loadArticles(token, tab);
        // Close modal after 1.5s
        setTimeout(() => {
          closeEditModal();
        }, 1500);
      } else {
        const data = await res.json();
        setEditMessage("❌ " + (data.error || "保存失败"));
      }
    } catch {
      setEditMessage("❌ 请求失败，请重试");
    }
    setEditSaving(false);
  };

  // Delete article (soft delete - move to trash)
  const handleDelete = async (articleId: string) => {
    try {
      const res = await fetch("/api/admin/articles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ articleId, permanent: false }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeleteMessage("✅ " + data.message);
        setDeletingId(null);
        // Refresh list
        loadArticles(token, tab);
        setTimeout(() => setDeleteMessage(""), 3000);
      } else {
        const data = await res.json();
        setDeleteMessage("❌ " + (data.error || "删除失败"));
      }
    } catch {
      setDeleteMessage("❌ 请求失败，请重试");
    }
  };

  // Permanently delete article
  const handlePermanentDelete = async (articleId: string) => {
    try {
      const res = await fetch("/api/admin/articles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ articleId, permanent: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeleteMessage("✅ " + data.message);
        setDeletingId(null);
        // Refresh list
        loadArticles(token, tab);
        setTimeout(() => setDeleteMessage(""), 3000);
      } else {
        const data = await res.json();
        setDeleteMessage("❌ " + (data.error || "删除失败"));
      }
    } catch {
      setDeleteMessage("❌ 请求失败，请重试");
    }
  };

  // Restore article from trash
  const handleRestore = async (articleId: string) => {
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ articleId }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeleteMessage("✅ " + data.message);
        // Refresh list
        loadArticles(token, tab);
        setTimeout(() => setDeleteMessage(""), 3000);
      } else {
        const data = await res.json();
        setDeleteMessage("❌ " + (data.error || "恢复失败"));
      }
    } catch {
      setDeleteMessage("❌ 请求失败，请重试");
    }
  };

  // Check stored token
  useEffect(() => {
    const stored = localStorage.getItem("lookfinde_token");
    if (stored) {
      setToken(stored);
      checkAuth(stored);
    }
  }, []);

  const checkAuth = async (t: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const user = await res.json();
        if (user.role === "admin") {
          setLoggedIn(true);
          setUserRole(user.role);
          loadArticles(t, "pending");
        } else {
          setError("需要管理员权限。");
          localStorage.removeItem("lookfinde_token");
        }
      } else {
        localStorage.removeItem("lookfinde_token");
        setToken("");
      }
    } catch {
      setError("连接失败。");
    }
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user?.role === "admin") {
        localStorage.setItem("lookfinde_token", data.token);
        setToken(data.token);
        setLoggedIn(true);
        setUserRole(data.user.role);
        loadArticles(data.token, "pending");
      } else {
        setError(data.error || "权限不足，需要管理员账号。");
      }
    } catch {
      setError("登录失败。");
    }
    setLoading(false);
  };

  const loadArticles = async (t: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/articles?status=${status}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch {
      setError("加载文章失败。");
    }
  };

  const handleReview = async (articleId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ articleId, action }),
      });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
      }
    } catch {
      setError("操作失败。");
    }
  };

  const switchTab = (t: "pending" | "approved") => {
    setTab(t);
    loadArticles(token, t);
  };

  // AI Batch Review
  const handleAIBatchReview = async () => {
    setAiProcessing(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/admin/ai-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
        // Refresh articles list
        loadArticles(token, tab);
      } else {
        setError("AI 审核失败");
      }
    } catch {
      setError("AI 审核请求失败");
    }
    setAiProcessing(false);
  };

  // Login screen
  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto">
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <h2 className="text-xl font-bold mb-2">🔐 管理员登录</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            仅管理员可访问后台
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lookfinde.com"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2"
                style={{
                  minHeight: 48,
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  "--tw-ring-color": "var(--color-ring)",
                } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2"
                style={{
                  minHeight: 48,
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  "--tw-ring-color": "var(--color-ring)",
                } as React.CSSProperties}
              />
            </div>

            {error && (
              <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
                {error}
              </p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl font-semibold text-white py-3.5 transition-all disabled:opacity-60 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                fontSize: "1rem",
                minHeight: 48,
              }}
            >
              {loading ? "登录中..." : "登录"}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => switchTab("pending")}
          className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: tab === "pending" ? "var(--color-primary)" : "var(--color-bg-tertiary)",
            color: tab === "pending" ? "#fff" : "var(--color-text-secondary)",
            border: "none",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          ⏳ 待审核
        </button>
        <button
          onClick={() => switchTab("approved")}
          className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: tab === "approved" ? "#10b981" : "var(--color-bg-tertiary)",
            color: tab === "approved" ? "#fff" : "var(--color-text-secondary)",
            border: "none",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          ✅ 已发布
        </button>
        <button
          onClick={() => switchTab("deleted")}
          className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: tab === "deleted" ? "#6b7280" : "var(--color-bg-tertiary)",
            color: tab === "deleted" ? "#fff" : "var(--color-text-secondary)",
            border: "none",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          🗑️ 回收站
        </button>

        {/* AI Batch Review Button */}
        {tab === "pending" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAIBatchReview}
            disabled={aiProcessing}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all ml-auto"
            style={{
              background: aiProcessing ? "#a5b4fc" : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              color: "#fff",
              border: "none",
              cursor: aiProcessing ? "wait" : "pointer",
              minHeight: 44,
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
            }}
          >
            {aiProcessing ? "🤖 AI 审核中..." : "🤖 AI 批量审核"}
          </motion.button>
        )}
      </div>
      
      {/* AI Review Result */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl"
            style={{
              background: aiResult.autoApproved > 0 ? "#f0fdf4" : "#fef3c7",
              border: `1px solid ${aiResult.autoApproved > 0 ? "#86efac" : "#fcd34d"}`,
            }}
          >
            <p style={{ color: aiResult.autoApproved > 0 ? "#16a34a" : "#d97706", fontWeight: 600 }}>
              🤖 AI 审核完成！处理了 {aiResult.processed} 篇文章，其中 {aiResult.autoApproved} 篇自动通过，{aiResult.flagged} 篇需要人工审核。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-sm mb-4" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}

      {/* Article list */}
      <div className="space-y-3 max-w-2xl">
        {articles.length === 0 && (
          <div
            className="text-center py-12 rounded-2xl"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span className="text-4xl block mb-3">
              {tab === "pending" ? "🎉" : "📭"}
            </span>
            <p style={{ color: "var(--color-text-muted)" }}>
              {tab === "pending" ? "没有待审核的文章" : "暂无已发布文章"}
            </p>
          </div>
        )}

        <AnimatePresence>
          {articles.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl p-5 transition-all"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold mb-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    style={{ fontSize: "1.05rem" }}
                    onClick={() =>
                      setExpandedId(expandedId === article.id ? null : article.id)
                    }
                  >
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--color-bg-tertiary)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      📁 {article.folder}
                    </span>
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          article.status === "approved"
                            ? "#dcfce7"
                            : article.status === "rejected"
                              ? "#fef2f2"
                              : "#fef3c7",
                        color:
                          article.status === "approved"
                            ? "#16a34a"
                            : article.status === "rejected"
                              ? "#dc2626"
                              : "#d97706",
                      }}
                    >
                      {article.status === "approved"
                        ? "✓ 已发布"
                        : article.status === "rejected"
                          ? "✗ 已驳回"
                          : "⏳ 待审核"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    作者: {article.authorEmail} ·{" "}
                    {new Date(article.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>

                {tab === "pending" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReview(article.id, "approve")}
                      className="rounded-full font-semibold text-white px-5 py-2.5 text-sm transition-all shadow-sm"
                      style={{
                        background: "#10b981",
                        border: "none",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      通过
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReview(article.id, "reject")}
                      className="rounded-full font-semibold text-white px-5 py-2.5 text-sm transition-all shadow-sm"
                      style={{
                        background: "#ef4444",
                        border: "none",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      驳回
                    </motion.button>
                  </div>
                )}

                {/* Actions for approved articles */}
                {tab === "approved" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(article)}
                      className="rounded-full font-semibold px-5 py-2.5 text-sm transition-all shadow-sm"
                      style={{
                        background: "#6366f1",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      ✏️ 编辑
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeletingId(article.id)}
                      className="rounded-full font-semibold px-5 py-2.5 text-sm transition-all shadow-sm"
                      style={{
                        background: "#f59e0b",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      🗑️ 移至回收站
                    </motion.button>
                  </div>
                )}

                {/* Actions for deleted articles (trash) */}
                {tab === "deleted" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRestore(article.id)}
                      className="rounded-full font-semibold text-white px-5 py-2.5 text-sm transition-all shadow-sm"
                      style={{
                        background: "#10b981",
                        border: "none",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      ♻️ 恢复发布
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeletingId(article.id)}
                      className="rounded-full font-semibold text-white px-5 py-2.5 text-sm transition-all shadow-sm"
                      style={{
                        background: "#dc2626",
                        border: "none",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      ⚠️ 永久删除
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Expanded content */}
              {expandedId === article.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t overflow-hidden"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {article.summary && (
                    <p
                      className="text-sm mb-3 px-3 py-2 rounded-lg"
                      style={{
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {article.summary}
                    </p>
                  )}
                  <pre
                    className="text-sm rounded-lg p-4 overflow-x-auto whitespace-pre-wrap"
                    style={{
                      background: "var(--color-code-bg)",
                      color: "var(--color-text)",
                      fontFamily: "var(--font-mono)",
                      lineHeight: 1.7,
                      maxHeight: 400,
                      overflowY: "auto",
                      fontSize: "0.8rem",
                    }}
                  >
                    {article.content}
                  </pre>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEditModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl p-6"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <h3 className="text-lg font-bold mb-4">✏️ 编辑文章</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">分类</label>
                  <input
                    type="text"
                    value={editFolder}
                    onChange={(e) => setEditFolder(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">标签（逗号分隔）</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="javascript, tutorial, frontend"
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">摘要</label>
                  <textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border px-4 py-3 resize-none"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </div>

                {editMessage && (
                  <p className="text-sm font-medium">{editMessage}</p>
                )}
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={saveArticleEdits}
                  disabled={editSaving}
                  className="flex-1 rounded-xl font-semibold text-white py-3 transition-all disabled:opacity-60"
                  style={{ background: "#10b981" }}
                >
                  {editSaving ? "保存中..." : "保存修改"}
                </button>
                <button
                  onClick={closeEditModal}
                  className="flex-1 rounded-xl font-semibold py-3 transition-all"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-text)",
                  }}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeletingId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: "var(--color-surface)",
                border: "1px solid #dc2626",
                boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.25)",
              }}
            >
              {/* Different confirmation based on tab */}
              {tab === "deleted" ? (
                <>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "#dc2626" }}>
                    ⚠️ 永久删除
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                    确定要永久删除这篇文章吗？此操作不可撤销，文章将无法恢复！
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "#f59e0b" }}>
                    🗑️ 移至回收站
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                    确定要将这篇文章移至回收站吗？可以在回收站中恢复或永久删除。
                  </p>
                </>
              )}

              {deleteMessage && (
                <p className="text-sm font-medium mb-4">{deleteMessage}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (tab === "deleted") {
                      handlePermanentDelete(deletingId);
                    } else {
                      handleDelete(deletingId);
                    }
                  }}
                  className="flex-1 rounded-xl font-semibold text-white py-3 transition-all"
                  style={{ background: tab === "deleted" ? "#dc2626" : "#f59e0b" }}
                >
                  {tab === "deleted" ? "永久删除" : "移至回收站"}
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 rounded-xl font-semibold py-3 transition-all"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-text)",
                  }}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
