/**
 * Customer & Khata (Udhaar Ledger) Types
 */

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  address?: string;
  currentBalancePaise: number; // Positive = Customer owes shop (Udhaar), Negative = Shop owes customer
  totalPurchasesPaise: number;
  totalPaidPaise: number;
  notes?: string;
  lastTransactionAt: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

export interface CustomerPayment {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  amountPaise: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  notes?: string;
  receivedBy: string;
  date: string;
}
