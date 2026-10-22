import React, { useState } from 'react';
import { Customer } from '../../types/customer';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise } from '../../utils/currency';
import { X, MessageCircle, Send } from 'lucide-react';

interface WhatsAppReminderModalProps {
  customer: Customer;
  onClose: () => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  customer,
  onClose,
}) => {
  const { activeShop } = useShop();
  const { t } = useI18n();

  const formattedAmount = formatPaise(customer.currentBalancePaise);
  const defaultText = t('customers.reminderMessage', {
    name: customer.name,
    shop: activeShop?.name || 'VyaparStock',
    amount: formattedAmount,
  });

  const [message, setMessage] = useState(defaultText);

  const handleSend = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
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
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('customers.sendReminder')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <p className="text-slate-500">Customer: <strong className="text-slate-900 dark:text-white">{customer.name}</strong></p>
            <p className="text-slate-500">WhatsApp: <strong className="text-slate-900 dark:text-white">{customer.phone}</strong></p>
            <p className="text-slate-500">Due Balance: <strong className="text-rose-600 tabular-nums">{formattedAmount}</strong></p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reminder Message (Editable)
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="w-2/3 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
