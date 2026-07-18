import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency, shiftMonth, monthLabel, startOfMonthFor, endOfMonthFor, isSameMonth } from '../utils/formatters';
import { TopBar } from './ui/TopBar';
import { Tabs } from './ui/Tabs';
import { SpendRing } from './ui/SpendRing';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Badge } from './ui/Badge';
import { TransactionRow } from './ui/TransactionRow';
import { Avatar } from './ui/Avatar';
import { EmptyState } from './ui/EmptyState';
import { ChevronRightIcon, ChevronDownIcon, PlusCircleIcon, WalletIcon, CogIcon } from './Icons';
import { categoryInitial } from '../utils/categories';

type TabKey = 'transactions' | 'categories' | 'merchants';
const MAX_ROWS = 200;

export default function Dashboard() {
  const [cursor, setCursor] = useState(() => new Date());
  const navigate = useNavigate();
  const { categories, getCategory } = useCategories();
  const [tab, setTab] = useState<TabKey>('transactions');

  const start = useMemo(() => startOfMonthFor(cursor), [cursor]);
  const end = useMemo(() => endOfMonthFor(cursor), [cursor]);
  const { transactions, deleteTransaction } = useTransactions(start, end);

  const handlePrev = useCallback(() => setCursor((c) => shiftMonth(c, -1)), []);
  const handleNext = useCallback(() => setCursor((c) => shiftMonth(c, 1)), []);
  const isCurrentMonth = isSameMonth(cursor, new Date());

  const stats = useMemo(() => {
    let expense = 0;
    let income = 0;
    const breakdown = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        expense += t.amount;
        breakdown.set(t.category, (breakdown.get(t.category) || 0) + t.amount);
      } else {
        income += t.amount;
      }
    }
    return { expense, income, net: income - expense, breakdown };
  }, [transactions]);

  const monthlyBudget = useMemo(
    () => categories.reduce((sum, c) => sum + (c.budget || 0), 0),
    [categories]
  );

  const sortedBreakdown = useMemo(
    () => Array.from(stats.breakdown.entries()).sort((a, b) => b[1] - a[1]),
    [stats.breakdown]
  );

  const merchants = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const key = t.description?.trim() || t.category;
      const cur = map.get(key) || { total: 0, count: 0 };
      cur.total += t.amount;
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [transactions]);

  const handleDelete = useCallback((id: number) => deleteTransaction(id), [deleteTransaction]);
  const rows = transactions.length > MAX_ROWS ? transactions.slice(0, MAX_ROWS) : transactions;

  const tabs = useMemo(
    () => [
      { key: 'transactions' as const, label: 'Transactions' },
      { key: 'categories' as const, label: 'Categories' },
      { key: 'merchants' as const, label: 'Merchants' },
    ],
    []
  );

  return (
    <div>
      <TopBar
        title="All transactions"
        subtitle={monthLabel(cursor)}
        trailing={
          <div className="flex items-center gap-1.5">
            <IconButton label="Settings" onClick={() => navigate('/settings')}>
              <CogIcon className="w-6 h-6" />
            </IconButton>
          </div>
        }
      />

      <div className="pt-4 w-full lg:max-w-2xl lg:mx-auto">
        {/* Month navigator */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button onClick={handlePrev} className="tap p-2 rounded-full text-tertiary hover:text-label active:scale-90">
            <ChevronDownIcon className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={() => !isCurrentMonth && setCursor(new Date())}
            className="tap min-w-[140px] text-center font-semibold text-label active:scale-95"
          >
            {monthLabel(cursor)}
          </button>
          <button onClick={handleNext} className="tap p-2 rounded-full text-tertiary hover:text-label active:scale-90">
            <ChevronDownIcon className="w-4 h-4 -rotate-90" />
          </button>
        </div>

        {/* Ring summary */}
        <Card className="flex flex-col items-center gap-2 mb-4">
          <SpendRing spent={stats.expense} budget={monthlyBudget} />
          <div className="grid grid-cols-2 gap-3 w-full mt-1">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-tertiary uppercase tracking-wide">Income</span>
              <span className="text-base font-bold text-success">{formatCurrency(stats.income)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-tertiary uppercase tracking-wide">Budget</span>
              {monthlyBudget > 0 ? (
                <span className="text-base font-bold text-label">{formatCurrency(monthlyBudget)}</span>
              ) : (
                <button
                  onClick={() => navigate('/budgets')}
                  className="tap text-accent text-sm font-semibold active:scale-95"
                >
                  Set monthly budget
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-separator/60 mb-2 px-4 sticky top-0 bg-canvas/90 backdrop-blur-xl z-20">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {tab === 'transactions' && (
              <TransactionsTab
                rows={rows}
                total={transactions.length}
                getCategory={getCategory}
                onDelete={handleDelete}
                onAdd={() => navigate('/add')}
              />
            )}

            {tab === 'categories' && (
              <CategoriesTab
                sortedBreakdown={sortedBreakdown}
                totalExpense={stats.expense}
                getCategory={getCategory}
                onCategoryBudget={() => navigate('/budgets')}
                empty={transactions.length === 0}
              />
            )}

            {tab === 'merchants' && (
              <MerchantsTab merchants={merchants} onAdd={() => navigate('/add')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

interface TransactionsTabProps {
  rows: import('../types').Transaction[];
  total: number;
  getCategory: (name: string) => import('../types').Category | undefined;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

function TransactionsTab({ rows, total, getCategory, onDelete, onAdd }: TransactionsTabProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<WalletIcon className="w-7 h-7" />}
        title="No transactions this month"
        subtitle="Add your first transaction to see it here."
        action={<Button onClick={onAdd} size="md"><PlusCircleIcon className="w-4 h-4 inline mr-1.5" />Add transaction</Button>}
      />
    );
  }
  return (
    <Card padded={false} className="px-3 divide-y divide-separator/50">
      {rows.map((t) => (
        <TransactionRow key={t.id} t={t} category={getCategory(t.category)} onDelete={onDelete} />
      ))}
      {total > rows.length && (
        <div className="py-3 text-center text-xs text-tertiary">
          +{total - rows.length} more this month
        </div>
      )}
    </Card>
  );
}

interface CategoriesTabProps {
  sortedBreakdown: [string, number][];
  totalExpense: number;
  getCategory: (name: string) => import('../types').Category | undefined;
  onCategoryBudget: () => void;
  empty: boolean;
}

function CategoriesTab({ sortedBreakdown, totalExpense, getCategory, onCategoryBudget, empty }: CategoriesTabProps) {
  const maxAmt = useMemo(() => (sortedBreakdown.length > 0 ? sortedBreakdown[0][1] : 0), [sortedBreakdown]);
  if (empty || sortedBreakdown.length === 0) {
    return (
      <EmptyState
        icon={<ChevronRightIcon className="w-7 h-7" />}
        title="No spending yet"
        subtitle="Your category breakdown appears once you log expenses."
      />
    );
  }
  return (
    <Card padded={false} className="px-3 py-2">
      {sortedBreakdown.map(([name, amount]) => {
        const cat = getCategory(name);
        const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        const widthPct = maxAmt > 0 ? (amount / maxAmt) * 100 : 0;
        return (
          <div key={name} className="py-2.5">
            <div className="flex items-center gap-3">
              <Avatar size="sm" color={cat?.color || '#64748b'}>
                {cat ? categoryInitial(cat.name) : '#'}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-label truncate">{name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-label">{formatCurrency(amount)}</span>
                    <span className="text-xs text-tertiary ml-2">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 mt-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${widthPct}%`, backgroundColor: cat?.color || 'rgb(var(--accent))', transition: 'width .3s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        onClick={onCategoryBudget}
        className="tap mt-1 w-full text-center text-xs text-accent font-semibold py-2 active:scale-95"
      >
        Set budgets →
      </button>
    </Card>
  );
}

interface MerchantsTabProps {
  merchants: { name: string; total: number; count: number }[];
  onAdd: () => void;
}

function MerchantsTab({ merchants, onAdd }: MerchantsTabProps) {
  const maxAmt = useMemo(() => (merchants.length > 0 ? merchants[0].total : 0), [merchants]);
  if (merchants.length === 0) {
    return (
      <EmptyState
        icon={<ChevronRightIcon className="w-7 h-7" />}
        title="No merchants tracked"
        subtitle="Expenses will be grouped by merchant here once added."
        action={<Button onClick={onAdd} size="md"><PlusCircleIcon className="w-4 h-4 inline mr-1.5" />Add expense</Button>}
      />
    );
  }
  return (
    <Card padded={false} className="px-3 py-2">
      {merchants.map((m) => {
        const widthPct = maxAmt > 0 ? (m.total / maxAmt) * 100 : 0;
        return (
          <div key={m.name} className="py-2.5">
            <div className="flex items-center gap-3">
              <Avatar size="sm" color="#64748b">{m.name.slice(0, 2).toUpperCase()}</Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-label truncate">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" size="xs">{m.count}</Badge>
                    <span className="text-sm font-bold text-label">{formatCurrency(m.total)}</span>
                  </div>
                </div>
                <div className="h-1.5 mt-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${widthPct}%`, transition: 'width .3s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}