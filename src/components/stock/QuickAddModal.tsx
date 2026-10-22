import React, { useState, useEffect } from 'react';
import { Product } from '../../types/product';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { rupeesToPaise, paiseToRupees } from '../../utils/currency';
import { AVAILABLE_UNITS } from '../../utils/unitConversion';
import { findSimilarProduct } from '../../locales/romanHindiMap';
import { X, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, categories, products, activeShop } = useShop();
  const { t } = useI18n();

  // Required Fields
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [sellingPrice, setSellingPrice] = useState('');
  const [unit, setUnit] = useState('piece');

  // Optional Fields
  const [showMore, setShowMore] = useState(false);
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  // Duplicate Warning State
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [ignoreWarning, setIgnoreWarning] = useState(false);

  // Populate when editing
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setQuantity(productToEdit.quantity.toString());
      setSellingPrice(paiseToRupees(productToEdit.sellingPricePaise).toString());
      setUnit(productToEdit.unit || 'piece');
      setCategory(productToEdit.category || '');
      setBrand(productToEdit.brand || '');
      setPurchasePrice(
        productToEdit.purchasePricePaise
          ? paiseToRupees(productToEdit.purchasePricePaise).toString()
          : ''
      );
      setShelfLocation(productToEdit.shelfLocation || '');
      setMinStockAlert(productToEdit.minStockAlert ? productToEdit.minStockAlert.toString() : '5');
      setExpiryDate(productToEdit.expiryDate || '');
      setBatchNumber(productToEdit.batchNumber || '');
      setShowMore(Boolean(productToEdit.brand || productToEdit.shelfLocation || productToEdit.purchasePricePaise));
    } else {
      // Default reset
      setName('');
      setQuantity('1');
      setSellingPrice('');
      setUnit(activeShop?.currencyCode === 'INR' ? 'piece' : 'piece');
      setCategory(categories[0]?.name || '');
      setBrand('');
      setPurchasePrice('');
      setShelfLocation('');
      setMinStockAlert('5');
      setExpiryDate('');
      setBatchNumber('');
      setShowMore(false);
      setDuplicateWarning(null);
      setIgnoreWarning(false);
    }
  }, [productToEdit, isOpen, categories, activeShop]);

  // Check for duplicate/similar names
  useEffect(() => {
    if (!productToEdit && name.trim().length >= 3 && !ignoreWarning) {
      const existingNames = products.map(p => p.name);
      const similar = findSimilarProduct(name, existingNames);
      setDuplicateWarning(similar);
    } else {
      setDuplicateWarning(null);
    }
  }, [name, products, productToEdit, ignoreWarning]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedQty = parseFloat(quantity) || 0;
    const parsedSellingPricePaise = rupeesToPaise(sellingPrice);
    const parsedPurchasePricePaise = purchasePrice.trim()
      ? rupeesToPaise(purchasePrice)
      : undefined;
    const parsedMinStock = minStockAlert.trim() ? parseInt(minStockAlert, 10) : undefined;

    if (productToEdit && productToEdit.id) {
      updateProduct(productToEdit.id, {
        name: name.trim(),
        quantity: parsedQty,
        sellingPricePaise: parsedSellingPricePaise,
        unit,
        category: category.trim() || undefined,
        brand: brand.trim() || undefined,
        purchasePricePaise: parsedPurchasePricePaise,
        shelfLocation: shelfLocation.trim() || undefined,
        minStockAlert: parsedMinStock,
        expiryDate: expiryDate.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
      });
    } else {
      addProduct({
        name: name.trim(),
        quantity: parsedQty,
        sellingPricePaise: parsedSellingPricePaise,
        unit,
        category: category.trim() || undefined,
        brand: brand.trim() || undefined,
        purchasePricePaise: parsedPurchasePricePaise,
        shelfLocation: shelfLocation.trim() || undefined,
        minStockAlert: parsedMinStock,
        expiryDate: expiryDate.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
        createdBy: activeShop?.ownerName || 'Owner',
      });
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {productToEdit && productToEdit.id ? t('stock.editProduct') : t('stock.quickAdd')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* Duplicate Product Alert Warning */}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold">
                  {t('stock.duplicateWarning', { name: duplicateWarning })}
                </p>
                <button
                  type="button"
                  onClick={() => setIgnoreWarning(true)}
                  className="mt-1 font-bold underline cursor-pointer"
                >
                  Yes, this is a different item
                </button>
              </div>
            </div>
          )}

          {/* REQUIRED FIELD 1: Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('stock.productName')} *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('stock.productNamePlaceholder')}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* REQUIRED FIELD 2 & 3: Quantity + Unit + Selling Price */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('stock.quantity')} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold tabular-nums focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('stock.unit')} *
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full min-h-[48px] px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              >
                {AVAILABLE_UNITS.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('stock.sellingPrice')} (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                placeholder="₹ 0.00"
                className="w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold tabular-nums focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Toggle More Details (Expandable) */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="w-full py-2 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{showMore ? 'Hide Extra Details' : '+ Add More Details (Category, Brand, Godown, Cost)'}</span>
            {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showMore && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t('stock.category')}
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Spices or Oils"
                    list="category-suggestions"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="category-suggestions">
                    {categories.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t('stock.brand')}
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g. Tata, Amul, Fortune"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t('stock.purchasePrice')} (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(e.target.value)}
                    placeholder="For profit calculation"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm tabular-nums focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t('stock.shelfLocation')}
                  </label>
                  <input
                    type="text"
                    value={shelfLocation}
                    onChange={e => setShelfLocation(e.target.value)}
                    placeholder="e.g. Shelf A-2 / Godown"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t('stock.minStockAlert')}
                  </label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(e.target.value)}
                    placeholder="5"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm tabular-nums focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t('stock.expiryDate')}
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="w-2/3 min-h-[48px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-5 h-5" />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
