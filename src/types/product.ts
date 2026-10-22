/**
 * Product and Stock Types
 * Barcode scanning and fields are explicitly forbidden per project guidelines.
 */

export type StandardUnit =
  | 'piece'
  | 'packet'
  | 'kg'
  | 'gram'
  | 'litre'
  | 'ml'
  | 'box'
  | 'dozen'
  | 'bag'
  | 'bottle'
  | 'metre'
  | 'sq_ft'
  | 'set';

export interface UnitConversionRule {
  fromUnit: string; // e.g. "box"
  toUnit: string; // e.g. "piece"
  multiplier: number; // e.g. 1 box = 12 pieces
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size: L / Color: Blue"
  quantity: number;
  sellingPricePaise: number;
  purchasePricePaise?: number;
  sku?: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string; // REQUIRED
  quantity: number; // REQUIRED (supports decimals e.g. 2.5 kg)
  sellingPricePaise: number; // REQUIRED (stored in integer paise)
  unit: string; // e.g. "piece", "kg", "packet" (default: "piece")

  // Optional fields (toggled per shop settings)
  category?: string;
  brand?: string;
  size?: string;
  colour?: string;
  purchasePricePaise?: number;
  expiryDate?: string; // YYYY-MM-DD
  batchNumber?: string;
  shelfLocation?: string;
  supplierId?: string;
  supplierName?: string;
  minStockAlert?: number;
  notes?: string;

  // Variants & conversions
  hasVariants?: boolean;
  variants?: ProductVariant[];
  conversionRules?: UnitConversionRule[];

  // Flags & Lifecycle
  isFavourite?: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type MovementReason =
  | 'purchase'
  | 'sale'
  | 'damaged'
  | 'expired'
  | 'lost'
  | 'returned_to_supplier'
  | 'customer_return'
  | 'stock_count'
  | 'correction';

export interface StockMovement {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  deltaQuantity: number; // e.g. +10 or -3
  previousQuantity: number;
  newQuantity: number;
  unit: string;
  reason: MovementReason;
  referenceId?: string; // saleId or poId
  note?: string;
  performedBy: string; // User display name / UID
  timestamp: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  iconName?: string;
  color?: string;
  archived?: boolean;
}
