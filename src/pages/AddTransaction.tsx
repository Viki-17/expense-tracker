import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import TransactionForm from '../components/TransactionForm';

export default function AddTransaction() {
  const { addTransaction } = useTransactions();
  const navigate = useNavigate();

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <TransactionForm
          onSubmit={(data) => {
            addTransaction(data);
            navigate('/transactions');
          }}
        />
      </div>
    </div>
  );
}
