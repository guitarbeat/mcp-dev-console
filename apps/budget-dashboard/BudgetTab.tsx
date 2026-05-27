import React, { useState, useMemo } from "react";
import { BudgetData, setBudgetAmount } from "./bridge";
import { fmtMoney, fmtMonthLabel, healthColor } from "./helpers";
import { MonthData, CategoryMonth } from "./types";

interface Props {
  data: BudgetData;
  onRefresh: () => void;
  showStatus: (type: "success" | "error", msg: string) => void;
}

interface GroupedCategory {
  groupName: string;
  groupId: string;
  cats: Array<{
    id: string;
    name: string;
    budgeted: number;
    spent: number;
    balance: number;
  }>;
  totalBudgeted: number;
  totalSpent: number;
}

export function BudgetTab({ data, onRefresh, showStatus }: Props) {
  const monthKeys = useMemo(() => {
    return (data.months || [])
      .map((m: MonthData) => m.month)
      .sort()
      .reverse();
  }, [data.months]);

  const [monthIdx, setMonthIdx] = useState(0);
  const currentKey = monthKeys[monthIdx] || "";
  const monthData = data.months?.find((m: MonthData) => m.month === currentKey);

  // Edit state
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (gid: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  // Build grouped categories
  const groups: GroupedCategory[] = useMemo(() => {
    const cats: CategoryMonth[] = monthData?.categories || [];
    const catDefs = data.categories || [];
    const groupDefs = data.categoryGroups || [];

    const groupMap: Record<string, GroupedCategory> = {};

    for (const gd of groupDefs) {
      groupMap[gd.id] = {
        groupName: gd.name,
        groupId: gd.id,
        cats: [],
        totalBudgeted: 0,
        totalSpent: 0,
      };
    }

    for (const cat of cats) {
      const def = catDefs.find((c: any) => c.id === cat.id);
      if (!def) continue;
      const gid = def.group_id;
      if (!groupMap[gid]) continue;

      const budgeted = cat.budgeted || 0;
      const spent = cat.spent || 0;
      groupMap[gid].cats.push({
        id: cat.id,
        name: def.name,
        budgeted,
        spent,
        balance: budgeted + spent,
      });
      groupMap[gid].totalBudgeted += budgeted;
      groupMap[gid].totalSpent += spent;
    }

    return Object.values(groupMap)
      .filter((g) => g.cats.length > 0)
      .sort((a, b) => Math.abs(b.totalSpent) - Math.abs(a.totalSpent));
  }, [monthData, data.categories, data.categoryGroups]);

  const startEdit = (catId: string, currentBudgeted: number) => {
    setEditingCat(catId);
    setEditValue((currentBudgeted / 100).toFixed(2));
  };

  const cancelEdit = () => {
    setEditingCat(null);
    setEditValue("");
  };

  const handleSave = async (catId: string) => {
    setSaving(true);
    try {
      const cents = Math.round(parseFloat(editValue || "0") * 100);
      await setBudgetAmount(currentKey, catId, cents);
      showStatus("success", "Budget updated.");
      cancelEdit();
      onRefresh();
    } catch (e: any) {
      showStatus("error", e.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

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

      {/* Category groups */}
      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <p>No budget categories for this month.</p>
        </div>
      ) : (
        groups.map((group) => {
          const isExpanded = expandedGroups.has(group.groupId);
          const gSpent = Math.abs(group.totalSpent);
          const gBudgeted = group.totalBudgeted;
          const gPct = gBudgeted > 0 ? Math.min((gSpent / gBudgeted) * 100, 100) : gSpent > 0 ? 100 : 0;
          const gHealth = gBudgeted > 0 ? gSpent / gBudgeted : gSpent > 0 ? 1 : 0;

          return (
            <div key={group.groupId} className="category-group">
              {/* Group header */}
              <div
                className="category-group-header"
                onClick={() => toggleGroup(group.groupId)}
              >
                <span style={{ fontSize: "0.85rem", transition: "transform 180ms", transform: isExpanded ? "rotate(90deg)" : "none" }}>
                  ▶
                </span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: "0.95rem" }}>
                  {group.groupName}
                </span>
                <div className="flex items-center gap-md">
                  <span className="t-mono t-negative" style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                    {fmtMoney(-gSpent)}
                  </span>
                  <span className="t-mono t-muted" style={{ fontSize: "0.8rem" }}>
                    / {fmtMoney(gBudgeted)}
                  </span>
                  <span className={`chip ${gHealth > 1 ? "chip-danger" : gHealth > 0.85 ? "chip-warning" : "chip-success"}`}>
                    {gBudgeted > 0 ? `${Math.round(gHealth * 100)}%` : "—"}
                  </span>
                </div>
              </div>

              {/* Collapsed progress bar */}
              {!isExpanded && gBudgeted > 0 && (
                <div style={{ padding: "0 var(--sp-card) 0.625rem" }}>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${healthColor(gHealth)}`}
                      style={{ width: `${gPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Expanded subcategories */}
              {isExpanded &&
                group.cats
                  .sort((a, b) => Math.abs(b.spent) - Math.abs(a.spent))
                  .map((cat) => {
                    const spent = Math.abs(cat.spent);
                    const budgeted = cat.budgeted;
                    const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : spent > 0 ? 100 : 0;
                    const health = budgeted > 0 ? spent / budgeted : spent > 0 ? 1 : 0;
                    const isEditing = editingCat === cat.id;

                    return (
                      <div key={cat.id} className="category-row">
                        <span className="truncate" style={{ flex: 1, fontSize: "0.9rem", minWidth: 0 }}>
                          {cat.name}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-sm">
                            <span className="t-label" style={{ fontSize: "0.72rem" }}>$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="input t-mono"
                              style={{ width: 100, minHeight: 36, padding: "0.25rem 0.5rem" }}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave(cat.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              autoFocus
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => handleSave(cat.id)} disabled={saving}>
                              {saving ? "…" : "✓"}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-md" style={{ cursor: "pointer" }} onClick={() => startEdit(cat.id, cat.budgeted)}>
                            <div style={{ width: 100 }}>
                              <div className="progress-track">
                                <div
                                  className={`progress-fill ${healthColor(health)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <span className="t-mono t-negative" style={{ fontSize: "0.85rem", fontWeight: 600, width: 72, textAlign: "right" }}>
                              {fmtMoney(-spent)}
                            </span>
                            <span className="t-mono t-muted" style={{ fontSize: "0.78rem", width: 72, textAlign: "right" }}>
                              / {fmtMoney(budgeted)}
                            </span>
                            <span className={`chip ${health > 1 ? "chip-danger" : health > 0.85 ? "chip-warning" : "chip-success"}`} style={{ minWidth: 45, textAlign: "center" }}>
                              {budgeted > 0 ? `${Math.round(health * 100)}%` : "—"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          );
        })
      )}
    </div>
  );
}
