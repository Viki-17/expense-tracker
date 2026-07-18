import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { parseMultipleSMS } from '../utils/smsParser';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { SMSResult, Transaction } from '../types';
import { db } from '../db';
import { isNativePlatform } from '../utils/platform';
import SmsReader from '../plugins/sms-reader';
import { getAutoImportMerchants, addAutoImportMerchant } from '../utils/autoImport';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

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
  const [results, setResults] = useState<SMSResult[]>([]);
  const [importedIndices, setImportedIndices] = useState<Set<number>>(new Set());
  const [preExistingIndices, setPreExistingIndices] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>('week');
  const [selectedSMS, setSelectedSMS] = useState<SMSResult | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedForImport, setSelectedForImport] = useState<Set<number>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const smsRef = useRef<HTMLDivElement>(null);

  const isNative = isNativePlatform();

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isNative) return;
    SmsReader.checkPermission().then((res) => {
      setPermissionGranted(res.granted);
    });
  }, [isNative]);

  useEffect(() => {
    if (!isNative || !permissionGranted) return;
    scanDeviceSms();

    const interval = setInterval(() => {
      scanDeviceSms();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative, permissionGranted]);

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
    if (result.merchant) {
      addAutoImportMerchant(result.merchant);
    }
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

  const requestSmsPermission = useCallback(async () => {
    if (!isNative) return;
    const res = await SmsReader.requestPermission();
    setPermissionGranted(res.granted);
    if (res.granted) {
      setMessage('Permission granted! Tap "Scan SMS" to find transactions.');
    } else {
      setMessage('SMS permission denied. Please grant SMS permission in your device settings to scan transactions.');
    }
  }, [isNative]);

  const enterSelectionMode = useCallback((index: number) => {
    if (importedIndices.has(index)) return;
    setSelectionMode(true);
    setSelectedForImport((prev) => new Set([...prev, index]));
  }, [importedIndices]);

  const toggleSelect = useCallback((index: number) => {
    if (importedIndices.has(index)) return;
    setSelectedForImport((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(index);
      }
      return next;
    });
  }, [importedIndices]);

  const toggleGroupSelection = useCallback((groupIndices: number[]) => {
    const selectable = groupIndices.filter((i) => !importedIndices.has(i));
    if (selectable.length === 0) return;
    const allSelected = selectable.every((i) => selectedForImport.has(i));
    setSelectedForImport((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectable.forEach((i) => next.delete(i));
        if (next.size === 0) setSelectionMode(false);
      } else {
        selectable.forEach((i) => next.add(i));
      }
      return next;
    });
    if (!allSelected) setSelectionMode(true);
  }, [importedIndices, selectedForImport]);

  const selectAll = useCallback(() => {
    const selectable = results
      .map((_, i) => i)
      .filter((i) => !importedIndices.has(i));
    if (selectable.length === 0) return;
    setSelectionMode(true);
    setSelectedForImport(new Set(selectable));
  }, [results, importedIndices]);

  const cancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedForImport(new Set());
  }, []);

  const bulkImport = useCallback(async () => {
    for (const index of selectedForImport) {
      if (importedIndices.has(index)) continue;
      const result = results[index];
      const sameDay = await db.transactions
        .where('[type+date]')
        .equals([result.type, result.date])
        .toArray();
      if (sameDay.find((t) => t.amount === result.amount)) continue;
      doImport(result, index);
    }
    setSelectionMode(false);
    setSelectedForImport(new Set());
  }, [selectedForImport, importedIndices, results, doImport]);

  const scanDeviceSms = useCallback(async () => {
    if (!isNative || !permissionGranted) return;
    setLoading(true);
    setMessage('Scanning SMS inbox for transactions...');
    try {
      const [smsRes, existingRes] = await Promise.all([
        SmsReader.getMessages({ maxCount: 1000, daysBack: 730 }),
        db.transactions.where('source').equals('sms').toArray(),
      ]);
      const existingTexts = new Set(existingRes.map((t) => t.smsText).filter(Boolean) as string[]);
      const autoMerchants = getAutoImportMerchants().map((m) => m.toLowerCase());

      const bodies = smsRes.messages.map((m) => m.body);
      const parsed = parseMultipleSMS(bodies);

      const preExisting = new Set<number>();
      const autoImported = new Set<number>();

      for (let idx = 0; idx < parsed.length; idx++) {
        const result = parsed[idx];
        if (existingTexts.has(result.raw)) {
          preExisting.add(idx);
          continue;
        }

        const merchantMatch = result.merchant && autoMerchants.includes(result.merchant.toLowerCase());
        if (merchantMatch) {
          const sameDay = await db.transactions
            .where('[type+date]')
            .equals([result.type, result.date])
            .toArray();
          if (!sameDay.find((t) => t.amount === result.amount)) {
            await db.transactions.add({
              amount: result.amount,
              type: result.type,
              category: result.category,
              description: result.description,
              date: result.date,
              source: 'sms',
              smsText: result.raw,
              createdAt: new Date().toISOString(),
            });
          }
          autoImported.add(idx);
        }
      }

      const allImported = new Set([...preExisting, ...autoImported]);
      setPreExistingIndices(preExisting);
      setImportedIndices(allImported);
      setResults(parsed);
      setSelectedForImport(new Set());
      setSelectionMode(false);

      const remaining = parsed.length - allImported.size;
      const parts: string[] = [];
      if (autoImported.size > 0) parts.push(`${autoImported.size} auto-imported`);
      if (preExisting.size > 0) parts.push(`${preExisting.size} already imported`);
      if (remaining > 0) parts.push(`${remaining} new found`);
      setMessage(
        parsed.length > 0
          ? `Scanned ${smsRes.messages.length} financial SMS. ${parts.join(', ')}.`
          : `Scanned ${smsRes.messages.length} financial SMS but detected no transactions.`
      );
    } catch (e: any) {
      setMessage(`Error: ${e.message || 'Failed to scan SMS'}`);
    } finally {
      setLoading(false);
    }
  }, [isNative, permissionGranted]);

  const { pullDistance, refreshing, setRefreshing } = usePullToRefresh(smsRef, {
    onRefresh: scanDeviceSms,
  });

  useEffect(() => {
    if (refreshing && !loading) {
      setRefreshing(false);
    }
  }, [refreshing, loading, setRefreshing]);

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
    <div className="space-y-4" ref={smsRef}>
      {pullDistance > 0 && (
        <div className="flex items-center justify-center py-2">
          <div
            className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"
            style={{ opacity: Math.min(pullDistance / 80, 1) }}
          />
          <span className="ml-2 text-xs text-gray-400">
            {pullDistance >= 80 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      )}
      {loading && pullDistance === 0 && (
        <div className="flex items-center justify-center py-2">
          <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <span className="ml-2 text-xs text-primary-500 font-medium">Scanning SMS...</span>
        </div>
      )}
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
            <div className="flex items-center gap-2">
              {!selectionMode ? (
                <button
                  onClick={selectAll}
                  disabled={results.every((_, i) => importedIndices.has(i))}
                  className="text-[10px] text-primary-500 font-medium hover:text-primary-600 disabled:text-gray-300"
                >
                  Select All to Import
                </button>
              ) : (
                <button
                  onClick={cancelSelection}
                  className="text-[10px] text-gray-500 font-medium hover:text-gray-700"
                >
                  Cancel
                </button>
              )}
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
          </div>

          {groups.map((group) => {
            const groupGlobalIndices = group.results.map((r) => results.indexOf(r));
            const selectableInGroup = groupGlobalIndices.filter((i) => !importedIndices.has(i));
            const allGroupSelected = selectableInGroup.length > 0 && selectableInGroup.every((i) => selectedForImport.has(i));
            const someGroupSelected = selectableInGroup.some((i) => selectedForImport.has(i));

            return (
            <div key={group.dateRange}>
              <div className="flex items-center justify-between mb-2 mt-4 px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleGroupSelection(groupGlobalIndices)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                      allGroupSelected ? 'bg-primary-500 border-primary-500' :
                      someGroupSelected ? 'border-primary-400 bg-primary-50' :
                      'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {(allGroupSelected || someGroupSelected) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        {allGroupSelected ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" d="M5 12h14" />
                        )}
                      </svg>
                    )}
                  </button>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </h4>
                </div>
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
                  const preExisting = preExistingIndices.has(globalIndex);
                  const isSelected = selectedForImport.has(globalIndex);

                  const handlePointerDown = () => {
                    if (selectionMode || imported) return;
                    longPressTimer.current = setTimeout(() => {
                      enterSelectionMode(globalIndex);
                    }, 500);
                  };

                  const handlePointerUp = () => {
                    clearLongPress();
                  };

                  const handleClick = () => {
                    if (selectionMode) {
                      toggleSelect(globalIndex);
                    } else {
                      setSelectedSMS(result);
                    }
                  };

                  return (
                    <div
                      key={`${result.date}-${result.amount}-${i}`}
                      onClick={handleClick}
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className={`bg-white rounded-xl border p-3 transition-all cursor-pointer active:scale-[0.98] select-none ${
                        imported ? 'border-income-500/30 bg-green-50/50' :
                        isSelected ? 'border-primary-400 bg-primary-50' :
                        'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {selectionMode && !imported && (
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
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
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-bold ${result.type === 'expense' ? 'text-expense-500' : 'text-income-500'}`}>
                            {result.type === 'expense' ? '-' : '+'}{formatCurrency(result.amount)}
                          </p>
                          {!selectionMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleImport(result, globalIndex); }}
                              disabled={imported}
                              className={`mt-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                imported
                                  ? 'bg-green-100 text-green-600 cursor-default'
                                  : 'bg-primary-500 text-white hover:bg-primary-600'
                              }`}
                            >
                              {imported ? (preExisting ? 'Already Imported' : 'Imported') : 'Import'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })}

          {selectionMode && selectedForImport.size > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-lg -mx-0 px-4 py-3 flex items-center justify-between gap-3">
              <button
                onClick={cancelSelection}
                className="text-xs text-gray-500 font-medium hover:text-gray-700 px-2"
              >
                Cancel
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {selectedForImport.size} selected
              </span>
              <button
                onClick={bulkImport}
                className="px-5 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                Import {selectedForImport.size} Transaction{selectedForImport.size !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </>
      )}

      {selectedSMS && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
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
                <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
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
    </div>
  );
}
