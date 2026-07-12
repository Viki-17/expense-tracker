import { useState, useMemo } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTransactionStats } from '../hooks/useTransactions';
import { startOfMonth, endOfMonth, formatCurrency, today } from '../utils/formatters';

export default function Budgets() {
  const { categories, updateCategory } = useCategories();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [budgetValue, setBudgetValue] = useState('');

  const rangeDates = useMemo(() => ({
    start: startOfMonth(),
    end: endOfMonth(),
  }), []);

  const stats = useTransactionStats(rangeDates.start, rangeDates.end);

  const expenseCategories = categories.filter((c) =>
    !['Salary', 'Freelance', 'Investment'].includes(c.name)
  );

  const handleSetBudget = async (id: number) => {
    const amount = parseFloat(budgetValue);
    if (!amount || amount <= 0) return;
    await updateCategory(id, { budget: amount });
    setEditingId(null);
    setBudgetValue('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Monthly Budgets — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </h3>
        <p className="text-xs text-gray-400 -mt-3 mb-4">
          Set spending limits for each category to track your expenses better.
        </p>

        <div className="space-y-3">
          {expenseCategories.map((cat) => {
            const spent = stats?.breakdown.find((b) => b.category === cat.name)?.total || 0;
            const budgeted = cat.budget || 0;
            const remaining = budgeted - spent;
            const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            const isOverBudget = budgeted > 0 && spent > budgeted;
            const isNearBudget = budgeted > 0 && pct >= 80 && !isOverBudget;

            return (
              <div key={cat.id || cat.name} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">₹</span>
                        <input
                          type="number"
                          className="w-20 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          value={budgetValue}
                          onChange={(e) => setBudgetValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSetBudget(cat.id!)}
                          placeholder="Budget"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSetBudget(cat.id!)}
                          className="text-xs px-2 py-1 bg-primary-500 text-white rounded-lg"
                        >
                          Set
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(cat.id!);
                          setBudgetValue(cat.budget?.toString() || '');
                        }}
                        className="text-xs px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {budgeted > 0 ? formatCurrency(budgeted) : 'Set Budget'}
                      </button>
                    )}
                  </div>
                </div>

                {budgeted > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        Spent {formatCurrency(spent)} of {formatCurrency(budgeted)}
                      </span>
                      <span className={`text-xs font-medium ${
                        isOverBudget ? 'text-expense-500' : isNearBudget ? 'text-orange-500' : 'text-gray-500'
                      }`}>
                        {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget ? 'bg-expense-500' : isNearBudget ? 'bg-orange-400' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    {isOverBudget && (
                      <p className="text-xs text-expense-500 mt-1">⚠ Over budget!</p>
                    )}
                    {isNearBudget && !isOverBudget && (
                      <p className="text-xs text-orange-500 mt-1">Almost at limit</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {expenseCategories.every((c) => !c.budget) && (
          <div className="text-center py-10">
            <span className="text-4xl">🎯</span>
            <p className="text-gray-500 font-medium mt-2">No budgets set yet</p>
            <p className="text-gray-400 text-sm">Tap "Set Budget" on any category to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
