import React, { useState, useMemo } from 'react';
import { Product } from '../../types/product';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { matchProductSearch } from '../../locales/romanHindiMap';
import { ProductCard } from './ProductCard';
import { QuickAddModal } from './QuickAddModal';
import { StockMovementModal } from './StockMovementModal';
import { EmptyState } from '../common/EmptyState';
import {
  Search,
  Plus,
  SlidersHorizontal,
  Package,
  Layers,
  Archive,
  ArrowUpDown,
  X,
} from 'lucide-react';

export const StockScreen: React.FC = () => {
  const { products, categories, activeShop } = useShop();
  const { t } = useI18n();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'recent'>('recent');

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);

  const threshold = activeShop?.lowStockThresholdDefault || 5;

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Archive filter
      if (stockFilter === 'archived') {
        if (!p.archived) return false;
      } else {
        if (p.archived) return false;
      }

      // 2. Stock Health filter
      if (stockFilter === 'low') {
        if (p.quantity <= 0 || p.quantity > (p.minStockAlert ?? threshold)) return false;
      } else if (stockFilter === 'out') {
        if (p.quantity > 0) return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // 4. Roman-Hindi / English / Hindi Search matching
      if (searchQuery.trim()) {
        const matches = matchProductSearch(p.name, searchQuery, p.category);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stockAsc') return a.quantity - b.quantity;
      if (sortBy === 'stockDesc') return b.quantity - a.quantity;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy, threshold]);

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-4">
      {/* 1. SEARCH BAR WITH ROMAN-HINDI PHONETIC MATCHING */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('common.search')}
          className="w-full min-h-[48px] pl-11 pr-10 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm shadow-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. FILTER STRIP: Status Pills & Category Horizontal Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Status: All */}
        <button
          onClick={() => setStockFilter('all')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            stockFilter === 'all'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          {t('common.all')} ({products.filter(p => !p.archived).length})
        </button>

        {/* Status: Low Stock */}
        <button
          onClick={() => setStockFilter('low')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            stockFilter === 'low'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 hover:bg-amber-50'
          }`}
        >
          {t('stock.lowStock')}
        </button>

        {/* Status: Out of Stock */}
        <button
          onClick={() => setStockFilter('out')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            stockFilter === 'out'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-50'
          }`}
        >
          {t('stock.outOfStock')}
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Category: All categories toggle */}
        <button
          onClick={() => setSelectedCategory('all')}
          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-800 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          All Categories
        </button>

        {/* Category Pills */}
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === cat.name
                ? 'bg-teal-800 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}

        {/* Status: Archived */}
        <button
          onClick={() => setStockFilter('archived')}
          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
            stockFilter === 'archived'
              ? 'bg-slate-800 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{t('stock.archived')}</span>
        </button>
      </div>

      {/* 3. PRODUCT LIST / GRID */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={searchQuery ? 'No matching items found' : 'Your stock catalog is empty'}
          description={
            searchQuery
              ? `No products found for "${searchQuery}". Check spelling or try searching in Hindi / English.`
              : 'Tap the button below to add your first product in 3 quick taps.'
          }
          actionLabel={searchQuery ? 'Clear Search' : '+ Add First Product'}
          onAction={searchQuery ? () => setSearchQuery('') : () => setIsQuickAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={p => {
                setProductToEdit(p);
                setIsQuickAddOpen(true);
              }}
              onStockMovement={p => setMovementProduct(p)}
            />
          ))}
        </div>
      )}

      {/* 4. FLOATING QUICK ADD BUTTON (+) */}
      <button
        onClick={() => {
          setProductToEdit(null);
          setIsQuickAddOpen(true);
        }}
        aria-label="Quick Add Product"
        className="fixed right-5 bottom-20 z-30 w-14 h-14 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {movementProduct && (
        <StockMovementModal
          product={movementProduct}
          onClose={() => setMovementProduct(null)}
        />
      )}
    </div>
  );
};
