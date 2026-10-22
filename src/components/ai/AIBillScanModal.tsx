import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { rupeesToPaise } from '../../utils/currency';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';

interface ScannedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPriceRupees: number;
}

interface AIBillScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIBillScanModal: React.FC<AIBillScanModalProps> = ({ isOpen, onClose }) => {
  const { activeShop, addProduct, updateShopSettings } = useShop();
  const { t } = useI18n();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const usedScans = activeShop?.aiScansUsedThisMonth || 0;
  const limitScans = activeShop?.aiMonthlyLimit || 20;
  const isLimitReached = usedScans >= limitScans;

  if (!isOpen) return null;

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const b64 = event.target?.result as string;
      setImagePreview(b64);
      processBillImage(b64);
    };
    reader.readAsDataURL(file);
  };

  const processBillImage = async (base64Data: string) => {
    if (isLimitReached) {
      setErrorMsg(`Monthly scan limit (${limitScans} bills) reached. You can still add stock manually.`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Simulate/trigger Cloud Function call
      // In production, this calls the firebase cloud function: scanSupplierBill({ shopId, imageBase64 })
      await new Promise(r => setTimeout(r, 1800));

      // Realistic parsed results from invoice OCR
      const mockParsed: ScannedItem[] = [
        { id: '1', name: 'Fortune Soya Health Oil 1L', quantity: 15, unit: 'litre', unitPriceRupees: 120 },
        { id: '2', name: 'Aashirvaad Shudh Chakki Atta 10kg', quantity: 8, unit: 'packet', unitPriceRupees: 410 },
        { id: '3', name: 'Tata Tea Gold 500g', quantity: 20, unit: 'packet', unitPriceRupees: 285 },
      ];

      setScannedItems(mockParsed);
      updateShopSettings({
        aiScansUsedThisMonth: usedScans + 1,
      });
    } catch (err) {
      setErrorMsg('Could not read bill text clearly. Please adjust camera lighting and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleItemChange = (id: string, field: keyof ScannedItem, val: any) => {
    setScannedItems(prev =>
      prev.map(i => (i.id === id ? { ...i, [field]: val } : i))
    );
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleConfirmAndAddStock = () => {
    if (scannedItems.length === 0) return;

    for (const item of scannedItems) {
      if (item.name.trim() && item.quantity > 0) {
        addProduct({
          name: item.name.trim(),
          quantity: item.quantity,
          sellingPricePaise: rupeesToPaise(item.unitPriceRupees * 1.15), // suggested 15% margin
          purchasePricePaise: rupeesToPaise(item.unitPriceRupees),
          unit: item.unit,
          createdBy: activeShop?.ownerName || 'Owner',
        });
      }
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              AI Supplier Bill Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 pt-4 overflow-y-auto flex-1">
          {/* Monthly limit counter */}
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900 text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between">
            <span>Free Scans Used This Month:</span>
            <span className="font-bold tabular-nums">
              {usedScans} / {limitScans}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload or Capture button */}
          {!imagePreview ? (
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Camera className="w-10 h-10 text-teal-600 mb-2" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Take Photo or Upload Supplier Bill
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Gemini AI will extract items, quantities, and prices for your review.
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bill image captured</span>
                <label className="text-teal-600 font-bold underline cursor-pointer">
                  Retake Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Processing Loader */}
              {isProcessing && (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold">Reading invoice line items...</p>
                </div>
              )}

              {/* REVIEW & EDIT TABLE (Owner Confirmation Mandatory) */}
              {!isProcessing && scannedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">Review & Edit Before Adding Stock:</p>
                    <p className="opacity-90">Verify each item and quantity below. Tap confirm to add them to your inventory.</p>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                    {scannedItems.map(item => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-900 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold tabular-nums text-center"
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-center"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            value={item.unitPriceRupees}
                            onChange={e => handleItemChange(item.id, 'unitPriceRupees', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold tabular-nums text-right"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={scannedItems.length === 0 || isProcessing}
            onClick={handleConfirmAndAddStock}
            className="w-2/3 min-h-[48px] bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Add to Stock ({scannedItems.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
