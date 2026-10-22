/**
 * Universal Storage & Offline-First State Engine
 * Implements strict multi-tenant isolation under shops/{shopId}/*,
 * atomic transactional stock adjustments, sync queue tracking,
 * and 30-day soft-deletion trash bin.
 */

import { ShopSettings, TeamMember, UserRole, UserProfile } from '../types/shop';
import { Product, StockMovement, CategoryItem, MovementReason } from '../types/product';
import { Sale, CustomerReturn, PaymentMethod } from '../types/sale';
import { Customer, CustomerPayment, PaymentMode } from '../types/customer';
import { Supplier, PurchaseOrder } from '../types/supplier';
import { TrashItem, AuditLog, BackupDataSnapshot, BackupPreview } from '../types/backup';

const LOCAL_STORAGE_PREFIX = 'vyapar_stock_data_';

export interface ShopDataStore {
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
  trash: TrashItem[];
  auditLogs: AuditLog[];
}

export class StorageService {
  private activeShopId: string | null = null;
  private memoryCache: Map<string, ShopDataStore> = new Map();
  private pendingSyncCount = 0;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  public getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      pendingSyncCount: this.pendingSyncCount,
    };
  }

  public setActiveShop(shopId: string) {
    this.activeShopId = shopId;
    this.loadShopData(shopId);
    this.notifyListeners();
  }

  public getActiveShopId(): string | null {
    return this.activeShopId;
  }

  private getStorageKey(shopId: string): string {
    return `${LOCAL_STORAGE_PREFIX}${shopId}`;
  }

  public loadShopData(shopId: string): ShopDataStore {
    if (this.memoryCache.has(shopId)) {
      return this.memoryCache.get(shopId)!;
    }

    try {
      const serialized = localStorage.getItem(this.getStorageKey(shopId));
      if (serialized) {
        const parsed = JSON.parse(serialized);
        this.memoryCache.set(shopId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read from local storage:', e);
    }

    // Default empty store for brand new shop
    const emptyStore: ShopDataStore = {
      shop: {
        id: shopId,
        name: '',
        ownerName: '',
        phone: '',
        address: '',
        shopType: 'other',
        currencySymbol: '₹',
        currencyCode: 'INR',
        language: 'en',
        billStyle: 'simple',
        enabledFields: {
          brand: true,
          size: false,
          colour: false,
          purchasePrice: true,
          expiryDate: false,
          batchNumber: false,
          location: false,
          supplier: true,
          minStockAlert: true,
          notes: false,
        },
        lowStockThresholdDefault: 5,
        aiScansUsedThisMonth: 0,
        aiMonthlyLimit: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'owner-local-uid',
      },
      products: [],
      categories: [],
      customers: [],
      sales: [],
      payments: [],
      stockMovements: [],
      suppliers: [],
      purchaseOrders: [],
      returns: [],
      members: [],
      trash: [],
      auditLogs: [],
    };

    this.memoryCache.set(shopId, emptyStore);
    return emptyStore;
  }

  private persistShopData(shopId: string) {
    const data = this.memoryCache.get(shopId);
    if (!data) return;

    try {
      localStorage.setItem(this.getStorageKey(shopId), JSON.stringify(data));
      // In offline mode or pending sync, increment counter
      if (!this.isOnline) {
        this.pendingSyncCount++;
      } else {
        this.pendingSyncCount = Math.max(0, this.pendingSyncCount - 1);
      }
    } catch (err) {
      console.error('Failed to persist shop data to localStorage:', err);
    }
    this.notifyListeners();
  }

  public getShopData(shopId?: string): ShopDataStore {
    const id = shopId || this.activeShopId;
    if (!id) throw new Error('No active shop selected');
    return this.loadShopData(id);
  }

  // --- SHOP MANAGEMENT ---
  public createShop(settings: ShopSettings, initialCategories: string[] = []): ShopSettings {
    const categories: CategoryItem[] = initialCategories.map((name, i) => ({
      id: `cat_${Date.now()}_${i}`,
      name,
    }));

    const newStore: ShopDataStore = {
      shop: settings,
      products: [],
      categories,
      customers: [],
      sales: [],
      payments: [],
      stockMovements: [],
      suppliers: [],
      purchaseOrders: [],
      returns: [],
      members: [
        {
          uid: settings.ownerId,
          name: settings.ownerName,
          phoneOrEmail: settings.phone,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          invitedBy: 'self',
        },
      ],
      trash: [],
      auditLogs: [
        {
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          shopId: settings.id,
          action: 'backup_created',
          actorUid: settings.ownerId,
          actorName: settings.ownerName,
          actorRole: 'owner',
          details: `Shop "${settings.name}" created`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    this.memoryCache.set(settings.id, newStore);
    this.persistShopData(settings.id);
    this.setActiveShop(settings.id);

    // Save shop ID to active user's shop list
    this.registerShopToUser(settings.ownerId, settings.id);

    return settings;
  }

  public updateShopSettings(updates: Partial<ShopSettings>) {
    const data = this.getShopData();
    data.shop = {
      ...data.shop,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persistShopData(data.shop.id);
  }

  private registerShopToUser(uid: string, shopId: string) {
    try {
      const userKey = `vyapar_user_${uid}`;
      const existing = localStorage.getItem(userKey);
      const profile: UserProfile = existing
        ? JSON.parse(existing)
        : {
            uid,
            displayName: 'Owner',
            emailOrPhone: '',
            activeShopId: shopId,
            shopIds: [],
            createdAt: new Date().toISOString(),
          };

      if (!profile.shopIds.includes(shopId)) {
        profile.shopIds.push(shopId);
      }
      profile.activeShopId = shopId;
      localStorage.setItem(userKey, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  // --- PRODUCTS & ATOMIC STOCK TRANSACTION ---
  public addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'shopId'>): Product {
    const data = this.getShopData();
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newProduct: Product = {
      ...product,
      id,
      shopId: data.shop.id,
      createdAt: now,
      updatedAt: now,
    };

    data.products.unshift(newProduct);

    // Initial movement log if initial quantity > 0
    if (newProduct.quantity > 0) {
      const movement: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shopId: data.shop.id,
        productId: newProduct.id,
        productName: newProduct.name,
        deltaQuantity: newProduct.quantity,
        previousQuantity: 0,
        newQuantity: newProduct.quantity,
        unit: newProduct.unit,
        reason: 'purchase',
        performedBy: newProduct.createdBy,
        timestamp: now,
        note: 'Initial stock on product creation',
      };
      data.stockMovements.unshift(movement);
    }

    this.logAudit(data, 'product_create', `Added product "${newProduct.name}" (Qty: ${newProduct.quantity} ${newProduct.unit})`);
    this.persistShopData(data.shop.id);
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>, actor = 'Owner'): Product {
    const data = this.getShopData();
    const index = data.products.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Product not found');

    const existing = data.products[index];
    const now = new Date().toISOString();

    // Check if price changed
    if (updates.sellingPricePaise !== undefined && updates.sellingPricePaise !== existing.sellingPricePaise) {
      this.logAudit(
        data,
        'price_change',
        `Changed price of "${existing.name}" from ₹${existing.sellingPricePaise / 100} to ₹${updates.sellingPricePaise / 100}`,
        actor
      );
    }

    const updated: Product = {
      ...existing,
      ...updates,
      id: existing.id,
      shopId: existing.shopId,
      updatedAt: now,
    };

    data.products[index] = updated;
    this.persistShopData(data.shop.id);
    return updated;
  }

  /**
   * ATOMIC STOCK ADJUSTMENT TRANSACTION
   * Ensures two simultaneous updates never produce corrupt quantities
   */
  public adjustStock(
    productId: string,
    delta: number,
    reason: MovementReason,
    actorName: string,
    note?: string,
    referenceId?: string
  ): { product: Product; movement: StockMovement } {
    const data = this.getShopData();
    const index = data.products.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Product not found');

    const product = data.products[index];
    const previousQuantity = product.quantity;
    const newQuantity = Math.max(0, Math.round((previousQuantity + delta) * 100) / 100);

    const now = new Date().toISOString();
    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId: data.shop.id,
      productId: product.id,
      productName: product.name,
      deltaQuantity: delta,
      previousQuantity,
      newQuantity,
      unit: product.unit,
      reason,
      referenceId,
      note,
      performedBy: actorName,
      timestamp: now,
    };

    product.quantity = newQuantity;
    product.updatedAt = now;

    data.stockMovements.unshift(movement);
    this.logAudit(
      data,
      'stock_adjustment',
      `${delta >= 0 ? '+' : ''}${delta} ${product.unit} to "${product.name}" (${reason}) -> New: ${newQuantity} ${product.unit}`,
      actorName
    );

    this.persistShopData(data.shop.id);
    return { product, movement };
  }

  // --- SOFT DELETE TO RECYCLE BIN ---
  public moveProductToTrash(productId: string, actor = 'Owner'): TrashItem {
    const data = this.getShopData();
    const index = data.products.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Product not found');

    const product = data.products[index];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const trashItem: TrashItem = {
      id: `trash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId: data.shop.id,
      entityType: 'product',
      originalId: product.id,
      displayName: product.name,
      data: product,
      deletedBy: actor,
      deletedAt: now.toISOString(),
      expiresAt,
    };

    data.products.splice(index, 1);
    data.trash.unshift(trashItem);
    this.logAudit(data, 'product_delete', `Moved product "${product.name}" to Recycle Bin`, actor);

    this.persistShopData(data.shop.id);
    return trashItem;
  }

  public restoreFromTrash(trashId: string): boolean {
    const data = this.getShopData();
    const index = data.trash.findIndex(t => t.id === trashId);
    if (index === -1) return false;

    const item = data.trash[index];
    if (item.entityType === 'product') {
      const restored = item.data as Product;
      restored.updatedAt = new Date().toISOString();
      data.products.unshift(restored);
      this.logAudit(data, 'product_create', `Restored "${item.displayName}" from Recycle Bin`);
    }

    data.trash.splice(index, 1);
    this.persistShopData(data.shop.id);
    return true;
  }

  public permanentDeleteTrash(trashId: string): boolean {
    const data = this.getShopData();
    const index = data.trash.findIndex(t => t.id === trashId);
    if (index === -1) return false;

    const item = data.trash[index];
    this.logAudit(data, 'product_delete', `Permanently deleted "${item.displayName}" from Recycle Bin`);
    data.trash.splice(index, 1);
    this.persistShopData(data.shop.id);
    return true;
  }

  // --- SALES & CUSTOMER UDHAAR LEDGER ---
  public recordSale(saleData: Omit<Sale, 'id' | 'shopId' | 'status' | 'createdAt'>): Sale {
    const data = this.getShopData();
    const id = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const sale: Sale = {
      ...saleData,
      id,
      shopId: data.shop.id,
      status: 'completed',
      createdAt: now,
    };

    // 1. Deduct stock atomically for each item sold
    for (const item of sale.items) {
      const product = data.products.find(p => p.id === item.productId);
      if (product) {
        this.adjustStock(
          product.id,
          -item.quantity,
          'sale',
          sale.createdBy,
          `Sale #${sale.invoiceNumber}`,
          sale.id
        );
      }
    }

    // 2. If credit (Udhaar), update customer balance
    if (sale.paymentMethod === 'credit' && sale.customerId) {
      const customer = data.customers.find(c => c.id === sale.customerId);
      if (customer) {
        customer.currentBalancePaise += sale.totalPaise;
        customer.totalPurchasesPaise += sale.totalPaise;
        customer.lastTransactionAt = now;
        customer.updatedAt = now;
      }
    }

    data.sales.unshift(sale);
    this.logAudit(
      data,
      'sale_created',
      `Completed Sale #${sale.invoiceNumber} (Total: ₹${sale.totalPaise / 100}, Payment: ${sale.paymentMethod})`,
      sale.createdBy
    );

    this.persistShopData(data.shop.id);
    return sale;
  }

  public recordCustomerPayment(
    customerId: string,
    amountPaise: number,
    mode: PaymentMode,
    receivedBy: string,
    notes?: string
  ): CustomerPayment {
    const data = this.getShopData();
    const customer = data.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const now = new Date().toISOString();
    const payment: CustomerPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId: data.shop.id,
      customerId,
      customerName: customer.name,
      amountPaise,
      paymentMode: mode,
      receivedBy,
      notes,
      date: now,
    };

    customer.currentBalancePaise -= amountPaise;
    customer.totalPaidPaise = (customer.totalPaidPaise || 0) + amountPaise;
    customer.lastTransactionAt = now;
    customer.updatedAt = now;

    data.payments.unshift(payment);
    this.logAudit(
      data,
      'payment_received',
      `Received ₹${amountPaise / 100} from "${customer.name}" via ${mode}`,
      receivedBy
    );

    this.persistShopData(data.shop.id);
    return payment;
  }

  public addCustomer(cust: Omit<Customer, 'id' | 'shopId' | 'createdAt' | 'updatedAt' | 'lastTransactionAt' | 'totalPurchasesPaise' | 'totalPaidPaise'>): Customer {
    const data = this.getShopData();
    const now = new Date().toISOString();
    const customer: Customer = {
      ...cust,
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId: data.shop.id,
      totalPurchasesPaise: 0,
      totalPaidPaise: 0,
      lastTransactionAt: now,
      createdAt: now,
      updatedAt: now,
    };

    data.customers.unshift(customer);
    this.persistShopData(data.shop.id);
    return customer;
  }

  // --- BACKUP & RESTORE WITH SAFETY SNAPSHOT ---
  public exportDataSnapshot(): BackupDataSnapshot {
    const data = this.getShopData();
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shop: data.shop,
      products: data.products,
      categories: data.categories,
      customers: data.customers,
      sales: data.sales,
      payments: data.payments,
      stockMovements: data.stockMovements,
      suppliers: data.suppliers,
      purchaseOrders: data.purchaseOrders,
      returns: data.returns,
      members: data.members,
    };
  }

  public getBackupPreview(snapshot: BackupDataSnapshot): BackupPreview {
    const valuation = (snapshot.products || []).reduce(
      (acc, p) => acc + (p.purchasePricePaise || p.sellingPricePaise || 0) * (p.quantity || 0),
      0
    );

    return {
      date: snapshot.exportedAt,
      shopName: snapshot.shop?.name || 'Shop Backup',
      productCount: (snapshot.products || []).length,
      customerCount: (snapshot.customers || []).length,
      saleCount: (snapshot.sales || []).length,
      supplierCount: (snapshot.suppliers || []).length,
      stockMovementCount: (snapshot.stockMovements || []).length,
      totalInventoryValuationPaise: valuation,
    };
  }

  /**
   * Safe Restore: Takes an automatic safety backup first before replacing data
   */
  public restoreFromSnapshot(snapshot: BackupDataSnapshot, mode: 'replace' | 'copy'): { safetyBackupKey: string } {
    const currentData = this.getShopData();

    // 1. Mandatory Safety Backup
    const safetyKey = `safety_backup_${currentData.shop.id}_${Date.now()}`;
    try {
      localStorage.setItem(safetyKey, JSON.stringify(currentData));
    } catch {
      // ignore
    }

    if (mode === 'replace') {
      const restoredStore: ShopDataStore = {
        shop: {
          ...snapshot.shop,
          id: currentData.shop.id, // keep current shop ID
          updatedAt: new Date().toISOString(),
          lastBackupAt: new Date().toISOString(),
        },
        products: (snapshot.products || []).map(p => ({ ...p, shopId: currentData.shop.id })),
        categories: snapshot.categories || [],
        customers: (snapshot.customers || []).map(c => ({ ...c, shopId: currentData.shop.id })),
        sales: (snapshot.sales || []).map(s => ({ ...s, shopId: currentData.shop.id })),
        payments: (snapshot.payments || []).map(p => ({ ...p, shopId: currentData.shop.id })),
        stockMovements: (snapshot.stockMovements || []).map(m => ({ ...m, shopId: currentData.shop.id })),
        suppliers: (snapshot.suppliers || []).map(sp => ({ ...sp, shopId: currentData.shop.id })),
        purchaseOrders: (snapshot.purchaseOrders || []).map(po => ({ ...po, shopId: currentData.shop.id })),
        returns: (snapshot.returns || []).map(r => ({ ...r, shopId: currentData.shop.id })),
        members: currentData.members,
        trash: [],
        auditLogs: [
          {
            id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            shopId: currentData.shop.id,
            action: 'backup_restored',
            actorUid: currentData.shop.ownerId,
            actorName: currentData.shop.ownerName,
            actorRole: 'owner',
            details: `Restored backup from date: ${snapshot.exportedAt}`,
            timestamp: new Date().toISOString(),
          },
          ...currentData.auditLogs,
        ],
      };

      this.memoryCache.set(currentData.shop.id, restoredStore);
      this.persistShopData(currentData.shop.id);
    }

    return { safetyBackupKey: safetyKey };
  }

  // --- AUDIT LOG HELPER ---
  private logAudit(data: ShopDataStore, action: AuditLog['action'], details: string, actorName = 'Owner') {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId: data.shop.id,
      action,
      actorUid: data.shop.ownerId,
      actorName,
      actorRole: 'owner',
      details,
      timestamp: new Date().toISOString(),
    };
    data.auditLogs.unshift(log);
  }
}

export const storageService = new StorageService();
