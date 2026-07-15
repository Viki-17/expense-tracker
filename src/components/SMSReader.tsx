import { useState, useCallback } from 'react';
import { parseSMS, parseMultipleSMS } from '../utils/smsParser';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { SMSResult, Transaction } from '../types';
import { db } from '../db';
import { isNativePlatform } from '../utils/platform';
import SmsReader from '../plugins/sms-reader';

export default function SmartSMSReader() {
  const [smsText, setSmsText] = useState('');
  const [results, setResults] = useState<SMSResult[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const isNative = isNativePlatform();

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    await db.transactions.add({ ...t, createdAt: new Date().toISOString() });
  }, []);

  const handleImport = useCallback((result: SMSResult, index: number) => {
    const key = `${result.date}-${result.amount}-${result.merchant || 'nomerchant'}-${index}`;
    if (importedIds.has(key)) return;
    addTransaction({
      amount: result.amount,
      type: result.type,
      category: result.category,
      description: result.description,
      date: result.date,
      source: 'sms',
      smsText: result.raw,
    });
    setImportedIds((prev) => new Set([...prev, key]));
  }, [importedIds, addTransaction]);

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
    setImportedIds(new Set());
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

  const importedCount = importedIds.size;

  return (
    <div className="space-y-4">
      {isNative && (
        <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl p-5 text-white">
          <h3 className="text-lg font-bold mb-1">📱 Auto-Scan SMS</h3>
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
              {loading ? '⏳ Scanning...' : '🔍 Scan SMS for Transactions'}
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
            {isNative ? '📋 Or Paste SMS Manually' : '📱 Paste SMS'}
          </h3>
          {!isNative && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              PWA Mode
            </span>
          )}
        </div>

        {!isNative && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 mb-3">
            <p className="font-medium mb-0.5">💡 On Android?</p>
            <p className="text-blue-600 text-xs">
              Install the native app version to auto-scan your SMS inbox. In browser/PWA mode,
              paste bank/UPI SMS messages manually.
            </p>
          </div>
        )}

        <textarea
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          placeholder="Paste your bank/UPI transaction SMS here...&#10;&#10;Examples:&#10;• Rs.500 spent on Swiggy at 12:34 on 15-Jan&#10;• ₹1,200 debited from a/c **1234 at Amazon&#10;• UPI payment of ₹350 to PhonePe&#10;&#10;Paste multiple messages separated by blank lines."
          rows={5}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleParse}
            disabled={!smsText.trim()}
            className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔍 Parse SMS
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
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Detected Transactions ({results.length})
          </h3>
          {results.map((result, i) => {
            const key = `${result.date}-${result.amount}-${result.merchant || 'nomerchant'}-${i}`;
            const imported = importedIds.has(key);
            return (
              <div
                key={key}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  imported ? 'border-income-500/30 bg-green-50/50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        result.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {result.type.toUpperCase()}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {result.category}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {Math.round(result.confidence)}% confidence
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{result.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(result.date)}
                      {result.merchant && ` · ${result.merchant}`}
                    </p>
                    <p className="text-[11px] text-gray-300 mt-1 line-clamp-1">{result.raw}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${result.type === 'expense' ? 'text-expense-500' : 'text-income-500'}`}>
                      {result.type === 'expense' ? '-' : '+'}{formatCurrency(result.amount)}
                    </p>
                    <button
                      onClick={() => handleImport(result, i)}
                      disabled={imported}
                      className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        imported
                          ? 'bg-green-100 text-green-600 cursor-default'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                      }`}
                    >
                      {imported ? '✓ Imported' : '+ Import'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
            ].map((example, i) => (
              <button
                key={i}
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
