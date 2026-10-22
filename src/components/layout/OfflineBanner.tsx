import React from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { WifiOff, CloudUpload } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingSyncCount } = useShop();
  const { t } = useI18n();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      role="status"
      className="bg-amber-600 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <CloudUpload className="w-3.5 h-3.5 animate-spin" />}
          <span>
            {!isOnline
              ? t('common.offline')
              : `${pendingSyncCount} ${t('common.syncing')}`}
          </span>
        </div>
        <span className="text-[11px] opacity-90 hidden sm:inline">
          All data is safe on this device
        </span>
      </div>
    </div>
  );
};
