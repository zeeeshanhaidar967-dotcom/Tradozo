import React, { useState } from 'react';
import { Customer, PaymentMode } from '../../types/customer';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise, rupeesToPaise } from '../../utils/currency';
import { X, Check, BadgeDollarSign } from 'lucide-react';

interface PaymentModalProps {
  customer: Customer;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  customer,
  onClose,
}) => {
  const { recordCustomerPayment } = useShop();
  const { t } = useI18n();

  const [amountRupees, setAmountRupees] = useState('');
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0) return;

    recordCustomerPayment(customer.id, paise, mode, notes.trim() || undefined);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('customers.recordPayment')}
            </h2>
            <p className="text-xs text-slate-500">
              Customer: <strong>{customer.name}</strong> ({customer.phone})
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <span className="text-slate-600 dark:text-slate-400">Current Due (Udhaar):</span>
            <span className="font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
              {formatPaise(customer.currentBalancePaise)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('customers.amountReceived')} (₹) *
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={amountRupees}
              onChange={e => setAmountRupees(e.target.value)}
              placeholder="0.00"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xl font-bold tabular-nums focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('customers.paymentMode')} *
            </label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as PaymentMode)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="cash">Cash (नकद)</option>
              <option value="upi">UPI / GPay / PhonePe</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Reference / Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received via PhonePe"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="w-2/3 min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-5 h-5" />
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
