import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise } from '../../utils/currency';
import { BackupDataSnapshot, BackupPreview } from '../../types/backup';
import {
  ShieldCheck,
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Clock,
  FileSpreadsheet,
  Cloud,
  RefreshCw,
} from 'lucide-react';

export const BackupScreen: React.FC = () => {
  const {
    activeShop,
    exportBackup,
    getBackupPreview,
    restoreBackup,
    updateShopSettings,
    deleteAccountAndShop,
    user,
    isSyncing,
    signInWithGoogle,
    signOutUser,
    syncToCloud,
  } = useShop();
  const { t } = useI18n();

  const [previewSnapshot, setPreviewSnapshot] = useState<BackupDataSnapshot | null>(null);
  const [previewMetrics, setPreviewMetrics] = useState<BackupPreview | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Manual Backup: Generates and downloads JSON snapshot
  const handleBackupNow = () => {
    const snapshot = exportBackup();
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `backup_${activeShop?.name || 'shop'}_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    updateShopSettings({ lastBackupAt: new Date().toISOString() });
    setStatusMessage('Backup file downloaded successfully!');
  };

  // Export Products to CSV / Excel
  const handleExportExcel = () => {
    const snapshot = exportBackup();
    const headers = ['Product Name', 'Category', 'Unit', 'Quantity', 'Selling Price (Rs)', 'Cost Price (Rs)', 'Location'];
    const rows = snapshot.products.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.category || '',
      p.unit,
      p.quantity.toString(),
      (p.sellingPricePaise / 100).toFixed(2),
      p.purchasePricePaise ? (p.purchasePricePaise / 100).toFixed(2) : '',
      p.shelfLocation || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file select for restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as BackupDataSnapshot;
        if (!parsed.products || !parsed.shop) {
          alert('Invalid backup file format.');
          return;
        }
        setPreviewSnapshot(parsed);
        setPreviewMetrics(getBackupPreview(parsed));
      } catch (err) {
        alert('Could not read backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Perform Restore with automatic safety backup
  const handleConfirmRestore = () => {
    if (!previewSnapshot) return;
    const result = restoreBackup(previewSnapshot, 'replace');
    setPreviewSnapshot(null);
    setPreviewMetrics(null);
    setStatusMessage(`Restored successfully! Automatic safety backup saved at ${result.safetyBackupKey}`);
  };

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-5">
      {/* Status banner */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Firebase Cloud Sync Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Firebase Cloud Sync & Multi-Device
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user ? (
                <span>Connected as <strong>{user.email}</strong> • Project: <code>yielding-cache-p01dl</code></span>
              ) : (
                <span>Sign in with Google to sync stocks, billing, and customer udhaar to Cloud Firestore.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {user ? (
            <button
              onClick={() => syncToCloud()}
              disabled={isSyncing}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync to Firestore Now'}</span>
            </button>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <Cloud className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Backup Status Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('backup.title')}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {activeShop?.lastBackupAt
                  ? `${t('backup.lastBackup')}: ${new Date(activeShop.lastBackupAt).toLocaleString('en-IN')}`
                  : t('backup.neverBackedUp')}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleBackupNow}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{t('backup.backupNow')}</span>
        </button>
      </div>

      {/* Export & Import Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export to Excel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{t('backup.exportExcel')}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Download your full stock list with quantities, prices, and godown locations in spreadsheet format.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Products CSV</span>
          </button>
        </div>

        {/* Restore Backup with Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>{t('backup.restoreTitle')}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a previous JSON backup file. A preview of records will be shown before any changes are applied.
            </p>
          </div>

          <label className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 cursor-pointer text-center">
            <Upload className="w-4 h-4" />
            <span>Select Backup File (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* RESTORE PREVIEW MODAL / CARD */}
      {previewSnapshot && previewMetrics && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>{t('backup.restorePreview')}</span>
            </div>
            <button
              onClick={() => {
                setPreviewSnapshot(null);
                setPreviewMetrics(null);
              }}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-400 block">Backup Date</span>
              <strong className="text-white text-xs">
                {new Date(previewMetrics.date).toLocaleDateString('en-IN')}
              </strong>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-400 block">Products</span>
              <strong className="text-white text-sm tabular-nums">{previewMetrics.productCount}</strong>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-400 block">Customers</span>
              <strong className="text-white text-sm tabular-nums">{previewMetrics.customerCount}</strong>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-400 block">Sales Invoices</span>
              <strong className="text-white text-sm tabular-nums">{previewMetrics.saleCount}</strong>
            </div>
          </div>

          <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>{t('backup.safetyBackupNotice')}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConfirmRestore}
              className="min-h-[48px] w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Restore Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Google Play Required: Delete Account and Shop Data */}
      <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-5 border border-rose-200 dark:border-rose-900 text-xs space-y-3">
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>{t('backup.deleteAccount')}</span>
        </h3>
        <p className="text-rose-600/90 dark:text-rose-300 leading-relaxed">
          {t('backup.deleteAccountWarning')} You can also submit an automated deletion request via email or our public web form.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Request Shop & Data Deletion
          </button>
        ) : (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-800 space-y-3">
            <p className="font-bold text-slate-900 dark:text-white">
              Are you absolutely sure? All products, sales, and customer ledgers will be permanently erased.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccountAndShop}
                className="min-h-[40px] px-4 py-1.5 bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Yes, Delete Everything Permanently
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
