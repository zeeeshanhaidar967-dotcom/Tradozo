import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { ShopType, BillStyle } from '../../types/shop';
import { SHOP_TYPE_PRESETS } from '../../utils/shopPresets';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  Globe,
  Sparkles,
} from 'lucide-react';

const SHOP_TYPES: { id: ShopType; labelKey: string }[] = [
  { id: 'kirana', labelKey: 'shopTypes.kirana' },
  { id: 'hardware', labelKey: 'shopTypes.hardware' },
  { id: 'medical', labelKey: 'shopTypes.medical' },
  { id: 'clothing', labelKey: 'shopTypes.clothing' },
  { id: 'electronics', labelKey: 'shopTypes.electronics' },
  { id: 'mobile', labelKey: 'shopTypes.mobile' },
  { id: 'stationery', labelKey: 'shopTypes.stationery' },
  { id: 'paint', labelKey: 'shopTypes.paint' },
  { id: 'furniture', labelKey: 'shopTypes.furniture' },
  { id: 'marble_tiles', labelKey: 'shopTypes.marble_tiles' },
  { id: 'other', labelKey: 'shopTypes.other' },
];

export const OnboardingWizard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { createShop, seedDemoForTesting } = useShop();
  const { language, setLanguage, t } = useI18n();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedType, setSelectedType] = useState<ShopType>('kirana');
  const [billStyle, setBillStyle] = useState<BillStyle>('simple');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!shopName.trim()) errs.shopName = 'Please enter shop name';
    if (!ownerName.trim()) errs.ownerName = 'Please enter owner name';
    if (!phone.trim() || phone.trim().length < 10) errs.phone = 'Please enter valid 10-digit phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFinish = () => {
    const preset = SHOP_TYPE_PRESETS[selectedType] || SHOP_TYPE_PRESETS.other;

    createShop({
      name: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      gstin: gstin.trim() || undefined,
      upiId: upiId.trim() || undefined,
      shopType: selectedType,
      currencySymbol: '₹',
      currencyCode: 'INR',
      language,
      billStyle,
      receiptHeader: `${shopName.trim()}`,
      receiptFooter: 'Thank you for your business! Please visit again.',
      enabledFields: preset.defaultEnabledFields,
      lowStockThresholdDefault: 5,
      ownerId: `owner_${Date.now()}`,
    });

    if (onComplete) onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center px-4 py-8">
      <div className="max-w-lg w-full mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        {/* Progress indicators */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Step {step} of 4
              </span>
              <p className="text-xs text-slate-500">
                {step === 1 && 'Language & Start'}
                {step === 2 && 'Shop Details'}
                {step === 3 && 'Shop Category'}
                {step === 4 && 'Billing Preferences'}
              </p>
            </div>
          </div>
          {/* Quick Demo Pre-seed button for evaluation */}
          <button
            onClick={() => {
              seedDemoForTesting('kirana');
              if (onComplete) onComplete();
            }}
            className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Data</span>
          </button>
        </div>

        {/* STEP 1: Welcome & Language Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t('onboarding.welcomeTitle')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('onboarding.welcomeSubtitle')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-600" />
                <span>{t('onboarding.selectLanguage')}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`min-h-[48px] p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    language === 'en'
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`min-h-[48px] p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    language === 'hi'
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                  {language === 'hi' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full min-h-[48px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{t('common.confirm')} & Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Shop Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('onboarding.stepShopDetails')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These will appear on your customer receipts and WhatsApp invoices.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('onboarding.shopName')} *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g. Gupta General Store"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
              {errors.shopName && <p className="text-xs text-red-500 mt-1">{errors.shopName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('onboarding.ownerName')} *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Gupta"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
                {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('onboarding.phoneNumber')} *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('onboarding.shopAddress')}
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Shop 12, Main Bazaar, Varanasi"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('onboarding.gstinOptional')}
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  UPI ID (QR on bills)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. shop@upi"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.back')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="w-2/3 min-h-[44px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Shop Type Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('onboarding.shopTypeTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('onboarding.shopTypeSubtitle')}
              </p>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {SHOP_TYPES.map(st => {
                const isSelected = selectedType === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedType(st.id)}
                    className={`w-full min-h-[48px] p-3 rounded-xl border text-left flex items-center justify-between text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t(st.labelKey)}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.back')}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-2/3 min-h-[44px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Bill Style & Confirmation */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('onboarding.billStyleTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the default format for WhatsApp bills and receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillStyle('simple')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  billStyle === 'simple'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-700 flex items-center justify-center mb-2">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {t('sales.simpleBill')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  {t('onboarding.simpleBillDesc')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBillStyle('gst')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  billStyle === 'gst'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {t('sales.gstBill')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  {t('onboarding.gstBillDesc')}
                </p>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">Summary:</p>
              <p>• Currency: ₹ (INR Indian Rupee)</p>
              <p>• Language: {language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}</p>
              <p>• Suggested Units & Categories configured for {selectedType} shop</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.back')}</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="w-2/3 min-h-[48px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('onboarding.getStarted')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
