import React, { useState, useMemo } from "react";
import { BudgetData } from "./bridge";
import { fmtMoney, fmtMonthLabel, healthColor } from "./helpers";
import { MonthData, CategoryMonth } from "./types";

export function OverviewTab({ data }: { data: BudgetData }) {
  const monthKeys = useMemo(() => {
    return (data.months || [])
      .map((m: MonthData) => m.month)
      .sort()
      .reverse();
  }, [data.months]);

  const [monthIdx, setMonthIdx] = useState(0);
  const currentKey = monthKeys[monthIdx] || "";
  const monthData = data.months?.find((m: MonthData) => m.month === currentKey);

  // Compute stats
  const cats: CategoryMonth[] = monthData?.categories || [];
  const totalBudgeted = cats.reduce((s, c) => s + (c.budgeted || 0), 0);
  const totalSpent = cats.reduce((s, c) => s + (c.spent || 0), 0);
  const netIncome = totalBudgeted + totalSpent; // spent is negative

  // Top spending categories (negative spent = expense)
  const topSpending = useMemo(() => {
    return [...cats]
      .filter((c) => (c.spent || 0) < 0)
      .sort((a, b) => (a.spent || 0) - (b.spent || 0))
      .slice(0, 8);
  }, [cats]);

  // Accounts summary
  const onBudgetAccounts = (data.accounts || []).filter(
    (a: any) => !a.offbudget && !a.closed
  );
  const offBudgetAccounts = (data.accounts || []).filter(
    (a: any) => a.offbudget && !a.closed
  );

  return (
    <div className="flex-col gap-lg">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="month-nav">
          <button
            onClick={() => setMonthIdx((i) => Math.min(i + 1, monthKeys.length - 1))}
            disabled={monthIdx >= monthKeys.length - 1}
          >
            ←
          </button>
          <span className="month-label">{fmtMonthLabel(currentKey)}</span>
          <button
            onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
            disabled={monthIdx <= 0}
          >
            →
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-3">
        <div className="card stat-card">
          <span className="stat-label">Budgeted</span>
          <span className="stat-value">{fmtMoney(totalBudgeted)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Spent</span>
          <span className="stat-value t-negative">{fmtMoney(totalSpent)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Remaining</span>
          <span className={`stat-value ${netIncome >= 0 ? "t-positive" : "t-negative"}`}>
            {fmtMoney(netIncome)}
          </span>
        </div>
      </div>

      {/* Top spending */}
      <div className="card">
        <div className="t-label" style={{ marginBottom: "0.75rem" }}>
          Top Spending
        </div>
        {topSpending.length === 0 ? (
          <div className="empty-state">
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="flex-col">
            {topSpending.map((cat) => {
              const spent = Math.abs(cat.spent || 0);
              const budgeted = cat.budgeted || 0;
              const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : spent > 0 ? 100 : 0;
              const health = budgeted > 0 ? (spent / budgeted) : 1;
              const catInfo = data.categories?.find((c: any) => c.id === cat.id);
              const name = catInfo?.name || cat.id;

              return (
                <div key={cat.id} style={{ padding: "0.5rem 0" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.9rem" }}>{name}</span>
                    <div className="flex items-center gap-sm">
                      <span className="t-mono" style={{ fontSize: "0.88rem", color: "var(--t-negative)" }}>
                        {fmtMoney(-spent)}
                      </span>
                      {budgeted > 0 && (
                        <span className="t-mono t-muted" style={{ fontSize: "0.8rem" }}>
                          / {fmtMoney(budgeted)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${healthColor(health)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accounts */}
      <div className="grid-2">
        <div className="card">
          <div className="t-label" style={{ marginBottom: "0.75rem" }}>
            On-Budget Accounts
          </div>
          {onBudgetAccounts.length === 0 ? (
            <p className="t-tertiary" style={{ fontSize: "0.88rem" }}>No accounts.</p>
          ) : (
            <div className="flex-col">
              {onBudgetAccounts.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between"
                  style={{ padding: "0.375rem 0", borderBottom: "1px solid var(--b-subtle)" }}
                >
                  <span className="truncate" style={{ fontSize: "0.88rem", maxWidth: "60%" }}>
                    {a.name}
                  </span>
                  <span className={`t-mono ${(a.balance_current || 0) >= 0 ? "t-positive" : "t-negative"}`} style={{ fontSize: "0.88rem" }}>
                    {a.balance_current != null ? fmtMoney(a.balance_current) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="t-label" style={{ marginBottom: "0.75rem" }}>
            Off-Budget / Savings
          </div>
          {offBudgetAccounts.length === 0 ? (
            <p className="t-tertiary" style={{ fontSize: "0.88rem" }}>No accounts.</p>
          ) : (
            <div className="flex-col">
              {offBudgetAccounts.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between"
                  style={{ padding: "0.375rem 0", borderBottom: "1px solid var(--b-subtle)" }}
                >
                  <span className="truncate" style={{ fontSize: "0.88rem", maxWidth: "60%" }}>
                    {a.name}
                  </span>
                  <span className={`t-mono ${(a.balance_current || 0) >= 0 ? "t-positive" : "t-negative"}`} style={{ fontSize: "0.88rem" }}>
                    {a.balance_current != null ? fmtMoney(a.balance_current) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
