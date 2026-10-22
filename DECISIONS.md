# Architectural & Product Decisions Log (DECISIONS.md)

This document records key decisions made to guarantee data safety, high performance, and total agnostic flexibility across retail shop types in India.

---

### Decision 1: Paise as Smallest Integer Currency Unit
- **Choice**: All prices, subtotals, discounts, tax amounts, and customer ledger balances are stored as integer paise (e.g. ₹150.50 is stored as `15050`).
- **Rationale**: Eliminates standard IEEE-754 binary floating-point rounding bugs (such as `0.1 + 0.2 = 0.30000000000000004`) during discount compounding, tax calculation, and ledger reconciliation.
- **Alternatives Considered**: Storing floating-point Rupees directly (rejected due to accumulation of rounding errors over thousands of retail sales).

---

### Decision 2: Decoupled Multi-Shop Path Structure (`shops/{shopId}/*`)
- **Choice**: The database schema and folder structure use strictly neutral identifiers (`shops/{shopId}/products`, `shops/{shopId}/sales`, etc.) with zero hardcoded shop names, owner emails, phone numbers, or brand names.
- **Rationale**: Ensures the app can be rebranded or remixed under any company name without schema migrations, and cleanly isolates tenant data with Attribute-Based Access Control (ABAC).

---

### Decision 3: Barcode Scanning Omission
- **Choice**: Barcode input fields and camera barcode scanning dependencies are strictly omitted from models, forms, and workflows.
- **Rationale**: In accordance with project requirements. Small Indian retail shops (kirana, hardware, marble, clothing) frequently sell unbarcoded, loose, or custom-measured items (e.g. loose grains by kg, cut cloth by metre, marble by sq ft). Fast search with Roman-Hindi phonetic matching provides a much faster and zero-hardware workflow.

---

### Decision 4: Gemini Multimodal Bill OCR Isolated in Cloud Function
- **Choice**: Gemini API calls for supplier bill photo scanning are deployed strictly inside serverless Cloud Functions (`functions/src/index.ts`) with a per-shop monthly rate limit.
- **Rationale**: The Gemini API key must never be bundled inside client JavaScript or the Android APK bundle where attackers could extract it. Furthermore, requiring owner review before adding stock prevents OCR hallucinations from corrupting inventory.

---

### Decision 5: Mandatory Pre-Restore Safety Snapshot
- **Choice**: Whenever an owner chooses to restore a previous JSON backup file, the system automatically takes a complete snapshot of the current state (`safety_backup_{shopId}_{timestamp}`) before applying any changes.
- **Rationale**: Guarantees zero accidental data loss if an owner accidentally uploads an obsolete or incorrect backup file.

---

### Decision 6: Dual Language English & Hindi with Roman Transliteration
- **Choice**: Text strings are externalized in dedicated dictionary files (`en.ts`, `hi.ts`). Product search incorporates a Roman-Hindi phonetic indexer ("chawal" $\to$ "Rice / चावल", "cheeni" $\to$ "Sugar", "loha" $\to$ "Iron").
- **Rationale**: Shop owners frequently type product names using Roman English alphabets even when thinking in Hindi.
