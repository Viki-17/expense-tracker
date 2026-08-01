import { useState, useMemo } from 'react';
import { useCategories } from '../hooks/useCategories';
import type { Transaction } from '../types';
import { today } from '../utils/formatters';
import { CategoryIcon } from './Icons';

interface Props {
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initial?: Partial<Transaction>;
  compact?: boolean;
}

const INPUT_CLASS = "w-full px-4 py-3 bg-surface-2 border border-separator/60 rounded-xl text-sm text-label placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all";
const LABEL_CLASS = "block text-sm font-medium text-secondary mb-1.5";

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other'];
const EXCLUDED_FROM_EXPENSE = new Set(['Salary', 'Freelance', 'Investment']);

export default function TransactionForm({ onSubmit, initial, compact }: Props) {
  const { categories } = useCategories();
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [type, setType] = useState<'expense' | 'income' | 'neutral'>(initial?.type || 'expense');
  const [category, setCategory] = useState(initial?.category || 'Other');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(initial?.date || today());

  const filteredCategories = useMemo(() =>
    type === 'neutral'
      ? categories
      : categories.filter((c) =>
          type === 'income'
            ? INCOME_CATEGORIES.includes(c.name)
            : !EXCLUDED_FROM_EXPENSE.has(c.name)
        ),
    [categories, type]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    onSubmit({
      amount: numAmount,
      type,
      category,
      description: description || category,
      merchant: description || category,
      date,
      source: 'manual',
    });
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              type === 'expense'
                ? 'bg-expense-500 text-white shadow-sm'
                : 'bg-surface-2 text-secondary'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              type === 'income'
                ? 'bg-income-500 text-on-accent shadow-sm'
                : 'bg-surface-2 text-secondary'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setType('neutral')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              type === 'neutral'
                ? 'bg-tertiary text-canvas shadow-sm'
                : 'bg-surface-2 text-secondary'
            }`}
          >
            Neutral
          </button>
        </div>
        <div>
          <label className={LABEL_CLASS}>Amount (₹)</label>
          <input type="number" step="0.01" min="0" required className={INPUT_CLASS} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Category</label>
          <div className="grid grid-cols-3 gap-2">
            {filteredCategories.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs transition-all ${
                  category === c.name
                    ? 'bg-accent-soft ring-2 ring-accent/40 text-accent font-medium'
                    : 'bg-surface-2 text-secondary hover:bg-surface-3'
                }`}
              >
                <CategoryIcon name={c.name} className="w-5 h-5" />
                <span className="leading-tight text-center">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full py-3 bg-accent text-on-accent rounded-xl font-medium text-sm hover:brightness-110 transition-all">
          Add {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Neutral'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            type === 'expense'
              ? 'bg-expense-500 text-white shadow-lg shadow-expense-500/25'
              : 'bg-surface-2 border border-separator/60 text-secondary'
          }`}
        >
          💸 Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            type === 'income'
              ? 'bg-income-500 text-on-accent shadow-lg shadow-income-500/25'
              : 'bg-surface-2 border border-separator/60 text-secondary'
          }`}
        >
          💰 Income
        </button>
        <button
          type="button"
          onClick={() => setType('neutral')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            type === 'neutral'
              ? 'bg-tertiary text-canvas shadow-lg shadow-tertiary/25'
              : 'bg-surface-2 border border-separator/60 text-secondary'
          }`}
        >
          ⚪ Neutral
        </button>
      </div>

      <div>
        <label className={LABEL_CLASS}>Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary font-medium">₹</span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className={`${INPUT_CLASS} pl-8 text-lg font-medium`}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Category</label>
        <div className="grid grid-cols-4 gap-2">
          {filteredCategories.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCategory(c.name)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs transition-all ${
                category === c.name
                  ? 'bg-accent-soft ring-2 ring-accent/40 text-accent font-medium'
                  : 'bg-surface-2 text-secondary hover:bg-surface-3'
              }`}
            >
              <CategoryIcon name={c.name} className="w-5 h-5" />
              <span className="leading-tight text-center">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Description</label>
        <input className={INPUT_CLASS} placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className={LABEL_CLASS}>Date</label>
        <input type="date" required className={INPUT_CLASS} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <button
        type="submit"
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
          type === 'expense'
            ? 'bg-expense-500 hover:bg-expense-600 text-white shadow-lg shadow-expense-500/25'
            : type === 'income'
            ? 'bg-income-500 hover:bg-income-600 text-on-accent shadow-lg shadow-income-500/25'
            : 'bg-accent hover:brightness-110 text-on-accent shadow-lg shadow-accent/25'
        }`}
      >
        Add {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Neutral'}
      </button>
    </form>
  );
}
