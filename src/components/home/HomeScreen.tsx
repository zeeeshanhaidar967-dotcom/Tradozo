import React from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise } from '../../utils/currency';
import { NavTab } from '../layout/BottomNav';
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Users,
  PlusCircle,
  Receipt,
  BadgeDollarSign,
  ClipboardCheck,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
  onOpenReceivePayment: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenQuickAdd,
  onOpenReceivePayment,
}) => {
  const { products, sales, customers, stockMovements, activeShop } = useShop();
  const { t } = useI18n();

  // Calculate metrics for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
  const todaySalesTotalPaise = todaySales.reduce((acc, s) => acc + s.totalPaise, 0);
  const todayCashPaise = todaySales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.totalPaise, 0);

  // Customer Dues (Total Udhaar owed to shop)
  const totalCustomerDuesPaise = customers.reduce(
    (acc, c) => acc + Math.max(0, c.currentBalancePaise),
    0
  );

  // Low stock products count
  const threshold = activeShop?.lowStockThresholdDefault || 5;
  const lowStockCount = products.filter(
    p => !p.archived && p.quantity > 0 && p.quantity <= (p.minStockAlert ?? threshold)
  ).length;
  const outOfStockCount = products.filter(p => !p.archived && p.quantity <= 0).length;

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4 pt-4">
      {/* 1. TOP METRICS GRID (Today's Sales, Cash Received, Low Stock, Udhaar) */}
      <section aria-label="Key Performance Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('home.todaySales')}</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatPaise(todaySalesTotalPaise)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span>{todaySales.length} {t('common.items')} sold</span>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('home.cashCollected')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatPaise(todayCashPaise)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>In cash drawer</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigate('stock')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-shadow hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('home.lowStockAlerts')}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              lowStockCount + outOfStockCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight flex items-center justify-between">
            <span>{lowStockCount + outOfStockCount}</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
            <span>{outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'Needs reordering'}</span>
          </div>
        </div>

        {/* Customer Dues (Udhaar) */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-shadow hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('home.customerDues')}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight flex items-center justify-between">
            <span>{formatPaise(totalCustomerDuesPaise)}</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
            <span>From {customers.filter(c => c.currentBalancePaise > 0).length} customers</span>
          </div>
        </div>
      </section>

      {/* 2. FOUR BIG QUICK ACTION BUTTONS */}
      <section aria-label="Primary Quick Actions">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">
          {t('home.quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Action 1: Add Stock */}
          <button
            onClick={onOpenQuickAdd}
            className="min-h-[72px] p-4 bg-teal-700 hover:bg-teal-800 active:scale-98 text-white rounded-2xl shadow-sm flex flex-col justify-between transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between w-full">
              <PlusCircle className="w-5 h-5 text-teal-200" />
              <ArrowUpRight className="w-4 h-4 text-teal-300 opacity-80" />
            </div>
            <span className="font-bold text-sm tracking-tight">{t('home.addStock')}</span>
          </button>

          {/* Action 2: New Sale */}
          <button
            onClick={() => onNavigate('sell')}
            className="min-h-[72px] p-4 bg-indigo-700 hover:bg-indigo-800 active:scale-98 text-white rounded-2xl shadow-sm flex flex-col justify-between transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between w-full">
              <Receipt className="w-5 h-5 text-indigo-200" />
              <ArrowUpRight className="w-4 h-4 text-indigo-300 opacity-80" />
            </div>
            <span className="font-bold text-sm tracking-tight">{t('home.newSale')}</span>
          </button>

          {/* Action 3: Receive Payment */}
          <button
            onClick={onOpenReceivePayment}
            className="min-h-[72px] p-4 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-2xl shadow-sm flex flex-col justify-between transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between w-full">
              <BadgeDollarSign className="w-5 h-5 text-emerald-200" />
              <ArrowDownRight className="w-4 h-4 text-emerald-300 opacity-80" />
            </div>
            <span className="font-bold text-sm tracking-tight">{t('home.receivePayment')}</span>
          </button>

          {/* Action 4: Stock Count */}
          <button
            onClick={() => onNavigate('more')}
            className="min-h-[72px] p-4 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-2xl shadow-sm flex flex-col justify-between transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between w-full">
              <ClipboardCheck className="w-5 h-5 text-slate-300" />
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <span className="font-bold text-sm tracking-tight">{t('home.stockCount')}</span>
          </button>
        </div>
      </section>

      {/* 3. RECENT STOCK ACTIVITY LOG */}
      <section aria-label="Recent Stock Movements" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <span>{t('home.recentActivity')}</span>
          </h2>
          {stockMovements.length > 0 && (
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('common.viewAll')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {stockMovements.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            {t('home.noActivity')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stockMovements.slice(0, 5).map((mov, index) => {
              const isPositive = mov.deltaQuantity > 0;
              return (
                <div key={`${mov.id}_${index}`} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {mov.productName}
                    </p>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{t(`reasons.${mov.reason}` as any)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isPositive ? `+${mov.deltaQuantity}` : mov.deltaQuantity} {mov.unit}
                    </span>
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      {mov.previousQuantity} → {mov.newQuantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
