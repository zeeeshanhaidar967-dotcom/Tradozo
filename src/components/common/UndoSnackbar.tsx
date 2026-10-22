import React from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { RotateCcw, X } from 'lucide-react';

export const UndoSnackbar: React.FC = () => {
  const { undoAction, setUndoAction } = useShop();
  const { t } = useI18n();

  if (!undoAction) return null;

  return (
    <aside
      aria-label="Undo Action Alert"
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900 text-white dark:bg-slate-800 rounded-xl shadow-2xl p-3 flex items-center justify-between gap-3 border border-slate-700 animate-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm truncate font-medium">{undoAction.message}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            undoAction.onUndo();
            setUndoAction(null);
          }}
          className="min-h-[44px] px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('common.undo')}</span>
        </button>
        <button
          onClick={() => setUndoAction(null)}
          aria-label="Dismiss alert"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
