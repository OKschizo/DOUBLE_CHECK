import { z } from 'zod';

// Location type schema
export const locationTypeSchema = z.enum([
  'interior',
  'exterior',
  'studio',
  'outdoor',
  'indoor',
  'basecamp',
  'holding',
  'parking',
  'catering',
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
  'wrapped',
]);

export type LocationStatus = z.infer<typeof locationStatusSchema>;

// Nearby facility schema for hospitals, police, fire, etc.
export const nearbyFacilitySchema = z.object({
  name: z.string(),
  type: z.enum(['hospital', 'police', 'fire', 'pharmacy', 'urgent_care', 'other']),
  address: z.string().optional(),
  phone: z.string().optional(),
  distance: z.string().optional(), // e.g., "0.5 miles"
  driveTime: z.string().optional(), // e.g., "5 min"
});

export type NearbyFacility = z.infer<typeof nearbyFacilitySchema>;

// Parking option schema
export const parkingOptionSchema = z.object({
  name: z.string(),
  type: z.enum(['crew', 'cast', 'trucks', 'basecamp', 'background', 'public', 'private']),
  address: z.string().optional(),
  capacity: z.number().optional(),
  cost: z.number().optional(), // per day
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type ParkingOption = z.infer<typeof parkingOptionSchema>;

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
  type: locationTypeSchema.default('other'),
  status: locationStatusSchema.default('pending'),
  
  // Contact Information
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  
  // Location Details
  description: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  photoUrls: z.array(z.string()).default([]), // Multiple photos
  
  // Access & Logistics
  accessInfo: z.string().optional(),
  loadInInfo: z.string().optional(), // Load-in/load-out details
  restrictions: z.string().optional(),
  powerInfo: z.string().optional(), // Available power/generators
  bathroomInfo: z.string().optional(),
  wifiInfo: z.string().optional(),
  cellService: z.string().optional(),
  
  // Parking Information
  parkingInfo: z.string().optional(),
  parkingOptions: z.array(parkingOptionSchema).default([]),
  crewParkingAddress: z.string().optional(),
  crewParkingCapacity: z.number().optional(),
  truckParkingAddress: z.string().optional(),
  basecampAddress: z.string().optional(),
  bgHoldingAddress: z.string().optional(),
  bgParkingAddress: z.string().optional(),
  
  // Nearby Facilities (Safety)
  nearestHospital: z.string().optional(),
  nearestHospitalAddress: z.string().optional(),
  nearestHospitalPhone: z.string().optional(),
  nearestHospitalDistance: z.string().optional(),
  nearestPoliceStation: z.string().optional(),
  nearestFireStation: z.string().optional(),
  nearbyFacilities: z.array(nearbyFacilitySchema).default([]),
  
  // Permits & Legal
  permitRequired: z.boolean().default(false),
  permitInfo: z.string().optional(),
  permitNumber: z.string().optional(),
  permitExpiry: z.date().optional(),
  insuranceRequired: z.boolean().default(false),
  insuranceInfo: z.string().optional(),
  
  // Financial
  rentalCost: z.number().optional(),
  rentalCostPeriod: z.enum(['day', 'week', 'flat']).optional(),
  depositAmount: z.number().optional(),
  paymentTerms: z.string().optional(),
  
  // Schedule
  availableDates: z.array(z.date()).default([]),
  blackoutDates: z.array(z.date()).default([]),
  loadInTime: z.string().optional(),
  wrapTime: z.string().optional(),
  
  // Weather & Environment
  weatherConsiderations: z.string().optional(),
  sunDirection: z.string().optional(), // e.g., "East-facing, morning sun"
  noiseLevel: z.string().optional(),
  
  // Metadata
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

