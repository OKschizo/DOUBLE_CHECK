import { z } from 'zod';

// Location type schema
export const locationTypeSchema = z.enum([
  'interior',
  'exterior',
  'studio',
  'outdoor',
  'indoor',
  'other',
]);

export type LocationType = z.infer<typeof locationTypeSchema>;

// Location status schema
export const locationStatusSchema = z.enum([
  'scouted',
  'confirmed',
  'pending',
  'rejected',
  'backup',
]);

export type LocationStatus = z.infer<typeof locationStatusSchema>;

// Location schema
export const locationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  type: locationTypeSchema,
  status: locationStatusSchema,
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  parkingInfo: z.string().optional(),
  accessInfo: z.string().optional(),
  restrictions: z.string().optional(),
  permitRequired: z.boolean().optional(),
  permitInfo: z.string().optional(),
  rentalCost: z.number().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Location = z.infer<typeof locationSchema>;

// Create location schema
export const createLocationSchema = locationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update location schema
export const updateLocationSchema = createLocationSchema.partial().extend({
  id: z.string(),
});

