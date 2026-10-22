/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { I18nProvider } from './context/I18nContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { TopBar } from './components/layout/TopBar';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { UndoSnackbar } from './components/common/UndoSnackbar';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { HomeScreen } from './components/home/HomeScreen';
import { StockScreen } from './components/stock/StockScreen';
import { SellScreen } from './components/sales/SellScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { MoreScreen } from './components/more/MoreScreen';
import { QuickAddModal } from './components/stock/QuickAddModal';
import { PaymentModal } from './components/customers/PaymentModal';

const AppContent: React.FC = () => {
  const { activeShop, seedDemoForTesting, customers } = useShop();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [receivePaymentCustomer, setReceivePaymentCustomer] = useState<any>(null);

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vyapar_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('vyapar_dark_mode', darkMode.toString());
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Support ?autostart=1 query parameter for automated verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !activeShop) {
      seedDemoForTesting('kirana');
    }
  }, [activeShop, seedDemoForTesting]);

  // If no shop created yet, show onboarding
  if (!activeShop) {
    return <OnboardingWizard onComplete={() => setActiveTab('home')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Bar */}
      <TopBar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />

      {/* Offline / Pending Sync Banner */}
      <OfflineBanner />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={tab => setActiveTab(tab)}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onOpenReceivePayment={() => {
              if (customers.length > 0) {
                setReceivePaymentCustomer(customers[0]);
              } else {
                setActiveTab('customers');
              }
            }}
          />
        )}
        {activeTab === 'stock' && <StockScreen />}
        {activeTab === 'sell' && <SellScreen />}
        {activeTab === 'customers' && <CustomersScreen />}
        {activeTab === 'more' && <MoreScreen />}
      </main>

      {/* Fixed Ergonomic Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* 10-Second Undo Notification */}
      <UndoSnackbar />

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* Receive Payment Modal */}
      {receivePaymentCustomer && (
        <PaymentModal
          customer={receivePaymentCustomer}
          onClose={() => setReceivePaymentCustomer(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <I18nProvider>
      <ShopProvider>
        <AppContent />
      </ShopProvider>
    </I18nProvider>
  );
}
