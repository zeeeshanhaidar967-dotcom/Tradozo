import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShopSettings, UserRole, TeamMember } from '../types/shop';
import { Product, StockMovement, CategoryItem, MovementReason } from '../types/product';
import { Sale, CustomerReturn } from '../types/sale';
import { Customer, CustomerPayment, PaymentMode } from '../types/customer';
import { Supplier, PurchaseOrder } from '../types/supplier';
import { TrashItem, AuditLog, BackupDataSnapshot, BackupPreview } from '../types/backup';
import { storageService, ShopDataStore } from '../services/storageService';
import { SHOP_TYPE_PRESETS } from '../utils/shopPresets';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '../firebase';
import { firestoreService } from '../services/firestoreService';

interface ShopContextType {
  activeShop: ShopSettings | null;
  currentUserRole: UserRole;
  products: Product[];
  categories: CategoryItem[];
  customers: Customer[];
  sales: Sale[];
  payments: CustomerPayment[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  returns: CustomerReturn[];
  trash: TrashItem[];
  auditLogs: AuditLog[];
  members: TeamMember[];

  // Network & Sync State
  isOnline: boolean;
  pendingSyncCount: number;
  user: any; // User | null
  isAuthReady: boolean;
  isSyncing: boolean;

  // Firebase Auth & Cloud Sync Actions
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncToCloud: () => Promise<void>;

  // Actions
  createShop: (settings: Omit<ShopSettings, 'id' | 'createdAt' | 'updatedAt' | 'aiScansUsedThisMonth' | 'aiMonthlyLimit'>) => ShopSettings;
  updateShopSettings: (updates: Partial<ShopSettings>) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'shopId'>) => Product;
  updateProduct: (productId: string, updates: Partial<Product>) => Product;
  adjustStock: (productId: string, delta: number, reason: MovementReason, note?: string, refId?: string) => void;
  deleteProductToTrash: (productId: string) => TrashItem;
  restoreFromTrash: (trashId: string) => boolean;
  permanentDeleteTrash: (trashId: string) => boolean;

  // Sales & Udhaar
  recordSale: (sale: Omit<Sale, 'id' | 'shopId' | 'status' | 'createdAt'>) => Sale;
  addCustomer: (customer: Omit<Customer, 'id' | 'shopId' | 'createdAt' | 'updatedAt' | 'lastTransactionAt' | 'totalPurchasesPaise' | 'totalPaidPaise'>) => Customer;
  recordCustomerPayment: (customerId: string, amountPaise: number, mode: PaymentMode, notes?: string) => CustomerPayment;

  // Category
  addCategory: (name: string) => void;

  // Suppliers & PO
  addSupplier: (supplier: Omit<Supplier, 'id' | 'shopId' | 'priceHistory' | 'balancePaise' | 'createdAt' | 'updatedAt'>) => Supplier;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'shopId' | 'createdAt'>) => PurchaseOrder;
  markPOReceived: (poId: string) => void;

  // Backup & Restore
  exportBackup: () => BackupDataSnapshot;
  getBackupPreview: (snapshot: BackupDataSnapshot) => BackupPreview;
  restoreBackup: (snapshot: BackupDataSnapshot, mode: 'replace' | 'copy') => { safetyBackupKey: string };
  deleteAccountAndShop: () => void;
  seedDemoForTesting: (type?: ShopSettings['shopType']) => void;

  // Undo notification state
  undoAction: { message: string; onUndo: () => void } | null;
  setUndoAction: (action: { message: string; onUndo: () => void } | null) => void;
}

const ShopContext = createContext<ShopContextType | null>(null);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeData, setStoreData] = useState<ShopDataStore | null>(null);
  const [networkStatus, setNetworkStatus] = useState(storageService.getNetworkStatus());
  const [undoAction, setUndoAction] = useState<{ message: string; onUndo: () => void } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      setUser(res.user);
      const currentStore = storageService.getActiveShopId() ? storageService.getShopData() : null;
      if (currentStore) {
        setIsSyncing(true);
        await firestoreService.syncShopToFirestore(currentStore.shop.id, currentStore);
        setIsSyncing(false);
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const syncToCloud = async () => {
    const currentStore = storageService.getActiveShopId() ? storageService.getShopData() : null;
    if (!currentStore || !auth.currentUser) return;
    try {
      setIsSyncing(true);
      await firestoreService.syncShopToFirestore(currentStore.shop.id, currentStore);
    } catch (err) {
      console.error('Cloud sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Initialize or load active shop
  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setNetworkStatus(storageService.getNetworkStatus());
      const activeId = storageService.getActiveShopId();
      if (activeId) {
        setStoreData({ ...storageService.getShopData(activeId) });
      }
    });

    // Check if there is an existing shop ID in storage
    const lastShopId = localStorage.getItem('vyapar_last_active_shop');
    if (lastShopId) {
      storageService.setActiveShop(lastShopId);
      setStoreData({ ...storageService.getShopData(lastShopId) });
    }

    return unsub;
  }, []);

  // Clear undo action after 10 seconds
  useEffect(() => {
    if (!undoAction) return;
    const timer = setTimeout(() => {
      setUndoAction(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [undoAction]);

  const createShop = (settings: Omit<ShopSettings, 'id' | 'createdAt' | 'updatedAt' | 'aiScansUsedThisMonth' | 'aiMonthlyLimit'>) => {
    const id = `shop_${Date.now()}`;
    const preset = SHOP_TYPE_PRESETS[settings.shopType] || SHOP_TYPE_PRESETS.other;

    const fullSettings: ShopSettings = {
      ...settings,
      id,
      aiScansUsedThisMonth: 0,
      aiMonthlyLimit: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = storageService.createShop(fullSettings, preset.suggestedCategories);
    localStorage.setItem('vyapar_last_active_shop', id);
    setStoreData({ ...storageService.getShopData(id) });
    return created;
  };

  const updateShopSettings = (updates: Partial<ShopSettings>) => {
    storageService.updateShopSettings(updates);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'shopId'>) => {
    const prod = storageService.addProduct(product);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return prod;
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    const updated = storageService.updateProduct(productId, updates, storeData?.shop.ownerName);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return updated;
  };

  const adjustStock = (productId: string, delta: number, reason: MovementReason, note?: string, refId?: string) => {
    storageService.adjustStock(
      productId,
      delta,
      reason,
      storeData?.shop.ownerName || 'Owner',
      note,
      refId
    );
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
  };

  const deleteProductToTrash = (productId: string) => {
    const trash = storageService.moveProductToTrash(productId, storeData?.shop.ownerName);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    // Set 10-second undo
    setUndoAction({
      message: `Deleted "${trash.displayName}"`,
      onUndo: () => {
        storageService.restoreFromTrash(trash.id);
        if (storeData) {
          setStoreData({ ...storageService.getShopData(storeData.shop.id) });
        }
      },
    });
    return trash;
  };

  const restoreFromTrash = (trashId: string) => {
    const ok = storageService.restoreFromTrash(trashId);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return ok;
  };

  const permanentDeleteTrash = (trashId: string) => {
    const ok = storageService.permanentDeleteTrash(trashId);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return ok;
  };

  const recordSale = (sale: Omit<Sale, 'id' | 'shopId' | 'status' | 'createdAt'>) => {
    const res = storageService.recordSale(sale);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return res;
  };

  const addCustomer = (cust: Omit<Customer, 'id' | 'shopId' | 'createdAt' | 'updatedAt' | 'lastTransactionAt' | 'totalPurchasesPaise' | 'totalPaidPaise'>) => {
    const res = storageService.addCustomer(cust);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return res;
  };

  const recordCustomerPayment = (customerId: string, amountPaise: number, mode: PaymentMode, notes?: string) => {
    const res = storageService.recordCustomerPayment(
      customerId,
      amountPaise,
      mode,
      storeData?.shop.ownerName || 'Owner',
      notes
    );
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return res;
  };

  const addCategory = (name: string) => {
    if (!storeData) return;
    const cat: CategoryItem = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
    };
    storeData.categories.push(cat);
    storageService.updateShopSettings({}); // trigger persist
    setStoreData({ ...storageService.getShopData(storeData.shop.id) });
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'shopId' | 'priceHistory' | 'balancePaise' | 'createdAt' | 'updatedAt'>) => {
    if (!storeData) throw new Error('No active shop');
    const sup: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}`,
      shopId: storeData.shop.id,
      balancePaise: 0,
      priceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storeData.suppliers.unshift(sup);
    storageService.updateShopSettings({});
    setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    return sup;
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'shopId' | 'createdAt'>) => {
    if (!storeData) throw new Error('No active shop');
    const po: PurchaseOrder = {
      ...poData,
      id: `po_${Date.now()}`,
      shopId: storeData.shop.id,
      createdAt: new Date().toISOString(),
    };
    storeData.purchaseOrders.unshift(po);
    storageService.updateShopSettings({});
    setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    return po;
  };

  const markPOReceived = (poId: string) => {
    if (!storeData) return;
    const po = storeData.purchaseOrders.find(p => p.id === poId);
    if (!po || po.status === 'received') return;

    po.status = 'received';
    po.receivedAt = new Date().toISOString();

    // Increment stock for each item automatically
    for (const item of po.items) {
      adjustStock(
        item.productId,
        item.quantity,
        'purchase',
        `Received PO #${po.poNumber}`,
        po.id
      );
    }

    storageService.updateShopSettings({});
    setStoreData({ ...storageService.getShopData(storeData.shop.id) });
  };

  const exportBackup = () => {
    return storageService.exportDataSnapshot();
  };

  const getBackupPreview = (snapshot: BackupDataSnapshot) => {
    return storageService.getBackupPreview(snapshot);
  };

  const restoreBackup = (snapshot: BackupDataSnapshot, mode: 'replace' | 'copy') => {
    const res = storageService.restoreFromSnapshot(snapshot, mode);
    if (storeData) {
      setStoreData({ ...storageService.getShopData(storeData.shop.id) });
    }
    return res;
  };

  const deleteAccountAndShop = () => {
    if (!storeData) return;
    localStorage.removeItem(`vyapar_stock_data_${storeData.shop.id}`);
    localStorage.removeItem('vyapar_last_active_shop');
    setStoreData(null);
  };

  // Deterministic seed data helper for automated Playwright / visual test verification
  const seedDemoForTesting = (type: ShopSettings['shopType'] = 'kirana') => {
    const preset = SHOP_TYPE_PRESETS[type] || SHOP_TYPE_PRESETS.kirana;
    const shop = createShop({
      name: 'Radhe Krishna Super Store',
      ownerName: 'Sunil Sharma',
      phone: '9876543210',
      address: 'Shop No. 4, City Center Market, Jaipur',
      gstin: '08AAAAA0000A1Z5',
      upiId: 'sunilstore@okhdfcbank',
      shopType: type,
      currencySymbol: '₹',
      currencyCode: 'INR',
      language: 'en',
      billStyle: 'gst',
      receiptHeader: 'Radhe Krishna Super Store - Fast & Fresh',
      receiptFooter: 'Thank you for shopping with us! Please visit again.',
      enabledFields: preset.defaultEnabledFields,
      lowStockThresholdDefault: 5,
      ownerId: 'owner_demo_uid',
    });

    // Seed sample products
    const p1 = addProduct({
      name: 'Fortune Sunlite Refined Sunflower Oil 1L',
      quantity: 24,
      sellingPricePaise: 14500, // ₹145
      purchasePricePaise: 12500,
      unit: 'litre',
      category: 'Oils & Ghee',
      brand: 'Fortune',
      minStockAlert: 5,
      shelfLocation: 'Rack A-1',
      createdBy: 'Sunil Sharma',
    });

    const p2 = addProduct({
      name: 'Daawat Rozana Gold Basmati Rice 5kg',
      quantity: 12,
      sellingPricePaise: 38000, // ₹380
      purchasePricePaise: 32000,
      unit: 'packet',
      category: 'Grains & Flours',
      brand: 'Daawat',
      minStockAlert: 3,
      shelfLocation: 'Rack B-2',
      createdBy: 'Sunil Sharma',
    });

    const p3 = addProduct({
      name: 'Tata Salt Vaccum Evaporated 1kg',
      quantity: 45,
      sellingPricePaise: 2800, // ₹28
      purchasePricePaise: 2200,
      unit: 'packet',
      category: 'Spices & Masala',
      brand: 'Tata',
      minStockAlert: 10,
      shelfLocation: 'Rack C-1',
      createdBy: 'Sunil Sharma',
    });

    const p4 = addProduct({
      name: 'Madhur Pure & Hygienic Sugar 5kg',
      quantity: 2, // low stock!
      sellingPricePaise: 24000, // ₹240
      purchasePricePaise: 21000,
      unit: 'packet',
      category: 'Grains & Flours',
      brand: 'Madhur',
      minStockAlert: 5,
      shelfLocation: 'Rack B-1',
      createdBy: 'Sunil Sharma',
    });

    // Seed customer
    const c1 = addCustomer({
      name: 'Amit Verma',
      phone: '9829012345',
      address: 'Flat 302, Green Valley Apartments',
      currentBalancePaise: 125000, // ₹1,250 Udhaar
    });

    const c2 = addCustomer({
      name: 'Pooja Agarwal',
      phone: '9829098765',
      address: 'Sector 5, Mansarovar',
      currentBalancePaise: 0,
    });

    // Seed completed sale
    recordSale({
      invoiceNumber: 'INV-1001',
      items: [
        {
          productId: p1.id,
          name: p1.name,
          quantity: 2,
          unit: 'litre',
          sellingPricePaise: 14500,
          purchasePricePaise: 12500,
          totalPaise: 29000,
        },
        {
          productId: p3.id,
          name: p3.name,
          quantity: 1,
          unit: 'packet',
          sellingPricePaise: 2800,
          purchasePricePaise: 2200,
          totalPaise: 2800,
        },
      ],
      subtotalPaise: 31800,
      discountPaise: 0,
      taxPaise: 1514, // 5% GST
      totalPaise: 31800,
      paymentMethod: 'upi',
      customerId: c2.id,
      customerName: c2.name,
      customerPhone: c2.phone,
      createdBy: 'Sunil Sharma',
    });
  };

  return (
    <ShopContext.Provider
      value={{
        activeShop: storeData ? storeData.shop : null,
        currentUserRole: 'owner', // Default role for active session
        products: storeData ? storeData.products : [],
        categories: storeData ? storeData.categories : [],
        customers: storeData ? storeData.customers : [],
        sales: storeData ? storeData.sales : [],
        payments: storeData ? storeData.payments : [],
        stockMovements: storeData ? storeData.stockMovements : [],
        suppliers: storeData ? storeData.suppliers : [],
        purchaseOrders: storeData ? storeData.purchaseOrders : [],
        returns: storeData ? storeData.returns : [],
        trash: storeData ? storeData.trash : [],
        auditLogs: storeData ? storeData.auditLogs : [],
        members: storeData ? storeData.members : [],
        isOnline: networkStatus.isOnline,
        pendingSyncCount: networkStatus.pendingSyncCount,
        user,
        isAuthReady,
        isSyncing,
        signInWithGoogle,
        signOutUser,
        syncToCloud,
        createShop,
        updateShopSettings,
        addProduct,
        updateProduct,
        adjustStock,
        deleteProductToTrash,
        restoreFromTrash,
        permanentDeleteTrash,
        recordSale,
        addCustomer,
        recordCustomerPayment,
        addCategory,
        addSupplier,
        createPurchaseOrder,
        markPOReceived,
        exportBackup,
        getBackupPreview,
        restoreBackup,
        deleteAccountAndShop,
        seedDemoForTesting,
        undoAction,
        setUndoAction,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
