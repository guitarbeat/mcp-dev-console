import "./styles.css";
import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { loadAllData, BudgetData } from "./bridge";
import { OverviewTab } from "./OverviewTab";
import { TransactionsTab } from "./TransactionsTab";
import { BudgetTab } from "./BudgetTab";
import { TreemapTab } from "./TreemapTab";

type Tab = "overview" | "transactions" | "budget" | "treemap";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "overview", icon: "📊", label: "Overview" },
  { id: "transactions", icon: "📒", label: "Transactions" },
  { id: "budget", icon: "🎯", label: "Budget" },
  { id: "treemap", icon: "🗺️", label: "Treemap" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await loadAllData();
      setData(d);
    } catch (e: any) {
      setError(e.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-dismiss status
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const showStatus = (type: "success" | "error", msg: string) => setStatus({ type, msg });

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <span className="app-title">Budget Dashboard</span>
        <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </header>

      {/* Status toast */}
      {status && (
        <div className={`status-bar ${status.type === "success" ? "status-success" : "status-error"}`}>
          {status.msg}
        </div>
      )}

      {/* Tabs */}
      <nav className="nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="app-content">
        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            <span className="t-secondary" style={{ fontSize: "0.9rem" }}>Loading your budget…</span>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={refresh}>
              Try Again
            </button>
          </div>
        ) : data ? (
          <>
            {tab === "overview" && <OverviewTab data={data} />}
            {tab === "transactions" && (
              <TransactionsTab data={data} onRefresh={refresh} showStatus={showStatus} />
            )}
            {tab === "budget" && (
              <BudgetTab data={data} onRefresh={refresh} showStatus={showStatus} />
            )}
            {tab === "treemap" && <TreemapTab data={data} />}
          </>
        ) : null}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
