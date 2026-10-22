/**
 * Sales, Bills & Invoicing Types
 * All amounts stored in integer paise.
 */

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit';

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  sellingPricePaise: number;
  purchasePricePaise?: number; // for profit calculation
  totalPaise: number;
}

export interface Sale {
  id: string;
  shopId: string;
  invoiceNumber: string; // e.g. "INV-1001"
  items: SaleItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number; // For GST breakdown if enabled
  totalPaise: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  status: 'completed' | 'returned' | 'partially_returned';
  createdAt: string;
  createdBy: string;
}

export interface ReturnItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  refundAmountPaise: number;
  condition: 'restock' | 'damaged' | 'discard';
}

export interface CustomerReturn {
  id: string;
  shopId: string;
  saleId: string;
  invoiceNumber: string;
  customerId?: string;
  items: ReturnItem[];
  totalRefundPaise: number;
  refundMethod: 'cash' | 'upi' | 'credit_deduction';
  reason: string;
  createdAt: string;
  createdBy: string;
}
