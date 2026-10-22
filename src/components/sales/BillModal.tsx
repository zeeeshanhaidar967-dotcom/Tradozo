import React, { useEffect, useState, useRef } from 'react';
import { Sale } from '../../types/sale';
import { useShop } from '../../context/ShopContext';
import { useI18n } from '../../context/I18nContext';
import { formatPaise } from '../../utils/currency';
import QRCode from 'qrcode';
import { X, Share2, Printer, CheckCircle2, MessageCircle } from 'lucide-react';

interface BillModalProps {
  sale: Sale;
  onClose: () => void;
}

export const BillModal: React.FC<BillModalProps> = ({ sale, onClose }) => {
  const { activeShop } = useShop();
  const { t } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printableRef = useRef<HTMLDivElement>(null);

  const isGst = activeShop?.billStyle === 'gst' && Boolean(activeShop?.gstin);
  const upiId = activeShop?.upiId;

  // Generate UPI QR Code
  useEffect(() => {
    if (upiId) {
      const amountRupees = (sale.totalPaise / 100).toFixed(2);
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        activeShop?.name || 'Shop'
      )}&am=${amountRupees}&cu=INR&tn=Invoice-${sale.invoiceNumber}`;

      QRCode.toDataURL(upiUrl, { width: 140, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.warn('QR Code generation failed:', err));
    }
  }, [upiId, sale, activeShop]);

  // WhatsApp bill text sharing
  const handleShareWhatsApp = () => {
    const shopName = activeShop?.name || 'VyaparStock';
    const lines = [
      `🧾 *${shopName}*`,
      activeShop?.address ? `📍 ${activeShop.address}` : '',
      activeShop?.phone ? `📞 ${activeShop.phone}` : '',
      `────────────────`,
      `*Invoice:* #${sale.invoiceNumber}`,
      `*Date:* ${new Date(sale.createdAt).toLocaleDateString('en-IN')}`,
      sale.customerName ? `*Customer:* ${sale.customerName}` : '',
      `────────────────`,
      ...sale.items.map(
        i => `• ${i.name} (${i.quantity} ${i.unit}) = ${formatPaise(i.totalPaise)}`
      ),
      `────────────────`,
      `*Total Amount:* ${formatPaise(sale.totalPaise)}`,
      `*Payment Mode:* ${sale.paymentMethod.toUpperCase()}`,
      upiId ? `*UPI ID:* ${upiId}` : '',
      `────────────────`,
      activeShop?.receiptFooter || 'Thank you for your visit!',
    ].filter(Boolean);

    const message = lines.join('\n');
    const phone = sale.customerPhone ? sale.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Sale Completed (#{sale.invoiceNumber})
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bill preview"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div
          ref={printableRef}
          className="p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs space-y-4 overflow-y-auto flex-1 font-sans"
        >
          {/* Shop Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h3 className="text-lg font-bold tracking-tight">
              {activeShop?.name || 'VyaparStock'}
            </h3>
            {activeShop?.receiptHeader && (
              <p className="text-[11px] text-slate-500 mt-0.5">{activeShop.receiptHeader}</p>
            )}
            {activeShop?.address && <p className="text-slate-600 dark:text-slate-400">{activeShop.address}</p>}
            {activeShop?.phone && <p className="text-slate-600 dark:text-slate-400">Ph: {activeShop.phone}</p>}
            {isGst && activeShop?.gstin && (
              <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                GSTIN: {activeShop.gstin}
              </p>
            )}
            <p className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 tracking-wider mt-1">
              {isGst ? 'Tax Invoice' : 'Retail Receipt'}
            </p>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
            <div>
              <p>Invoice: <strong className="text-slate-900 dark:text-white font-mono">#{sale.invoiceNumber}</strong></p>
              <p>Date: {new Date(sale.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-right">
              {sale.customerName ? (
                <>
                  <p>Customer: <strong className="text-slate-900 dark:text-white">{sale.customerName}</strong></p>
                  {sale.customerPhone && <p>Ph: {sale.customerPhone}</p>}
                </>
              ) : (
                <p>Walk-in Customer</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px]">
                <th className="py-1.5 pr-2">Item</th>
                <th className="py-1.5 px-2 text-center w-16">Qty</th>
                <th className="py-1.5 px-2 text-right w-20">Price</th>
                <th className="py-1.5 pl-2 text-right w-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {sale.items.map((item, idx) => (
                <tr key={idx} className="py-1.5">
                  <td className="py-1.5 pr-2">
                    <span className="font-semibold text-slate-900 dark:text-white block leading-snug">{item.name}</span>
                  </td>
                  <td className="py-1.5 px-2 text-center tabular-nums text-slate-700 dark:text-slate-300">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {formatPaise(item.sellingPricePaise)}
                  </td>
                  <td className="py-1.5 pl-2 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatPaise(item.totalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-2 space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="tabular-nums font-semibold">{formatPaise(sale.subtotalPaise)}</span>
            </div>
            {sale.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="tabular-nums font-semibold">-{formatPaise(sale.discountPaise)}</span>
              </div>
            )}
            {isGst && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Incl. GST (CGST+SGST):</span>
                <span className="tabular-nums font-semibold">{formatPaise(sale.taxPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total:</span>
              <span className="tabular-nums font-bold text-teal-700 dark:text-teal-400">
                {formatPaise(sale.totalPaise)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Payment Mode:</span>
              <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                {sale.paymentMethod}
              </span>
            </div>
          </div>

          {/* UPI QR Code Section */}
          {upiId && qrDataUrl && (
            <div className="text-center pt-3 pb-1 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center">
              <img
                src={qrDataUrl}
                alt="UPI Payment QR"
                className="w-28 h-28 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700"
              />
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1">
                Scan to pay with any UPI App
              </p>
              <p className="text-[10px] text-slate-400 font-mono">{upiId}</p>
            </div>
          )}

          {/* Footer message */}
          <div className="text-center pt-2 text-[11px] text-slate-400">
            <p>{activeShop?.receiptFooter || 'Thank you! Visit again.'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="min-h-[48px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Bill</span>
          </button>
          <button
            onClick={handlePrint}
            className="min-h-[48px] py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
