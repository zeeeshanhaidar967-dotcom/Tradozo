import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise } from '../../utils/currency';
import {
  TrendingUp,
  Download,
  AlertTriangle,
  Flame,
  Clock,
  CircleDollarSign,
  Calendar,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { sales, products, customers } = useShop();
  const { t } = useI18n();

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter sales by period
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      const saleDate = new Date(s.createdAt);
      if (period === 'today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      }
      if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= monthAgo;
      }
      return true;
    });
  }, [sales, period]);

  // Aggregate Metrics
  const totalRevenuePaise = filteredSales.reduce((acc, s) => acc + s.totalPaise, 0);

  // Profit calculation (only for items where purchase price was entered)
  const estimatedProfitPaise = filteredSales.reduce((acc, s) => {
    let saleProfit = 0;
    for (const item of s.items) {
      if (item.purchasePricePaise !== undefined && item.purchasePricePaise > 0) {
        saleProfit += (item.sellingPricePaise - item.purchasePricePaise) * item.quantity;
      }
    }
    return acc + saleProfit;
  }, 0);

  // Top Selling Items
  const itemVelocities: Record<string, { name: string; qty: number; revenuePaise: number }> = {};
  filteredSales.forEach(s => {
    s.items.forEach(i => {
      if (!itemVelocities[i.productId]) {
        itemVelocities[i.productId] = { name: i.name, qty: 0, revenuePaise: 0 };
      }
      itemVelocities[i.productId].qty += i.quantity;
      itemVelocities[i.productId].revenuePaise += i.totalPaise;
    });
  });

  const topItems = Object.values(itemVelocities)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Dead Stock (No sales in 60 days)
  const soldProductIds = new Set(sales.map(s => s.items.map(i => i.productId)).flat());
  const deadStock = products
    .filter(p => !p.archived && p.quantity > 0 && !soldProductIds.has(p.id))
    .slice(0, 5);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Customer', 'Items Count', 'Total (Rupees)', 'Payment Mode'];
    const rows = filteredSales.map(s => [
      s.invoiceNumber,
      new Date(s.createdAt).toLocaleDateString('en-IN'),
      s.customerName || 'Walk-in',
      s.items.length.toString(),
      (s.totalPaise / 100).toFixed(2),
      s.paymentMethod,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-5">
      {/* Top Strip: Timeframe Switcher & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setPeriod('today')}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'today'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('reports.today')}
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'week'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('reports.thisWeek')}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('reports.thisMonth')}
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{t('reports.exportReport')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('reports.totalRevenue')}</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatPaise(totalRevenuePaise)}
          </div>
          <p className="text-xs text-slate-400 mt-1">From {filteredSales.length} invoices generated</p>
        </div>

        {/* Gross Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t('reports.netProfit')}</span>
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {formatPaise(estimatedProfitPaise)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Calculated from items with purchase cost</p>
        </div>
      </div>

      {/* Two Column Grid: Top Selling vs Dead Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Selling */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{t('reports.topSelling')}</span>
          </h3>

          {topItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No sales recorded in this period.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-slate-400 tabular-nums">{item.qty} units sold</p>
                  </div>
                  <span className="font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                    {formatPaise(item.revenuePaise)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dead Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{t('reports.deadStock')}</span>
          </h3>

          {deadStock.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No slow-moving dead stock detected!</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {deadStock.map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-slate-400">{p.category || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {p.quantity} {p.unit}
                    </span>
                    <p className="text-[10px] text-slate-400">Worth {formatPaise(p.sellingPricePaise * p.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
