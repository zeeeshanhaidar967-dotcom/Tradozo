import React from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { Store, Globe, Wifi, WifiOff, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ darkMode, onToggleDarkMode }) => {
  const { activeShop, isOnline, pendingSyncCount, user, signInWithGoogle, signOutUser, isSyncing } = useShop();
  const { language, setLanguage, t } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand / Shop Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-700 dark:bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
              {activeShop ? activeShop.name : 'VyaparStock'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {activeShop ? activeShop.ownerName : t('onboarding.welcomeSubtitle')}
            </p>
          </div>
        </div>

        {/* Right: Actions (Language, Theme, Network Status) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sync status indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              isOnline
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
            }`}
            title={isOnline ? t('common.online') : `${t('common.offline')} (${pendingSyncCount})`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isOnline ? (pendingSyncCount > 0 ? `${pendingSyncCount} sync` : 'Synced') : 'Offline'}
            </span>
          </div>

          {/* Google Sign-in / Cloud Auth */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-teal-500 shadow-xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={signOutUser}
                title={`Signed in as ${user.email}. Click to sign out.`}
                className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer hidden md:inline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign in with Google to enable Firebase Cloud Backup & Multi-device Sync"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}

          {/* Language Toggle (EN / हिन्दी) */}
          <button
            onClick={toggleLanguage}
            aria-label="Switch Language"
            className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle Theme"
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
