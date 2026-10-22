import React, { useState } from 'react';
import { Supplier, PurchaseOrder, POItem } from '../../types/supplier';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise, rupeesToPaise } from '../../utils/currency';
import { EmptyState } from '../common/EmptyState';
import {
  Truck,
  Plus,
  CheckCircle2,
  PackageCheck,
  Phone,
  Building,
  X,
  FilePlus,
} from 'lucide-react';

export const SuppliersScreen: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    products,
    addSupplier,
    createPurchaseOrder,
    markPOReceived,
  } = useShop();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);

  // Supplier Form
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCompany, setSupCompany] = useState('');

  // PO Form
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [poQty, setPoQty] = useState('10');
  const [poCostRupees, setPoCostRupees] = useState('');

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) return;

    addSupplier({
      name: supName.trim(),
      phone: supPhone.trim(),
      companyName: supCompany.trim() || undefined,
    });

    setSupName('');
    setSupPhone('');
    setSupCompany('');
    setIsAddSupplierOpen(false);
  };

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    const product = products.find(p => p.id === selectedProductId);
    if (!supplier || !product) return;

    const qty = parseFloat(poQty) || 1;
    const costPaise = rupeesToPaise(poCostRupees || '0');
    const totalCostPaise = qty * costPaise;

    const item: POItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unit: product.unit,
      unitCostPaise: costPaise,
      totalCostPaise,
    };

    createPurchaseOrder({
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: [item],
      totalCostPaise,
      status: 'ordered',
      orderedAt: new Date().toISOString(),
      createdBy: 'Owner',
    });

    setIsNewPOOpen(false);
    setActiveTab('orders');
  };

  return (
    <div className="pb-28 max-w-7xl mx-auto px-4 pt-4 space-y-4">
      {/* Top Controls Strip */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>

        {activeTab === 'suppliers' ? (
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="min-h-[44px] px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (suppliers.length === 0) {
                setIsAddSupplierOpen(true);
              } else {
                setSelectedSupplierId(suppliers[0].id);
                setSelectedProductId(products[0]?.id || '');
                setIsNewPOOpen(true);
              }
            }}
            className="min-h-[44px] px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        )}
      </div>

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <>
          {suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers added yet"
              description="Keep track of your distributors, wholesale vendors, and purchase history."
              actionLabel="+ Add First Supplier"
              onAction={() => setIsAddSupplierOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {suppliers.map(sup => (
                <div
                  key={sup.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {sup.name}
                      </h3>
                      {sup.companyName && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{sup.companyName}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{sup.phone}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* PURCHASE ORDERS TAB */}
      {activeTab === 'orders' && (
        <>
          {purchaseOrders.length === 0 ? (
            <EmptyState
              icon={PackageCheck}
              title="No purchase orders created"
              description="Create a purchase order when you order goods. When the delivery arrives, mark it received to update stock in 1 tap."
              actionLabel="+ Create Purchase Order"
              onAction={() => {
                if (suppliers.length === 0) {
                  setIsAddSupplierOpen(true);
                } else {
                  setSelectedSupplierId(suppliers[0].id);
                  setSelectedProductId(products[0]?.id || '');
                  setIsNewPOOpen(true);
                }
              }}
            />
          ) : (
            <div className="space-y-3">
              {purchaseOrders.map(po => {
                const isReceived = po.status === 'received';
                return (
                  <div
                    key={po.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          #{po.poNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Supplier: <strong>{po.supplierName}</strong> · Total: {formatPaise(po.totalCostPaise)}
                      </p>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {po.items.map((it, idx) => (
                          <span key={idx}>
                            {it.productName} ({it.quantity} {it.unit})
                          </span>
                        ))}
                      </div>
                    </div>

                    {!isReceived ? (
                      <button
                        onClick={() => markPOReceived(po.id)}
                        className="min-h-[44px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('suppliers.markReceived')}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Stock Incremented</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('suppliers.addSupplier')}
              </h2>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('suppliers.name')} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  placeholder="e.g. Suresh Trading Co."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('suppliers.phone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('suppliers.company')}
                </label>
                <input
                  type="text"
                  value={supCompany}
                  onChange={e => setSupCompany(e.target.value)}
                  placeholder="e.g. Gujarat Oil Distributors"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 min-h-[48px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow cursor-pointer transition-all"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {isNewPOOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('suppliers.newPurchaseOrder')}
              </h2>
              <button
                onClick={() => setIsNewPOOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Supplier *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.companyName || s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product to Order *
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (In stock: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={poQty}
                    onChange={e => setPoQty(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold tabular-nums focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cost per Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={poCostRupees}
                    onChange={e => setPoCostRupees(e.target.value)}
                    placeholder="0.00"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold tabular-nums focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPOOpen(false)}
                  className="w-1/3 min-h-[48px] py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 min-h-[48px] bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl shadow cursor-pointer transition-all"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
