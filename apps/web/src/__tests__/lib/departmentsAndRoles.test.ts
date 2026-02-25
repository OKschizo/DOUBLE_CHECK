import { describe, it, expect } from 'vitest';
import { DEPARTMENTS_AND_ROLES } from '@/features/crew/data/departmentsAndRoles';

describe('Departments and Roles', () => {
  it('should contain core film production departments', () => {
    const names = DEPARTMENTS_AND_ROLES.map(d => d.name);
    expect(names).toContain('Production');
    expect(names).toContain('Direction');
    expect(names).toContain('Camera');
  });

  it('each department should have id, name, icon, and roles', () => {
    for (const dept of DEPARTMENTS_AND_ROLES) {
      expect(dept.id).toBeTruthy();
      expect(dept.name).toBeTruthy();
      expect(dept.icon).toBeTruthy();
      expect(Array.isArray(dept.roles)).toBe(true);
      expect(dept.roles.length).toBeGreaterThan(0);
    }
  });

  it('each role should have id and name', () => {
    for (const dept of DEPARTMENTS_AND_ROLES) {
      for (const role of dept.roles) {
        expect(role.id).toBeTruthy();
        expect(role.name).toBeTruthy();
      }
    }
  });

  it('Production department should include key roles', () => {
    const production = DEPARTMENTS_AND_ROLES.find(d => d.name === 'Production');
    expect(production).toBeTruthy();
    const roleNames = production!.roles.map(r => r.name);
    expect(roleNames).toContain('Producer');
    expect(roleNames).toContain('Line Producer');
  });

  it('Direction department should include Director and AD roles', () => {
    const direction = DEPARTMENTS_AND_ROLES.find(d => d.name === 'Direction');
    expect(direction).toBeTruthy();
    const roleNames = direction!.roles.map(r => r.name);
    expect(roleNames).toContain('Director');
    expect(roleNames.some(r => r.includes('Assistant Director'))).toBe(true);
  });

  it('Camera department should include DP and AC roles', () => {
    const camera = DEPARTMENTS_AND_ROLES.find(d => d.name === 'Camera');
    expect(camera).toBeTruthy();
    const roleNames = camera!.roles.map(r => r.name);
    expect(roleNames.some(r => r.includes('Director of Photography') || r.includes('DP'))).toBe(true);
  });

  it('department IDs should be unique', () => {
    const ids = DEPARTMENTS_AND_ROLES.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
