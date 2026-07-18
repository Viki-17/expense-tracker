import { memo } from 'react';
import type { Transaction, Category } from '../../types';
import { formatCurrency, formatDateShort } from '../../utils/formatters';
import { categoryInitial, categoryColor } from '../../utils/categories';
import { Avatar } from './Avatar';
import { TrashIcon } from '../Icons';

interface RowProps {
  t: Transaction;
  category?: Category;
  onDelete?: (id: number) => void;
  showCategoryTag?: boolean;
}

function TransactionRowBase({ t, category, onDelete, showCategoryTag = true }: RowProps) {
  const isExpense = t.type === 'expense';
  return (
    <div className="group flex items-center gap-3 py-3 px-1 active:bg-surface-2/60 rounded-lg transition-colors contain-layout">
      {category ? (
        <Avatar size="md" color={categoryColor(category)}>
          {categoryInitial(category.name)}
        </Avatar>
      ) : (
        <Avatar size="md" color={categoryColor(undefined, t.type === 'expense' ? '#ef4444' : '#22c55e')}>
          {isExpense ? '↓' : '↑'}
        </Avatar>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-label truncate">{t.description || t.category}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-tertiary">{formatDateShort(t.date)}</span>
          {showCategoryTag && (
            <span className="text-[10px] text-tertiary">#{t.category.replace(/\s+/g, '')}</span>
          )}
          {t.source === 'sms' && (
            <span className="text-[10px] text-accent font-medium">SMS</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="text-right">
          <p className={`text-sm font-bold ${isExpense ? 'text-danger' : 'text-success'}`}>
            {isExpense ? '−' : '+'}{formatCurrency(t.amount)}
          </p>
        </div>
        {onDelete && t.id != null && (
          <button
            onClick={() => onDelete(t.id!)}
            aria-label="Delete"
            className="tap p-1.5 rounded-lg text-tertiary hover:text-danger active:scale-90 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export const TransactionRow = memo(TransactionRowBase);