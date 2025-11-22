import { z } from 'zod';
import { locationTypeSchema, locationStatusSchema } from './location';

export const locationTemplateTypeSchema = z.enum([
  'film',
  'commercial',
  'documentary',
  'episodic',
  'music_video',
  'photoshoot',
  'corporate',
  'custom',
]);

export const locationTemplateItemSchema = z.object({
  name: z.string().min(1),
  type: locationTypeSchema,
  required: z.boolean().default(true),
  quantity: z.number().int().positive().default(1), // For multiple similar locations
  notes: z.string().optional(),
});

export const locationTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  type: locationTemplateTypeSchema,
  description: z.string().optional(),
  locations: z.array(locationTemplateItemSchema).default([]),
  isPublic: z.boolean().default(false),
  createdBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createLocationTemplateSchema = locationTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const applyLocationTemplateSchema = z.object({
  projectId: z.string(),
  templateId: z.string(),
  overwriteExisting: z.boolean().default(false),
  skipExisting: z.boolean().default(true),
});

export type LocationTemplate = z.infer<typeof locationTemplateSchema>;
export type LocationTemplateType = z.infer<typeof locationTemplateTypeSchema>;
export type LocationTemplateItem = z.infer<typeof locationTemplateItemSchema>;
export type CreateLocationTemplateInput = z.infer<typeof createLocationTemplateSchema>;
export type ApplyLocationTemplateInput = z.infer<typeof applyLocationTemplateSchema>;

