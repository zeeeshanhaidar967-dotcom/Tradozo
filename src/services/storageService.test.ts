import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from './storageService';
import { ShopSettings } from '../types/shop';

// Simple mock for browser localStorage in Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: 0,
  } as Storage;
}

test('StorageService: Shop creation and isolated tenancy', () => {
  const service = new StorageService();
  const shopSettings: ShopSettings = {
    id: 'test_shop_101',
    name: 'Bharat General Store',
    ownerName: 'Ramesh Kumar',
    phone: '9876543210',
    address: 'Main Market, Delhi',
    shopType: 'kirana',
    currencySymbol: '₹',
    currencyCode: 'INR',
    language: 'hi',
    billStyle: 'simple',
    enabledFields: {
      brand: true,
      size: false,
      colour: false,
      purchasePrice: true,
      expiryDate: true,
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
    ownerId: 'user_ramesh_1',
  };

  service.createShop(shopSettings, ['Grains', 'Oils']);
  const data = service.getShopData('test_shop_101');
  assert.equal(data.shop.name, 'Bharat General Store');
  assert.equal(data.categories.length, 2);
  assert.equal(data.members[0].role, 'owner');
});

test('StorageService: Atomic stock adjustment and movement trail', () => {
  const service = new StorageService();
  service.setActiveShop('test_shop_101');

  const prod = service.addProduct({
    name: 'Basmati Rice 5kg',
    quantity: 20,
    sellingPricePaise: 45000, // ₹450
    unit: 'packet',
    createdBy: 'Ramesh',
  });

  assert.equal(prod.quantity, 20);

  // Stock Out: Sold 5 packets
  const { product: updated, movement } = service.adjustStock(
    prod.id,
    -5,
    'sale',
    'Ramesh',
    'Customer purchase'
  );

  assert.equal(updated.quantity, 15);
  assert.equal(movement.previousQuantity, 20);
  assert.equal(movement.newQuantity, 15);
  assert.equal(movement.reason, 'sale');
});

test('StorageService: Soft-delete to Recycle Bin and Restore', () => {
  const service = new StorageService();
  service.setActiveShop('test_shop_101');

  const prod = service.addProduct({
    name: 'Old Detergent',
    quantity: 10,
    sellingPricePaise: 10000,
    unit: 'packet',
    createdBy: 'Ramesh',
  });

  const trashItem = service.moveProductToTrash(prod.id, 'Ramesh');
  assert.equal(trashItem.displayName, 'Old Detergent');

  // Verify item removed from active products
  const activeData = service.getShopData();
  assert.equal(activeData.products.some(p => p.id === prod.id), false);
  assert.equal(activeData.trash.length >= 1, true);

  // Restore item
  const success = service.restoreFromTrash(trashItem.id);
  assert.equal(success, true);
  const restoredData = service.getShopData();
  assert.equal(restoredData.products.some(p => p.name === 'Old Detergent'), true);
});

test('StorageService: POS Sale creation and Udhaar ledger update', () => {
  const service = new StorageService();
  service.setActiveShop('test_shop_101');

  const cust = service.addCustomer({
    name: 'Suresh Patel',
    phone: '9123456780',
    currentBalancePaise: 0,
  });

  const prod = service.addProduct({
    name: 'Mustard Oil 1L',
    quantity: 30,
    sellingPricePaise: 16000, // ₹160
    unit: 'bottle',
    createdBy: 'Ramesh',
  });

  // Credit sale of 2 bottles = ₹320
  const sale = service.recordSale({
    invoiceNumber: 'INV-101',
    items: [
      {
        productId: prod.id,
        name: prod.name,
        quantity: 2,
        unit: 'bottle',
        sellingPricePaise: 16000,
        totalPaise: 32000,
      },
    ],
    subtotalPaise: 32000,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: 32000,
    paymentMethod: 'credit',
    customerId: cust.id,
    customerName: cust.name,
    createdBy: 'Ramesh',
  });

  assert.equal(sale.totalPaise, 32000);

  // Check product stock decremented
  const updatedProd = service.getShopData().products.find(p => p.id === prod.id);
  assert.equal(updatedProd?.quantity, 28);

  // Check customer udhaar balance updated
  const updatedCust = service.getShopData().customers.find(c => c.id === cust.id);
  assert.equal(updatedCust?.currentBalancePaise, 32000); // Owes ₹320
});
