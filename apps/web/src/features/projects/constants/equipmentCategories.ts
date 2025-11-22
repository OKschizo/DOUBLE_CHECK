import { defaultEquipmentCategories } from '@doublecheck/schemas';

export const EQUIPMENT_CATEGORIES: Record<string, string> = {
  camera: 'Camera',
  lenses: 'Lenses',
  lighting: 'Lighting',
  audio: 'Audio',
  grip: 'Grip',
  power: 'Power & Distribution',
  monitors: 'Monitors & Playback',
  wireless_video: 'Wireless Video',
  specialty: 'Specialty Equipment',
  vehicles: 'Vehicles',
  other: 'Other',
};

// Helper function to get display name for a category
export function getCategoryDisplayName(category: string): string {
  return EQUIPMENT_CATEGORIES[category] || category;
}

// Helper function to get all categories (default + custom)
export function getAllCategories(customCategories: string[] = []): string[] {
  const defaults = [...defaultEquipmentCategories];
  return [...defaults, ...customCategories];
}

