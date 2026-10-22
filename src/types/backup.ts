/**
 * Backup, Restore, Audit Log & Recycle Bin Types
 */

import { ShopSettings, TeamMember } from './shop';
import { Product, StockMovement, CategoryItem } from './product';
import { Sale, CustomerReturn } from './sale';
import { Customer, CustomerPayment } from './customer';
import { Supplier, PurchaseOrder } from './supplier';

export interface TrashItem {
  id: string;
  shopId: string;
  entityType: 'product' | 'customer' | 'sale' | 'supplier' | 'category';
  originalId: string;
  displayName: string;
  data: Record<string, any>;
  deletedBy: string;
  deletedAt: string;
  expiresAt: string; // 30 days after deletedAt
}

export interface AuditLog {
  id: string;
  shopId: string;
  action:
    | 'product_create'
    | 'product_update'
    | 'product_delete'
    | 'stock_adjustment'
    | 'price_change'
    | 'sale_created'
    | 'sale_cancelled'
    | 'payment_received'
    | 'backup_created'
    | 'backup_restored'
    | 'member_invited'
    | 'role_changed';
  actorUid: string;
  actorName: string;
  actorRole: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface BackupDataSnapshot {
  version: '1.0';
  exportedAt: string;
  shop: ShopSettings;
  products: Product[];
  categories: CategoryItem[];
  customers: Customer[];
  sales: Sale[];
  payments: CustomerPayment[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  returns: CustomerReturn[];
  members: TeamMember[];
}

export interface BackupPreview {
  date: string;
  shopName: string;
  productCount: number;
  customerCount: number;
  saleCount: number;
  supplierCount: number;
  stockMovementCount: number;
  totalInventoryValuationPaise: number;
}
