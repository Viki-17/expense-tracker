import Dexie, { type Table } from 'dexie';
import type { Transaction, Category } from '../types';
import { matchesMerchant } from '../utils/categories';

export class ExpenseDB extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;

  constructor() {
    super('ExpenseTrackerDB');
    this.version(4).stores({
      transactions: '++id, type, category, date, amount, source, merchant, [type+date], [category+date]',
      categories: '++id, name',
    });
    this.on('populate', () => this.populate());
  }

  async populate() {
    await this.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

  async getTransactionsInRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return this.transactions
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .sortBy('date');
  }

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return this.transactions.where('category').equals(category).toArray();
  }

  async getTotalByType(type: 'expense' | 'income', startDate?: string, endDate?: string): Promise<number> {
    const sd = startDate || Dexie.minKey;
    const ed = endDate || Dexie.maxKey;
    const arr = await this.transactions
      .where('[type+date]')
      .between([type, sd], [type, ed], true, true)
      .toArray();
    return arr.reduce((sum, t) => sum + t.amount, 0);
  }

  async getCategoryBreakdown(startDate: string, endDate: string): Promise<{ category: string; total: number }[]> {
    const expenses = await this.transactions
      .where('[type+date]')
      .between(['expense', startDate], ['expense', endDate], true, true)
      .toArray();

    const breakdown: Record<string, number> = {};
    for (const t of expenses) {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    }
    return Object.entries(breakdown)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  async getMonthlyTotals(months?: number): Promise<{ month: string; expense: number; income: number }[]> {
    const maxMonths = months || 90;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - maxMonths + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sd = start.toISOString().split('T')[0];
    const ed = end.toISOString().split('T')[0];
    const transactions = await this.transactions
      .where('date')
      .between(sd, ed, true, true)
      .toArray();
    const map = new Map<string, { expense: number; income: number }>();
    for (const t of transactions) {
      const m = t.date.slice(0, 7);
      const cur = map.get(m) || { expense: 0, income: 0 };
      if (t.type === 'expense') cur.expense += t.amount;
      else cur.income += t.amount;
      map.set(m, cur);
    }
    const result: { month: string; expense: number; income: number }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const val = map.get(key);
      result.push({ month: key, expense: val?.expense || 0, income: val?.income || 0 });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }

  async getDailyTotals(startDate: string, endDate: string): Promise<{ date: string; expense: number; income: number }[]> {
    const transactions = await this.getTransactionsInRange(startDate, endDate);
    const map: Record<string, { date: string; expense: number; income: number }> = {};

    const dates = getDatesInRange(startDate, endDate);
    dates.forEach((d) => (map[d] = { date: d, expense: 0, income: 0 }));

    for (const t of transactions) {
      if (map[t.date]) {
        if (t.type === 'expense') map[t.date].expense += t.amount;
        else map[t.date].income += t.amount;
      }
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCategoryTransactionsInRange(category: string, startDate: string, endDate: string): Promise<Transaction[]> {
    return this.transactions
      .where('[category+date]')
      .between([category, startDate], [category, endDate], true, true)
      .reverse()
      .sortBy('date');
  }

  async getMerchantTransactionsInRange(merchant: string, startDate: string, endDate: string): Promise<Transaction[]> {
    const transactions = await this.transactions
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
    return transactions
      .filter((t) => matchesMerchant(t, merchant))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getCategoryMonthlyTotals(category: string, months: number): Promise<{ month: string; total: number }[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sd = start.toISOString().split('T')[0];
    const ed = end.toISOString().split('T')[0];

    const transactions = await this.transactions
      .where('[category+date]')
      .between([category, sd], [category, ed], true, true)
      .toArray();

    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const m = t.date.slice(0, 7);
      map.set(m, (map.get(m) || 0) + t.amount);
    }

    const result: { month: string; total: number }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: key, total: map.get(key) || 0 });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }

  async getMerchantMonthlyTotals(merchant: string, months: number): Promise<{ month: string; total: number }[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sd = start.toISOString().split('T')[0];
    const ed = end.toISOString().split('T')[0];

    const transactions = await this.transactions
      .where('date')
      .between(sd, ed, true, true)
      .toArray();

    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      if (!matchesMerchant(t, merchant)) continue;
      const m = t.date.slice(0, 7);
      map.set(m, (map.get(m) || 0) + t.amount);
    }

    const result: { month: string; total: number }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: key, total: map.get(key) || 0 });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  const limit = 365;
  let count = 0;
  while (current <= endDate && count < limit) {
    const y = current.getFullYear();
    const m = `${current.getMonth() + 1}`.padStart(2, '0');
    const d = `${current.getDate()}`.padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
}

export const db = new ExpenseDB();

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Food & Dining', icon: 'food', color: '#f97316' },
  { name: 'Shopping', icon: 'shopping', color: '#ec4899' },
  { name: 'Transport', icon: 'transport', color: '#3b82f6' },
  { name: 'Bills & Utilities', icon: 'bills', color: '#6366f1' },
  { name: 'Entertainment', icon: 'entertainment', color: '#8b5cf6' },
  { name: 'Groceries', icon: 'groceries', color: '#22c55e' },
  { name: 'Healthcare', icon: 'healthcare', color: '#ef4444' },
  { name: 'Education', icon: 'education', color: '#06b6d4' },
  { name: 'Travel', icon: 'travel', color: '#14b8a6' },
  { name: 'Rent', icon: 'rent', color: '#78716c' },
  { name: 'Investment', icon: 'investment', color: '#a855f7' },
  { name: 'Salary', icon: 'salary', color: '#22c55e' },
  { name: 'Freelance', icon: 'freelance', color: '#0ea5e9' },
  { name: 'Other', icon: 'other', color: '#64748b' },
];
