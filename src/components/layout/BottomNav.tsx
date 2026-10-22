import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { Home, Package, ShoppingCart, Users, Menu } from 'lucide-react';

export type NavTab = 'home' | 'stock' | 'sell' | 'customers' | 'more';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, cartCount = 0 }) => {
  const { t } = useI18n();

  const tabs: { id: NavTab; labelKey: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', labelKey: 'nav.home', icon: Home },
    { id: 'stock', labelKey: 'nav.stock', icon: Package },
    { id: 'sell', labelKey: 'nav.sell', icon: ShoppingCart, badge: cartCount },
    { id: 'customers', labelKey: 'nav.customers', icon: Users },
    { id: 'more', labelKey: 'nav.more', icon: Menu },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg transition-colors"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              aria-label={t(tab.labelKey)}
              className={`min-h-[48px] flex flex-col items-center justify-center relative transition-transform active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-teal-700 dark:text-teal-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-teal-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center tabular-nums">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] tracking-tight mt-1 truncate max-w-[64px]">
                {t(tab.labelKey)}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
