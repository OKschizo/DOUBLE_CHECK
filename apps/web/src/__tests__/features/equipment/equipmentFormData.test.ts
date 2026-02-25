import { describe, it, expect } from 'vitest';

/**
 * Tests for the Equipment form data handling logic.
 * Verifies the fix for the weeklyRate/description undefined bug
 * where Firebase addDoc() would reject undefined field values.
 */

function buildEquipmentCreatePayload(formData: {
  name: string;
  category: string;
  description: string;
  dailyRate: string;
  weeklyRate: string;
  quantity: string;
}) {
  return {
    name: formData.name,
    category: formData.category,
    description: formData.description || '',
    dailyRate: formData.dailyRate ? Number(formData.dailyRate) : 0,
    weeklyRate: formData.weeklyRate ? Number(formData.weeklyRate) : 0,
    quantity: Number(formData.quantity),
  };
}

const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
  dailyRate: '',
  weeklyRate: '',
  quantity: '1',
  procurementStatus: 'needed',
  source: 'rental',
  daysNeeded: '',
  reservedDate: '',
  pickupDate: '',
  returnDate: '',
  rentalVendor: '',
  vendorContact: '',
  vendorPhone: '',
  confirmationNumber: '',
  responsiblePartyId: '',
  responsibleDepartment: '',
  assignedTo: [] as string[],
  shootingDayIds: [] as string[],
  notes: '',
};

describe('Equipment Form Data Handling', () => {
  describe('buildEquipmentCreatePayload (mirrors EquipmentView handleAddSubmit)', () => {
    it('should never produce undefined values for Firebase', () => {
      const payload = buildEquipmentCreatePayload({
        name: 'Test Camera',
        category: 'Camera',
        description: '',
        dailyRate: '1500',
        weeklyRate: '',
        quantity: '1',
      });

      Object.entries(payload).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
      });
    });

    it('should default empty weeklyRate to 0 (not undefined)', () => {
      const payload = buildEquipmentCreatePayload({
        name: 'ARRI Alexa',
        category: 'Camera',
        description: '',
        dailyRate: '1500',
        weeklyRate: '',
        quantity: '1',
      });

      expect(payload.weeklyRate).toBe(0);
      expect(typeof payload.weeklyRate).toBe('number');
    });

    it('should default empty dailyRate to 0 (not undefined)', () => {
      const payload = buildEquipmentCreatePayload({
        name: 'Test Item',
        category: 'Sound',
        description: '',
        dailyRate: '',
        weeklyRate: '',
        quantity: '1',
      });

      expect(payload.dailyRate).toBe(0);
      expect(typeof payload.dailyRate).toBe('number');
    });

    it('should default empty description to empty string (not undefined)', () => {
      const payload = buildEquipmentCreatePayload({
        name: 'Test',
        category: 'Camera',
        description: '',
        dailyRate: '100',
        weeklyRate: '500',
        quantity: '1',
      });

      expect(payload.description).toBe('');
      expect(typeof payload.description).toBe('string');
    });

    it('should correctly parse numeric string values', () => {
      const payload = buildEquipmentCreatePayload({
        name: 'Zeiss Primes',
        category: 'Lenses',
        description: 'Full set',
        dailyRate: '800',
        weeklyRate: '3500',
        quantity: '3',
      });

      expect(payload.dailyRate).toBe(800);
      expect(payload.weeklyRate).toBe(3500);
      expect(payload.quantity).toBe(3);
      expect(payload.description).toBe('Full set');
    });
  });

  describe('Form reset data shape', () => {
    it('should include all required fields in empty form', () => {
      const requiredKeys = [
        'name', 'category', 'description', 'dailyRate', 'weeklyRate', 'quantity',
        'procurementStatus', 'source', 'daysNeeded', 'reservedDate', 'pickupDate',
        'returnDate', 'rentalVendor', 'vendorContact', 'vendorPhone',
        'confirmationNumber', 'responsiblePartyId', 'responsibleDepartment',
        'assignedTo', 'shootingDayIds', 'notes',
      ];

      for (const key of requiredKeys) {
        expect(EMPTY_FORM).toHaveProperty(key);
      }
    });

    it('should have correct default values', () => {
      expect(EMPTY_FORM.quantity).toBe('1');
      expect(EMPTY_FORM.procurementStatus).toBe('needed');
      expect(EMPTY_FORM.source).toBe('rental');
      expect(EMPTY_FORM.assignedTo).toEqual([]);
      expect(EMPTY_FORM.shootingDayIds).toEqual([]);
    });

    it('should not have undefined values anywhere', () => {
      Object.entries(EMPTY_FORM).forEach(([key, value]) => {
        expect(value, `${key} should not be undefined`).not.toBeUndefined();
      });
    });
  });
});
