# Universal Indian Retail Stock, Sales & Khata System

A simple, fast, resilient Android (Capacitor) and web application designed for any small shop owner in India (Kirana, Hardware, Medical, Clothing, Electronics, Mobile, Stationery, Paint, Furniture, Marble & Tiles, and general retail) to manage stock, sales, customer credit (*udhaar*), and money with offline support and zero-latency interactions.

---

> [!IMPORTANT]
> **Revised Alignment & Ground Rules**
> 1. **Zero Personal Data & Decoupled Branding**:
>    - No hardcoded personal names, owner emails, phone numbers, GSTINs, or shop names anywhere in code or database rules.
>    - App name is treated as a configurable presentation layer label; database paths, collections, and internal logic remain completely agnostic (e.g. `shops/{shopId}/*`) allowing zero-friction rebranding at any time.
> 2. **No Barcode Scanning**:
>    - Barcode fields and scanner integrations are completely removed from product models, database schemas, forms, and workflows.
> 3. **Firestore Security Rules & Multi-Tenant Tests (Milestone 3)**:
>    - Strict ABAC security rules with a dedicated emulator-based automated test suite verifying that a user from Shop A can never read or write Shop B's data under any condition.
> 4. **Automated & Safeguarded Backups (Milestone 5)**:
>    - Scheduled Cloud Function exports active shops daily to private Cloud Storage (`backups/{shopId}/{date}.json`), retaining the last 30 daily backups and 12 monthly backups before automatic rotation.
>    - Manual backup & export (JSON + Excel), and restore flow with a full preview of record counts that **mandatory takes an automatic safety backup** before applying any replacement.
> 5. **Financial Precision & Offline-First Persistence**:
>    - All currency values stored in integer paise (₹1.00 = 100 paise).
>    - Offline persistence via Firestore local cache with live sync indicator (*"X changes waiting to sync"*).

---

## 1. Overview & Core Concept

Small shop owners (*vyaparis*) operate in bustling retail markets where transactions happen rapidly and cellular networks fluctuate. The system delivers:
- **Fast One-Thumb Ergonomics**: Large touch targets ($\ge 48\text{px}$), rapid `+` / `-` stock steppers on product cards, and a 3-tap Quick Add modal.
- **Shop-Type Adaptation**: Onboarding pre-populates industry-standard units (kg, gram, litre, ml, piece, packet, box, dozen, bag, bottle, metre, sq ft, set) and customizable category presets without rigid schema locks.
- **Instant POS & WhatsApp Sharing**: Clean receipt generation (GST bill or Simple bill) with custom UPI QR code and 1-tap WhatsApp sharing for bills and polite payment reminders.
- **Data Protection Guarantee**: 30-day Recycle Bin, 10-second Undo snackbars on destructive actions, transaction-guaranteed stock mutations, and previewable backup/restore.

---

## 2. User Experience & Visual Design

### Design Language & Accessibility
- **Palette**: Deep professional teal primary (`#0F766E` / `teal-700`), warm amber warning (`#D97706`), crisp emerald success (`#059669`), and neutral high-contrast canvas (`#F8FAFC` light, `#0F172A` dark) tested for outdoor sun glare.
- **Typography**: Clean, readable sans-serif pairing with native Devanagari script support, tabular figures (`font-mono tabular-nums`) for currency and quantity columns, and minimum 16px body copy.
- **Zero-Pill Restraint**: Metadata rendered with clean unboxed typographic dividers (`·` and `/`), avoiding AI capsule clutter while keeping interactive segmented controls distinct.

### Primary Screen Flows
1. **Onboarding & Setup Flow (4 Steps)**:
   - Welcome & Language selection (English / हिन्दी).
   - Shop details (Shop Name, Owner Name, Phone, Address, optional GSTIN, optional UPI ID & Logo).
   - Shop Type Selector (Kirana, Hardware, Medical, Clothes, Electronics, Mobile, Stationery, Paint, Furniture, Marble, Other) $\to$ loads customizable suggested categories and units.
   - Bill preference (Simple Bill vs. Tax GST Invoice).
2. **Bottom Navigation (5 Anchors)**:
   - **Home**: Today's sales, cash collected, low-stock alerts, customer dues, and 4 primary action tiles (*Add Stock, New Sale, Udhaar Payment, Stock Count*).
   - **Stock**: Real-time product cards with `+`/`-` buttons, search (English/Hindi/Roman-Hindi), category chips, low-stock/out-of-stock filters, and Floating `+` Quick Add.
   - **Sell (POS)**: Rapid cart builder, instant price/qty adjustments, discount toggle, payment methods (Cash, UPI, Card, Udhaar/Credit), and 1-tap WhatsApp/Print bill.
   - **Customers**: Customer ledger (*Khata*), outstanding balances, payment entry, transaction history, and polite customizable WhatsApp payment reminder messages.
   - **More**: Suppliers & Purchase Orders, Stock Audit Count Mode, Reports (Daily/Weekly/Monthly Sales, Profit, Dead Stock), Recycle Bin, Backup & Restore, Team Permissions, and Shop Settings.

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Capacitor Mobile & Web PWA                      │
├────────────────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + Tailwind CSS (Light / Dark Mode + i18n EN/HI) │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│   State & Local Cache    │    Search & Aliases      │   PDF & QR Gen   │
│  - Offline IndexedDb     │  - Roman-Hindi indexer   │  - Canvas UPI QR │
│  - Sync Queue Monitor    │  - Fuzzy token matching  │  - Bill Styler   │
└─────────────┬────────────┴─────────────┬────────────┴──────────────────┘
              │                          │
              ▼                          ▼
┌────────────────────────────┐ ┌─────────────────────────────────────────┐
│     Firebase Client        │ │       Cloud Functions (Backend)         │
│  - Auth (Google / Phone)   │ │  - Scheduled Nightly Backups            │
│  - Firestore Persistence   │ │    (30 daily + 12 monthly retention)    │
│  - Client Transactions     │ │  - Gemini Multimodal Bill OCR (Key Safe)│
└─────────────┬──────────────┘ └─────────────────┬───────────────────────┘
              │                                  │
              ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Google Cloud / Firebase Services                   │
│  - Cloud Firestore (Multi-tenant shops/{shopId}/*)                     │
│  - Cloud Storage (Receipts, logos, backups/{shopId}/{date}.json)       │
│  - ABAC Security Rules (Strict member-enforced role gates)             │
└────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Data Model (`shops/{shopId}/*`)

| Collection Path | Entity Description | Key Attributes |
| :--- | :--- | :--- |
| `users/{uid}` | User Profile & Shop List | `uid`, `name`, `phone`, `email`, `shopIds[]`, `activeShopId` |
| `shops/{shopId}` | Shop Metadata & Settings | `name`, `ownerId`, `ownerName`, `phone`, `address`, `gstin`, `upiId`, `shopType`, `currency`, `language`, `billStyle`, `enabledOptionalFields`, `createdAt` |
| `shops/{shopId}/members/{uid}` | Access Control (RBAC) | `uid`, `role` (`owner` \| `manager` \| `staff` \| `viewer`), `invitedBy`, `joinedAt` |
| `shops/{shopId}/products/{id}` | Product Catalog | `name`, `category`, `unit`, `quantity` (float), `sellingPrice` (paise), `purchasePrice` (paise), `minStockAlert`, `brand`, `expiryDate`, `batch`, `shelfLocation`, `archived`, `updatedAt` |
| `shops/{shopId}/stockMovements/{id}` | Immutable Stock Audit Trail | `productId`, `productName`, `deltaQuantity`, `previousQuantity`, `newQuantity`, `reason` (`purchase` \| `sale` \| `damaged` \| `expired` \| `lost` \| `returned` \| `count_adjustment`), `performedBy`, `timestamp`, `note` |
| `shops/{shopId}/sales/{id}` | Invoices & Transactions | `invoiceNumber`, `items[]` (`productId`, `name`, `qty`, `unit`, `pricePaise`), `subtotalPaise`, `discountPaise`, `totalPaise`, `paymentMethod` (`cash` \| `upi` \| `card` \| `credit`), `customerId`, `customerName`, `status` (`completed` \| `returned`), `createdAt` |
| `shops/{shopId}/customers/{id}` | Customer Ledger (*Udhaar*) | `name`, `phone`, `currentBalancePaise` (positive = owes shop), `totalPurchasesPaise`, `notes`, `updatedAt` |
| `shops/{shopId}/payments/{id}` | Ledger Payments Received | `customerId`, `amountPaise`, `paymentMode` (`cash` \| `upi` \| `bank`), `referenceNo`, `receivedBy`, `date` |
| `shops/{shopId}/suppliers/{id}` | Vendor Directory & Costs | `name`, `phone`, `company`, `gstin`, `balancePaise`, `priceHistory[]` |
| `shops/{shopId}/purchaseOrders/{id}` | Purchase Tracking | `poNumber`, `supplierId`, `items[]`, `totalPaise`, `status` (`draft` \| `ordered` \| `received`), `receivedAt` |
| `shops/{shopId}/trash/{id}` | Soft-Deleted Recycle Bin | `entityType` (`product` \| `customer` \| `sale`), `originalId`, `data` (JSON snapshot), `deletedAt`, `deletedBy`, `expiresAt` (30 days) |
| `shops/{shopId}/auditLogs/{id}` | Security & Action Audit | `action`, `actorUid`, `actorRole`, `details`, `timestamp` |

---

## 4. Planned Project Folder Structure

```
src/
├── components/
│   ├── common/             # Button, Input, Modal, Badge, EmptyState, LoadingSkeleton, Toast
│   ├── layout/             # TopBar, BottomNav, MobileContainer, OfflineBanner
│   ├── stock/              # ProductCard, QuickAddSheet, StockMovementDialog, UnitSelector
│   ├── sales/              # CartItemRow, PaymentSelector, BillModal, BillTemplate
│   ├── customers/          # CustomerCard, UdhaarDialog, WhatsAppReminderModal
│   ├── audit/              # StockCountRow, DifferenceSummary
│   └── settings/           # ShopDetailsForm, FieldToggleList, BackupRestoreCard, TeamList
├── context/
│   ├── AuthContext.tsx     # Firebase user session & role permissions
│   ├── ShopContext.tsx     # Active shop state, real-time listeners, offline queues
│   └── I18nContext.tsx     # Language toggle (EN/HI) & translation strings
├── hooks/
│   ├── useStockSearch.ts   # English + Hindi + Roman-Hindi fuzzy search hook
│   ├── useOfflineSync.ts   # Firestore network connectivity & pending writes watcher
│   └── usePermissions.ts   # Role-based feature gates (Owner / Manager / Staff / Viewer)
├── locales/
│   ├── en.ts               # Complete English strings dictionary
│   ├── hi.ts               # Complete Hindi (हिन्दी) strings dictionary
│   └── romanHindiMap.ts    # Transliteration aliases ("chawal" -> "Rice", "cheeni" -> "Sugar", etc.)
├── services/
│   ├── firebase.ts         # Firebase App, Auth, Firestore with offline persistence
│   ├── stockService.ts     # Transactional stock mutations and movement logger
│   ├── salesService.ts     # Atomic sale creation + customer balance + stock deduction
│   ├── customerService.ts  # Khata payment logging and balance queries
│   ├── backupService.ts    # Client JSON export, import previewer, and restore safeguards
│   └── billGenerator.ts    # GST / Simple bill calculation, printable HTML/PDF, and UPI QR
├── types/
│   ├── shop.ts             # Shop, TeamMember, Role definitions
│   ├── product.ts          # Product, Unit, Category, StockMovement, Reason (No barcode)
│   ├── sale.ts             # Sale, SaleItem, PaymentMethod, BillConfig
│   └── customer.ts         # Customer, PaymentRecord, LedgerEntry
├── utils/
│   ├── currency.ts         # Paise to Rupees formatting (₹) and parsing
│   ├── date.ts             # Localized Indian date formats (DD/MM/YYYY)
│   └── sound.ts            # Haptic vibration / light feedback triggers
├── App.tsx                 # Root app shell, router, and onboarding guards
└── main.tsx                # Entry point
```

---

## 5. Development Milestones & Verification Plan

### Milestone 1 — Foundation & Onboarding
- Agnostic branding & architecture setup (neutral database paths, zero personal hardcoding).
- English and Hindi translation dictionaries (`en.ts`, `hi.ts`) with Roman-Hindi search indexer.
- 4-step shop onboarding wizard (Language, Shop Details, Shop Type with suggested categories/units, Bill Style).
- High-contrast responsive shell with thumb-zone navigation.

### Milestone 2 — Core Stock Management
- Flexible product catalog (strictly without barcode fields or scanning dependencies).
- Unit conversion engine (e.g., 1 Box = 12 Pieces, 1 Bag = 50 kg).
- Rapid `+`/`-` stock steppers with haptic feedback and long-press numeric input.
- Stock In / Stock Out modal with mandatory business reasons (*purchase, sale, damaged, expired, lost, returned, count adjustment*).
- Offline-first mutation queues with sync state badge (*"X changes waiting to sync"*).

### Milestone 3 — Data Safety, Audit & Security Rules Verification
- Recycle bin with 30-day soft deletion and 10-second undo snackbar.
- Inventory Count Mode: Walk-through shop audit comparing physical count to system stock with 1-tap correction.
- Tamper-evident audit log for stock adjustments and price updates.
- **Firestore Security Rules & Emulator Tests**: Test suite executing the "Dirty Dozen" tests and verifying that:
  - User of Shop A is strictly rejected from reading or writing documents in Shop B.
  - Staff roles cannot delete products or view profit margins.
  - Stock updates must pass schema validation and valid actor role checks.

### Milestone 4 — POS Sales, Bills & Customer Khata
- Fast Sale / POS screen with quick product pick, quantity adjustment, discount, and payment methods (Cash, UPI, Card, Udhaar).
- Instant receipt engine: GST invoice (with GSTIN/HSN breakdown) and Simple bill.
- Shop's custom UPI QR code embedded directly on receipts.
- 1-tap WhatsApp invoice sharing and customer balance ledger (*Khata*).
- Polite, customizable WhatsApp payment reminder messages.
- Customer returns and supplier return flows updating stock and ledger balances atomically.

### Milestone 5 — Backup, Restore & Data Tools
- **Scheduled Automated Daily Backup**: Cloud Function exporting active shops to private Cloud Storage `backups/{shopId}/{date}.json` with automatic retention (keeping last 30 daily and 12 monthly backups).
- **Manual Backup & Export**: "Back up now" button generating JSON and Excel spreadsheets shareable via standard phone share sheet.
- **Restore with Preview & Pre-Restore Safety Snapshot**: Shows record counts (products, sales, customers) and automatically creates a safety snapshot before restoring as a copy or replacing current data.
- **Data Deletion & Play Compliance**: Account & shop data deletion flow with confirmation and public deletion request instructions.

### Milestone 6 — Smart Analytics & Supplier Workflows
- Low-stock alerts and shareable WhatsApp reorder list.
- Expiry date alerts (30, 15, and 7 days) for applicable retail shops.
- Dead stock (not sold in 60/90 days) and top-selling product velocity metrics.
- Supplier catalog, purchase order creation, and auto-stock increment upon receiving goods.
- AI bill photo scan UI with per-shop monthly quota limits, review screen, and mandatory owner confirmation.

### Milestone 7 — Multi-User Roles & Permissions
- Granular RBAC: Owner, Manager, Staff, and Stock Viewer.
- Team invitation via phone/email with role-specific views (e.g. Staff cannot see profit/costs or delete shop).
- Role revocation and instant sub-collection lockouts.

### Milestone 8 — Production Polish, Tests & Play Store Readiness
- Comprehensive unit tests (`tsx --test`) for unit conversions, paise financial math, and search transliterations.
- Play Store asset guides: Keystore generation, target Android SDK specs, Data Safety declaration answers, bilingual listing drafts, privacy policy, and 12-tester recruitment checklist.
- Production documentation: `README.md` and `DECISIONS.md`.
