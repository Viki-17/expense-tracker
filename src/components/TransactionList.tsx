import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency, formatDate, formatDateShort } from '../utils/formatters';
import { TrashIcon, ArrowDownIcon, ArrowUpIcon } from './Icons';
import type { SortField, SortDirection } from '../types';

export default function TransactionList() {
  const { transactions, deleteTransaction } = useTransactions();
  const { getCategory } = useCategories();
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const filtered = transactions
    .filter((t) => filter === 'all' || t.type === filter)
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      if (sortField === 'date') return (a.date.localeCompare(b.date)) * dir;
      return (a.amount - b.amount) * dir;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const total = filtered.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-gray-500 font-medium">No transactions yet</p>
        <p className="text-gray-400 text-sm mt-1">Add your first transaction to get started</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters & Summary */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['all', 'expense', 'income'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="text-sm">
          <span className={`font-semibold ${total >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
            {formatCurrency(Math.abs(total))}
          </span>
          <span className="text-gray-400 text-xs ml-1">{total >= 0 ? 'net gain' : 'net spend'}</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="hidden sm:grid grid-cols-[1fr_100px_40px] gap-3 px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
        <button onClick={() => toggleSort('date')} className="text-left flex items-center gap-1 hover:text-gray-700">
          Date {sortField === 'date' && (sortDir === 'desc' ? '↓' : '↑')}
        </button>
        <button onClick={() => toggleSort('amount')} className="text-right flex items-center justify-end gap-1 hover:text-gray-700">
          Amount {sortField === 'amount' && (sortDir === 'desc' ? '↓' : '↑')}
        </button>
        <span></span>
      </div>

      {/* Transaction items */}
      <div className="space-y-1.5">
        {filtered.map((t) => {
          const cat = getCategory(t.category);
          const isExpense = t.type === 'expense';
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${cat?.color || '#64748b'}15` }}
              >
                {cat?.icon || '📌'}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {t.description || t.category}
                  {t.source === 'sms' && <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">SMS</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{formatDateShort(t.date)}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t.category}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold ${isExpense ? 'text-expense-500' : 'text-income-500'}`}>
                  {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={() => t.id && deleteTransaction(t.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No {filter} transactions found</p>
      )}
    </div>
  );
}
