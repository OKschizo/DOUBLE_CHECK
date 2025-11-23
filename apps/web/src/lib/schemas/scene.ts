import { z } from 'zod';

export const sceneStatusSchema = z.enum([
  'not-shot',
  'in-progress',
  'completed',
  'omitted',
]);

export const sceneSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  // Basic information
  sceneNumber: z.string().min(1, 'Scene number is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  pageCount: z.string().optional(), // e.g. "1/8", "3 4/8"
  locationId: z.string().optional(), // Deprecated - use locationIds
  locationName: z.string().optional(), // Deprecated - use locationNames
  locationIds: z.array(z.string()).optional().default([]),
  locationNames: z.array(z.string()).optional().default([]),
  imageUrl: z.string().optional(),
  // Script information
  scriptText: z.string().optional(), // Rich text content
  scriptPageStart: z.number().optional(),
  scriptPageEnd: z.number().optional(),
  // Production information
  status: sceneStatusSchema.default('not-shot'),
  shootingDayId: z.string().optional(), // Deprecated - use shootingDayIds
  shootingDayIds: z.array(z.string()).optional().default([]),
  scheduledDate: z.coerce.date().optional(),
  scheduledDates: z.array(z.coerce.date()).optional().default([]),
  estimatedDuration: z.number().min(0).optional(), // in minutes
  // Creative information
  timeOfDay: z.string().optional(), // e.g. "DAY", "NIGHT", "DAWN", "DUSK"
  weather: z.string().optional(),
  mood: z.string().optional(),
  visualNotes: z.string().optional(),
  storyboardIds: z.array(z.string()).optional().default([]),
  // Reference Images
  sceneReferences: z.array(z.object({
    id: z.string(), // Matches ReferenceImage ID
    url: z.string(),
    category: z.enum(['wardrobe', 'camera', 'location', 'character', 'other']),
  })).optional().default([]),
  // Integration fields
  castIds: z.array(z.string()).optional().default([]),
  crewIds: z.array(z.string()).optional().default([]),
  equipmentIds: z.array(z.string()).optional().default([]),
  // Production details
  continuityNotes: z.string().optional(),
  specialRequirements: z.string().optional(),
  vfxNotes: z.string().optional(),
  stuntsRequired: z.boolean().optional().default(false),
  // Metadata
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSceneSchema = sceneSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSceneSchema = sceneSchema
  .omit({
    id: true,
    projectId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type Scene = z.infer<typeof sceneSchema>;
export type SceneStatus = z.infer<typeof sceneStatusSchema>;
export type CreateSceneInput = z.infer<typeof createSceneSchema>;
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;

