import { describe, it, expect } from 'vitest';
import { parseSafeNumber, formatCurrency, formatNumber } from '../numberUtils';

describe('numberUtils Unit Tests', () => {
  describe('parseSafeNumber', () => {
    it('handles null and undefined', () => {
      expect(parseSafeNumber(null)).toBeNull();
      expect(parseSafeNumber(undefined)).toBeNull();
      expect(parseSafeNumber(null, 0)).toBe(0);
      expect(parseSafeNumber(undefined, -1)).toBe(-1);
    });

    it('handles NaN and Infinity', () => {
      expect(parseSafeNumber(NaN)).toBeNull();
      expect(parseSafeNumber(Number.NaN, 10)).toBe(10);
      expect(parseSafeNumber(Infinity)).toBeNull();
      expect(parseSafeNumber(-Infinity)).toBeNull();
    });

    it('handles valid numbers and negatives', () => {
      expect(parseSafeNumber(0)).toBe(0);
      expect(parseSafeNumber(42)).toBe(42);
      expect(parseSafeNumber(-1250)).toBe(-1250);
      expect(parseSafeNumber(3.14159)).toBe(3.14159);
    });

    it('handles numeric strings with formatting, spaces, and currency symbols', () => {
      expect(parseSafeNumber('1200')).toBe(1200);
      expect(parseSafeNumber('1,25,000')).toBe(125000);
      expect(parseSafeNumber('₹ 45,000')).toBe(45000);
      expect(parseSafeNumber('  -2,500.50  ')).toBe(-2500.50);
      expect(parseSafeNumber('$350')).toBe(350);
    });

    it('handles non-numeric strings and invalid types', () => {
      expect(parseSafeNumber('')).toBeNull();
      expect(parseSafeNumber('   ')).toBeNull();
      expect(parseSafeNumber('abc')).toBeNull();
      expect(parseSafeNumber('₹NaN')).toBeNull();
      expect(parseSafeNumber({})).toBeNull();
      expect(parseSafeNumber([])).toBeNull();
      expect(parseSafeNumber(true)).toBeNull();
    });
  });

  describe('formatCurrency', () => {
    it('formats valid numbers and negatives without NaN', () => {
      expect(formatCurrency(50000)).toBe('₹50,000');
      expect(formatCurrency(-15000)).toBe('₹-15,000');
      expect(formatCurrency(0)).toBe('₹0');
      expect(formatCurrency(1234567)).toBe('₹12,34,567');
    });

    it('formats strings safely', () => {
      expect(formatCurrency('65400')).toBe('₹65,400');
      expect(formatCurrency('₹ 75,000')).toBe('₹75,000');
    });

    it('returns fallback for null, undefined, NaN, and invalid strings (never ₹NaN)', () => {
      expect(formatCurrency(null)).toBe('No data yet');
      expect(formatCurrency(undefined)).toBe('No data yet');
      expect(formatCurrency(NaN)).toBe('No data yet');
      expect(formatCurrency('not a number')).toBe('No data yet');
      expect(formatCurrency(null, 'DEMO DATA')).toBe('DEMO DATA');
      expect(formatCurrency(undefined, '₹0')).toBe('₹0');
    });

    it('supports options such as showSymbol', () => {
      expect(formatCurrency(25000, '0', { showSymbol: false })).toBe('25,000');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers to specified decimal places', () => {
      expect(formatNumber(12.3456, 1)).toBe('12.3');
      expect(formatNumber(12.3456, 2)).toBe('12.35');
      expect(formatNumber(-8.5, 0)).toBe('-9');
    });

    it('returns fallback on invalid values', () => {
      expect(formatNumber(null, 1, '0.0')).toBe('0.0');
      expect(formatNumber(undefined, 2, '-')).toBe('-');
      expect(formatNumber(NaN, 1, 'No data')).toBe('No data');
    });
  });
});
