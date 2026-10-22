import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { ClipboardCheck, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

export const StockCountScreen: React.FC = () => {
  const { products, adjustStock, activeShop } = useShop();
  const { t } = useI18n();

  // Map of productId -> counted number string
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  const activeProducts = products.filter(p => !p.archived);

  const handleCountChange = (productId: string, val: string) => {
    setCounts(prev => ({ ...prev, [productId]: val }));
    setIsSaved(false);
  };

  // Find products with differences entered
  const differences = activeProducts.map(p => {
    const rawCount = counts[p.id];
    if (rawCount === undefined || rawCount.trim() === '') {
      return { product: p, diff: 0, counted: p.quantity, hasEntry: false };
    }
    const counted = parseFloat(rawCount) || 0;
    const diff = counted - p.quantity;
    return { product: p, diff, counted, hasEntry: true };
  });

  const changedItems = differences.filter(d => d.hasEntry && d.diff !== 0);

  const handleApplyAdjustments = () => {
    if (changedItems.length === 0) return;

    for (const item of changedItems) {
      adjustStock(
        item.product.id,
        item.diff,
        'stock_count',
        `Physical stock audit count: set to ${item.counted} (diff: ${item.diff > 0 ? '+' : ''}${item.diff})`
      );
    }

    setCounts({});
    setIsSaved(true);
  };

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('audit.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('audit.subtitle')}
            </p>
          </div>
        </div>

        {changedItems.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{changedItems.length} products have quantity differences</span>
            </span>
            <button
              onClick={handleApplyAdjustments}
              className="min-h-[44px] px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              {t('audit.saveAdjustments')}
            </button>
          </div>
        )}

        {isSaved && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All stock counts successfully synchronized with audit history!</span>
          </div>
        )}
      </div>

      {/* Audit Rows Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 grid grid-cols-12 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="col-span-5 sm:col-span-6">Product / Location</div>
          <div className="col-span-3 sm:col-span-2 text-center">{t('audit.systemStock')}</div>
          <div className="col-span-4 text-center">{t('audit.physicalCount')}</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
          {activeProducts.map(product => {
            const currentEntry = counts[product.id] ?? '';
            const numCount = parseFloat(currentEntry);
            const hasDiff = currentEntry !== '' && !isNaN(numCount) && numCount !== product.quantity;
            const diffVal = hasDiff ? numCount - product.quantity : 0;

            return (
              <div
                key={product.id}
                className="p-3.5 grid grid-cols-12 items-center gap-2 text-xs"
              >
                <div className="col-span-5 sm:col-span-6 min-w-0 pr-2">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {product.category || 'General'} {product.shelfLocation ? `· 📍 ${product.shelfLocation}` : ''}
                  </p>
                </div>

                <div className="col-span-3 sm:col-span-2 text-center font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {product.quantity} <span className="text-[10px] text-slate-400 font-normal">{product.unit}</span>
                </div>

                <div className="col-span-4 flex items-center justify-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    value={currentEntry}
                    placeholder={product.quantity.toString()}
                    onChange={e => handleCountChange(product.id, e.target.value)}
                    className="w-20 min-h-[40px] px-2 py-1 text-center font-bold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 tabular-nums focus:ring-2 focus:ring-teal-500"
                  />
                  {hasDiff && (
                    <span
                      className={`text-[11px] font-bold tabular-nums shrink-0 ${
                        diffVal > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {diffVal > 0 ? `+${diffVal}` : diffVal}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
