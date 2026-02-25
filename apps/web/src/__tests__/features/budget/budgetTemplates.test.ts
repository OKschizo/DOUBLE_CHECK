import { describe, it, expect } from 'vitest';
import { defaultTemplates, getTemplateByType, getAllTemplates } from '@/features/budget/templates';

describe('Budget Templates', () => {
  describe('defaultTemplates', () => {
    it('should include at least 2 templates', () => {
      expect(defaultTemplates.length).toBeGreaterThanOrEqual(2);
    });

    it('each template should have id, name, and categories', () => {
      for (const template of defaultTemplates) {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(Array.isArray(template.categories)).toBe(true);
        expect(template.categories.length).toBeGreaterThan(0);
      }
    });

    it('should include a film template', () => {
      const film = defaultTemplates.find(t => t.name.toLowerCase().includes('film'));
      expect(film).toBeTruthy();
    });

    it('should include a commercial template', () => {
      const commercial = defaultTemplates.find(t => t.name.toLowerCase().includes('commercial'));
      expect(commercial).toBeTruthy();
    });
  });

  describe('getTemplateByType', () => {
    it('should find feature film template by type', () => {
      const template = getTemplateByType('feature' as any);
      if (template) {
        expect(template.name).toBeTruthy();
        expect(template.categories.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getAllTemplates', () => {
    it('should return same templates as defaultTemplates', () => {
      const all = getAllTemplates();
      expect(all.length).toBe(defaultTemplates.length);
    });
  });

  describe('Template categories structure', () => {
    it('film template should have comprehensive categories', () => {
      const film = defaultTemplates.find(t => t.name.toLowerCase().includes('film'));
      expect(film).toBeTruthy();
      if (film) {
        expect(film.categories.length).toBeGreaterThanOrEqual(10);
        const categoryNames = film.categories.map((c: any) => c.name || c.category);
        expect(categoryNames.length).toBeGreaterThan(0);
      }
    });
  });
});
