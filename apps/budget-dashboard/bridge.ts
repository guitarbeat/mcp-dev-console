// Bridge wrapper for Actual Budget API calls via window.tasklet.runCommand
// The API script runs in /tmp/ab and writes JSON results to /tmp/actual-api-result.json

import type { BudgetData, BudgetMonth, MonthData, CategoryMonth } from './types';
export type { BudgetData };

export interface ApiResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function callActualApi(action: string, params: Record<string, unknown> = {}): Promise<ApiResult> {
  const payload = JSON.stringify({ action, params });
  // Escape single quotes for shell
  const escaped = payload.replace(/'/g, "'\\''");

  // Ensure /tmp/ab exists with ESM-compatible package.json and @actual-app/api installed
  const setup = `
    if [ ! -d /tmp/ab/node_modules/@actual-app/api ]; then
      mkdir -p /tmp/ab
      echo '{"type":"module","dependencies":{"@actual-app/api":"^26.3.0"}}' > /tmp/ab/package.json
      cd /tmp/ab && npm install --silent 2>&1
    fi
  `;

  // Copy api script, run it, then read the result file
  const cmd = `${setup}
    cp /agent/home/apps/budget-dashboard/api.mjs /tmp/ab/api.mjs
    cd /tmp/ab && node api.mjs '${escaped}' 2>&1
    cat /tmp/actual-api-result.json`;

  const result = await window.tasklet.runCommand(cmd, 120);

  if (result.exitCode !== 0) {
    const log = result.log.trim();
    const jsonMatch = log.match(/\n(\{[\s\S]*\})$/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.error) return { success: false, error: parsed.error };
      } catch {}
    }
    return { success: false, error: log.slice(-500) };
  }

  const log = result.log.trim();
  const lastBrace = log.lastIndexOf('}');
  if (lastBrace < 0) {
    return { success: false, error: 'No JSON in API response' };
  }

  let depth = 0;
  let jsonStart = lastBrace;
  for (let i = lastBrace; i >= 0; i--) {
    if (log[i] === '}') depth++;
    if (log[i] === '{') depth--;
    if (depth === 0) { jsonStart = i; break; }
  }

  const jsonStr = log.substring(jsonStart, lastBrace + 1);
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.error) return { success: false, error: parsed.error };
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: 'Failed to parse API response' };
  }
}

/** Flatten BudgetMonth categoryGroups into a flat CategoryMonth[] */
function flattenMonth(bm: BudgetMonth): MonthData {
  const cats: CategoryMonth[] = [];
  for (const g of (bm.categoryGroups || [])) {
    for (const c of (g.categories || [])) {
      cats.push({
        id: c.id,
        name: c.name,
        budgeted: c.budgeted || 0,
        spent: c.spent || 0,
        balance: c.balance || 0,
        group_id: c.group_id || g.id,
      });
    }
  }
  return { month: bm.month, categories: cats };
}

/** Load all budget data in one shot via the getAll API action */
export async function loadAllData(): Promise<BudgetData> {
  const res = await callActualApi('getAll', {});
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to load budget data');
  }
  const d = res.data as any;

  // Transform budgetData (record of BudgetMonth) into MonthData[]
  const rawMonths: string[] = d.months || [];
  const budgetData: Record<string, BudgetMonth> = d.budgetData || {};
  const months: MonthData[] = rawMonths.map((m: string) => {
    const bm = budgetData[m];
    return bm ? flattenMonth(bm) : { month: m, categories: [] };
  });

  return {
    accounts: d.accounts || [],
    categories: d.categories || [],
    categoryGroups: d.categoryGroups || [],
    payees: d.payees || [],
    transactions: d.transactions || [],
    months,
    budgetData,
  };
}

/** Save (create or update) a transaction */
export async function saveTransaction(tx: Record<string, unknown>): Promise<void> {
  const action = tx.id ? 'updateTransaction' : 'addTransaction';
  const res = await callActualApi(action, tx);
  if (!res.success) throw new Error(res.error || 'Failed to save transaction');
}

/** Delete a transaction by ID */
export async function deleteTransaction(id: string): Promise<void> {
  const res = await callActualApi('deleteTransaction', { id });
  if (!res.success) throw new Error(res.error || 'Failed to delete transaction');
}

/** Set a budget amount for a category in a given month */
export async function setBudgetAmount(month: string, categoryId: string, amount: number): Promise<void> {
  const res = await callActualApi('setBudgetAmount', { month, categoryId, amount });
  if (!res.success) throw new Error(res.error || 'Failed to set budget');
}
