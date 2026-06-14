import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { i18n } from "i18next";

function getCopy(i18n: i18n, lang: string) {
  return {
    placeholder: i18n.t("subscribe.placeholder", { lng: lang }),
    button: i18n.t("subscribe.button", { lng: lang }),
    loading: i18n.t("subscribe.submitting", { lng: lang }),
    success: "✓ " + i18n.t("subscribe.subscribed", { lng: lang }),
    successMsg: i18n.t("subscribe.success", { lng: lang }),
    error: i18n.t("subscribe.error", { lng: lang }),
  };
}

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copy, setCopy] = useState({ placeholder: "", button: "", loading: "", success: "", successMsg: "", error: "" });

  useEffect(() => {
    const i18n = (window as any).__i18n;
    const lang = localStorage.getItem("lookfinde_lang") || "zh";
    if (i18n) setCopy(getCopy(i18n, lang));
    const handler = () => {
      const l = localStorage.getItem("lookfinde_lang") || "zh";
      if (i18n) setCopy(getCopy(i18n, l));
    };
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status !== "idle") setStatus("idle"); }}
          placeholder={copy.placeholder}
          required
          className="flex-1 rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 focus:border-transparent"
          style={{
            minHeight: 48,
            background: "var(--color-bg)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
            fontSize: "1rem",
            "--tw-ring-color": "var(--color-ring)",
          } as React.CSSProperties}
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl font-semibold text-white px-6 py-3 transition-all disabled:opacity-60 shadow-lg"
          style={{
            minHeight: 48,
            minWidth: 120,
            background: status === "success"
              ? "#10b981"
              : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none",
            cursor: status === "loading" ? "wait" : "pointer",
            fontSize: "1rem",
          }}
        >
          {status === "loading" ? copy.loading : status === "success" ? copy.success : copy.button}
        </motion.button>
      </div>

      {status === "success" && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium"
          style={{ color: "#10b981" }}
        >
          ✅ {copy.successMsg}
        </motion.p>
      )}
      {status === "error" && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium"
          style={{ color: "#ef4444" }}
        >
          {copy.error}
        </motion.p>
      )}
    </form>
  );
}