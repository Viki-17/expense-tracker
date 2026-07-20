import { memo, useState, useRef, useCallback } from 'react';
import type { Transaction, Category } from '../../types';
import { formatCurrency, formatDateShort } from '../../utils/formatters';
import { categoryColor } from '../../utils/categories';
import { Avatar } from './Avatar';
import { CategoryPicker } from './CategoryPicker';
import { TrashIcon, CategoryIcon } from '../Icons';

interface RowProps {
  t: Transaction;
  category?: Category;
  onDelete?: (id: number) => void;
  showCategoryTag?: boolean;
  onClick?: () => void;
  onCategoryChange?: (category: string) => void;
  allCategories?: Category[];
}

function TransactionRowBase({ t, category, onDelete, showCategoryTag = true, onClick, onCategoryChange, allCategories }: RowProps) {
  const isExpense = t.type === 'expense';
  const isIncome = t.type === 'income';
  const [pickerOpen, setPickerOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const handleAvatarClick = useCallback((e: React.MouseEvent) => {
    if (!onCategoryChange || !allCategories) return;
    e.stopPropagation();
    setPickerOpen((prev) => !prev);
  }, [onCategoryChange, allCategories]);

  const handleCategorySelect = useCallback((catName: string) => {
    setPickerOpen(false);
    onCategoryChange?.(catName);
  }, [onCategoryChange]);

  return (
    <div onClick={onClick} className="group flex items-center gap-3 py-3 px-1 active:bg-surface-2/60 rounded-lg transition-colors contain-layout cursor-pointer">
      <div ref={avatarRef} onClick={handleAvatarClick} className={onCategoryChange ? 'cursor-pointer' : ''}>
        {category ? (
          <Avatar size="md" color={categoryColor(category)} icon={<CategoryIcon name={category.name} />} />
        ) : (
          <Avatar size="md" color={categoryColor(undefined, t.type === 'expense' ? '#ef4444' : t.type === 'income' ? '#22c55e' : '#64748b')}>
            {isExpense ? '↓' : isIncome ? '↑' : '○'}
          </Avatar>
        )}
      </div>
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
          <p className={`text-sm font-bold ${
            isExpense ? 'text-danger' : isIncome ? 'text-success' : 'text-tertiary'
          }`}>
            {isExpense ? '−' : isIncome ? '+' : '±'}{formatCurrency(t.amount)}
          </p>
        </div>
        {onDelete && t.id != null && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(t.id!);
            }}
            aria-label="Delete"
            className="tap p-1.5 rounded-lg text-tertiary hover:text-danger active:scale-90 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          )}
      </div>
      {pickerOpen && avatarRef.current && allCategories && (
        <CategoryPicker
          categories={allCategories}
          anchorRect={avatarRef.current.getBoundingClientRect()}
          onSelect={handleCategorySelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export const TransactionRow = memo(TransactionRowBase);