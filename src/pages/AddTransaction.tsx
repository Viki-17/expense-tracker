import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import TransactionForm from '../components/TransactionForm';
import type { Transaction } from '../types';

export default function AddTransaction() {
  const { addTransaction } = useTransactions();
  const navigate = useNavigate();

  const handleSubmit = useCallback((data: Omit<Transaction, 'id' | 'createdAt'>) => {
    addTransaction(data);
    navigate('/transactions');
  }, [addTransaction, navigate]);

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <TransactionForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
