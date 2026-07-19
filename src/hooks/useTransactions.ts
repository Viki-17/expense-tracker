import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Transaction } from '../types';
import { today } from '../utils/formatters';

export function useTransactions(startDate?: string, endDate?: string) {
  const transactions = useLiveQuery(
    () => {
      if (startDate && endDate) {
        return db.getTransactionsInRange(startDate, endDate);
      }
      return db.transactions.orderBy('date').reverse().toArray();
    },
    [startDate, endDate]
  );

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    await db.transactions.add({ ...t, createdAt: new Date().toISOString() });
  }, []);

  const deleteTransaction = useCallback(async (id: number) => {
    await db.transactions.delete(id);
  }, []);

  const updateTransaction = useCallback(async (id: number, updates: Partial<Transaction>) => {
    await db.transactions.update(id, updates);
  }, []);

  return { transactions: transactions || [], addTransaction, deleteTransaction, updateTransaction };
}

export function useTransactionStats(startDate?: string, endDate?: string) {
  return useLiveQuery(
    async () => {
      const sd = startDate || '2000-01-01';
      const ed = endDate || today();
      const [totalExpense, totalIncome, breakdown, dailyTotals] = await Promise.all([
        db.getTotalByType('expense', sd, ed),
        db.getTotalByType('income', sd, ed),
        db.getCategoryBreakdown(sd, ed),
        db.getDailyTotals(sd, ed),
      ]);
      return { totalExpense, totalIncome, breakdown, dailyTotals, net: totalIncome - totalExpense };
    },
    [startDate, endDate]
  );
}
