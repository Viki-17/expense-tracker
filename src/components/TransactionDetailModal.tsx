import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useCategories } from '../hooks/useCategories';
import { CategoryPicker } from './ui/CategoryPicker';
import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
  onUpdate?: (id: number, updates: Partial<Transaction>) => void;
}

export function TransactionDetailModal({ transaction, onClose, onUpdate }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [isEditingMerchant, setIsEditingMerchant] = useState(false);
  const [editMerchant, setEditMerchant] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [categoryPicker, setCategoryPicker] = useState<{ anchorRect: DOMRect } | null>(null);
  const [current, setCurrent] = useState(transaction);
  const inputRef = useRef<HTMLInputElement>(null);
  const merchantRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const { categories } = useCategories();

  useEffect(() => {
    setCurrent(transaction);
  }, [transaction]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAmountClick = useCallback(() => {
    if (!onUpdate) return;
    setEditAmount(current.amount.toString());
    setIsEditingAmount(true);
  }, [onUpdate, current.amount]);

  const handleTypeClick = useCallback(() => {
    if (!onUpdate || current.id == null) return;
    const nextType: Transaction['type'] =
      current.type === 'expense' ? 'income' :
      current.type === 'income' ? 'neutral' : 'expense';
    onUpdate(current.id, { type: nextType });
    setCurrent((prev) => ({ ...prev, type: nextType }));
  }, [onUpdate, current.id, current.type]);

  const saveAmount = useCallback(() => {
    const parsed = parseFloat(editAmount);
    if (!isNaN(parsed) && parsed > 0 && parsed !== current.amount && current.id != null && onUpdate) {
      onUpdate(current.id, { amount: parsed });
      setCurrent((prev) => ({ ...prev, amount: parsed }));
    }
    setIsEditingAmount(false);
  }, [editAmount, current.amount, current.id, onUpdate]);

  const handleAmountKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveAmount();
    } else if (e.key === 'Escape') {
      setIsEditingAmount(false);
    }
  }, [saveAmount]);

  const handleMerchantClick = useCallback(() => {
    if (!onUpdate) return;
    setEditMerchant(current.merchant || '');
    setIsEditingMerchant(true);
  }, [onUpdate, current.merchant]);

  const saveMerchant = useCallback(() => {
    const val = editMerchant.trim();
    if (val !== (current.merchant || '') && current.id != null && onUpdate) {
      onUpdate(current.id, { merchant: val || undefined });
      setCurrent((prev) => ({ ...prev, merchant: val || undefined }));
    }
    setIsEditingMerchant(false);
  }, [editMerchant, current.merchant, current.id, onUpdate]);

  const handleMerchantKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveMerchant();
    else if (e.key === 'Escape') setIsEditingMerchant(false);
  }, [saveMerchant]);

  const handleDateClick = useCallback(() => {
    if (!onUpdate) return;
    setEditDate(current.date);
    setIsEditingDate(true);
  }, [onUpdate, current.date]);

  const saveDate = useCallback(() => {
    if (editDate && editDate !== current.date && current.id != null && onUpdate) {
      onUpdate(current.id, { date: editDate });
      setCurrent((prev) => ({ ...prev, date: editDate }));
    }
    setIsEditingDate(false);
  }, [editDate, current.date, current.id, onUpdate]);

  const handleDateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveDate();
    else if (e.key === 'Escape') setIsEditingDate(false);
  }, [saveDate]);

  const handleCategoryClick = useCallback((e: React.MouseEvent) => {
    if (!onUpdate) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCategoryPicker({ anchorRect: rect });
  }, [onUpdate]);

  const handleCategorySelect = useCallback((category: string) => {
    if (current.id != null && onUpdate) {
      onUpdate(current.id, { category });
      setCurrent((prev) => ({ ...prev, category }));
    }
    setCategoryPicker(null);
  }, [current.id, onUpdate]);

  useEffect(() => {
    if (isEditingAmount && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingAmount]);

  useEffect(() => {
    if (isEditingMerchant && merchantRef.current) {
      merchantRef.current.focus();
      merchantRef.current.select();
    }
  }, [isEditingMerchant]);

  useEffect(() => {
    if (isEditingDate && dateRef.current) {
      dateRef.current.focus();
    }
  }, [isEditingDate]);

  return (
    <>
      {categoryPicker && (
        <CategoryPicker
          categories={categories}
          anchorRect={categoryPicker.anchorRect}
          onSelect={handleCategorySelect}
          onClose={() => setCategoryPicker(null)}
        />
      )}
      {createPortal(
        <AnimatePresence onExitComplete={() => !isVisible && onClose()}>
          {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="bg-surface rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
          >
            <div className="sticky top-0 bg-surface border-b border-separator/40 px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-sm font-semibold text-label">Transaction Details</h3>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-secondary hover:bg-surface-3 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-[10px] text-tertiary uppercase font-medium">Amount</p>
                  {isEditingAmount ? (
                    <input
                      ref={inputRef}
                      type="number"
                      inputMode="decimal"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onBlur={saveAmount}
                      onKeyDown={handleAmountKeyDown}
                      className="w-full mt-1 text-lg font-bold bg-transparent border-b-2 border-accent text-label outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  ) : (
                    <p
                      className={`text-lg font-bold cursor-pointer hover:opacity-80 transition-opacity ${onUpdate ? '' : 'cursor-default'} ${
                        current.type === 'expense' ? 'text-danger' : current.type === 'income' ? 'text-success' : 'text-tertiary'
                      }`}
                      onClick={handleAmountClick}
                      title={onUpdate ? 'Click to edit amount' : undefined}
                    >
                      {current.type === 'expense' ? '−' : current.type === 'income' ? '+' : '±'}{formatCurrency(current.amount)}
                    </p>
                  )}
                </div>
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-[10px] text-tertiary uppercase font-medium">Date</p>
                  {isEditingDate ? (
                    <input
                      ref={dateRef}
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      onBlur={saveDate}
                      onKeyDown={handleDateKeyDown}
                      className="w-full mt-1 text-sm font-semibold bg-transparent border-b-2 border-accent text-label outline-none"
                    />
                  ) : (
                    <p
                      className={`text-sm font-semibold text-label ${onUpdate ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                      onClick={handleDateClick}
                      title={onUpdate ? 'Click to edit date' : undefined}
                    >
                      {formatDate(current.date)}
                    </p>
                  )}
                </div>
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-[10px] text-tertiary uppercase font-medium">Type</p>
                  <span
                    className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full select-none ${onUpdate ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${
                      current.type === 'expense' ? 'bg-danger-soft text-danger' : current.type === 'income' ? 'bg-success-soft text-success' : 'bg-surface-2 text-secondary'
                    }`}
                    onClick={handleTypeClick}
                    title={onUpdate ? 'Click to change type' : undefined}
                  >
                    {current.type.toUpperCase()}
                  </span>
                </div>
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-[10px] text-tertiary uppercase font-medium">Category</p>
                  <p
                    className={`text-sm font-semibold text-label ${onUpdate ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    onClick={handleCategoryClick}
                    title={onUpdate ? 'Click to change category' : undefined}
                  >
                    {current.category}
                  </p>
                </div>
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-[10px] text-tertiary uppercase font-medium">Merchant</p>
                  {isEditingMerchant ? (
                    <input
                      ref={merchantRef}
                      type="text"
                      value={editMerchant}
                      onChange={(e) => setEditMerchant(e.target.value)}
                      onBlur={saveMerchant}
                      onKeyDown={handleMerchantKeyDown}
                      className="w-full mt-1 text-sm font-semibold bg-transparent border-b-2 border-accent text-label outline-none"
                    />
                  ) : (
                    <p
                      className={`text-sm font-semibold text-label ${onUpdate ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                      onClick={handleMerchantClick}
                      title={onUpdate ? 'Click to edit merchant' : undefined}
                    >
                      {current.merchant || 'N/A'}
                    </p>
                  )}
                </div>
                <div className="bg-surface-2 rounded-xl p-3">
                  <p className="text-[10px] text-tertiary uppercase font-medium">Source</p>
                  <p className="text-sm font-semibold text-label">{current.source === 'sms' ? 'SMS Import' : 'Manual'}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-tertiary uppercase font-medium mb-1.5">Description</p>
                <p className="text-sm text-label">{current.description || current.category}</p>
              </div>

              {current.source === 'sms' && current.smsText && (
                <div>
                  <p className="text-[10px] text-tertiary uppercase font-medium mb-1.5">Raw SMS</p>
                  <div className="bg-surface-2 rounded-xl p-3 max-h-40 overflow-y-auto">
                    <p className="text-sm text-label leading-relaxed whitespace-pre-wrap break-words">
                      {current.smsText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )}
    </>
  );
}
