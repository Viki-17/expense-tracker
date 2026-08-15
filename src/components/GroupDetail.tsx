import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useCategories } from '../hooks/useCategories';
import { useSwipe } from '../hooks/useSwipe';
import { formatCurrency, monthLabel } from '../utils/formatters';
import { categoryColor } from '../utils/categories';
import { TopBar } from './ui/TopBar';
import { Card } from './ui/Card';
import { TransactionRow } from './ui/TransactionRow';
import { Avatar } from './ui/Avatar';
import { EmptyState } from './ui/EmptyState';
import { GroupBarChart } from './ui/GroupBarChart';
import { Skeleton } from './ui/Skeleton';
import { TransactionDetailModal } from './TransactionDetailModal';
import { ArrowLeftIcon, WalletIcon, CategoryIcon } from './Icons';
import type { Transaction } from '../types';

const MAX_ROWS = 100;

interface GroupDetailProps {
  type: 'category' | 'merchant';
}

export default function GroupDetail({ type }: GroupDetailProps) {
  const { name } = useParams<{ name: string }>();
  const decoded = decodeURIComponent(name || '');
  const navigate = useNavigate();
  const { getCategory, categories } = useCategories();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const updateTransaction = useCallback(async (id: number, updates: Partial<Transaction>) => {
    await db.transactions.update(id, updates);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const start = useMemo(
    () => `${selectedMonth}-01`,
    [selectedMonth]
  );
  const end = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
  }, [selectedMonth]);

  const monthlyTotals = useLiveQuery(
    () =>
      type === 'category'
        ? db.getCategoryMonthlyTotals(decoded, 6)
        : db.getMerchantMonthlyTotals(decoded, 6),
    [decoded, type]
  );

  const transactionsQuery = useLiveQuery(
    () =>
      type === 'category'
        ? db.getCategoryTransactionsInRange(decoded, start, end)
        : db.getMerchantTransactionsInRange(decoded, start, end),
    [decoded, type, start, end]
  );

  const txPrevRef = useRef<Transaction[] | null>(null);
  if (transactionsQuery !== undefined) txPrevRef.current = transactionsQuery;
  const txList = transactionsQuery ?? txPrevRef.current ?? [];

  const category = useMemo(
    () => (type === 'category' ? getCategory(decoded) : undefined),
    [type, decoded, getCategory]
  );

  const color = useMemo(
    () => categoryColor(category, '#64748b'),
    [category]
  );

  const handleCategoryChange = useCallback(
    (id: number, category: string) => {
      db.transactions.update(id, { category });
    },
    []
  );

  const handleSelectMonth = useCallback((month: string) => {
    setSelectedMonth(month);
  }, []);

  const handlePrevMonth = useCallback(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }, [selectedMonth]);

  const swipeRef = useSwipe({
    onSwipeLeft: handleNextMonth,
    onSwipeRight: handlePrevMonth,
  });

  const chartData = useMemo(
    () => monthlyTotals || [],
    [monthlyTotals]
  );

  const selectedDate = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [selectedMonth]);

  const monthSubtitle = useMemo(
    () => monthLabel(selectedDate),
    [selectedDate]
  );

  const chartHasData = useMemo(
    () => chartData.some((d) => d.total > 0),
    [chartData]
  );

  const totalExpense = useMemo(
    () => txList.reduce((sum, t) => (t.type === 'expense' ? sum + t.amount : sum), 0),
    [txList]
  );

  const chartLoading = monthlyTotals === undefined;
  const transactionsLoading = txPrevRef.current === null && transactionsQuery === undefined;

  return (
    <div ref={swipeRef} style={{ touchAction: 'pan-y' }}>
      <TopBar
        leading={
          <button
            onClick={() => navigate(-1)}
            className="tap p-1.5 -ml-1.5 rounded-xl active:scale-90"
            aria-label="Back"
          >
            <ArrowLeftIcon className="w-6 h-6 text-label" />
          </button>
        }
        title={decoded}
        subtitle={monthSubtitle}
        trailing={
          type === 'category' && category ? (
            <Avatar size="sm" color={color} icon={<CategoryIcon name={decoded} />} />
          ) : undefined
        }
      />

      <div className="w-full lg:max-w-2xl lg:mx-auto">
        {chartLoading && (
          <div className="h-[96px] pt-2 pb-1 flex items-end gap-2 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-12 rounded-t-md rounded-b-none" />
            ))}
          </div>
        )}

        {!chartLoading && chartHasData && (
          <div className="pt-2 pb-1">
            <GroupBarChart
              data={chartData}
              selectedMonth={selectedMonth}
              onSelect={handleSelectMonth}
            />
          </div>
        )}

        {!chartLoading && !chartHasData && chartData.length > 0 && (
          <div className="py-8">
            <EmptyState
              icon={<WalletIcon className="w-7 h-7" />}
              title={`No spending for ${decoded}`}
              subtitle="No transactions found for this month range."
            />
          </div>
        )}

        <div className="mt-2 space-y-2">
          {transactionsLoading ? (
            <DetailTransactionsLoadingSkeleton />
          ) : txList.length === 0 ? (
            <EmptyState
              icon={<WalletIcon className="w-7 h-7" />}
              title="No transactions"
              subtitle={`No ${type === 'category' ? 'category' : 'merchant'} spending in ${monthSubtitle}`}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-tertiary uppercase tracking-wide">
                  {txList.length} transaction{txList.length !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-bold text-label">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              {txList.slice(0, MAX_ROWS).map((t) => (
                <Card key={t.id} padded={false} className="px-3 py-1">
                  <TransactionRow
                    t={t}
                    category={getCategory(t.category)}
                    onCategoryChange={(cat) => handleCategoryChange(t.id!, cat)}
                    allCategories={categories}
                    onClick={() => setSelectedTransaction(t)}
                  />
                </Card>
              ))}
              {txList.length > MAX_ROWS && (
                <div className="py-3 text-center text-xs text-tertiary">
                  +{txList.length - MAX_ROWS} more this month
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={updateTransaction}
        />
      )}
    </div>
  );
}

function DetailTransactionsLoadingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} padded={false} className="px-3 py-1">
          <div className="flex items-center gap-3 h-[60px]">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}
