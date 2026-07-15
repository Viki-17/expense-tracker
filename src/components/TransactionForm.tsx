import { useState, useMemo } from 'react';
import { useCategories } from '../hooks/useCategories';
import type { Transaction } from '../types';
import { today } from '../utils/formatters';

interface Props {
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initial?: Partial<Transaction>;
  compact?: boolean;
}

const INPUT_CLASS = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-1.5";

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other'];
const EXCLUDED_FROM_EXPENSE = new Set(['Salary', 'Freelance', 'Investment']);

export default function TransactionForm({ onSubmit, initial, compact }: Props) {
  const { categories } = useCategories();
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [type, setType] = useState<'expense' | 'income'>(initial?.type || 'expense');
  const [category, setCategory] = useState(initial?.category || 'Other');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(initial?.date || today());

  const filteredCategories = useMemo(() =>
    categories.filter((c) =>
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
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              type === 'income'
                ? 'bg-income-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Income
          </button>
        </div>
        <div>
          <label className={LABEL_CLASS}>Amount (₹)</label>
          <input type="number" step="0.01" min="0" required className={INPUT_CLASS} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Category</label>
          <select className={INPUT_CLASS} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select...</option>
            {filteredCategories.map((c) => (
              <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors">
          Add {type === 'expense' ? 'Expense' : 'Income'}
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
              : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          💸 Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            type === 'income'
              ? 'bg-income-500 text-white shadow-lg shadow-income-500/25'
              : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          💰 Income
        </button>
      </div>

      <div>
        <label className={LABEL_CLASS}>Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
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
                  ? 'bg-primary-50 ring-2 ring-primary-500/30 text-primary-700 font-medium'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{c.icon}</span>
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
        className={`w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all ${
          type === 'expense'
            ? 'bg-expense-500 hover:bg-expense-600 shadow-lg shadow-expense-500/25'
            : 'bg-income-500 hover:bg-income-600 shadow-lg shadow-income-500/25'
        }`}
      >
        Add {type === 'expense' ? 'Expense' : 'Income'}
      </button>
    </form>
  );
}
