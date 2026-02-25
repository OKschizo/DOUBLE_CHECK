import { describe, it, expect } from 'vitest';
import {
  equipmentSchema,
  equipmentCategorySchema,
  equipmentStatusSchema,
  equipmentProcurementStatusSchema,
  equipmentSourceSchema,
  defaultEquipmentCategories,
  KIT_TEMPLATES,
} from '@/lib/schemas/equipment';

describe('Equipment Zod Schemas', () => {
  describe('equipmentCategorySchema', () => {
    it('should accept valid categories', () => {
      for (const cat of defaultEquipmentCategories) {
        expect(() => equipmentCategorySchema.parse(cat)).not.toThrow();
      }
    });

    it('should reject invalid category', () => {
      expect(() => equipmentCategorySchema.parse('invalid')).toThrow();
    });
  });

  describe('equipmentStatusSchema', () => {
    it('should accept valid statuses', () => {
      const validStatuses = ['available', 'checked_out', 'reserved', 'maintenance', 'not_available', 'lost'];
      for (const status of validStatuses) {
        expect(() => equipmentStatusSchema.parse(status)).not.toThrow();
      }
    });
  });

  describe('equipmentProcurementStatusSchema', () => {
    it('should accept all procurement statuses', () => {
      const statuses = ['needed', 'requested', 'reserved', 'picked_up', 'on_set', 'wrapped', 'returned', 'unavailable', 'cancelled'];
      for (const status of statuses) {
        expect(() => equipmentProcurementStatusSchema.parse(status)).not.toThrow();
      }
    });
  });

  describe('equipmentSourceSchema', () => {
    it('should accept valid sources', () => {
      const sources = ['owned', 'rental', 'crew_provided'];
      for (const source of sources) {
        expect(() => equipmentSourceSchema.parse(source)).not.toThrow();
      }
    });
  });

  describe('equipmentSchema', () => {
    const validEquipment = {
      id: 'eq-1',
      projectId: 'proj-1',
      name: 'ARRI Alexa Mini LF',
      category: 'camera',
      quantity: 1,
      quantityAvailable: 1,
      status: 'available',
      source: 'rental',
      procurementStatus: 'needed',
      assignedTo: [],
      shootingDayIds: [],
      dailyRate: 1500,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should accept valid equipment data', () => {
      const result = equipmentSchema.parse(validEquipment);
      expect(result.name).toBe('ARRI Alexa Mini LF');
      expect(result.dailyRate).toBe(1500);
    });

    it('should require name to be non-empty', () => {
      expect(() => equipmentSchema.parse({ ...validEquipment, name: '' })).toThrow();
    });

    it('should require category to be non-empty', () => {
      expect(() => equipmentSchema.parse({ ...validEquipment, category: '' })).toThrow();
    });

    it('should accept optional weeklyRate', () => {
      const withoutWeekly = { ...validEquipment };
      delete (withoutWeekly as any).weeklyRate;
      const result = equipmentSchema.parse(withoutWeekly);
      expect(result.weeklyRate).toBeUndefined();
    });

    it('should accept weeklyRate of 0 as valid (regression for the bug fix)', () => {
      const withZeroWeekly = { ...validEquipment, weeklyRate: undefined };
      const result = equipmentSchema.parse(withZeroWeekly);
      expect(result.weeklyRate).toBeUndefined();
    });
  });

  describe('KIT_TEMPLATES', () => {
    it('should contain at least 5 kit templates', () => {
      expect(KIT_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it('each kit should have id, name, category, and items', () => {
      for (const kit of KIT_TEMPLATES) {
        expect(kit.id).toBeTruthy();
        expect(kit.name).toBeTruthy();
        expect(kit.category).toBeTruthy();
        expect(kit.items.length).toBeGreaterThan(0);
      }
    });

    it('each kit item should have name and category', () => {
      for (const kit of KIT_TEMPLATES) {
        for (const item of kit.items) {
          expect(item.name).toBeTruthy();
          expect(item.category).toBeTruthy();
          expect(typeof item.required).toBe('boolean');
        }
      }
    });

    it('should include camera, sound, and lighting kits', () => {
      const categories = KIT_TEMPLATES.map(k => k.category);
      expect(categories).toContain('Camera');
      expect(categories).toContain('Sound');
      expect(categories).toContain('Lighting');
    });
  });
});
