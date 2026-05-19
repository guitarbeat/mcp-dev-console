import { PresetCall } from '../types';

function getDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const today = new Date();
const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

export const PRESETS: PresetCall[] = [
  // Budget
  {
    id: 'this-month-spending',
    label: 'This Month Spending',
    description: 'Category breakdown for current month',
    icon: '📊',
    tool: 'spending-by-category',
    args: { startDate: getDateStr(thisMonthStart), endDate: getDateStr(today) },
    category: 'budget',
  },
  {
    id: 'last-month-spending',
    label: 'Last Month Spending',
    description: 'Category breakdown for last month',
    icon: '📅',
    tool: 'spending-by-category',
    args: { startDate: getDateStr(lastMonthStart), endDate: getDateStr(lastMonthEnd) },
    category: 'budget',
  },
  {
    id: 'monthly-summary-3m',
    label: '3-Month Summary',
    description: 'Income, expenses & savings rate',
    icon: '📈',
    tool: 'monthly-summary',
    args: { months: 3 },
    category: 'budget',
  },
  {
    id: 'monthly-summary-6m',
    label: '6-Month Summary',
    description: 'Longer-term financial trend',
    icon: '📉',
    tool: 'monthly-summary',
    args: { months: 6 },
    category: 'budget',
  },
  // Transactions
  {
    id: 'uncategorized',
    label: 'Uncategorized',
    description: 'All transactions missing a category',
    icon: '❓',
    tool: 'get-transactions',
    args: { accountId: 'all', categoryName: 'uncategorized', limit: 50 },
    category: 'transactions',
  },
  {
    id: 'recent-30',
    label: 'Recent 30 Days',
    description: 'Last 30 days across all accounts',
    icon: '🕐',
    tool: 'get-transactions',
    args: { accountId: 'all', startDate: getDateStr(thirtyDaysAgo), endDate: getDateStr(today), limit: 30 },
    category: 'transactions',
  },
  {
    id: 'this-month-txns',
    label: 'This Month',
    description: 'All transactions this month',
    icon: '📋',
    tool: 'get-transactions',
    args: { accountId: 'all', startDate: getDateStr(thisMonthStart), endDate: getDateStr(today), limit: 100 },
    category: 'transactions',
  },
  // Accounts & data
  {
    id: 'all-accounts',
    label: 'All Accounts',
    description: 'Accounts with current balances',
    icon: '🏦',
    tool: 'get-accounts',
    args: {},
    category: 'accounts',
  },
  {
    id: 'get-payees',
    label: 'All Payees',
    description: 'Full list of payees/merchants',
    icon: '👤',
    tool: 'get-payees',
    args: {},
    category: 'accounts',
  },
  {
    id: 'get-categories',
    label: 'Categories',
    description: 'All categories grouped',
    icon: '🏷️',
    tool: 'get-grouped-categories',
    args: {},
    category: 'accounts',
  },
  {
    id: 'get-rules',
    label: 'Rules',
    description: 'Auto-categorization rules',
    icon: '⚙️',
    tool: 'get-rules',
    args: {},
    category: 'server',
  },
  {
    id: 'get-schedules',
    label: 'Schedules',
    description: 'Recurring transaction schedules',
    icon: '🔁',
    tool: 'get-schedules',
    args: {},
    category: 'server',
  },
  {
    id: 'financial-insights',
    label: 'Financial Insights',
    description: 'AI-generated spending insights',
    icon: '💡',
    tool: 'get-financial-insights',
    args: {},
    category: 'budget',
  },
];
