import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../utils/formatters';
import { TrashIcon, ListBulletIcon, ArrowUpIcon, ArrowDownIcon, CategoryIcon } from './Icons';
import { TopBar } from './ui/TopBar';
import { Card } from './ui/Card';
import { VirtualList } from './ui/VirtualList';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';
import { CategoryPicker } from './ui/CategoryPicker';
import { TransactionDetailModal } from './TransactionDetailModal';
import type { SortField, SortDirection, Transaction } from '../types';

const FILTERS = ['all', 'expense', 'income'] as const;
type Filter = (typeof FILTERS)[number];

const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 72;

type FlatRow =
  | { kind: 'header'; month: string; total: number; count: number; key: string }
  | { kind: 'row'; t: Transaction; key: string };

export default function TransactionList() {
  const { transactions, deleteTransaction, updateTransaction } = useTransactions();
  const { getCategory, categories } = useCategories();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const [filter, setFilter] = useState<Filter>(
    filterParam === 'expense' || filterParam === 'income' ? filterParam : 'all'
  );
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [listHeight, setListHeight] = useState(480);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categoryPicker, setCategoryPicker] = useState<{ anchorRect: DOMRect; transactionId: number } | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    console.log('[TransactionList] selectedTransaction changed:', selectedTransaction?.id ?? null);
  }, [selectedTransaction]);

  useEffect(() => {
    const update = () => setListHeight(Math.max(window.innerHeight - 260, 240));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (filterParam === 'expense' || filterParam === 'income') setFilter(filterParam);
    else if (!filterParam) setFilter('all');
  }, [filterParam]);

  const setFilterAndUrl = useCallback((f: Filter) => {
    setFilter(f);
    setSearchParams(f === 'all' ? {} : { filter: f });
  }, [setSearchParams]);

  const flatRows = useMemo(() => {
    const sorted = transactions
      .filter((t) => filter === 'all' || t.type === filter)
      .sort((a, b) => {
        const dir = sortDir === 'desc' ? -1 : 1;
        if (sortField === 'date') return a.date.localeCompare(b.date) * dir;
        return (a.amount - b.amount) * dir;
      });

    const rows: FlatRow[] = [];
    let lastMonth = '';
    for (const t of sorted) {
      const m = t.date.slice(0, 7);
      if (m !== lastMonth) {
        const items = sorted.filter((x) => x.date.slice(0, 7) === m);
        const total = items.reduce((s, x) => s + (x.type === 'expense' ? -x.amount : x.amount), 0);
        rows.push({ kind: 'header', month: m, total, count: items.length, key: `h-${m}` });
        lastMonth = m;
      }
      rows.push({ kind: 'row', t, key: `r-${t.id}` });
    }
    return rows;
  }, [transactions, filter, sortField, sortDir]);

  const toggleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        return prev;
      }
      setSortDir('desc');
      return field;
    });
  }, []);

  const handleDelete = useCallback((id: number) => deleteTransaction(id), [deleteTransaction]);

  const handleCategoryChange = useCallback((id: number, category: string) => {
    updateTransaction(id, { category });
    setCategoryPicker(null);
  }, [updateTransaction]);

  const itemKeyExtractor = useCallback((item: FlatRow) => item.key, []);

  const renderRow = useCallback(
    (item: FlatRow) => {
      if (item.kind === 'header') {
        const label = new Date(item.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        return (
          <div className="flex items-center justify-between px-2 py-3">
            <span className="text-label font-bold text-sm">{label}</span>
            <span className={`text-xs font-bold ${item.total >= 0 ? 'text-success' : 'text-danger'}`}>
              {item.total >= 0 ? '+' : '−'}{formatCurrency(Math.abs(item.total))}
            </span>
          </div>
        );
      }
      const t = item.t;
      const cat = getCategory(t.category);
      const isExpense = t.type === 'expense';
      return (
        <div
          className="group flex items-center gap-3 py-3 px-2 active:bg-surface-2/60 rounded-lg transition-colors cursor-pointer"
          style={{ height: ROW_HEIGHT, boxSizing: 'border-box' }}
          onClick={() => {
            console.log('[TransactionList] row clicked, transaction id:', t.id);
            setSelectedTransaction(t);
          }}
          onPointerDown={(e) => {
            pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          }}
          onPointerUp={(e) => {
            const start = pointerStartRef.current;
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            const dt = Date.now() - start.time;
            pointerStartRef.current = null;
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 500) {
              console.log('[TransactionList] pointer tap, transaction id:', t.id);
              setSelectedTransaction(t);
            }
          }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 cursor-pointer"
            style={{ backgroundColor: `${cat?.color || '#64748b'}26`, color: cat?.color || '#64748b' }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setCategoryPicker({ anchorRect: rect, transactionId: t.id! });
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <CategoryIcon name={cat?.name || t.category} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-label truncate">{t.description || t.category}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-tertiary">{t.date}</span>
              {t.source === 'sms' && <span className="text-[10px] text-accent font-medium">SMS</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <p className={`text-sm font-bold ${isExpense ? 'text-danger' : 'text-success'}`}>
              {isExpense ? '−' : '+'}{formatCurrency(t.amount)}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(t.id!); }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              aria-label="Delete"
              className="tap p-1.5 rounded-lg text-tertiary hover:text-danger active:scale-90"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    },
    [getCategory, handleDelete]
  );

  if (transactions.length === 0) {
    return (
      <div>
        <TopBar title="Transactions" subtitle="All activity" />
        <div className="px-4 max-w-2xl mx-auto">
          <EmptyState
            icon={<ListBulletIcon className="w-7 h-7" />}
            title="No transactions yet"
            subtitle="Add your first transaction to get started."
            action={<Button onClick={() => navigate('/add')}>Add transaction</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Transactions"
        subtitle={`${transactions.length} total`}
        trailing={
          <div className="flex items-center gap-1">
            <button onClick={() => toggleSort('date')} className="tap p-2 rounded-full text-secondary hover:text-label" aria-label="Sort by date">
              {sortField === 'date' ? (sortDir === 'desc' ? <ArrowDownIcon className="w-5 h-5" /> : <ArrowUpIcon className="w-5 h-5" />) : <ArrowDownIcon className="w-5 h-5 opacity-40" />}
            </button>
            <button onClick={() => toggleSort('amount')} className="tap p-2 rounded-full text-secondary hover:text-label" aria-label="Sort by amount">
              {sortField === 'amount' ? (sortDir === 'desc' ? <ArrowDownIcon className="w-5 h-5" /> : <ArrowUpIcon className="w-5 h-5" />) : <ArrowUpIcon className="w-5 h-5 opacity-40" />}
            </button>
          </div>
        }
      />

      <div className="px-4 max-w-2xl mx-auto w-full pt-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3 gap-2 shrink-0">
          <div className="inline-flex bg-surface-2 rounded-xl p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilterAndUrl(f)}
                className={`tap px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === f ? 'bg-surface text-label shadow-card' : 'text-tertiary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {flatRows.length === 0 ? (
          <p className="text-center text-tertiary text-sm py-8">No {filter} transactions found</p>
        ) : (
          <Card padded={false} className="px-2 flex-1 min-h-0">
              <VirtualList
              items={flatRows}
              rowHeight={ROW_HEIGHT}
              height={listHeight}
              renderRow={renderRow}
              itemKey={itemKeyExtractor}
              overscan={8}
            />
          </Card>
        )}

        {selectedTransaction && (
          <TransactionDetailModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}

        {categoryPicker && (
          <CategoryPicker
            categories={categories}
            anchorRect={categoryPicker.anchorRect}
            onSelect={(cat) => handleCategoryChange(categoryPicker.transactionId, cat)}
            onClose={() => setCategoryPicker(null)}
          />
        )}
      </div>
    </div>
  );
}