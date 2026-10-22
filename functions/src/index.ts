/**
 * Cloud Functions for Universal Indian Retail Stock & Khata App
 * Implements:
 * 1. Automatic Scheduled Daily Backups to Private Cloud Storage with 30-day / 12-month retention
 * 2. Secure Gemini Bill OCR with per-shop monthly rate limits
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

/**
 * 1. Scheduled Daily Backup: Runs every night at 02:00 AM IST (20:30 UTC)
 * Saves each active shop's data to private Cloud Storage: backups/{shopId}/{date}.json
 * Keeps the last 30 daily and 12 monthly backups, deleting older ones.
 */
export const dailyShopBackup = onSchedule(
  {
    schedule: '30 20 * * *', // 02:00 AM IST
    timeZone: 'Asia/Kolkata',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const bucket = storage.bucket();
    const shopsSnapshot = await db.collection('shops').get();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const isFirstDayOfMonth = today.getDate() === 1;

    for (const shopDoc of shopsSnapshot.docs) {
      const shopId = shopDoc.id;
      const shopData = shopDoc.data();

      // Collect all subcollection records
      const [productsSnap, customersSnap, salesSnap, movementsSnap, suppliersSnap] = await Promise.all([
        db.collection(`shops/${shopId}/products`).get(),
        db.collection(`shops/${shopId}/customers`).get(),
        db.collection(`shops/${shopId}/sales`).get(),
        db.collection(`shops/${shopId}/stockMovements`).get(),
        db.collection(`shops/${shopId}/suppliers`).get(),
      ]);

      const backupPayload = {
        version: '1.0',
        exportedAt: today.toISOString(),
        shop: { id: shopId, ...shopData },
        products: productsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        customers: customersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        sales: salesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        stockMovements: movementsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        suppliers: suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      };

      const backupFilePath = `backups/${shopId}/${dateStr}.json`;
      const file = bucket.file(backupFilePath);
      await file.save(JSON.stringify(backupPayload, null, 2), {
        contentType: 'application/json',
        metadata: {
          isMonthly: isFirstDayOfMonth ? 'true' : 'false',
          backupDate: dateStr,
        },
      });

      // Update shop metadata with last backup timestamp
      await shopDoc.ref.update({
        lastBackupAt: today.toISOString(),
      });

      // Backup Retention Enforcement: Keep last 30 daily and 12 monthly backups
      const [files] = await bucket.getFiles({ prefix: `backups/${shopId}/` });
      const dailyFiles: { name: string; time: number }[] = [];
      const monthlyFiles: { name: string; time: number }[] = [];

      for (const f of files) {
        const [meta] = await f.getMetadata();
        const created = new Date(meta.timeCreated).getTime();
        if (meta.metadata?.isMonthly === 'true') {
          monthlyFiles.push({ name: f.name, time: created });
        } else {
          dailyFiles.push({ name: f.name, time: created });
        }
      }

      // Sort newest to oldest
      dailyFiles.sort((a, b) => b.time - a.time);
      monthlyFiles.sort((a, b) => b.time - a.time);

      // Delete daily backups older than 30
      if (dailyFiles.length > 30) {
        const toDelete = dailyFiles.slice(30);
        await Promise.all(toDelete.map(item => bucket.file(item.name).delete().catch(() => {})));
      }

      // Delete monthly backups older than 12
      if (monthlyFiles.length > 12) {
        const toDelete = monthlyFiles.slice(12);
        await Promise.all(toDelete.map(item => bucket.file(item.name).delete().catch(() => {})));
      }
    }
  }
);

/**
 * 2. Secure Gemini Multimodal Bill OCR
 * Uses the server-side GEMINI_API_KEY. Never exposes keys to the client.
 * Enforces per-shop limits and returns structured items for owner review.
 */
export const scanSupplierBill = onCall(
  {
    enforceAppCheck: false,
    memory: '512MiB',
    secrets: ['GEMINI_API_KEY'],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to scan bills.');
    }

    const { shopId, imageBase64, mimeType } = request.data;
    if (!shopId || !imageBase64) {
      throw new HttpsError('invalid-argument', 'Missing shopId or imageBase64 data.');
    }

    // Verify user is a member of the shop
    const memberDoc = await db.doc(`shops/${shopId}/members/${request.auth.uid}`).get();
    if (!memberDoc.exists) {
      throw new HttpsError('permission-denied', 'You are not a member of this shop.');
    }

    // Check monthly limit
    const shopRef = db.doc(`shops/${shopId}`);
    const shopSnap = await shopRef.get();
    const shopData = shopSnap.data() || {};
    const used = shopData.aiScansUsedThisMonth || 0;
    const limit = shopData.aiMonthlyLimit || 20;

    if (used >= limit) {
      throw new HttpsError(
        'resource-exhausted',
        `Monthly free scan limit of ${limit} bills reached. Contact support to upgrade.`
      );
    }

    // Initialize Gemini SDK with server environment key
    const ai = new GoogleGenAI();
    const prompt = `You are a specialist retail OCR engine for Indian shop supplier invoices and bills.
Read the attached bill image and extract every line item into a clean JSON array with keys:
- "name": string (standardized item name)
- "quantity": number (parsed float, e.g. 5 or 2.5)
- "unit": string (e.g. piece, packet, kg, box, litre)
- "unitPriceRupees": number (numeric price per unit)

Return ONLY valid raw JSON array with no markdown backticks or commentary.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const responseText = response.text || '[]';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedItems = JSON.parse(cleanJson);

      // Increment per-shop counter atomically
      await shopRef.update({
        aiScansUsedThisMonth: admin.firestore.FieldValue.increment(1),
      });

      return {
        success: true,
        scannedItems: parsedItems,
        scansRemaining: Math.max(0, limit - (used + 1)),
      };
    } catch (err: any) {
      console.error('Gemini Bill OCR Error:', err);
      throw new HttpsError('internal', 'Unable to parse bill image. Please ensure good lighting and try again.');
    }
  }
);
