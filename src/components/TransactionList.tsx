import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../utils/formatters';
import { useSwipe } from '../hooks/useSwipe';
import { TrashIcon } from './Icons';
import type { SortField, SortDirection } from '../types';

const FILTERS = ['all', 'expense', 'income'] as const;
type Filter = (typeof FILTERS)[number];

const ROW_HEIGHT = 72;
const LIST_OVERSCAN = 5;

export default function TransactionList() {
  const { transactions, deleteTransaction } = useTransactions();
  const { getCategory } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const [filter, setFilter] = useState<Filter>(
    filterParam === 'expense' || filterParam === 'income' ? filterParam : 'all'
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipeLeft = useCallback(() => {
    setFilter((prev) => {
      const idx = FILTERS.indexOf(prev);
      const next = FILTERS[Math.min(idx + 1, FILTERS.length - 1)];
      setSearchParams(next === 'all' ? {} : { filter: next });
      return next;
    });
  }, [setSearchParams]);

  const handleSwipeRight = useCallback(() => {
    setFilter((prev) => {
      const idx = FILTERS.indexOf(prev);
      const next = FILTERS[Math.max(idx - 1, 0)];
      setSearchParams(next === 'all' ? {} : { filter: next });
      return next;
    });
  }, [setSearchParams]);

  useSwipe(containerRef, { onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight });

  useEffect(() => {
    if (filterParam === 'expense' || filterParam === 'income') {
      setFilter(filterParam);
    } else if (!filterParam) {
      setFilter('all');
    }
  }, [filterParam]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [listHeight, setListHeight] = useState(400);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const available = containerRef.current.clientHeight - 80;
        setListHeight(Math.max(available, 200));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const filtered = useMemo(() =>
    transactions
      .filter((t) => filter === 'all' || t.type === filter)
      .sort((a, b) => {
        const dir = sortDir === 'desc' ? -1 : 1;
        if (sortField === 'date') return a.date.localeCompare(b.date) * dir;
        return (a.amount - b.amount) * dir;
      }),
    [transactions, filter, sortField, sortDir]
  );

  const total = useMemo(() =>
    filtered.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0),
    [filtered]
  );

  const toggleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
        return prev;
      }
      setSortDir('desc');
      return field;
    });
  }, []);

  const handleDelete = useCallback((id: number | undefined) => {
    if (id) deleteTransaction(id);
  }, [deleteTransaction]);

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
    <div className="flex flex-col h-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-4 gap-2 shrink-0">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                if (f === 'all') {
                  setSearchParams({});
                } else {
                  setSearchParams({ filter: f });
                }
              }}
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

      <div className="hidden sm:grid grid-cols-[1fr_100px_40px] gap-3 px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider shrink-0">
        <button onClick={() => toggleSort('date')} className="text-left flex items-center gap-1 hover:text-gray-700">
          Date {sortField === 'date' && (sortDir === 'desc' ? '↓' : '↑')}
        </button>
        <button onClick={() => toggleSort('amount')} className="text-right flex items-center justify-end gap-1 hover:text-gray-700">
          Amount {sortField === 'amount' && (sortDir === 'desc' ? '↓' : '↑')}
        </button>
        <span></span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No {filter} transactions found</p>
      ) : (
        <div className="space-y-1.5 overflow-y-auto flex-1" style={{ maxHeight: listHeight }}>
          {filtered.map((t) => {
            const cat = getCategory(t.category);
            const isExpense = t.type === 'expense';
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${cat?.color || '#64748b'}15` }}
                >
                  {cat?.icon || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {t.description || t.category}
                    {t.source === 'sms' && <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">SMS</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{t.date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t.category}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${isExpense ? 'text-expense-500' : 'text-income-500'}`}>
                    {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
