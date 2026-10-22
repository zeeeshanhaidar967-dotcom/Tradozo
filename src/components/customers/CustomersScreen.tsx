import React, { useState } from 'react';
import { Customer } from '../../types/customer';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise } from '../../utils/currency';
import { PaymentModal } from './PaymentModal';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import { EmptyState } from '../common/EmptyState';
import {
  Users,
  Search,
  Plus,
  BadgeDollarSign,
  MessageCircle,
  Phone,
  UserCheck,
  X,
} from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const { customers, addCustomer } = useShop();
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<Customer | null>(null);
  const [selectedForReminder, setSelectedForReminder] = useState<Customer | null>(null);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const filteredCustomers = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const totalDuesPaise = customers.reduce(
    (acc, c) => acc + Math.max(0, c.currentBalancePaise),
    0
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      currentBalancePaise: 0,
    });

    setName('');
    setPhone('');
    setAddress('');
    setIsAddOpen(false);
  };

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-4">
      {/* Top Banner: Total Udhaar Dues */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">Total Customer Udhaar (Dues)</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatPaise(totalDuesPaise)}
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="min-h-[44px] px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('customers.addCustomer')}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customer by name or phone..."
          className="w-full min-h-[48px] pl-11 pr-10 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm shadow-xs focus:ring-2 focus:ring-teal-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No customer found' : t('customers.emptyCustomers')}
          description="Maintain customer ledger (udhaar), record incoming payments, and send polite WhatsApp reminders."
          actionLabel={search ? 'Clear Search' : '+ Add First Customer'}
          onAction={search ? () => setSearch('') : () => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCustomers.map(customer => {
            const hasDue = customer.currentBalancePaise > 0;
            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{customer.phone}</span>
                      {customer.address && <span aria-hidden="true">·</span>}
                      {customer.address && <span className="truncate">{customer.address}</span>}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Balance Due</span>
                    <span
                      className={`text-base font-bold tabular-nums ${
                        hasDue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatPaise(customer.currentBalancePaise)}
                    </span>
                  </div>
                </div>

                {/* Actions: Record Payment, WhatsApp Reminder */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  {hasDue && (
                    <button
                      onClick={() => setSelectedForReminder(customer)}
                      aria-label={`Send WhatsApp reminder to ${customer.name}`}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reminder</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedForPayment(customer)}
                    aria-label={`Receive payment from ${customer.name}`}
                    className="min-h-[44px] px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <BadgeDollarSign className="w-3.5 h-3.5" />
                    <span>Receive ₹</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('customers.addCustomer')}
              </h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('customers.customerName')} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Anil Kumar"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('customers.phone')} *
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('customers.address')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. House 44, Near Temple"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 min-h-[48px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Save Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedForPayment && (
        <PaymentModal
          customer={selectedForPayment}
          onClose={() => setSelectedForPayment(null)}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      {selectedForReminder && (
        <WhatsAppReminderModal
          customer={selectedForReminder}
          onClose={() => setSelectedForReminder(null)}
        />
      )}
    </div>
  );
};
