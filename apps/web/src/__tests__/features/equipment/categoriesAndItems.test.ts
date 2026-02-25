import { describe, it, expect } from 'vitest';
import {
  EQUIPMENT_CATEGORIES,
  getAllCategories,
  getItemsForCategory,
  getAllItems,
  getCategoryIcon,
} from '@/features/equipment/data/categoriesAndItems';

describe('Equipment Categories and Items', () => {
  describe('EQUIPMENT_CATEGORIES', () => {
    it('should contain multiple categories', () => {
      expect(EQUIPMENT_CATEGORIES.length).toBeGreaterThan(5);
    });

    it('each category should have id, name, icon, and items', () => {
      for (const cat of EQUIPMENT_CATEGORIES) {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.icon).toBeTruthy();
        expect(Array.isArray(cat.items)).toBe(true);
        expect(cat.items.length).toBeGreaterThan(0);
      }
    });

    it('each item should have id and name', () => {
      for (const cat of EQUIPMENT_CATEGORIES) {
        for (const item of cat.items) {
          expect(item.id).toBeTruthy();
          expect(item.name).toBeTruthy();
        }
      }
    });

    it('should include core film production categories', () => {
      const names = EQUIPMENT_CATEGORIES.map(c => c.name);
      expect(names).toContain('Cameras');
      expect(names).toContain('Lenses');
      expect(names).toContain('Lighting - HMI/LED');
    });
  });

  describe('getAllCategories', () => {
    it('should return all category names as strings', () => {
      const categories = getAllCategories();
      expect(categories.length).toBe(EQUIPMENT_CATEGORIES.length);
      categories.forEach(name => {
        expect(typeof name).toBe('string');
      });
    });
  });

  describe('getItemsForCategory', () => {
    it('should return items for a valid category', () => {
      const items = getItemsForCategory('Cameras');
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].name).toBeTruthy();
    });

    it('should return empty array for unknown category', () => {
      const items = getItemsForCategory('NonExistentCategory');
      expect(items).toEqual([]);
    });
  });

  describe('getAllItems', () => {
    it('should return all items with their category', () => {
      const all = getAllItems();
      expect(all.length).toBeGreaterThan(10);
      all.forEach(entry => {
        expect(entry.category).toBeTruthy();
        expect(entry.item).toBeTruthy();
        expect(entry.item.name).toBeTruthy();
      });
    });
  });

  describe('getCategoryIcon', () => {
    it('should return correct icon for known category', () => {
      const icon = getCategoryIcon('Cameras');
      expect(icon).toBe('📷');
    });

    it('should return fallback icon for unknown category', () => {
      const icon = getCategoryIcon('Unknown');
      expect(icon).toBe('📦');
    });
  });
});
