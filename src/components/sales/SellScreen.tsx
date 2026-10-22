import React, { useState, useMemo } from 'react';
import { Product } from '../../types/product';
import { SaleItem, PaymentMethod } from '../../types/sale';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise, rupeesToPaise } from '../../utils/currency';
import { matchProductSearch } from '../../locales/romanHindiMap';
import { BillModal } from './BillModal';
import { EmptyState } from '../common/EmptyState';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  CreditCard,
  QrCode,
  Banknote,
  BookOpen,
  CheckCircle2,
  X,
} from 'lucide-react';

export const SellScreen: React.FC = () => {
  const { products, customers, recordSale, activeShop } = useShop();
  const { t } = useI18n();

  // Search in catalog
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountRupees, setDiscountRupees] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [completedSale, setCompletedSale] = useState<any>(null);

  // Filtered available products for quick add
  const availableProducts = useMemo(() => {
    return products
      .filter(p => !p.archived && p.quantity > 0)
      .filter(p => matchProductSearch(p.name, searchQuery, p.category))
      .slice(0, 15);
  }, [products, searchQuery]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPaise: Math.round((item.quantity + 1) * item.sellingPricePaise),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unit: product.unit,
          sellingPricePaise: product.sellingPricePaise,
          purchasePricePaise: product.purchasePricePaise,
          totalPaise: product.sellingPricePaise,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              totalPaise: Math.round(newQty * item.sellingPricePaise),
            }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Calculations
  const subtotalPaise = cart.reduce((acc, item) => acc + item.totalPaise, 0);
  const discountPaise = rupeesToPaise(discountRupees);
  const totalPaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = activeShop?.billStyle === 'gst' ? Math.round(totalPaise * 0.05) : 0;

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const customer = customers.find(c => c.id === selectedCustomerId);
    const invoiceNumber = `INV-${Date.now().toString().slice(-4)}`;

    const sale = recordSale({
      invoiceNumber,
      items: cart,
      subtotalPaise,
      discountPaise,
      taxPaise,
      totalPaise,
      paymentMethod,
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      createdBy: activeShop?.ownerName || 'Owner',
    });

    setCompletedSale(sale);
    // Reset cart
    setCart([]);
    setDiscountRupees('');
    setSelectedCustomerId('');
  };

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PRODUCT SELECTION & SEARCH (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product to bill (or type 'chawal')..."
              className="w-full min-h-[48px] pl-11 pr-10 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm shadow-xs focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Item Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto no-scrollbar">
            {availableProducts.map(product => {
              const inCartItem = cart.find(i => i.productId === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer active:scale-98 ${
                    inCartItem
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Stock: {product.quantity} {product.unit}
                  </p>
                  <p className="text-sm font-bold text-teal-700 dark:text-teal-400 mt-1 tabular-nums">
                    {formatPaise(product.sellingPricePaise)}
                  </p>

                  {inCartItem && (
                    <span className="absolute top-2 right-2 bg-teal-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold tabular-nums">
                      {inCartItem.quantity}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CART & CHECKOUT (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-600" />
                <span>{t('sales.cart')}</span>
                <span className="text-xs font-normal text-slate-400">({cart.length} items)</span>
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">{t('sales.cartEmpty')}</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                {cart.map(item => (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        {formatPaise(item.sellingPricePaise)} / {item.unit}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs tabular-nums text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right shrink-0 w-16">
                      <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatPaise(item.totalPaise)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer (Udhaar / Credit mapping) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('sales.selectCustomer')}</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Walk-in Customer (नकद / पर्ची)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — Due: {formatPaise(c.currentBalancePaise)}
                  </option>
                ))}
              </select>
            </div>

            {/* Discount & Totals */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('common.discount')} (₹):</span>
                <input
                  type="number"
                  step="any"
                  value={discountRupees}
                  onChange={e => setDiscountRupees(e.target.value)}
                  placeholder="0.00"
                  className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-right text-xs font-mono tabular-nums"
                />
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t('common.subtotal')}:</span>
                <span className="tabular-nums font-semibold">{formatPaise(subtotalPaise)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>{t('common.total')}:</span>
                <span className="tabular-nums font-bold text-teal-700 dark:text-teal-400">
                  {formatPaise(totalPaise)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`min-h-[48px] py-2 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`min-h-[48px] py-2 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <QrCode className="w-4 h-4 text-teal-600" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`min-h-[48px] py-2 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('credit');
                  if (!selectedCustomerId && customers.length > 0) {
                    setSelectedCustomerId(customers[0].id);
                  }
                }}
                className={`min-h-[48px] py-2 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <BookOpen className="w-4 h-4 text-rose-600" />
                <span>Udhaar</span>
              </button>
            </div>

            {/* Complete Sale Button */}
            <button
              disabled={cart.length === 0}
              onClick={handleCompleteSale}
              className="w-full min-h-[50px] bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t('sales.completeSale')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bill Preview Modal after sale completion */}
      {completedSale && (
        <BillModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};
