import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { db } from '../db';
import type { Transaction } from '../types';
import { today } from '../utils/formatters';
import { TopBar } from '../components/ui/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { ArrowLeftIcon, CategoryIcon } from '../components/Icons';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other'];
const EXCLUDED_FROM_EXPENSE = new Set(['Salary', 'Freelance', 'Investment']);

export default function AddTransaction() {
  const { categories } = useCategories();
  const navigate = useNavigate();
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    await db.transactions.add({ ...t, createdAt: new Date().toISOString() });
  }, []);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today());

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        type === 'income' ? INCOME_CATEGORIES.includes(c.name) : !EXCLUDED_FROM_EXPENSE.has(c.name)
      ),
    [categories, type]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const num = parseFloat(amount);
      if (!num || num <= 0) return;
      addTransaction({
        amount: num,
        type,
        category,
        description: description || category,
        date,
        source: 'manual',
      });
      navigate('/transactions');
    },
    [addTransaction, amount, type, category, description, date, navigate]
  );

  return (
    <div className="flex flex-col min-h-full safe-top">
      <TopBar
        title="Add transaction"
        leading={
          <IconButton label="Back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="w-5 h-5" />
          </IconButton>
        }
      />

      <form onSubmit={handleSubmit} className="px-4 max-w-xl mx-auto w-full pt-4 space-y-5" style={{ paddingBottom: 'calc(var(--sab) + 1rem)' }}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`tap py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              type === 'expense' ? 'bg-danger text-white shadow-card' : 'bg-surface-2 text-secondary'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`tap py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              type === 'income' ? 'bg-success text-white shadow-card' : 'bg-surface-2 text-secondary'
            }`}
          >
            Income
          </button>
        </div>

        <Card className="space-y-4">
          <div>
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary font-semibold text-lg">₹</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 text-lg font-semibold"
              />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((c) => {
                const active = category === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`tap flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl text-[11px] font-medium transition-all ${
                      active ? 'bg-accent-soft text-accent ring-2 ring-accent/40' : 'bg-surface-2 text-secondary'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${c.color || '#64748b'}26`, color: c.color || '#64748b' }}
                    >
                      <CategoryIcon name={c.name} className="w-4 h-4" />
                    </span>
                    <span className="leading-tight text-center">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Date</Label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </Card>

        <div className="max-w-xl mx-auto w-full">
          <Button type="submit" full size="lg">
            Add {type === 'expense' ? 'expense' : 'income'}
          </Button>
        </div>
      </form>
    </div>
  );
}