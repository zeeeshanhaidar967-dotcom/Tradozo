/**
 * Unit Conversion Engine for Indian Retail Shops
 * Supports metric standards and custom product conversion ratios.
 */

import { UnitConversionRule } from '../types/product';

// Standard unit aliases & base ratios
const STANDARD_CONVERSIONS: Record<string, { baseUnit: string; factor: number }> = {
  // Mass (Base: gram)
  kg: { baseUnit: 'gram', factor: 1000 },
  kilogram: { baseUnit: 'gram', factor: 1000 },
  gram: { baseUnit: 'gram', factor: 1 },
  g: { baseUnit: 'gram', factor: 1 },
  quintal: { baseUnit: 'gram', factor: 100000 },

  // Volume (Base: ml)
  litre: { baseUnit: 'ml', factor: 1000 },
  l: { baseUnit: 'ml', factor: 1000 },
  ml: { baseUnit: 'ml', factor: 1 },

  // Count (Base: piece)
  dozen: { baseUnit: 'piece', factor: 12 },
  doz: { baseUnit: 'piece', factor: 12 },
  piece: { baseUnit: 'piece', factor: 1 },
  pc: { baseUnit: 'piece', factor: 1 },
  packet: { baseUnit: 'piece', factor: 1 }, // default 1 unless overridden
};

/**
 * Converts a quantity from one unit to another
 */
export function convertUnitQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  customRules?: UnitConversionRule[]
): { converted: number; success: boolean } {
  if (!Number.isFinite(quantity)) return { converted: 0, success: false };

  const normFrom = fromUnit.trim().toLowerCase();
  const normTo = toUnit.trim().toLowerCase();

  if (normFrom === normTo) {
    return { converted: quantity, success: true };
  }

  // 1. Check custom product rules first
  if (customRules && customRules.length > 0) {
    for (const rule of customRules) {
      const ruleFrom = rule.fromUnit.trim().toLowerCase();
      const ruleTo = rule.toUnit.trim().toLowerCase();

      // Forward: e.g., 1 Box -> 12 Pieces
      if (ruleFrom === normFrom && ruleTo === normTo) {
        return { converted: quantity * rule.multiplier, success: true };
      }

      // Reverse: e.g., 12 Pieces -> 1 Box
      if (ruleFrom === normTo && ruleTo === normFrom && rule.multiplier > 0) {
        return { converted: quantity / rule.multiplier, success: true };
      }
    }
  }

  // 2. Check standard conversions
  const stdFrom = STANDARD_CONVERSIONS[normFrom];
  const stdTo = STANDARD_CONVERSIONS[normTo];

  if (stdFrom && stdTo && stdFrom.baseUnit === stdTo.baseUnit) {
    // Both belong to the same physical dimension
    const inBase = quantity * stdFrom.factor;
    const result = inBase / stdTo.factor;
    return { converted: result, success: true };
  }

  // Fallback: No known conversion
  return { converted: quantity, success: false };
}

/**
 * Standard list of retail units for UI selection
 */
export const AVAILABLE_UNITS = [
  { id: 'piece', labelEn: 'Piece (pc)', labelHi: 'पीस (pc)' },
  { id: 'packet', labelEn: 'Packet (pkt)', labelHi: 'पैकेट (pkt)' },
  { id: 'kg', labelEn: 'Kilogram (kg)', labelHi: 'किलो (kg)' },
  { id: 'gram', labelEn: 'Gram (g)', labelHi: 'ग्राम (g)' },
  { id: 'litre', labelEn: 'Litre (L)', labelHi: 'लीटर (L)' },
  { id: 'ml', labelEn: 'Millilitre (ml)', labelHi: 'मिली (ml)' },
  { id: 'box', labelEn: 'Box (bx)', labelHi: 'डिब्बा / बॉक्स (bx)' },
  { id: 'dozen', labelEn: 'Dozen (dz)', labelHi: 'दर्जन (dz)' },
  { id: 'bag', labelEn: 'Bag / बोरी (bag)', labelHi: 'बोरी / बैग (bag)' },
  { id: 'bottle', labelEn: 'Bottle (btl)', labelHi: 'बोतल (btl)' },
  { id: 'metre', labelEn: 'Metre (m)', labelHi: 'मीटर (m)' },
  { id: 'sq_ft', labelEn: 'Sq. Ft. (वर्ग फुट)', labelHi: 'वर्ग फुट (sq ft)' },
  { id: 'set', labelEn: 'Set', labelHi: 'सेट' },
];
