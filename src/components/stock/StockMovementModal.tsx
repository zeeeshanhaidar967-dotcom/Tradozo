import React, { useState } from 'react';
import { Product, MovementReason } from '../../types/product';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { X, ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';

interface StockMovementModalProps {
  product: Product;
  onClose: () => void;
}

const REASONS: { id: MovementReason; labelKey: string }[] = [
  { id: 'purchase', labelKey: 'reasons.purchase' },
  { id: 'sale', labelKey: 'reasons.sale' },
  { id: 'damaged', labelKey: 'reasons.damaged' },
  { id: 'expired', labelKey: 'reasons.expired' },
  { id: 'lost', labelKey: 'reasons.lost' },
  { id: 'returned_to_supplier', labelKey: 'reasons.returned_to_supplier' },
  { id: 'customer_return', labelKey: 'reasons.customer_return' },
  { id: 'stock_count', labelKey: 'reasons.stock_count' },
  { id: 'correction', labelKey: 'reasons.correction' },
];

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  product,
  onClose,
}) => {
  const { adjustStock } = useShop();
  const { t } = useI18n();

  const [type, setType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<MovementReason>('purchase');
  const [note, setNote] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(quantity);
    if (isNaN(parsed) || parsed <= 0) return;

    const delta = type === 'in' ? parsed : -parsed;
    adjustStock(product.id, delta, reason, note.trim() || undefined);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
              {product.name}
            </h2>
            <p className="text-xs text-slate-500">
              Current: <strong className="tabular-nums">{product.quantity} {product.unit}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* Movement Direction Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('in');
                setReason('purchase');
              }}
              className={`min-h-[44px] py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'in'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>{t('stock.stockIn')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('out');
                setReason('damaged');
              }}
              className={`min-h-[44px] py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'out'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('stock.stockOut')}</span>
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quantity to {type === 'in' ? 'Add' : 'Deduct'} ({product.unit}) *
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold tabular-nums focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('stock.reason')} *
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as MovementReason)}
              className="w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
            >
              {REASONS.map(r => (
                <option key={r.id} value={r.id}>
                  {t(r.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Note / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t('common.notes')} ({t('common.optional')})
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Supplier invoice #1234 or broken during transit"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={`w-2/3 min-h-[48px] text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all ${
                type === 'in' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>Confirm Stock Change</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
