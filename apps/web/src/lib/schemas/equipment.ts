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

// Equipment procurement/tracking status
export const equipmentProcurementStatusSchema = z.enum([
  'needed',        // Need to get this equipment
  'requested',     // Requested from vendor/rental house
  'reserved',      // Reserved/confirmed with vendor
  'picked_up',     // Picked up from vendor
  'on_set',        // Currently on set/in use
  'wrapped',       // Done using, ready to return
  'returned',      // Returned to vendor
  'unavailable',   // Could not be obtained
  'cancelled',     // No longer needed
]);

export type EquipmentProcurementStatus = z.infer<typeof equipmentProcurementStatusSchema>;

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
  
  // Procurement & Tracking
  procurementStatus: equipmentProcurementStatusSchema.default('needed'),
  daysNeeded: z.number().int().min(1).optional(), // How many days equipment is needed
  
  // Date tracking
  reservedDate: z.coerce.date().optional(),      // When it was reserved
  pickupDate: z.coerce.date().optional(),        // Scheduled pickup date
  pickedUpDate: z.coerce.date().optional(),      // Actual pickup date
  pickupConfirmedBy: z.string().optional(),      // Crew member who confirmed pickup
  returnDate: z.coerce.date().optional(),        // Scheduled return date
  returnedDate: z.coerce.date().optional(),      // Actual return date
  returnConfirmedBy: z.string().optional(),      // Crew member who confirmed return
  
  // Assignment & Accountability
  assignedTo: z.array(z.string()).default([]),   // Array of crew member IDs
  responsiblePartyId: z.string().optional(),     // Primary accountable crew member ID
  responsibleDepartment: z.string().optional(),  // Department responsible
  
  // Shoot Day Association
  shootingDayIds: z.array(z.string()).default([]), // Which shoot days this equipment is needed for
  
  // Rental Information
  rentalVendor: z.string().optional(),
  vendorContact: z.string().optional(),          // Contact at rental house
  vendorPhone: z.string().optional(),
  confirmationNumber: z.string().optional(),     // Rental confirmation/PO number
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
  description: z.string().optional(),
  notes: z.string().optional(),
  pickupNotes: z.string().optional(),
  returnNotes: z.string().optional(),
  
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
  category: z.string().optional(), // e.g., 'Camera Package', 'Sound Package', 'Lighting Package'
  
  // Equipment in this kit
  equipmentIds: z.array(z.string()).default([]),
  
  // Kit-level tracking (overrides individual item tracking when kit is managed as unit)
  trackAsUnit: z.boolean().default(true), // If true, track kit status as a whole
  procurementStatus: equipmentProcurementStatusSchema.default('needed'),
  source: equipmentSourceSchema.default('rental'),
  
  // Assignment
  responsiblePartyId: z.string().optional(),
  responsibleDepartment: z.string().optional(),
  assignedTo: z.array(z.string()).default([]),
  
  // Rental info for kit
  rentalVendor: z.string().optional(),
  vendorContact: z.string().optional(),
  vendorPhone: z.string().optional(),
  confirmationNumber: z.string().optional(),
  dailyRate: z.number().positive().optional(),
  weeklyRate: z.number().positive().optional(),
  
  // Date tracking
  reservedDate: z.coerce.date().optional(),
  pickupDate: z.coerce.date().optional(),
  pickedUpDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional(),
  returnedDate: z.coerce.date().optional(),
  
  // Shoot day association
  shootingDayIds: z.array(z.string()).default([]),
  
  // Notes
  notes: z.string().optional(),
  pickupNotes: z.string().optional(),
  returnNotes: z.string().optional(),
  
  // Media
  photoUrl: z.string().optional(),
  
  // Metadata
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

// Pre-defined Kit Templates
export const KIT_TEMPLATES = [
  {
    id: 'camera-basic',
    name: 'Basic Camera Package',
    category: 'Camera',
    description: 'Essential camera gear for small productions',
    items: [
      { name: 'Camera Body', category: 'Cameras', required: true },
      { name: 'Standard Zoom Lens', category: 'Lenses', required: true },
      { name: 'Batteries (2x)', category: 'Power & Distribution', required: true },
      { name: 'Memory Cards (3x)', category: 'Cameras', required: true },
      { name: 'Tripod', category: 'Camera Support', required: true },
    ],
  },
  {
    id: 'camera-cinema',
    name: 'Cinema Camera Package',
    category: 'Camera',
    description: 'Full cinema camera setup with monitoring',
    items: [
      { name: 'Cinema Camera Body', category: 'Cameras', required: true },
      { name: 'Prime Lens Set', category: 'Lenses', required: true },
      { name: 'Zoom Lens', category: 'Lenses', required: false },
      { name: 'Matte Box', category: 'Camera Support', required: true },
      { name: 'Follow Focus', category: 'Camera Support', required: true },
      { name: 'V-Mount Batteries (4x)', category: 'Power & Distribution', required: true },
      { name: 'CFast/SSD Media', category: 'Cameras', required: true },
      { name: 'On-Board Monitor', category: 'Video Assist & Monitors', required: true },
      { name: 'Camera Cage/Rig', category: 'Camera Support', required: true },
    ],
  },
  {
    id: 'sound-basic',
    name: 'Basic Sound Package',
    category: 'Sound',
    description: 'Essential sound recording gear',
    items: [
      { name: 'Field Recorder', category: 'Sound', required: true },
      { name: 'Boom Microphone', category: 'Sound', required: true },
      { name: 'Boom Pole', category: 'Sound', required: true },
      { name: 'Wireless Lav Kit (2x)', category: 'Sound', required: true },
      { name: 'Headphones', category: 'Sound', required: true },
      { name: 'XLR Cables', category: 'Sound', required: true },
    ],
  },
  {
    id: 'sound-full',
    name: 'Full Sound Package',
    category: 'Sound',
    description: 'Complete professional sound department',
    items: [
      { name: 'Mixer/Recorder (Sound Devices 833/888)', category: 'Sound', required: true },
      { name: 'Boom Microphone (Sennheiser MKH 416)', category: 'Sound', required: true },
      { name: 'Boom Pole (K-Tek)', category: 'Sound', required: true },
      { name: 'Wireless Lav Kit (4x)', category: 'Sound', required: true },
      { name: 'IFB System (4x)', category: 'Sound', required: true },
      { name: 'Comtek System', category: 'Sound', required: false },
      { name: 'Sound Cart', category: 'Sound', required: false },
      { name: 'Timecode Slate', category: 'Sound', required: true },
      { name: 'Windshield/Blimp', category: 'Sound', required: true },
    ],
  },
  {
    id: 'lighting-basic',
    name: 'Basic Lighting Package',
    category: 'Lighting',
    description: 'Simple 3-point lighting setup',
    items: [
      { name: 'LED Panel (2x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'Light Stands (3x)', category: 'Grip & Rigging', required: true },
      { name: 'Softbox/Diffusion', category: 'Grip & Rigging', required: true },
      { name: 'Reflector', category: 'Grip & Rigging', required: true },
      { name: 'Extension Cords', category: 'Power & Distribution', required: true },
    ],
  },
  {
    id: 'lighting-full',
    name: 'Full Lighting Package',
    category: 'Lighting',
    description: 'Professional lighting for larger productions',
    items: [
      { name: 'HMI 1.2K', category: 'Lighting - HMI/LED', required: true },
      { name: 'HMI 575W (2x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'LED Panel (4x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'Kino Flo 4-Bank (2x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'C-Stands (6x)', category: 'Grip & Rigging', required: true },
      { name: '4x4 Frames (2x)', category: 'Grip & Rigging', required: true },
      { name: 'Flags/Nets Set', category: 'Grip & Rigging', required: true },
      { name: 'Sandbags (12x)', category: 'Grip & Rigging', required: true },
      { name: 'Stinger/Extension Cords', category: 'Power & Distribution', required: true },
      { name: 'Distro Box', category: 'Power & Distribution', required: true },
    ],
  },
  {
    id: 'grip-basic',
    name: 'Basic Grip Package',
    category: 'Grip',
    description: 'Essential grip equipment',
    items: [
      { name: 'C-Stands (4x)', category: 'Grip & Rigging', required: true },
      { name: 'Sandbags (8x)', category: 'Grip & Rigging', required: true },
      { name: 'Apple Boxes (Set)', category: 'Grip & Rigging', required: true },
      { name: 'Clamps Assorted', category: 'Grip & Rigging', required: true },
      { name: 'Flags 18x24 (Set)', category: 'Grip & Rigging', required: true },
    ],
  },
  {
    id: 'dolly-package',
    name: 'Dolly/Movement Package',
    category: 'Camera Support',
    description: 'Camera movement equipment',
    items: [
      { name: 'Doorway Dolly', category: 'Camera Support', required: true },
      { name: 'Track (24ft)', category: 'Camera Support', required: true },
      { name: 'Slider', category: 'Camera Support', required: false },
      { name: 'Jib Arm', category: 'Camera Support', required: false },
      { name: 'Fluid Head Tripod', category: 'Camera Support', required: true },
    ],
  },
] as const;