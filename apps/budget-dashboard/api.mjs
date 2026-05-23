// Polyfill navigator BEFORE any imports that depend on it
// Must use dynamic import() because static imports are hoisted and run first
import fs from 'fs';

globalThis.navigator = { platform: 'linux', userAgent: '', language: 'en' };

const { default: api } = await import('@actual-app/api');

const SERVER_URL = 'https://actual.alw.lol';
const PASSWORD = 'ninI0112@';
const SYNC_ID = '6e1b2cfb-be2c-4b9c-b868-dcd1023570d0';
const DATA_DIR = '/tmp/actual-api-data';
const OUTPUT_FILE = '/tmp/actual-api-result.json';

// Suppress library logging to stdout
console.log = () => {};
console.warn = () => {};

async function main() {
  const cmd = JSON.parse(process.argv[2]);
  const { action, params = {} } = cmd;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  await api.init({ dataDir: DATA_DIR, serverURL: SERVER_URL, password: PASSWORD });
  await api.downloadBudget(SYNC_ID, { password: null });

  let result;

  switch (action) {
    case 'getAll': {
      const accounts = await api.getAccounts();
      const categories = await api.getCategories();
      const categoryGroups = await api.getCategoryGroups();
      const payees = await api.getPayees();
      const allMonths = await api.getBudgetMonths();
      // Find current month index and grab 18 past + 3 future
      const now = new Date();
      const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const curIdx = allMonths.indexOf(curKey);
      const startIdx = Math.max(0, (curIdx >= 0 ? curIdx : allMonths.length) - 18);
      const endIdx = Math.min(allMonths.length, (curIdx >= 0 ? curIdx : allMonths.length - 1) + 4);
      const months = allMonths.slice(startIdx, endIdx);
      const budgetData = {};
      for (const m of months) {
        budgetData[m] = await api.getBudgetMonth(m);
      }
      result = { accounts, categories, categoryGroups, payees, months, budgetData };
      break;
    }
    case 'getTransactions': {
      const { accountId, startDate, endDate } = params;
      if (accountId === '__ALL__') {
        // Fetch transactions from all open accounts
        const accts = await api.getAccounts();
        const open = accts.filter(a => !a.closed);
        const all = [];
        for (const a of open) {
          const txns = await api.getTransactions(a.id, startDate, endDate);
          for (const t of txns) { t._accountId = a.id; t._accountName = a.name; }
          all.push(...txns);
        }
        result = all;
      } else {
        result = await api.getTransactions(accountId, startDate, endDate);
      }
      break;
    }
    case 'createTransaction': {
      const txn = params.transaction;
      result = await api.importTransactions(params.accountId, [txn]);
      break;
    }
    case 'updateTransaction': {
      result = await api.updateTransaction(params.id, params.fields);
      break;
    }
    case 'deleteTransaction': {
      result = await api.deleteTransaction(params.id);
      break;
    }
    case 'setBudget': {
      result = await api.setBudgetAmount(params.month, params.categoryId, params.amount);
      break;
    }
    default:
      result = { error: `Unknown action: ${action}` };
  }

  await api.shutdown();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result));
}

main().catch(async err => {
  try { await api.shutdown(); } catch (_) {}
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ error: err.message }));
  process.exit(1);
});
