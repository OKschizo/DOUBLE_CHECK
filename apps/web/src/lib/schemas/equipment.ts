import { z } from 'zod';

// Default equipment categories
export const defaultEquipmentCategories = [
  'camera',
  'lenses',
  'lighting',
  'audio',
  'grip',
  'power',
  'monitors',
  'wireless_video',
  'specialty',
  'vehicles',
  'other',
] as const;

export const equipmentCategorySchema = z.enum([
  'camera',
  'lenses',
  'lighting',
  'audio',
  'grip',
  'power',
  'monitors',
  'wireless_video',
  'specialty',
  'vehicles',
  'other',
]);

export type EquipmentCategory = z.infer<typeof equipmentCategorySchema>;

// Equipment status
export const equipmentStatusSchema = z.enum([
  'available',
  'checked_out',
  'reserved',
  'maintenance',
  'not_available',
  'lost',
]);

export type EquipmentStatus = z.infer<typeof equipmentStatusSchema>;

// Equipment source
export const equipmentSourceSchema = z.enum([
  'owned',
  'rental',
  'crew_provided',
]);

export type EquipmentSource = z.infer<typeof equipmentSourceSchema>;

// Main Equipment Schema
export const equipmentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, 'Equipment name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  quantityAvailable: z.number().int().min(0).default(1), // Calculated field
  status: equipmentStatusSchema.default('available'),
  source: equipmentSourceSchema.default('owned'),
  
  // Assignment & Accountability
  assignedTo: z.array(z.string()).default([]), // Array of user IDs
  responsibleParty: z.string().optional(), // Primary accountable person
  
  // Rental Information
  rentalVendor: z.string().optional(),
  dailyRate: z.number().positive().optional(),
  weeklyRate: z.number().positive().optional(),
  
  // Identification
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  
  // Media
  photoUrl: z.string().optional(),
  
  // Package/Kit
  packageId: z.string().optional(), // If part of a package
  
  // Notes
  notes: z.string().optional(),
  
  // Metadata
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Equipment = z.infer<typeof equipmentSchema>;

export const createEquipmentSchema = equipmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  quantityAvailable: true,
});

export const updateEquipmentSchema = equipmentSchema
  .omit({
    id: true,
    projectId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;

// Checkout History Schema
export const checkoutHistorySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  equipmentId: z.string(),
  equipmentName: z.string(), // Denormalized for easy display
  userId: z.string(),
  userName: z.string(), // Denormalized for easy display
  quantity: z.number().int().positive().default(1),
  checkoutDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional(),
  status: z.enum(['checked_out', 'returned', 'overdue']).default('checked_out'),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CheckoutHistory = z.infer<typeof checkoutHistorySchema>;

export const createCheckoutSchema = checkoutHistorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  returnDate: true,
});

export const returnEquipmentSchema = z.object({
  checkoutId: z.string(),
  returnDate: z.coerce.date().optional(), // Defaults to now
  notes: z.string().optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type ReturnEquipmentInput = z.infer<typeof returnEquipmentSchema>;

// Package/Kit Schema
export const equipmentPackageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
  equipmentIds: z.array(z.string()).default([]),
  photoUrl: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EquipmentPackage = z.infer<typeof equipmentPackageSchema>;

export const createPackageSchema = equipmentPackageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePackageSchema = equipmentPackageSchema
  .omit({
    id: true,
    projectId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

