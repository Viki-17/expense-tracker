import { useState, useCallback, useMemo } from 'react';
import { parseSMS, parseMultipleSMS } from '../utils/smsParser';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { SMSResult, Transaction } from '../types';
import { db } from '../db';
import { isNativePlatform } from '../utils/platform';
import SmsReader from '../plugins/sms-reader';

type GroupMode = 'week' | 'month';

interface ResultGroup {
  label: string;
  dateRange: string;
  results: SMSResult[];
  totalExpense: number;
  totalIncome: number;
}

interface DuplicateCheck {
  result: SMSResult;
  index: number;
  existing: Transaction;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  return monday.toISOString().split('T')[0];
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mon = monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const sun = sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${mon} - ${sun}`;
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function SmartSMSReader() {
  const [smsText, setSmsText] = useState('');
  const [results, setResults] = useState<SMSResult[]>([]);
  const [importedIndices, setImportedIndices] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>('week');
  const [selectedSMS, setSelectedSMS] = useState<SMSResult | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);

  const isNative = isNativePlatform();

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    await db.transactions.add({ ...t, createdAt: new Date().toISOString() });
  }, []);

  const doImport = useCallback((result: SMSResult, index: number) => {
    addTransaction({
      amount: result.amount,
      type: result.type,
      category: result.category,
      description: result.description,
      date: result.date,
      source: 'sms',
      smsText: result.raw,
    });
    setImportedIndices((prev) => new Set([...prev, index]));
  }, [addTransaction]);

  const handleImport = useCallback(async (result: SMSResult, index: number) => {
    if (importedIndices.has(index)) return;
    const sameDay = await db.transactions
      .where('[type+date]')
      .equals([result.type, result.date])
      .toArray();
    const match = sameDay.find((t) => t.amount === result.amount);
    if (match) {
      setDuplicateCheck({ result, index, existing: match });
      return;
    }
    doImport(result, index);
  }, [importedIndices, doImport]);

  const confirmDuplicateImport = useCallback(() => {
    if (!duplicateCheck) return;
    doImport(duplicateCheck.result, duplicateCheck.index);
    setDuplicateCheck(null);
  }, [duplicateCheck, doImport]);

  const skipDuplicateImport = useCallback(() => {
    setDuplicateCheck(null);
  }, []);

  const handleParse = useCallback(() => {
    if (!smsText.trim()) return;
    const lines = smsText.split(/\n{2,}/).filter((l) => l.trim());
    const parsed = lines.length > 1 ? parseMultipleSMS(lines) : [parseSMS(smsText)].filter(Boolean) as SMSResult[];
    setResults(parsed);
    setMessage(
      parsed.length > 0
        ? `Found ${parsed.length} transaction(s)`
        : 'No transactions detected. Try pasting a bank/UPI SMS.'
    );
  }, [smsText]);

  const handleClear = useCallback(() => {
    setSmsText('');
    setResults([]);
    setImportedIndices(new Set());
    setMessage('');
  }, []);

  const requestSmsPermission = useCallback(async () => {
    if (!isNative) return;
    const res = await SmsReader.requestPermission();
    setPermissionGranted(res.granted);
    if (res.granted) {
      setMessage('Permission granted! Tap "Scan SMS" to find transactions.');
    } else {
      setMessage('SMS permission denied. You can still paste SMS manually below.');
    }
  }, [isNative]);

  const scanDeviceSms = useCallback(async () => {
    if (!isNative || !permissionGranted) return;
    setLoading(true);
    setMessage('Scanning SMS inbox for transactions...');
    try {
      const res = await SmsReader.getMessages({ maxCount: 500, daysBack: 30 });
      const bodies = res.messages.map((m) => m.body);
      const parsed = parseMultipleSMS(bodies);
      setResults(parsed);
      setMessage(
        parsed.length > 0
          ? `Found ${parsed.length} transaction(s) from ${res.messages.length} financial SMS in your inbox.`
          : `Scanned ${res.messages.length} financial SMS but detected no new transactions. You can paste SMS manually below.`
      );
    } catch (e: any) {
      setMessage(`Error: ${e.message || 'Failed to scan SMS'}`);
    } finally {
      setLoading(false);
    }
  }, [isNative, permissionGranted]);

  const groups = useMemo<ResultGroup[]>(() => {
    if (!results.length) return [];
    const map = new Map<string, SMSResult[]>();
    for (const r of results) {
      const key = groupMode === 'week' ? getWeekKey(r.date) : getMonthKey(r.date);
      const arr = map.get(key);
      if (arr) arr.push(r);
      else map.set(key, [r]);
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    return entries.map(([key, items]) => {
      const label = groupMode === 'week' ? formatWeekRange(key) : formatMonthLabel(key);
      let totalExpense = 0;
      let totalIncome = 0;
      for (const r of items) {
        if (r.type === 'expense') totalExpense += r.amount;
        else totalIncome += r.amount;
      }
      return { label, dateRange: key, results: items, totalExpense, totalIncome };
    });
  }, [results, groupMode]);

  const importedCount = importedIndices.size;

  return (
    <div className="space-y-4">
      {isNative && (
        <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-5 text-white">
          <h3 className="text-lg font-bold mb-1">Auto-Scan SMS</h3>
          <p className="text-primary-100 text-sm mb-4">
            Scan your SMS inbox to find bank & UPI transaction messages.
            Only messages that look like transactions are read.
          </p>

          {!permissionGranted ? (
            <button
              onClick={requestSmsPermission}
              className="w-full py-3 bg-white text-primary-600 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors"
            >
              Grant SMS Permission
            </button>
          ) : (
            <button
              onClick={scanDeviceSms}
              disabled={loading}
              className="w-full py-3 bg-white text-primary-600 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors disabled:opacity-60"
            >
              {loading ? 'Scanning...' : 'Scan SMS for Transactions'}
            </button>
          )}

          {importedCount > 0 && (
            <p className="text-center text-sm mt-3 text-primary-100">
              {importedCount} imported this session
            </p>
          )}
        </div>
      )}

      <div className={isNative ? 'bg-white rounded-2xl border border-gray-100 p-5' : ''}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {isNative ? 'Or Paste SMS Manually' : 'Paste SMS'}
          </h3>
          {!isNative && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              PWA Mode
            </span>
          )}
        </div>

        {!isNative && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 mb-3">
            <p className="font-medium mb-0.5">On Android?</p>
            <p className="text-blue-600 text-xs">
              Install the native app version to auto-scan your SMS inbox. In browser/PWA mode,
              paste bank/UPI SMS messages manually.
            </p>
          </div>
        )}

        <textarea
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          placeholder="Paste your bank/UPI transaction SMS here...&#10;&#10;Examples:&#10; Rs.500 spent on Swiggy at 12:34 on 15-Jan&#10; 1,200 debited from a/c **1234 at Amazon&#10; UPI payment of 350 to PhonePe&#10;&#10;Paste multiple messages separated by blank lines."
          rows={5}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleParse}
            disabled={!smsText.trim()}
            className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Parse SMS
          </button>
          {smsText && (
            <button onClick={handleClear} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className={`text-sm font-medium ${results.length > 0 ? 'text-income-600' : 'text-amber-600'}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Detected Transactions ({results.length})
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setGroupMode('week')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  groupMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setGroupMode('month')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  groupMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.dateRange}>
              <div className="flex items-center justify-between mb-2 mt-4 px-1">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.label}
                </h4>
                <div className="flex gap-3 text-[11px] font-medium">
                  {group.totalExpense > 0 && (
                    <span className="text-expense-500">-{formatCurrency(group.totalExpense)}</span>
                  )}
                  {group.totalIncome > 0 && (
                    <span className="text-income-500">+{formatCurrency(group.totalIncome)}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {group.results.map((result, i) => {
                  const globalIndex = results.indexOf(result);
                  const imported = importedIndices.has(globalIndex);
                  return (
                    <div
                      key={`${result.date}-${result.amount}-${i}`}
                      onClick={() => setSelectedSMS(result)}
                      className={`bg-white rounded-xl border p-3 transition-all cursor-pointer active:scale-[0.98] ${
                        imported ? 'border-income-500/30 bg-green-50/50' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              result.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {result.type === 'expense' ? 'EXPENSE' : 'INCOME'}
                            </span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                              {result.category}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {Math.round(result.confidence)}%
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">{result.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatDate(result.date)}
                            {result.merchant && `  ${result.merchant}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-bold ${result.type === 'expense' ? 'text-expense-500' : 'text-income-500'}`}>
                            {result.type === 'expense' ? '-' : '+'}{formatCurrency(result.amount)}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleImport(result, globalIndex); }}
                            disabled={imported}
                            className={`mt-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                              imported
                                ? 'bg-green-100 text-green-600 cursor-default'
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                            }`}
                          >
                            {imported ? 'Imported' : 'Import'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {selectedSMS && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedSMS(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-sm font-semibold text-gray-900">SMS Details</h3>
              <button
                onClick={() => setSelectedSMS(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Amount</p>
                  <p className={`text-lg font-bold ${selectedSMS.type === 'expense' ? 'text-expense-500' : 'text-income-500'}`}>
                    {selectedSMS.type === 'expense' ? '-' : '+'}{formatCurrency(selectedSMS.amount)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedSMS.date)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Type</p>
                  <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    selectedSMS.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {selectedSMS.type.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Category</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedSMS.category}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Merchant</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedSMS.merchant || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Confidence</p>
                  <p className="text-sm font-semibold text-gray-900">{Math.round(selectedSMS.confidence)}%</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Description</p>
                <p className="text-sm text-gray-700">{selectedSMS.description}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Raw SMS</p>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                    {selectedSMS.raw}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {duplicateCheck && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={skipDuplicateImport}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900">Possible Duplicate</h3>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                A transaction with the same amount and date already exists.
              </p>
            </div>

            <div className="px-5 py-3 space-y-2">
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-[10px] text-amber-600 uppercase font-medium mb-0.5">Existing Transaction</p>
                <p className="text-xs font-medium text-gray-900">
                  {duplicateCheck.existing.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    duplicateCheck.existing.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {duplicateCheck.existing.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(duplicateCheck.existing.date)}
                  </span>
                  <span className={`text-xs font-bold ${duplicateCheck.existing.type === 'expense' ? 'text-expense-500' : 'text-income-500'}`}>
                    {duplicateCheck.existing.type === 'expense' ? '-' : '+'}{formatCurrency(duplicateCheck.existing.amount)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">New Import</p>
                <p className="text-xs font-medium text-gray-900">
                  {duplicateCheck.result.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    duplicateCheck.result.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {duplicateCheck.result.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(duplicateCheck.result.date)}
                  </span>
                  <span className={`text-xs font-bold ${duplicateCheck.result.type === 'expense' ? 'text-expense-500' : 'text-income-500'}`}>
                    {duplicateCheck.result.type === 'expense' ? '-' : '+'}{formatCurrency(duplicateCheck.result.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={skipDuplicateImport}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={confirmDuplicateImport}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {!results.length && !loading && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Sample SMS formats to try:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'HDFC Bank: Rs.500.00 debited from a/c **1234 at AMAZON on 15-Jan',
              'ICICI Bank: Rs.1,200 spent on Swiggy at 12:34 PM. Avl Bal: Rs.25,000',
              'SBI: Rs.10,000 credited to a/c **5678. UPI Ref: 1234567890',
              'Axis Bank: INR 750.00 paid via UPI to PhonePe. Ref No: 9876543210',
              'Salary credited: Rs.50,000.00 on 01-Jan-2024',
              'Your card **9012 was used for Rs.2,499 at Flipkart on 20-Jan',
            ].map((example, exampleI) => (
              <button
                key={exampleI}
                onClick={() => setSmsText(example)}
                className="text-left text-xs p-2.5 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors truncate"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
