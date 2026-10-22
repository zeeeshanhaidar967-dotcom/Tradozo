import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { EmptyState } from '../common/EmptyState';
import { Trash2, RotateCcw, AlertTriangle, X } from 'lucide-react';

export const RecycleBinScreen: React.FC = () => {
  const { trash, restoreFromTrash, permanentDeleteTrash } = useShop();
  const { t } = useI18n();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('recycleBin.title')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('recycleBin.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {trash.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title={t('recycleBin.emptyTrash')}
          description="When you delete a product, it remains here safely for 30 days before permanent deletion."
        />
      ) : (
        <div className="space-y-3">
          {trash.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.displayName}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Type: {item.entityType} · Deleted on: {new Date(item.deletedAt).toLocaleDateString('en-IN')} by {item.deletedBy}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => restoreFromTrash(item.id)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('recycleBin.restore')}</span>
                </button>

                {deleteConfirmId !== item.id ? (
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    {t('recycleBin.deleteForever')}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        permanentDeleteTrash(item.id);
                        setDeleteConfirmId(null);
                      }}
                      className="min-h-[40px] px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="min-h-[40px] px-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
