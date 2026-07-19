import { useState, useMemo, useCallback } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTransactionStats } from '../hooks/useTransactions';
import { startOfMonth, endOfMonth, formatCurrency, monthLabel } from '../utils/formatters';
import { TopBar } from '../components/ui/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { CategoryIcon } from '../components/Icons';

const INCOME_CATEGORIES_SET = new Set(['Salary', 'Freelance', 'Investment']);

export default function Budgets() {
  const { categories, updateCategory } = useCategories();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [budgetValue, setBudgetValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const rangeDates = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const start = `${selectedMonth}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    return { start, end: `${selectedMonth}-${String(lastDay).padStart(2, '0')}`, date: d };
  }, [selectedMonth]);

  const stats = useTransactionStats(rangeDates.start, rangeDates.end);

  const expenseCategories = useMemo(
    () => categories.filter((c) => !INCOME_CATEGORIES_SET.has(c.name)),
    [categories]
  );

  const breakdownMap = useMemo(() => {
    const map = new Map<string, number>();
    if (stats?.breakdown) for (const b of stats.breakdown) map.set(b.category, b.total);
    return map;
  }, [stats?.breakdown]);

  const handleSetBudget = useCallback(
    async (id: number) => {
      const amount = parseFloat(budgetValue);
      if (!amount || amount <= 0) return;
      await updateCategory(id, { budget: amount });
      setEditingId(null);
      setBudgetValue('');
    },
    [budgetValue, updateCategory]
  );

  const handleStartEdit = useCallback((id: number, currentBudget: string | number | undefined) => {
    setEditingId(id);
    setBudgetValue(currentBudget?.toString() || '');
  }, []);

  const handlePrevMonth = useCallback(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, [selectedMonth]);

  const monthStr = useMemo(() => monthLabel(rangeDates.date), [rangeDates.date]);

  return (
    <div>
      <TopBar
        title="Budgets"
        subtitle={monthStr}
      />
      <div className="px-4 max-w-2xl mx-auto w-full pt-4 space-y-4" style={{ paddingBottom: 'calc(var(--sab) + 1rem)' }}>
        <div className="flex items-center justify-between">
          <button onClick={handlePrevMonth} className="tap p-1.5 -ml-1.5 rounded-lg text-secondary hover:text-label active:scale-90">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-label">{monthStr}</span>
          <button onClick={handleNextMonth} className="tap p-1.5 -mr-1.5 rounded-lg text-secondary hover:text-label active:scale-90">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <Card>
          <p className="text-xs text-tertiary">
            Set spending limits for each category to track your expenses better.
          </p>
        </Card>

        <div className="space-y-3">
          {expenseCategories.map((cat) => {
            const spent = breakdownMap.get(cat.name) || 0;
            const budgeted = cat.budget || 0;
            const remaining = budgeted - spent;
            const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            const isOverBudget = budgeted > 0 && spent > budgeted;
            const isNearBudget = budgeted > 0 && pct >= 80 && !isOverBudget;

            return (
              <Card key={cat.id || cat.name}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: `${cat.color || '#64748b'}26`, color: cat.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat.name} className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-label">{cat.name}</span>
                      <p className="text-xs text-tertiary">{formatCurrency(spent)} spent</p>
                    </div>
                  </div>
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-tertiary text-xs">₹</span>
                      <Input
                        type="number"
                        className="!w-20 !py-1 !px-2 text-sm font-bold"
                        value={budgetValue}
                        onChange={(e) => setBudgetValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSetBudget(cat.id!)}
                        placeholder="Budget"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSetBudget(cat.id!)}>
                        Set
                      </Button>
                      <button onClick={() => setEditingId(null)} className="tap text-tertiary text-xs px-2">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(cat.id!, cat.budget)}
                      className="tap text-xs px-3 py-1.5 bg-surface-2 text-secondary rounded-lg hover:text-label active:scale-95 transition-transform"
                    >
                      {budgeted > 0 ? formatCurrency(budgeted) : 'Set'}
                    </button>
                  )}
                </div>

                {budgeted > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-tertiary">
                        Spent {formatCurrency(spent)} of {formatCurrency(budgeted)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          isOverBudget ? 'text-danger' : isNearBudget ? 'text-warning' : 'text-secondary'
                        }`}
                      >
                        {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: isOverBudget
                            ? 'rgb(var(--danger))'
                            : isNearBudget
                            ? 'rgb(var(--warning))'
                            : cat.color || 'rgb(var(--accent))',
                        }}
                      />
                    </div>
                    {isOverBudget && <p className="text-xs text-danger mt-1.5">Over budget</p>}
                    {isNearBudget && !isOverBudget && <p className="text-xs text-warning mt-1.5">Almost at limit</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {expenseCategories.every((c) => !c.budget) && (
          <Card className="text-center">
            <p className="text-label font-semibold">No budgets set yet</p>
            <p className="text-tertiary text-sm mt-1">Tap "Set" on any category to start tracking.</p>
          </Card>
        )}
      </div>
    </div>
  );
}