import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { ReportsScreen } from '../reports/ReportsScreen';
import { SuppliersScreen } from '../suppliers/SuppliersScreen';
import { StockCountScreen } from '../audit/StockCountScreen';
import { BackupScreen } from '../backup/BackupScreen';
import { RecycleBinScreen } from '../recycle/RecycleBinScreen';
import { TeamScreen } from '../team/TeamScreen';
import { AIBillScanModal } from '../ai/AIBillScanModal';
import {
  BarChart3,
  Truck,
  ClipboardCheck,
  Sparkles,
  Database,
  Trash2,
  Users,
  Settings,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  HelpCircle,
  Star,
} from 'lucide-react';

type SubView =
  | 'menu'
  | 'reports'
  | 'suppliers'
  | 'audit'
  | 'backup'
  | 'recycle'
  | 'team'
  | 'settings'
  | 'privacy';

export const MoreScreen: React.FC = () => {
  const { activeShop, trash, updateShopSettings } = useShop();
  const { t } = useI18n();

  const [currentView, setCurrentView] = useState<SubView>('menu');
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Settings State
  const [name, setName] = useState(activeShop?.name || '');
  const [phone, setPhone] = useState(activeShop?.phone || '');
  const [address, setAddress] = useState(activeShop?.address || '');
  const [upiId, setUpiId] = useState(activeShop?.upiId || '');
  const [gstin, setGstin] = useState(activeShop?.gstin || '');
  const [header, setHeader] = useState(activeShop?.receiptHeader || '');
  const [footer, setFooter] = useState(activeShop?.receiptFooter || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopSettings({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      upiId: upiId.trim() || undefined,
      gstin: gstin.trim() || undefined,
      receiptHeader: header.trim(),
      receiptFooter: footer.trim(),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  if (currentView === 'reports') {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => setCurrentView('menu')}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <ReportsScreen />
      </div>
    );
  }

  if (currentView === 'suppliers') {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => setCurrentView('menu')}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <SuppliersScreen />
      </div>
    );
  }

  if (currentView === 'audit') {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => setCurrentView('menu')}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <StockCountScreen />
      </div>
    );
  }

  if (currentView === 'backup') {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => setCurrentView('menu')}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <BackupScreen />
      </div>
    );
  }

  if (currentView === 'recycle') {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => setCurrentView('menu')}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <RecycleBinScreen />
      </div>
    );
  }

  if (currentView === 'team') {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => setCurrentView('menu')}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <TeamScreen />
      </div>
    );
  }

  if (currentView === 'privacy') {
    return (
      <div className="pb-28 max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <button
          onClick={() => setCurrentView('menu')}
          className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-xs leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Privacy Policy & Data Safety</h2>
          <p>
            <strong>What Data is Collected:</strong> Shop name, inventory quantities, purchase costs, selling prices, sales invoices, and customer credit ledger balances. All data belongs exclusively to each shop owner.
          </p>
          <p>
            <strong>Storage & Security:</strong> Data is persisted locally on your device with offline support and synchronized with encrypted multi-tenant Google Cloud Firestore collections. Cross-shop reads and writes are mathematically forbidden by Attribute-Based Access Control rules.
          </p>
          <p>
            <strong>Data Retention & Deletion:</strong> You have full sovereignty over your data. You may download JSON or Excel backups at any time, or request complete account and data deletion from the Backup & Safety tab.
          </p>
          <p>
            <strong>Google Play Data Safety Form:</strong> We do not share personal or commercial shop data with third parties. Analytics and crash reports collect no financial or customer PII.
          </p>
        </div>
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="pb-28 max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <button
          onClick={() => setCurrentView('menu')}
          className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Shop Settings</h2>

          {settingsSaved && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
              Settings saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shop Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  UPI ID (QR Code)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shop Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bill Style
                </label>
                <select
                  value={activeShop?.billStyle}
                  onChange={e => updateShopSettings({ billStyle: e.target.value as any })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="simple">Simple Cash Receipt</option>
                  <option value="gst">Tax Invoice (GST)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Footer Greeting
              </label>
              <input
                type="text"
                value={footer}
                onChange={e => setFooter(e.target.value)}
                placeholder="e.g. Thank you for your business! Please visit again."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow cursor-pointer transition-all"
            >
              Save Shop Settings
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DEFAULT HUB MENU
  const menuSections = [
    {
      title: 'Operations & Intelligence',
      items: [
        { id: 'reports', label: 'Business Reports & Gross Profit', icon: BarChart3, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
        { id: 'suppliers', label: 'Suppliers & Purchase Orders', icon: Truck, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
        { id: 'audit', label: 'Stock Count Mode (Shelf Audit)', icon: ClipboardCheck, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
        { id: 'ai', label: 'Scan Supplier Bill (AI OCR)', icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40', onClick: () => setIsAIOpen(true) },
      ],
    },
    {
      title: 'Data & Administration',
      items: [
        { id: 'backup', label: 'Backup, Export & Restore Safety', icon: Database, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
        { id: 'recycle', label: `Recycle Bin (${trash.length} items)`, icon: Trash2, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
        { id: 'team', label: 'Team Roles & Permissions', icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
        { id: 'settings', label: 'Shop Settings & Bill Styles', icon: Settings, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
      ],
    },
    {
      title: 'Compliance & Support',
      items: [
        { id: 'privacy', label: 'Privacy Policy & Play Data Safety', icon: ShieldCheck, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
        { id: 'support', label: 'Contact Support & Feedback', icon: HelpCircle, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800', onClick: () => alert('Support email: support@vyaparstock.in') },
      ],
    },
  ];

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-6">
      {menuSections.map((section, sIdx) => (
        <section key={sIdx} className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            {section.title}
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else {
                      setCurrentView(item.id as SubView);
                    }
                  }}
                  className="w-full min-h-[56px] px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <AIBillScanModal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
};
