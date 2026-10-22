/**
 * Suppliers & Purchase Order Types
 */

export interface SupplierPriceRecord {
  productId: string;
  productName: string;
  purchasePricePaise: number;
  date: string;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  companyName?: string;
  address?: string;
  gstin?: string;
  balancePaise: number; // Positive = Shop owes supplier
  priceHistory: SupplierPriceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface POItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCostPaise: number;
  totalCostPaise: number;
}

export interface PurchaseOrder {
  id: string;
  shopId: string;
  poNumber: string; // e.g. "PO-2026-001"
  supplierId: string;
  supplierName: string;
  items: POItem[];
  totalCostPaise: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  orderedAt?: string;
  receivedAt?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}
