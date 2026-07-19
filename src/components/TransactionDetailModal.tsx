import { createPortal } from 'react-dom';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface border-b border-separator/40 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-sm font-semibold text-label">Transaction Details</h3>
          <button
            onClick={onClose}
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
              <p className={`text-lg font-bold ${transaction.type === 'expense' ? 'text-danger' : 'text-success'}`}>
                {transaction.type === 'expense' ? '−' : '+'}{formatCurrency(transaction.amount)}
              </p>
            </div>
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-[10px] text-tertiary uppercase font-medium">Date</p>
              <p className="text-sm font-semibold text-label">{formatDate(transaction.date)}</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-[10px] text-tertiary uppercase font-medium">Type</p>
              <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                transaction.type === 'expense' ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'
              }`}>
                {transaction.type.toUpperCase()}
              </span>
            </div>
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-[10px] text-tertiary uppercase font-medium">Category</p>
              <p className="text-sm font-semibold text-label">{transaction.category}</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-[10px] text-tertiary uppercase font-medium">Merchant</p>
              <p className="text-sm font-semibold text-label">{transaction.merchant || 'N/A'}</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-[10px] text-tertiary uppercase font-medium">Source</p>
              <p className="text-sm font-semibold text-label">{transaction.source === 'sms' ? 'SMS Import' : 'Manual'}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-tertiary uppercase font-medium mb-1.5">Description</p>
            <p className="text-sm text-label">{transaction.description || transaction.category}</p>
          </div>

          {transaction.source === 'sms' && transaction.smsText && (
            <div>
              <p className="text-[10px] text-tertiary uppercase font-medium mb-1.5">Raw SMS</p>
              <div className="bg-surface-2 rounded-xl p-3 max-h-40 overflow-y-auto">
                <p className="text-sm text-label leading-relaxed whitespace-pre-wrap break-words">
                  {transaction.smsText}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
