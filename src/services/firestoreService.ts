/**
 * Firestore Service Layer
 * Coordinates cloud data persistence for VyaparStock under multi-tenant paths:
 * /shops/{shopId}/products/{productId}
 * /shops/{shopId}/sales/{saleId}
 * /shops/{shopId}/customers/{customerId}
 * /shops/{shopId}/stockMovements/{movementId}
 * /shops/{shopId}/payments/{paymentId}
 *
 * Implements strict error handling conforming to firebase-integration-rpc guidelines.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ShopDataStore } from './storageService';
import { Product, StockMovement } from '../types/product';
import { Sale } from '../types/sale';
import { Customer, CustomerPayment } from '../types/customer';
import { ShopSettings, TeamMember } from '../types/shop';

export class FirestoreService {
  /**
   * Syncs an entire shop store to Firestore (used upon initial cloud connection or manual sync)
   */
  public async syncShopToFirestore(shopId: string, store: ShopDataStore): Promise<void> {
    if (!auth.currentUser) return;
    const shopPath = `shops/${shopId}`;

    try {
      // 1. Root shop document
      await setDoc(doc(db, 'shops', shopId), {
        name: store.shop.name || 'My Shop',
        ownerName: store.shop.ownerName || 'Owner',
        phone: store.shop.phone || '',
        address: store.shop.address || '',
        shopType: store.shop.shopType || 'other',
        ownerId: auth.currentUser.uid,
        currencyCode: store.shop.currencyCode || 'INR',
        currencySymbol: store.shop.currencySymbol || '₹',
        billStyle: store.shop.billStyle || 'simple',
        createdAt: store.shop.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. Member document
      const memberPath = `shops/${shopId}/members/${auth.currentUser.uid}`;
      await setDoc(doc(db, 'shops', shopId, 'members', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || store.shop.ownerName || 'Owner',
        role: 'owner',
        joinedAt: new Date().toISOString(),
      }, { merge: true });

      // 3. Sync products
      for (const p of store.products) {
        await this.saveProduct(shopId, p);
      }

      // 4. Sync customers
      for (const c of store.customers) {
        await this.saveCustomer(shopId, c);
      }

      // 5. Sync sales
      for (const s of store.sales) {
        await this.saveSale(shopId, s);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, shopPath);
    }
  }

  /**
   * Loads full shop data from Firestore
   */
  public async loadShopFromFirestore(shopId: string): Promise<Partial<ShopDataStore> | null> {
    const shopPath = `shops/${shopId}`;
    try {
      const snap = await getDoc(doc(db, 'shops', shopId));
      if (!snap.exists()) return null;

      const shopData = snap.data() as Partial<ShopSettings>;

      // Load products
      const prodSnap = await getDocs(collection(db, 'shops', shopId, 'products'));
      const products: Product[] = [];
      prodSnap.forEach(d => products.push(d.data() as Product));

      // Load customers
      const custSnap = await getDocs(collection(db, 'shops', shopId, 'customers'));
      const customers: Customer[] = [];
      custSnap.forEach(d => customers.push(d.data() as Customer));

      // Load sales
      const salesSnap = await getDocs(query(collection(db, 'shops', shopId, 'sales'), limit(100)));
      const sales: Sale[] = [];
      salesSnap.forEach(d => sales.push(d.data() as Sale));

      return {
        shop: {
          id: shopId,
          name: shopData.name || '',
          ownerName: shopData.ownerName || '',
          phone: shopData.phone || '',
          address: shopData.address || '',
          shopType: (shopData.shopType as any) || 'other',
          currencySymbol: shopData.currencySymbol || '₹',
          currencyCode: shopData.currencyCode || 'INR',
          language: 'en',
          billStyle: shopData.billStyle || 'simple',
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
          createdAt: shopData.createdAt || new Date().toISOString(),
          updatedAt: shopData.updatedAt || new Date().toISOString(),
          ownerId: shopData.ownerId || auth.currentUser?.uid || '',
        },
        products,
        customers,
        sales,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, shopPath);
    }
  }

  /**
   * Save or update a product in Firestore
   */
  public async saveProduct(shopId: string, product: Product): Promise<void> {
    const path = `shops/${shopId}/products/${product.id}`;
    try {
      await setDoc(doc(db, 'shops', shopId, 'products', product.id), {
        ...product,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Soft delete or remove product
   */
  public async deleteProduct(shopId: string, productId: string): Promise<void> {
    const path = `shops/${shopId}/products/${productId}`;
    try {
      await deleteDoc(doc(db, 'shops', shopId, 'products', productId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  /**
   * Record immutable stock movement log
   */
  public async saveStockMovement(shopId: string, movement: StockMovement): Promise<void> {
    const path = `shops/${shopId}/stockMovements/${movement.id}`;
    try {
      await setDoc(doc(db, 'shops', shopId, 'stockMovements', movement.id), {
        ...movement,
        performedBy: auth.currentUser?.uid || movement.performedBy || 'Staff',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  /**
   * Save a completed sale invoice
   */
  public async saveSale(shopId: string, sale: Sale): Promise<void> {
    const path = `shops/${shopId}/sales/${sale.id}`;
    try {
      await setDoc(doc(db, 'shops', shopId, 'sales', sale.id), {
        ...sale,
        createdBy: auth.currentUser?.uid || 'Staff',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  /**
   * Save or update customer profile
   */
  public async saveCustomer(shopId: string, customer: Customer): Promise<void> {
    const path = `shops/${shopId}/customers/${customer.id}`;
    try {
      await setDoc(doc(db, 'shops', shopId, 'customers', customer.id), {
        ...customer,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Record customer payment
   */
  public async savePayment(shopId: string, payment: CustomerPayment): Promise<void> {
    const path = `shops/${shopId}/payments/${payment.id}`;
    try {
      await setDoc(doc(db, 'shops', shopId, 'payments', payment.id), {
        ...payment,
        createdBy: auth.currentUser?.uid || 'Staff',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  /**
   * Realtime subscription for products with standard handleFirestoreError callback
   */
  public subscribeProducts(shopId: string, onUpdate: (products: Product[]) => void): () => void {
    const path = `shops/${shopId}/products`;
    const colRef = collection(db, 'shops', shopId, 'products');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const products: Product[] = [];
        snapshot.forEach((d) => products.push(d.data() as Product));
        onUpdate(products);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  /**
   * Realtime subscription for customers with standard handleFirestoreError callback
   */
  public subscribeCustomers(shopId: string, onUpdate: (customers: Customer[]) => void): () => void {
    const path = `shops/${shopId}/customers`;
    const colRef = collection(db, 'shops', shopId, 'customers');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const customers: Customer[] = [];
        snapshot.forEach((d) => customers.push(d.data() as Customer));
        onUpdate(customers);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }
}

export const firestoreService = new FirestoreService();
