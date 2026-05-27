import React, { useState, useMemo, useRef, useEffect } from "react";
import { BudgetData } from "./bridge";
import { fmtMoney, fmtMonthLabel } from "./helpers";
import { MonthData, CategoryMonth } from "./types";

interface TreeNode {
  id: string;
  name: string;
  spent: number;
  budgeted: number;
  health: number;
}

interface Rect extends TreeNode {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

function healthToColor(h: number): string {
  if (h <= 0.6) return "#4fa37f";
  if (h <= 0.85) return "#5a9a6e";
  if (h <= 1.0) return "#c9a646";
  return "#c95c52";
}

function squarify(items: TreeNode[], x: number, y: number, w: number, h: number): Rect[] {
  if (items.length === 0) return [];
  const total = items.reduce((s, i) => s + i.spent, 0);
  if (total <= 0) return [];

  const rects: Rect[] = [];
  let cx = x, cy = y, cw = w, ch = h;
  let remaining = [...items];
  let remTotal = total;

  while (remaining.length > 0) {
    const isWide = cw >= ch;
    const side = isWide ? ch : cw;
    let row: TreeNode[] = [];
    let rowArea = 0;

    for (const item of remaining) {
      const testRow = [...row, item];
      const testArea = rowArea + (item.spent / remTotal) * cw * ch;
      const testSide = testArea / side;

      if (row.length === 0) {
        row.push(item);
        rowArea = testArea;
        continue;
      }

      const currWorst = worstRatio(row, rowArea, side);
      const newWorst = worstRatio(testRow, testArea, side);

      if (newWorst <= currWorst) {
        row.push(item);
        rowArea = testArea;
      } else {
        break;
      }
    }

    // Layout row
    const rowFraction = rowArea / (cw * ch);
    if (isWide) {
      const rowW = cw * rowFraction;
      let ry = cy;
      for (const item of row) {
        const frac = (item.spent / remTotal) * cw * ch / rowArea;
        const rh = ch * frac;
        rects.push({
          ...item,
          x: cx, y: ry, w: rowW, h: rh,
          color: healthToColor(item.health),
        });
        ry += rh;
      }
      cx += rowW;
      cw -= rowW;
    } else {
      const rowH = ch * rowFraction;
      let rx = cx;
      for (const item of row) {
        const frac = (item.spent / remTotal) * cw * ch / rowArea;
        const rw = cw * frac;
        rects.push({
          ...item,
          x: rx, y: cy, w: rw, h: rowH,
          color: healthToColor(item.health),
        });
        rx += rw;
      }
      cy += rowH;
      ch -= rowH;
    }

    remaining = remaining.slice(row.length);
    remTotal -= row.reduce((s, i) => s + i.spent, 0);
  }

  return rects;
}

function worstRatio(row: TreeNode[], area: number, side: number): number {
  if (row.length === 0) return Infinity;
  const s = area / side;
  let worst = 0;
  const rowTotal = row.reduce((acc, i) => acc + i.spent, 0);
  for (const item of row) {
    const frac = item.spent / rowTotal;
    const r = frac * area;
    const ratio = Math.max((s * s) / r, r / (s * s));
    worst = Math.max(worst, ratio);
  }
  return worst;
}

export function TreemapTab({ data }: { data: BudgetData }) {
  const monthKeys = useMemo(() => {
    return (data.months || []).map((m: MonthData) => m.month).sort().reverse();
  }, [data.months]);

  const [monthIdx, setMonthIdx] = useState(0);
  const [viewBy, setViewBy] = useState<"category" | "group">("category");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 450 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const currentKey = monthKeys[monthIdx] || "";
  const monthData = data.months?.find((m: MonthData) => m.month === currentKey);
  const cats: CategoryMonth[] = monthData?.categories || [];
  const catDefs = data.categories || [];
  const groupDefs = data.categoryGroups || [];

  const nodes: TreeNode[] = useMemo(() => {
    if (viewBy === "category") {
      return cats
        .filter((c) => (c.spent || 0) < 0)
        .map((c) => {
          const def = catDefs.find((d: any) => d.id === c.id);
          const spent = Math.abs(c.spent || 0);
          const budgeted = c.budgeted || 0;
          return {
            id: c.id,
            name: def?.name || c.id,
            spent,
            budgeted,
            health: budgeted > 0 ? spent / budgeted : 1,
          };
        })
        .sort((a, b) => b.spent - a.spent);
    } else {
      const gMap: Record<string, { spent: number; budgeted: number }> = {};
      for (const c of cats) {
        if ((c.spent || 0) >= 0) continue;
        const def = catDefs.find((d: any) => d.id === c.id);
        if (!def) continue;
        const gid = def.group_id;
        if (!gMap[gid]) gMap[gid] = { spent: 0, budgeted: 0 };
        gMap[gid].spent += Math.abs(c.spent || 0);
        gMap[gid].budgeted += c.budgeted || 0;
      }
      return Object.entries(gMap)
        .map(([gid, val]) => {
          const gdef = groupDefs.find((g: any) => g.id === gid);
          return {
            id: gid,
            name: gdef?.name || gid,
            spent: val.spent,
            budgeted: val.budgeted,
            health: val.budgeted > 0 ? val.spent / val.budgeted : 1,
          };
        })
        .sort((a, b) => b.spent - a.spent);
    }
  }, [cats, catDefs, groupDefs, viewBy]);

  const rects = useMemo(() => squarify(nodes, 0, 0, dims.w, dims.h), [nodes, dims]);

  const hovered = hoveredId ? rects.find((r) => r.id === hoveredId) : null;

  return (
    <div className="flex-col gap-lg">
      {/* Controls */}
      <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="month-nav">
          <button onClick={() => setMonthIdx((i) => Math.min(i + 1, monthKeys.length - 1))} disabled={monthIdx >= monthKeys.length - 1}>←</button>
          <span className="month-label">{fmtMonthLabel(currentKey)}</span>
          <button onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))} disabled={monthIdx <= 0}>→</button>
        </div>
        <div className="flex gap-sm">
          <button
            className={`btn btn-sm ${viewBy === "category" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setViewBy("category")}
          >
            Categories
          </button>
          <button
            className={`btn btn-sm ${viewBy === "group" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setViewBy("group")}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Treemap */}
      {nodes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <p>No spending data for this month.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <div ref={containerRef} className="treemap-container">
            <svg width={dims.w} height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`}>
              {rects.map((r) => {
                const isHovered = hoveredId === r.id;
                const minLabel = r.w > 60 && r.h > 32;
                const minAmount = r.w > 50 && r.h > 50;
                return (
                  <g
                    key={r.id}
                    className="treemap-rect"
                    onMouseEnter={() => setHoveredId(r.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <rect
                      x={r.x + 1}
                      y={r.y + 1}
                      width={Math.max(r.w - 2, 0)}
                      height={Math.max(r.h - 2, 0)}
                      fill={r.color}
                      rx={4}
                      opacity={isHovered ? 1 : 0.82}
                      stroke={isHovered ? "#fff" : "none"}
                      strokeWidth={isHovered ? 2 : 0}
                    />
                    {minLabel && (
                      <text
                        x={r.x + r.w / 2}
                        y={r.y + r.h / 2 - (minAmount ? 6 : 0)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fff"
                        fontSize={Math.min(13, r.w / 8)}
                        fontWeight="700"
                        fontFamily="Inter, sans-serif"
                        style={{ pointerEvents: "none" }}
                      >
                        {r.name.length > 18 ? r.name.slice(0, 16) + "…" : r.name}
                      </text>
                    )}
                    {minAmount && (
                      <text
                        x={r.x + r.w / 2}
                        y={r.y + r.h / 2 + 14}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="rgba(255,255,255,0.7)"
                        fontSize={Math.min(11, r.w / 10)}
                        fontWeight="600"
                        fontFamily="Inter, sans-serif"
                        style={{ pointerEvents: "none" }}
                      >
                        {fmtMoney(-r.spent)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Hover tooltip */}
          {hovered && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "var(--bg-elevated)",
                border: "1px solid var(--b-default)",
                borderRadius: "var(--r-panel)",
                padding: "0.75rem 1rem",
                boxShadow: "var(--shadow-card)",
                minWidth: 160,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "0.375rem" }}>{hovered.name}</div>
              <div className="flex justify-between gap-md" style={{ fontSize: "0.82rem" }}>
                <span className="t-tertiary">Spent</span>
                <span className="t-mono t-negative">{fmtMoney(-hovered.spent)}</span>
              </div>
              <div className="flex justify-between gap-md" style={{ fontSize: "0.82rem" }}>
                <span className="t-tertiary">Budget</span>
                <span className="t-mono">{fmtMoney(hovered.budgeted)}</span>
              </div>
              <div className="flex justify-between gap-md" style={{ fontSize: "0.82rem" }}>
                <span className="t-tertiary">Remaining</span>
                <span className={`t-mono ${hovered.budgeted - hovered.spent >= 0 ? "t-positive" : "t-negative"}`}>
                  {fmtMoney(hovered.budgeted - hovered.spent)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{viewBy === "category" ? "Category" : "Group"}</th>
                <th style={{ textAlign: "right" }}>Spent</th>
                <th style={{ textAlign: "right" }}>Budget</th>
                <th style={{ textAlign: "right" }}>Remaining</th>
                <th style={{ textAlign: "right" }}>Usage</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => {
                const remaining = n.budgeted - n.spent;
                const pct = n.budgeted > 0 ? Math.round((n.spent / n.budgeted) * 100) : n.spent > 0 ? 999 : 0;
                return (
                  <tr key={n.id}>
                    <td>{n.name}</td>
                    <td className="text-right">
                      <span className="t-mono t-negative" style={{ fontSize: "0.88rem" }}>{fmtMoney(-n.spent)}</span>
                    </td>
                    <td className="text-right">
                      <span className="t-mono" style={{ fontSize: "0.88rem" }}>{fmtMoney(n.budgeted)}</span>
                    </td>
                    <td className="text-right">
                      <span className={`t-mono ${remaining >= 0 ? "t-positive" : "t-negative"}`} style={{ fontSize: "0.88rem" }}>
                        {fmtMoney(remaining)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`chip ${n.health > 1 ? "chip-danger" : n.health > 0.85 ? "chip-warning" : "chip-success"}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
