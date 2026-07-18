import { useState, useCallback } from 'react';
import { db, DEFAULT_CATEGORIES } from '../db';
import { useCategories } from '../hooks/useCategories';
import { getAutoImportMerchants, removeAutoImportMerchant } from '../utils/autoImport';

export default function Settings() {
  const { categories, addCategory } = useCategories();
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [exportStatus, setExportStatus] = useState('');
  const [autoMerchants, setAutoMerchants] = useState(getAutoImportMerchants);

  const handleExport = useCallback(async () => {
    const transactions = await db.transactions.toArray();
    const data = { transactions, categories, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('Exported successfully!');
    setTimeout(() => setExportStatus(''), 3000);
  }, [categories]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.transactions) {
          await db.transactions.clear();
          await db.transactions.bulkAdd(data.transactions);
        }
        if (data.categories) {
          await db.categories.clear();
          await db.categories.bulkAdd(data.categories);
        }
        setExportStatus('Data imported successfully!');
        setTimeout(() => setExportStatus(''), 3000);
        window.location.reload();
      } catch {
        setExportStatus('Invalid backup file');
        setTimeout(() => setExportStatus(''), 3000);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleReset = useCallback(async () => {
    if (!confirm('This will delete ALL your data. Are you sure?')) return;
    await db.transactions.clear();
    await db.categories.clear();
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    window.location.reload();
  }, []);

  const handleAddCategory = useCallback(async () => {
    if (!newCatName.trim()) return;
    await addCategory({ name: newCatName.trim(), icon: newCatIcon, color: newCatColor });
    setNewCatName('');
    setNewCatIcon('📌');
    setNewCatColor('#6366f1');
  }, [newCatName, newCatIcon, newCatColor, addCategory]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            📤 Export Data (JSON)
          </button>
          <label className="block w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium text-sm text-center hover:bg-gray-100 transition-colors cursor-pointer">
            📥 Import Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {exportStatus && (
            <p className="text-sm text-center font-medium text-income-600">{exportStatus}</p>
          )}
          <button
            onClick={handleReset}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors"
          >
            🗑 Reset All Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Add Custom Category</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          <input
            type="text"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="w-14 px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="w-12 h-11 rounded-xl border border-gray-200 cursor-pointer"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCatName.trim()}
            className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Categories ({categories.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: `${cat.color}10` }}
            >
              <span>{cat.icon}</span>
              <span className="text-gray-700">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Auto-Import Merchants</h3>
        <p className="text-xs text-gray-400 mb-4">
          SMS from these merchants are auto-imported during periodic scans. Merchants are learned each time you manually import an SMS.
        </p>
        {autoMerchants.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No auto-import merchants yet. Import an SMS manually to add its merchant here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {autoMerchants.map((merchant) => (
              <span
                key={merchant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium"
              >
                {merchant}
                <button
                  onClick={() => {
                    removeAutoImportMerchant(merchant);
                    setAutoMerchants(getAutoImportMerchants());
                  }}
                  className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
        <p className="text-sm text-gray-500">Expense Tracker PWA v1.0.0</p>
        <p className="text-xs text-gray-400 mt-1">
          A Progressive Web App for tracking expenses. Data is stored locally on your device using IndexedDB. 
          No data is ever sent to any server — your financial data stays private.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          SMS parsing supports common Indian bank formats (HDFC, ICICI, SBI, Axis, etc.) and UPI transaction messages.
        </p>
      </div>
    </div>
  );
}
