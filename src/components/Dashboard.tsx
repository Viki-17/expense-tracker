import { useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStats } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency, startOfMonth, endOfMonth, today, startOfWeek } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useSwipe } from '../hooks/useSwipe';
import type { DateRange } from '../types';

const DATE_RANGES: DateRange[] = ['week', 'month', 'year', 'all'];

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>('month');
  const { categories } = useCategories();
  const navigate = useNavigate();
  const swipeRef = useRef<HTMLDivElement>(null);

  const handleSwipeLeft = useCallback(() => {
    setRange((prev) => {
      const idx = DATE_RANGES.indexOf(prev);
      return DATE_RANGES[Math.min(idx + 1, DATE_RANGES.length - 1)];
    });
  }, []);

  const handleSwipeRight = useCallback(() => {
    setRange((prev) => {
      const idx = DATE_RANGES.indexOf(prev);
      return DATE_RANGES[Math.max(idx - 1, 0)];
    });
  }, []);

  useSwipe(swipeRef, { onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight });

  const handleCardTap = useCallback((type: 'expense' | 'income') => {
    navigate(`/transactions?filter=${type}`);
  }, [navigate]);

  const rangeDates = useMemo(() => {
    switch (range) {
      case 'week': return { start: startOfWeek(), end: today() };
      case 'month': return { start: startOfMonth(), end: endOfMonth() };
      case 'year': return { start: `${new Date().getFullYear()}-01-01`, end: today() };
      default: return { start: '2000-01-01', end: today() };
    }
  }, [range]);

  const stats = useTransactionStats(rangeDates.start, rangeDates.end);

  const categoryMap = useMemo(() => {
    const map = new Map(categories.map((c) => [c.name, c]));
    return map;
  }, [categories]);

  const pieData = useMemo(() => {
    const breakdown = stats?.breakdown || [];
    return breakdown.map((b) => ({
      name: b.category,
      value: b.total,
      color: categoryMap.get(b.category)?.color || '#64748b',
    }));
  }, [stats?.breakdown, categoryMap]);

  const barData = useMemo(() => {
    const dailyTotals = stats?.dailyTotals || [];
    const capped = range === 'all' ? dailyTotals.slice(-90) : dailyTotals;
    return capped.map((d) => ({
      date: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`,
      expense: d.expense,
      income: d.income,
    }));
  }, [stats?.dailyTotals, range]);

  const formatTooltip = useCallback((value: number) => `₹${value.toLocaleString('en-IN')}`, []);

  if (!stats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-9 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { totalExpense, totalIncome, breakdown, net } = stats;

  return (
    <div className="space-y-5" ref={swipeRef}>
      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        {DATE_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              range === r ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            {r === 'all' ? 'All Time' : `This ${r}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Expenses" amount={totalExpense} color="text-expense-500" icon="💸" onClick={() => handleCardTap('expense')} />
        <SummaryCard label="Income" amount={totalIncome} color="text-income-500" icon="💰" onClick={() => handleCardTap('income')} />
        <SummaryCard label="Net" amount={net} color={net >= 0 ? 'text-income-500' : 'text-expense-500'} icon="📊" />
        <SummaryCard label="Transactions" amount={breakdown.reduce((s) => s + 1, 0)} color="text-primary-600" icon="📝" isCount />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 w-full">
                {pieData.slice(0, 6).map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-600 truncate">{d.name}</span>
                    <span className="text-gray-400 ml-auto">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">No expense data for this period</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Trend</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip formatter={formatTooltip} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={range === 'year' || range === 'all' ? 16 : 24} />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={range === 'year' || range === 'all' ? 16 : 24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No data for this period</p>
          )}
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {breakdown.slice(0, 5).map((b) => {
              const cat = categoryMap.get(b.category);
              const pct = totalExpense > 0 ? (b.total / totalExpense) * 100 : 0;
              return (
                <div key={b.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{cat?.icon || '📌'}</span>
                      <span className="text-sm font-medium text-gray-700">{b.category}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatCurrency(b.total)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat?.color || '#64748b' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, amount, color, icon, isCount, onClick }: {
  label: string; amount: number; color: string; icon: string; isCount?: boolean; onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-4 ${onClick ? 'cursor-pointer active:scale-[0.97] transition-transform hover:border-gray-200' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>
        {isCount ? amount : formatCurrency(Math.abs(amount))}
      </p>
    </div>
  );
}
