import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, DEFAULT_CATEGORIES } from '../db';
import { useCategories } from '../hooks/useCategories';
import { getAutoImportMerchants, removeAutoImportMerchant, clearAutoImportMerchants } from '../utils/autoImport';
import { TopBar } from '../components/ui/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { ArrowLeftIcon, DownloadIcon, UploadIcon, TrashIcon, CategoryIcon } from '../components/Icons';
import type { Category } from '../types';
import { theme } from '../theme';

const DEFAULT_NAMES = new Set(DEFAULT_CATEGORIES.map((c) => c.name));

export default function Settings() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const navigate = useNavigate();
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState<string>(theme.defaultCategoryColor);
  const [exportStatus, setExportStatus] = useState('');
  const [autoMerchants, setAutoMerchants] = useState(getAutoImportMerchants);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  const handleExport = useCallback(async () => {
    const transactions = await db.transactions.toArray();
    const data = { transactions, categories, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaikanakku-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    setNewCatColor(theme.defaultCategoryColor);
  }, [newCatName, newCatColor, addCategory]);

  const handleStartEdit = useCallback((cat: Category) => {
    setEditingCat(cat);
    setEditingName(cat.name);
    setEditingColor(cat.color);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingCat || !editingName.trim() || !editingCat.id) return;
    await updateCategory(editingCat.id, { name: editingName.trim(), color: editingColor });
    setEditingCat(null);
  }, [editingCat, editingName, editingColor, updateCategory]);

  const handleDeleteCategory = useCallback(async (cat: Category) => {
    if (!cat.id) return;
    if (!confirm(`Delete category "${cat.name}"? Existing transactions with this category will not be removed.`)) return;
    await deleteCategory(cat.id);
  }, [deleteCategory]);

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
      <div className="max-w-none lg:max-w-3xl lg:mx-auto w-full pt-4 space-y-4" style={{ paddingBottom: 'calc(var(--sab) + 1rem)' }}>
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
            {categories.map((cat) => {
              const isDefault = DEFAULT_NAMES.has(cat.name);
              const isEditing = editingCat?.id === cat.id;
              return (
                <div
                  key={cat.id || cat.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm group"
                  style={{ backgroundColor: `${cat.color || '#64748b'}1a` }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ color: cat.color || '#64748b' }}
                  >
                    <CategoryIcon name={cat.name} className="w-3.5 h-3.5" />
                  </span>
                  {isEditing ? (
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 min-w-0 text-sm font-medium bg-white/20 dark:bg-white/10 rounded-md px-1.5 py-0.5 text-label outline-none border border-separator/40"
                      />
                      <input
                        type="color"
                        value={editingColor}
                        onChange={(e) => setEditingColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="tap text-[10px] font-bold text-accent shrink-0 active:scale-90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="tap text-[10px] text-tertiary shrink-0 active:scale-90"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-label font-medium truncate flex-1">{cat.name}</span>
                      {!isDefault && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="tap p-0.5 rounded text-tertiary hover:text-label active:scale-90"
                            title="Edit category"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="tap p-0.5 rounded text-tertiary hover:text-danger active:scale-90"
                            title="Delete category"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
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
          <p className="text-sm text-secondary">KaiKanakku v1.0.0</p>
          <p className="text-xs text-tertiary mt-1">
            A local-first personal expense tracker. All data stays on your device using IndexedDB — nothing is ever sent to a server.
          </p>
        </Card>
      </div>
    </div>
  );
}
