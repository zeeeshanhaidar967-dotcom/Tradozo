/**
 * Shop and User Types
 * Completely agnostic - no hardcoded personal or single-shop data.
 */

export type ShopType =
  | 'kirana'
  | 'hardware'
  | 'medical'
  | 'clothing'
  | 'electronics'
  | 'mobile'
  | 'stationery'
  | 'paint'
  | 'furniture'
  | 'marble_tiles'
  | 'other';

export type UserRole = 'owner' | 'manager' | 'staff' | 'viewer';

export type BillStyle = 'simple' | 'gst';

export interface ShopSettings {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  gstin?: string;
  upiId?: string;
  logoUrl?: string;
  shopType: ShopType;
  currencySymbol: string; // e.g. "₹"
  currencyCode: string; // "INR"
  language: 'en' | 'hi';
  billStyle: BillStyle;
  receiptHeader?: string;
  receiptFooter?: string;
  // Per-shop configurable optional product fields
  enabledFields: {
    brand: boolean;
    size: boolean;
    colour: boolean;
    purchasePrice: boolean;
    expiryDate: boolean;
    batchNumber: boolean;
    location: boolean; // shelf / godown
    supplier: boolean;
    minStockAlert: boolean;
    notes: boolean;
  };
  lowStockThresholdDefault: number;
  aiScansUsedThisMonth: number;
  aiMonthlyLimit: number; // e.g. 20 free scans
  lastBackupAt?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface TeamMember {
  uid: string;
  name: string;
  phoneOrEmail: string;
  role: UserRole;
  joinedAt: string;
  invitedBy: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  emailOrPhone: string;
  activeShopId: string | null;
  shopIds: string[];
  createdAt: string;
}
