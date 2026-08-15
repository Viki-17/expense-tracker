import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { useSmsListener } from './hooks/useSmsListener';
import { useRoutePrefetch } from './hooks/useRoutePrefetch';
import { Skeleton } from './components/ui/Skeleton';

const Home = lazy(() => import('./pages/Home'));
const Transactions = lazy(() => import('./pages/Transactions'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const SMSImport = lazy(() => import('./pages/SMSImport'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Settings = lazy(() => import('./pages/Settings'));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'));
const MerchantDetail = lazy(() => import('./pages/MerchantDetail'));

const PageSkeleton = () => (
  <div className="contain-layout" aria-hidden="true">
    <div className="pb-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-3 w-24 mt-2" />
    </div>
    <div className="w-full lg:max-w-3xl lg:mx-auto space-y-4">
      <Skeleton className="h-[180px] w-full rounded-2xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card px-3 py-1">
            <div className="flex items-center gap-3 h-[60px]">
              <Skeleton className="w-11 h-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function App() {
  useSmsListener();
  useRoutePrefetch();

  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
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
