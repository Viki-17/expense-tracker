import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { useSmsListener } from './hooks/useSmsListener';

const Home = lazy(() => import('./pages/Home'));
const Transactions = lazy(() => import('./pages/Transactions'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const SMSImport = lazy(() => import('./pages/SMSImport'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Settings = lazy(() => import('./pages/Settings'));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'));
const MerchantDetail = lazy(() => import('./pages/MerchantDetail'));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-10 h-10 rounded-full border-[3px] border-surface-3 border-t-accent animate-spin" />
  </div>
);

export default function App() {
  useSmsListener();

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/sms" element={<SMSImport />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/category/:name" element={<CategoryDetail />} />
          <Route path="/merchant/:name" element={<MerchantDetail />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
