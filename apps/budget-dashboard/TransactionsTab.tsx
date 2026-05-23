import React, { useState, useMemo } from "react";
import { BudgetData, saveTransaction, deleteTransaction } from "./bridge";
import { fmtMoney, fmtDate } from "./helpers";
import { Transaction } from "./types";

interface Props {
  data: BudgetData;
  onRefresh: () => void;
  showStatus: (type: "success" | "error", msg: string) => void;
}

interface FormData {
  date: string;
  account: string;
  payee_name: string;
  category: string;
  amount: string;
  notes: string;
}

const emptyForm = (): FormData => ({
  date: new Date().toISOString().slice(0, 10),
  account: "",
  payee_name: "",
  category: "",
  amount: "",
  notes: "",
});

export function TransactionsTab({ data, onRefresh, showStatus }: Props) {
  const [search, setSearch] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const txns: Transaction[] = data.transactions || [];
  const accounts = (data.accounts || []).filter((a: any) => !a.closed);
  const categories = data.categories || [];

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c: any) => { m[c.id] = c.name; });
    return m;
  }, [categories]);

  const acctMap = useMemo(() => {
    const m: Record<string, string> = {};
    (data.accounts || []).forEach((a: any) => { m[a.id] = a.name; });
    return m;
  }, [data.accounts]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list = [...txns];
    if (filterAccount) list = list.filter((t) => t.account === filterAccount);
    if (filterCategory) list = list.filter((t) => t.category === filterCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.payee_name || "").toLowerCase().includes(q) ||
          (t.notes || "").toLowerCase().includes(q) ||
          (catMap[t.category] || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return list;
  }, [txns, filterAccount, filterCategory, search, catMap]);

  // Max 200 shown
  const display = filtered.slice(0, 200);

  const openCreate = () => {
    setEditingTx(null);
    setForm(emptyForm());
    setPanelOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      date: tx.date || "",
      account: tx.account || "",
      payee_name: tx.payee_name || "",
      category: tx.category || "",
      amount: tx.amount != null ? (tx.amount / 100).toFixed(2) : "",
      notes: tx.notes || "",
    });
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingTx(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const amountCents = Math.round(parseFloat(form.amount || "0") * 100);
      const payload: any = {
        date: form.date,
        account: form.account || undefined,
        payee_name: form.payee_name || undefined,
        category: form.category || undefined,
        amount: amountCents,
        notes: form.notes || undefined,
      };
      if (editingTx) payload.id = editingTx.id;
      await saveTransaction(payload);
      showStatus("success", editingTx ? "Transaction saved." : "Transaction created.");
      closePanel();
      onRefresh();
    } catch (e: any) {
      showStatus("error", e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      showStatus("success", "Transaction deleted.");
      setDeletingId(null);
      onRefresh();
    } catch (e: any) {
      showStatus("error", e.message || "Failed to delete.");
    }
  };

  const updateField = (key: keyof FormData, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="flex-col gap-lg">
      {/* Filter bar */}
      <div className="filter-bar">
        <input
          className="input input-search"
          placeholder="Search payee or notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All accounts</option>
          {accounts.map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          className="select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openCreate}>
          + New
        </button>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <span className="t-secondary" style={{ fontSize: "0.85rem" }}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          {filtered.length > 200 && " (showing first 200)"}
        </span>
      </div>

      {/* Table */}
      {display.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📒</div>
          <p>No transactions yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payee</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {display.map((tx) => {
                  const amt = tx.amount || 0;
                  const isDeleting = deletingId === tx.id;
                  return (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                        {fmtDate(tx.date)}
                      </td>
                      <td>
                        <span className="truncate" style={{ maxWidth: 180, display: "inline-block" }}>
                          {tx.payee_name || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="truncate t-secondary" style={{ maxWidth: 160, display: "inline-block", fontSize: "0.85rem" }}>
                          {catMap[tx.category] || "Uncategorized"}
                        </span>
                      </td>
                      <td>
                        <span className="truncate t-tertiary" style={{ maxWidth: 140, display: "inline-block", fontSize: "0.82rem" }}>
                          {acctMap[tx.account] || "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`t-mono ${amt >= 0 ? "t-positive" : "t-negative"}`} style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                          {fmtMoney(amt)}
                        </span>
                      </td>
                      <td>
                        {isDeleting ? (
                          <div className="flex gap-sm items-center">
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ minHeight: 32, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              onClick={() => handleDelete(tx.id)}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ minHeight: 32, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              onClick={() => setDeletingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-sm items-center">
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ minHeight: 32, padding: "0.25rem 0.5rem" }}
                              onClick={() => openEdit(tx)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ minHeight: 32, padding: "0.25rem 0.5rem" }}
                              onClick={() => setDeletingId(tx.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide panel */}
      {panelOpen && (
        <>
          <div className="slide-panel-overlay" onClick={closePanel} />
          <div className="slide-panel">
            <div className="slide-panel-header">
              <span className="t-heading">
                {editingTx ? "Edit Transaction" : "New Transaction"}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={closePanel}>
                ✕
              </button>
            </div>
            <div className="slide-panel-body">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account</label>
                <select
                  className="select"
                  value={form.account}
                  onChange={(e) => updateField("account", e.target.value)}
                >
                  <option value="">Select account…</option>
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payee</label>
                <input
                  className="input"
                  placeholder="Who was this to/from?"
                  value={form.payee_name}
                  onChange={(e) => updateField("payee_name", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="select"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  className="input t-mono"
                  type="number"
                  step="0.01"
                  placeholder="Negative = expense, positive = income"
                  value={form.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  className="input"
                  placeholder="Optional notes…"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </div>
            </div>
            <div className="slide-panel-footer">
              <button className="btn btn-ghost" onClick={closePanel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editingTx ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
