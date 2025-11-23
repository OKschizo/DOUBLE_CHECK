import { z } from 'zod';

export const shotTypeSchema = z.enum([
  'master',
  'medium',
  'close',
  'extreme-close',
  'wide',
  'insert',
  'pov',
  'over-shoulder',
  'two-shot',
  'establishing',
  'cutaway',
  'other',
]);

export const shotStatusSchema = z.enum([
  'not-shot',
  'in-progress',
  'completed',
  'omitted',
]);

export const shotSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  projectId: z.string(),
  // Basic information
  shotNumber: z.string().min(1, 'Shot number is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  shotType: shotTypeSchema.default('master'),
  // Camera information
  cameraAngle: z.string().optional(), // e.g. "high", "low", "eye-level"
  cameraMovement: z.string().optional(), // e.g. "static", "pan", "tilt", "dolly", "crane"
  lens: z.string().optional(), // e.g. "24mm", "50mm", "85mm"
  focalLength: z.number().optional(),
  frameRate: z.number().optional(), // e.g. 24, 30, 60
  resolution: z.string().optional(), // e.g. "4K", "1080p"
  // Equipment information
  cameraId: z.string().optional(),
  lensId: z.string().optional(),
  equipmentIds: z.array(z.string()).optional().default([]),
  lightingSetup: z.string().optional(),
  // Production information
  status: shotStatusSchema.default('not-shot'),
  takeNumbers: z.array(z.number()).optional().default([]),
  bestTake: z.number().optional(),
  duration: z.number().min(0).optional(), // in seconds
  slateInfo: z.string().optional(),
  // Creative information
  composition: z.string().optional(),
  blocking: z.string().optional(),
  actionDescription: z.string().optional(),
  // Location and scheduling (can override scene)
  locationIds: z.array(z.string()).optional().default([]),
  locationNames: z.array(z.string()).optional().default([]),
  shootingDayIds: z.array(z.string()).optional().default([]),
  imageUrl: z.string().optional(),
  // Reference Images
  shotReferences: z.array(z.object({
    id: z.string(), // Matches ReferenceImage ID
    url: z.string(),
    category: z.enum(['wardrobe', 'camera', 'location', 'character', 'other']),
  })).optional().default([]),
  // Integration fields
  castIds: z.array(z.string()).optional().default([]),
  crewIds: z.array(z.string()).optional().default([]),
  storyboardId: z.string().optional(),
  sortOrder: z.number().optional(),
  // Metadata
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createShotSchema = shotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateShotSchema = shotSchema
  .omit({
    id: true,
    projectId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type Shot = z.infer<typeof shotSchema>;
export type ShotType = z.infer<typeof shotTypeSchema>;
export type ShotStatus = z.infer<typeof shotStatusSchema>;
export type CreateShotInput = z.infer<typeof createShotSchema>;
export type UpdateShotInput = z.infer<typeof updateShotSchema>;

