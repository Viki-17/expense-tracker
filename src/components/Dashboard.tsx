import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useSwipe } from '../hooks/useSwipe';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { db } from '../db';
import { formatCurrency, monthLabel } from '../utils/formatters';
import { parseMultipleSMS } from '../utils/smsParser';
import { getAutoImportMerchants, addAutoImportMerchant } from '../utils/autoImport';
import { isNativePlatform } from '../utils/platform';
import SmsReader from '../plugins/sms-reader';
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
import { MonthBarChart } from './ui/MonthBarChart';
import { CategoryDonutChart } from './ui/CategoryDonutChart';
import { TransactionDetailModal } from './TransactionDetailModal';
import { ChevronDownIcon, CogIcon, PlusCircleIcon, WalletIcon, CategoryIcon } from './Icons';

type TabKey = 'transactions' | 'categories' | 'merchants';
const MAX_ROWS = 200;
const TAB_ORDER: TabKey[] = ['transactions', 'categories', 'merchants'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { categories, getCategory } = useCategories();
  const [tab, setTab] = useState<TabKey>(() => {
    const saved = sessionStorage.getItem('dashboardTab') as TabKey | null;
    return saved || 'transactions';
  });
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyTotals, setMonthlyTotals] = useState<
    { month: string; expense: number; income: number }[]
  >([]);

  useEffect(() => {
    db.getMonthlyTotals(90).then(setMonthlyTotals);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('dashboardTab', tab);
  }, [tab]);

  const cursor = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [selectedMonth]);

  const start = useMemo(
    () => `${selectedMonth}-01`,
    [selectedMonth]
  );
  const end = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
  }, [selectedMonth]);
  const { transactions, deleteTransaction, updateTransaction } = useTransactions(start, end);

  const handleSelectMonth = useCallback((month: string) => {
    setSelectedMonth(month);
    setChartOpen(false);
  }, []);

  const toggleChart = useCallback(() => setChartOpen((o) => !o), []);

  const stats = useMemo(() => {
    let expense = 0;
    let income = 0;
    const breakdown = new Map<string, number>();
    const countMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        expense += t.amount;
        breakdown.set(t.category, (breakdown.get(t.category) || 0) + t.amount);
        countMap.set(t.category, (countMap.get(t.category) || 0) + 1);
      } else if (t.type === 'income') {
        income += t.amount;
      }
    }
    return { expense, income, net: income - expense, breakdown, countMap };
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
      const key = t.merchant || t.description?.trim() || t.category;
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

  const handleDelete = useCallback(
    (id: number) => deleteTransaction(id),
    [deleteTransaction]
  );

  const handleUpdateCategory = useCallback(
    (id: number, category: string) => updateTransaction(id, { category }),
    [updateTransaction]
  );
  const rows = useMemo(
    () => transactions.length > MAX_ROWS ? transactions.slice(0, MAX_ROWS) : transactions,
    [transactions]
  );

  const goToAdd = useCallback(() => navigate('/add'), [navigate]);
  const goToBudgets = useCallback(() => navigate('/budgets'), [navigate]);

  const tabs = useMemo(
    () => [
      { key: 'transactions' as const, label: 'Transactions' },
      { key: 'categories' as const, label: 'Categories' },
      { key: 'merchants' as const, label: 'Merchants' },
    ],
    []
  );

  const currentIdx = TAB_ORDER.indexOf(tab);

  const handleSwipeLeft = useCallback(() => {
    if (currentIdx < TAB_ORDER.length - 1)
      setTab(TAB_ORDER[currentIdx + 1]);
  }, [currentIdx]);

  const handleSwipeRight = useCallback(() => {
    if (currentIdx > 0) setTab(TAB_ORDER[currentIdx - 1]);
  }, [currentIdx]);

  const swipeRef = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const selectedMonthLabel = useMemo(() => monthLabel(cursor), [cursor]);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const scanForNewSMS = useCallback(async () => {
    if (!isNativePlatform()) {
      setToast('SMS scanning is only available on Android');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      const perm = await SmsReader.checkPermission();
      if (!perm.granted) {
        setToast('SMS permission not granted. Grant it in Settings → SMS Import.');
        setTimeout(() => setToast(null), 4000);
        return;
      }
    } catch {
      setToast('Could not check SMS permission');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const autoMerchants = getAutoImportMerchants().map((m) => m.toLowerCase());
    try {
      const [smsRes, existingRes] = await Promise.all([
        SmsReader.getMessages({ maxCount: 500 }),
        db.transactions.where('source').equals('sms').toArray(),
      ]);
      const existingTexts = new Set(existingRes.map((t) => t.smsText).filter(Boolean) as string[]);
      const bodies = smsRes.messages.map((m) => m.body);
      const parsed = parseMultipleSMS(bodies);

      let autoImported = 0;
      let newFound = 0;

      for (const result of parsed) {
        if (existingTexts.has(result.raw)) continue;

        const merchantMatch = result.merchant && autoMerchants.includes(result.merchant.toLowerCase());
        if (merchantMatch) {
          const sameDay = await db.transactions
            .where('[type+date]')
            .equals([result.type, result.date])
            .toArray();
          if (!sameDay.find((t) => t.amount === result.amount)) {
            await db.transactions.add({
              amount: result.amount,
              type: result.type,
              category: result.category,
              description: result.description,
              merchant: result.merchant,
              date: result.date,
              source: 'sms',
              smsText: result.raw,
              createdAt: new Date().toISOString(),
            });
            addAutoImportMerchant(result.merchant);
          }
          autoImported++;
        } else {
          newFound++;
        }
      }

      const parts: string[] = [];
      if (autoImported > 0) parts.push(`${autoImported} auto-imported`);
      if (newFound > 0) parts.push(`${newFound} new`);
      setToast(
        parts.length > 0
          ? `${parts.join(', ')} transaction${autoImported + newFound > 1 ? 's' : ''} found.`
          : 'No new transactions found.'
      );
    } catch (e: any) {
      setToast(`Scan failed: ${e.message || 'Unknown error'}`);
    }
    setTimeout(() => setToast(null), 3000);
  }, []);

  const { pullDistance, refreshing, setRefreshing } = usePullToRefresh(dashboardRef, {
    onRefresh: scanForNewSMS,
    threshold: 50,
  });

  useEffect(() => {
    if (refreshing && toast !== null) {
      setRefreshing(false);
    }
  }, [refreshing, toast, setRefreshing]);

  return (
    <div
      ref={(el) => {
        (dashboardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (swipeRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <TopBar
        title="All transactions"
        subtitle={
          <button
            onClick={toggleChart}
            className="tap inline-flex items-center gap-1 active:scale-95"
          >
            {selectedMonthLabel}
            <ChevronDownIcon
              className={`w-3 h-3 transition-transform duration-200 ${
                chartOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        }
        trailing={
          <div className="flex items-center gap-1.5">
            <IconButton label="Settings" onClick={() => navigate('/settings')}>
              <CogIcon className="w-6 h-6" />
            </IconButton>
          </div>
        }
      />

      <div className="px-3 w-full lg:max-w-2xl lg:mx-auto">
        <AnimatePresence initial={false}>
          {chartOpen && (
            <motion.div
              key="chart"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1">
                <MonthBarChart
                  data={monthlyTotals}
                  selectedMonth={selectedMonth}
                  onSelect={handleSelectMonth}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="border-b border-separator/60 mb-2 -mx-3 px-3 sticky top-0 bg-canvas/90 backdrop-blur-xl z-20">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
        </div>

        {pullDistance > 0 && (
          <div className="flex items-center justify-center py-2 -mt-1 mb-1">
            <div
              className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin"
              style={{ opacity: Math.min(pullDistance / 50, 1) }}
            />
            <span className="ml-2 text-xs text-tertiary">
              {pullDistance >= 50 ? 'Release to scan for new transactions' : 'Pull to scan SMS'}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.1, ease: [0.25, 0.8, 0.25, 1] }}
          >
            {tab === 'transactions' && (
              <TransactionsTab
                rows={rows}
                total={transactions.length}
                spent={stats.expense}
                income={stats.income}
                budget={monthlyBudget}
                getCategory={getCategory}
                allCategories={categories}
                onDelete={handleDelete}
                onUpdateCategory={handleUpdateCategory}
                onUpdateTransaction={updateTransaction}
                onAdd={goToAdd}
                onBudget={goToBudgets}
              />
            )}

            {tab === 'categories' && (
              <CategoriesTab
                sortedBreakdown={sortedBreakdown}
                totalExpense={stats.expense}
                getCategory={getCategory}
                categoryCounts={stats.countMap}
                onCategoryBudget={goToBudgets}
                empty={transactions.length === 0}
              />
            )}

            {tab === 'merchants' && (
              <MerchantsTab
                merchants={merchants}
                onAdd={goToAdd}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {toast && createPortal(
        <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-label text-canvas text-sm font-medium px-5 py-3 rounded-2xl shadow-lg max-w-sm mx-4 pointer-events-auto">
            {toast}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ───────── Transactions Tab ───────── */
interface TransactionsTabProps {
  rows: import('../types').Transaction[];
  total: number;
  spent: number;
  income: number;
  budget: number;
  getCategory: (name: string) => import('../types').Category | undefined;
  allCategories: import('../types').Category[];
  onDelete: (id: number) => void;
  onUpdateCategory: (id: number, category: string) => void;
  onUpdateTransaction: (id: number, updates: Partial<import('../types').Transaction>) => void;
  onAdd: () => void;
  onBudget: () => void;
}

function TransactionsTab({
  rows,
  total,
  spent,
  income,
  budget,
  getCategory,
  allCategories,
  onDelete,
  onUpdateCategory,
  onUpdateTransaction,
  onAdd,
  onBudget,
}: TransactionsTabProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<import('../types').Transaction | null>(null);

  const list = (
    <div className="space-y-2">
      {rows.map((t) => (
        <Card
          key={t.id}
          padded={false}
          className="px-3 py-1"
        >
          <TransactionRow
            t={t}
            category={getCategory(t.category)}
            onDelete={onDelete}
            onClick={() => setSelectedTransaction(t)}
            onCategoryChange={(cat) => onUpdateCategory(t.id!, cat)}
            allCategories={allCategories}
          />
        </Card>
      ))}
      {total > rows.length && (
        <div className="py-3 text-center text-xs text-tertiary">
          +{total - rows.length} more this month
        </div>
      )}
    </div>
  );

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="flex flex-col items-center gap-2">
          <SpendRing spent={spent} budget={budget} />
          <div className="grid grid-cols-2 gap-3 w-full mt-1">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-tertiary uppercase tracking-wide">
                Income
              </span>
              <span className="text-base font-bold text-success">
                {formatCurrency(income)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-tertiary uppercase tracking-wide">
                Budget
              </span>
              {budget > 0 ? (
                <span className="text-base font-bold text-label">
                  {formatCurrency(budget)}
                </span>
              ) : (
                <button
                  onClick={onBudget}
                  className="tap text-accent text-sm font-semibold active:scale-95"
                >
                  Set monthly budget
                </button>
              )}
            </div>
          </div>
        </Card>
        <EmptyState
          icon={<WalletIcon className="w-7 h-7" />}
          title="No transactions this month"
          subtitle="Add your first transaction to see it here."
          action={
            <Button onClick={onAdd} size="md">
              <PlusCircleIcon className="w-4 h-4 inline mr-1.5" />
              Add transaction
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center gap-2">
        <SpendRing spent={spent} budget={budget} />
        <div className="grid grid-cols-2 gap-3 w-full mt-1">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-wide">
              Income
            </span>
            <span className="text-base font-bold text-success">
              {formatCurrency(income)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium text-tertiary uppercase tracking-wide">
              Budget
            </span>
            {budget > 0 ? (
              <span className="text-base font-bold text-label">
                {formatCurrency(budget)}
              </span>
            ) : (
              <button
                onClick={onBudget}
                className="tap text-accent text-sm font-semibold active:scale-95"
              >
                Set monthly budget
              </button>
            )}
          </div>
        </div>
      </Card>
      {list}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={onUpdateTransaction}
        />
      )}
    </div>
  );
}

/* ───────── Categories Tab ───────── */
interface CategoriesTabProps {
  sortedBreakdown: [string, number][];
  totalExpense: number;
  getCategory: (name: string) => import('../types').Category | undefined;
  categoryCounts: Map<string, number>;
  onCategoryBudget: () => void;
  empty: boolean;
}

function CategoriesTab({
  sortedBreakdown,
  totalExpense,
  getCategory,
  categoryCounts,
  onCategoryBudget,
  empty,
}: CategoriesTabProps) {
  const navigate = useNavigate();

  const donutData = useMemo(
    () =>
      sortedBreakdown.map(([name, amount]) => {
        const cat = getCategory(name);
        return {
          name,
          value: amount,
          color: cat?.color || '#64748b',
        };
      }),
    [sortedBreakdown, getCategory]
  );

  const handleCategoryClick = useCallback(
    (name: string) => navigate(`/category/${encodeURIComponent(name)}`),
    [navigate]
  );

  if (empty || sortedBreakdown.length === 0) {
    return (
      <EmptyState
        icon={<WalletIcon className="w-7 h-7" />}
        title="No spending yet"
        subtitle="Your category breakdown appears once you log expenses."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CategoryDonutChart data={donutData} total={totalExpense} />
      </Card>
      <div className="space-y-2">
        {sortedBreakdown.map(([name, amount]) => {
          const cat = getCategory(name);
          const pct =
            totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
          const isKnown = !!cat;
          const count = categoryCounts.get(name) || 0;
          return (
            <Card
              key={name}
              padded={false}
              className="px-3 py-2.5"
              onClick={() => handleCategoryClick(name)}
            >
              <div className="flex items-center gap-3">
                <Avatar size="sm" color={cat?.color || '#64748b'} icon={<CategoryIcon name={isKnown ? name : 'Other'} />} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-label truncate">
                      {name}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-label">
                        {formatCurrency(amount)}
                      </span>
                      <span className="text-xs text-tertiary ml-2">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-tertiary">
                      {count} spend{count !== 1 ? 's' : ''}
                    </span>
                    {isKnown ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCategoryBudget();
                        }}
                        className="tap text-[11px] text-accent font-medium active:scale-95"
                      >
                        Set budget &rarr;
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCategoryBudget();
                        }}
                        className="tap text-[11px] text-warning font-medium active:scale-95"
                      >
                        Categorise &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Merchants Tab ───────── */
interface MerchantsTabProps {
  merchants: { name: string; total: number; count: number }[];
  onAdd: () => void;
}

function MerchantsTab({ merchants, onAdd }: MerchantsTabProps) {
  const navigate = useNavigate();

  const maxAmt = useMemo(
    () => (merchants.length > 0 ? merchants[0].total : 0),
    [merchants]
  );

  const handleMerchantClick = useCallback(
    (name: string) => navigate(`/merchant/${encodeURIComponent(name)}`),
    [navigate]
  );

  if (merchants.length === 0) {
    return (
      <EmptyState
        icon={<WalletIcon className="w-7 h-7" />}
        title="No merchants tracked"
        subtitle="Expenses will be grouped by merchant here once added."
        action={
          <Button onClick={onAdd} size="md">
            <PlusCircleIcon className="w-4 h-4 inline mr-1.5" />
            Add expense
          </Button>
        }
      />
    );
  }
  return (
    <div className="space-y-2">
      {merchants.map((m) => {
        const widthPct = maxAmt > 0 ? (m.total / maxAmt) * 100 : 0;
        return (
          <Card
            key={m.name}
            padded={false}
            className="px-3 py-2.5"
            onClick={() => handleMerchantClick(m.name)}
          >
            <div className="flex items-center gap-3">
              <Avatar size="sm" color="#64748b">
                {m.name.slice(0, 2).toUpperCase()}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-label truncate">
                    {m.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" size="xs">
                      {m.count}
                    </Badge>
                    <span className="text-sm font-bold text-label">
                      {formatCurrency(m.total)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 mt-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${widthPct}%`,
                      transition: 'width .3s',
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
