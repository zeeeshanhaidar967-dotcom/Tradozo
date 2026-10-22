import React, { useState } from 'react';
import { Product } from '../../types/product';
import { formatPaise } from '../../utils/currency';
import { useShop } from '../../context/ShopContext';
import {
  Plus,
  Minus,
  MoreVertical,
  Archive,
  Trash2,
  Copy,
  ArrowUpDown,
  Edit,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onStockMovement: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onStockMovement,
}) => {
  const { adjustStock, deleteProductToTrash, updateProduct, activeShop } = useShop();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [typedQty, setTypedQty] = useState(product.quantity.toString());

  // Determine stock health state
  const threshold = product.minStockAlert ?? (activeShop?.lowStockThresholdDefault || 5);
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= threshold;

  const handleQuickAdjust = (delta: number) => {
    // Haptic feedback if supported by browser/device
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    adjustStock(
      product.id,
      delta,
      delta > 0 ? 'purchase' : 'sale',
      `Quick ${delta > 0 ? '+' : '-'}${Math.abs(delta)} stepper`
    );
  };

  const handleSaveDirectQuantity = () => {
    const parsed = parseFloat(typedQty);
    if (!isNaN(parsed) && parsed >= 0) {
      const delta = parsed - product.quantity;
      if (delta !== 0) {
        adjustStock(
          product.id,
          delta,
          'correction',
          `Manual direct quantity set to ${parsed}`
        );
      }
    }
    setIsEditingQty(false);
  };

  const handleDuplicate = () => {
    onEdit({
      ...product,
      id: '',
      name: `${product.name} (Copy)`,
    });
    setShowMenu(false);
  };

  const handleToggleArchive = () => {
    updateProduct(product.id, { archived: !product.archived });
    setShowMenu(false);
  };

  const handleDelete = () => {
    deleteProductToTrash(product.id);
    setShowMenu(false);
  };

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative transition-all hover:shadow-md">
      {/* Top row: Title, Category, Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {product.category && <span>{product.category}</span>}
            {product.category && product.brand && <span aria-hidden="true">·</span>}
            {product.brand && <span>{product.brand}</span>}
            {(product.category || product.brand) && product.shelfLocation && <span aria-hidden="true">·</span>}
            {product.shelfLocation && <span>📍 {product.shelfLocation}</span>}
          </div>
        </div>

        {/* 3-dots Menu Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label={`Product actions for ${product.name}`}
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs divide-y divide-slate-100 dark:divide-slate-700"
              onMouseLeave={() => setShowMenu(false)}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onStockMovement(product);
                    setShowMenu(false);
                  }}
                  className="w-full min-h-[40px] px-3.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer text-left"
                >
                  <ArrowUpDown className="w-4 h-4 text-teal-600" />
                  <span>Stock In / Out</span>
                </button>
                <button
                  onClick={() => {
                    onEdit(product);
                    setShowMenu(false);
                  }}
                  className="w-full min-h-[40px] px-3.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer text-left"
                >
                  <Edit className="w-4 h-4 text-slate-500" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full min-h-[40px] px-3.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer text-left"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Make Copy</span>
                </button>
              </div>
              <div className="py-1">
                <button
                  onClick={handleToggleArchive}
                  className="w-full min-h-[40px] px-3.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer text-left"
                >
                  <Archive className="w-4 h-4 text-amber-600" />
                  <span>{product.archived ? 'Unarchive' : 'Archive Product'}</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full min-h-[40px] px-3.5 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 cursor-pointer text-left"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete to Recycle Bin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle row: Price & Stock Status indicator */}
      <div className="my-3 flex items-baseline justify-between">
        <div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatPaise(product.sellingPricePaise)}
          </span>
          <span className="text-xs text-slate-500 ml-1">/ {product.unit}</span>
          {product.purchasePricePaise ? (
            <span className="text-[11px] text-slate-400 block tabular-nums">
              Cost: {formatPaise(product.purchasePricePaise)}
            </span>
          ) : null}
        </div>

        {/* Status indicator */}
        <div className="text-right">
          {isOutOfStock ? (
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Low Stock (min {threshold})
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: Rapid +/- Stepper with big touch targets */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {/* Direct number editing or display */}
        {isEditingQty ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="any"
              autoFocus
              value={typedQty}
              onChange={e => setTypedQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveDirectQuantity()}
              className="w-20 px-2 py-1 text-sm font-bold border border-teal-600 rounded-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 tabular-nums"
            />
            <button
              onClick={handleSaveDirectQuantity}
              className="px-2 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTypedQty(product.quantity.toString());
              setIsEditingQty(true);
            }}
            aria-label={`Edit quantity of ${product.name}`}
            className="text-left group cursor-pointer"
          >
            <span className="text-xs text-slate-400 block">Current Qty</span>
            <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
              {product.quantity} <span className="text-xs font-medium text-slate-500">{product.unit}</span>
            </span>
          </button>
        )}

        {/* Stepper Buttons: Minimum 48px hitboxes */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuickAdjust(-1)}
            disabled={product.quantity <= 0}
            aria-label={`Decrease quantity of ${product.name}`}
            className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg active:scale-95 transition-all cursor-pointer"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleQuickAdjust(1)}
            aria-label={`Increase quantity of ${product.name}`}
            className="w-12 h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center font-bold text-lg active:scale-95 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </article>
  );
};
