/**
 * Core Logic Fast-Feedback Unit Tests
 * Uses node:test and node:assert/strict
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPaise, rupeesToPaise, paiseToRupees } from './currency';
import { convertUnitQuantity } from './unitConversion';
import { matchProductSearch, getLevenshteinDistance, findSimilarProduct } from '../locales/romanHindiMap';

test('Currency: rupeesToPaise converts numbers and strings accurately', () => {
  assert.equal(rupeesToPaise(10), 1000);
  assert.equal(rupeesToPaise(10.5), 1050);
  assert.equal(rupeesToPaise('₹ 1,500.25'), 150025);
  assert.equal(rupeesToPaise(0), 0);
});

test('Currency: formatPaise formats Indian number groups correctly', () => {
  assert.equal(formatPaise(100000), '₹1,000');
  assert.equal(formatPaise(150050), '₹1,500.50');
  assert.equal(formatPaise(10000000), '₹1,00,000'); // 1 Lakh
  assert.equal(formatPaise(0), '₹0');
  assert.equal(formatPaise(-5000), '-₹50');
});

test('Currency: paiseToRupees handles standard and decimal values', () => {
  assert.equal(paiseToRupees(15000), 150);
  assert.equal(paiseToRupees(12550), 125.5);
});

test('UnitConversion: standard metric conversions work both ways', () => {
  // kg to gram
  const kgToGram = convertUnitQuantity(2.5, 'kg', 'gram');
  assert.equal(kgToGram.success, true);
  assert.equal(kgToGram.converted, 2500);

  // gram to kg
  const gramToKg = convertUnitQuantity(500, 'gram', 'kg');
  assert.equal(gramToKg.success, true);
  assert.equal(gramToKg.converted, 0.5);

  // dozen to piece
  const dozToPc = convertUnitQuantity(2, 'dozen', 'piece');
  assert.equal(dozToPc.success, true);
  assert.equal(dozToPc.converted, 24);
});

test('UnitConversion: custom shop conversion rules work correctly', () => {
  const customRules = [{ fromUnit: 'box', toUnit: 'piece', multiplier: 24 }];
  const boxToPiece = convertUnitQuantity(3, 'box', 'piece', customRules);
  assert.equal(boxToPiece.success, true);
  assert.equal(boxToPiece.converted, 72);

  const pieceToBox = convertUnitQuantity(48, 'piece', 'box', customRules);
  assert.equal(pieceToBox.success, true);
  assert.equal(pieceToBox.converted, 2);
});

test('SearchEngine: Roman-Hindi phonetic aliases match English items', () => {
  // "chawal" finds "Basmati Rice"
  assert.equal(matchProductSearch('Basmati Rice Premium', 'chawal'), true);
  // "cheeni" finds "Sugar 1kg"
  assert.equal(matchProductSearch('Madhur Sugar 1kg', 'cheeni'), true);
  // "tel" finds "Fortune Mustard Oil"
  assert.equal(matchProductSearch('Fortune Mustard Oil', 'tel'), true);
  // "loha" finds "Iron Nail 2 inch"
  assert.equal(matchProductSearch('Iron Nail 2 inch', 'loha'), true);
  // Unrelated word does not match
  assert.equal(matchProductSearch('Colgate Toothpaste', 'chawal'), false);
});

test('SearchEngine: Levenshtein distance and duplicate warnings', () => {
  assert.equal(getLevenshteinDistance('Rice', 'Rice'), 0);
  assert.equal(getLevenshteinDistance('Sugar', 'Shugar'), 1);

  const existing = ['Tata Salt 1kg', 'Fortune Oil 1L', 'Basmati Rice'];
  assert.equal(findSimilarProduct('Tata Solt 1kg', existing), 'Tata Salt 1kg');
  assert.equal(findSimilarProduct('Basmati Rice', existing), 'Basmati Rice');
  assert.equal(findSimilarProduct('Colgate MaxFresh', existing), null);
});
