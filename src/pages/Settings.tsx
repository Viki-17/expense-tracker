import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, DEFAULT_CATEGORIES } from '../db';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../contexts/ThemeProvider';
import { getAutoImportMerchants, removeAutoImportMerchant, clearAutoImportMerchants } from '../utils/autoImport';
import { TopBar } from '../components/ui/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { ArrowLeftIcon, SunIcon, MoonIcon, DownloadIcon, UploadIcon, TrashIcon, CategoryIcon } from '../components/Icons';

export default function Settings() {
  const { categories, addCategory } = useCategories();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [newCatName, setNewCatName] = useState('');
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
    clearAutoImportMerchants();
    window.location.reload();
  }, []);

  const handleAddCategory = useCallback(async () => {
    if (!newCatName.trim()) return;
    await addCategory({ name: newCatName.trim(), icon: 'other', color: newCatColor });
    setNewCatName('');
    setNewCatColor('#6366f1');
  }, [newCatName, newCatColor, addCategory]);

  return (
    <div>
      <TopBar
        title="Settings"
        leading={
          <IconButton label="Back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="w-5 h-5" />
          </IconButton>
        }
      />
      <div className="px-4 max-w-2xl mx-auto w-full pt-4 space-y-4" style={{ paddingBottom: 'calc(var(--sab) + 1rem)' }}>
        {/* Appearance */}
        <Card>
          <h3 className="text-sm font-bold text-label mb-3">Appearance</h3>
          <button
            onClick={toggle}
            className="tap w-full flex items-center justify-between p-3 rounded-xl bg-surface-2 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <MoonIcon className="w-5 h-5 text-accent" /> : <SunIcon className="w-5 h-5 text-warning" />}
              <div className="text-left">
                <p className="text-sm font-semibold text-label">{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
                <p className="text-xs text-tertiary">Tap to switch</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-accent' : 'bg-surface-3'}`}>
              <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
            </div>
          </button>
        </Card>

        {/* Data management */}
        <Card>
          <h3 className="text-sm font-bold text-label mb-3">Data Management</h3>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="tap w-full flex items-center gap-3 py-3 px-3 bg-surface-2 text-label rounded-xl font-medium text-sm active:scale-[0.99]"
            >
              <DownloadIcon className="w-5 h-5 text-secondary" /> Export Data (JSON)
            </button>
            <label className="tap w-full flex items-center gap-3 py-3 px-3 bg-surface-2 text-label rounded-xl font-medium text-sm cursor-pointer active:scale-[0.99]">
              <UploadIcon className="w-5 h-5 text-secondary" /> Import Backup
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            {exportStatus && <p className="text-sm text-center font-medium text-success">{exportStatus}</p>}
            <button
              onClick={handleReset}
              className="tap w-full flex items-center gap-3 py-3 px-3 bg-danger-soft text-danger rounded-xl font-medium text-sm active:scale-[0.99]"
            >
              <TrashIcon className="w-5 h-5" /> Reset All Data
            </button>
          </div>
        </Card>

        {/* Custom category */}
        <Card>
          <h3 className="text-sm font-bold text-label mb-3">Add Custom Category</h3>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name"
              className="flex-1"
            />
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-12 h-11 rounded-xl border border-separator/60 cursor-pointer bg-surface-2"
            />
            <Button onClick={handleAddCategory} disabled={!newCatName.trim()}>
              Add
            </Button>
          </div>
        </Card>

        {/* Categories list */}
        <Card>
          <h3 className="text-sm font-bold text-label mb-3">Categories ({categories.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id || cat.name}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ backgroundColor: `${cat.color || '#64748b'}1a` }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ color: cat.color || '#64748b' }}
                >
                  <CategoryIcon name={cat.name} className="w-3.5 h-3.5" />
                </span>
                <span className="text-label font-medium truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Auto-import merchants */}
        <Card>
          <h3 className="text-sm font-bold text-label mb-2">Auto-Import Merchants</h3>
          <p className="text-xs text-tertiary mb-4">
            SMS from these merchants are auto-imported during scans. Learned each time you manually import an SMS.
          </p>
          {autoMerchants.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-4">
              No auto-import merchants yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {autoMerchants.map((merchant) => (
                <span
                  key={merchant}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-soft text-accent rounded-full text-xs font-semibold"
                >
                  {merchant}
                  <button
                    onClick={() => {
                      removeAutoImportMerchant(merchant);
                      setAutoMerchants(getAutoImportMerchants());
                    }}
                    className="tap ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-accent/20"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* About */}
        <Card>
          <h3 className="text-sm font-bold text-label mb-2">About</h3>
          <p className="text-sm text-secondary">Expense Tracker v1.0.0</p>
          <p className="text-xs text-tertiary mt-1">
            A local-first expense tracker. All data stays on your device using IndexedDB — nothing is ever sent to a server.
          </p>
        </Card>
      </div>
    </div>
  );
}