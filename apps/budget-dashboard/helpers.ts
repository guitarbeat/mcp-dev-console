export function cents(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${(abs / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Alias used by redesigned tabs */
export const fmtMoney = cents;

export function centsInput(amount: number): string {
  return (Math.abs(amount) / 100).toFixed(2);
}

export function parseDollars(str: string): number {
  const n = parseFloat(str.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

export function pct(spent: number, budgeted: number): number {
  if (budgeted === 0) return spent === 0 ? 0 : 100;
  return Math.min(Math.round((Math.abs(spent) / Math.abs(budgeted)) * 100), 999);
}

export function barColor(spent: number, budgeted: number): string {
  const p = pct(spent, budgeted);
  if (p <= 75) return 'bg-success';
  if (p <= 100) return 'bg-warning';
  return 'bg-error';
}

export function monthLabel(m: string): string {
  const [y, mo] = m.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(mo)-1]} ${y}`;
}

/** Alias used by redesigned tabs */
export const fmtMonthLabel = monthLabel;

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function monthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

/** Format ISO date string to "Jan 15, 2025" */
export function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, d] = dateStr.split('-');
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

/** Returns a CSS class name for health-based coloring (ratio of spent/budgeted) */
export function healthColor(ratio: number): string {
  if (ratio <= 0.75) return 'health-safe';
  if (ratio <= 1.0) return 'health-caution';
  return 'health-danger';
}
