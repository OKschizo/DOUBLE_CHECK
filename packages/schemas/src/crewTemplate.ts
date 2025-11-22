import { z } from 'zod';
import { departmentSchema } from './crew';

export const crewTemplateTypeSchema = z.enum([
  'film',
  'commercial',
  'documentary',
  'episodic',
  'music_video',
  'photoshoot',
  'corporate',
  'custom',
]);

export const crewTemplatePositionSchema = z.object({
  department: z.string().min(1),
  role: z.string().min(1),
  required: z.boolean().default(true), // Whether this position is required or optional
  quantity: z.number().int().positive().default(1), // Number of people needed for this role
  defaultRate: z.number().positive().optional(), // Default day rate for this position
  notes: z.string().optional(), // Additional notes about this position
});

export const crewTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  type: crewTemplateTypeSchema,
  description: z.string().optional(),
  // Template structure - array of positions
  positions: z.array(crewTemplatePositionSchema).default([]),
  // Metadata
  isPublic: z.boolean().default(false), // System templates vs user templates
  createdBy: z.string().optional(), // User ID for custom templates
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCrewTemplateSchema = crewTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const applyCrewTemplateSchema = z.object({
  projectId: z.string(),
  templateId: z.string(),
  // Options for template application
  overwriteExisting: z.boolean().default(false), // Overwrite existing crew members with same role
  skipExisting: z.boolean().default(true), // Skip positions that already have crew members
});

export type CrewTemplate = z.infer<typeof crewTemplateSchema>;
export type CrewTemplateType = z.infer<typeof crewTemplateTypeSchema>;
export type CrewTemplatePosition = z.infer<typeof crewTemplatePositionSchema>;
export type CreateCrewTemplateInput = z.infer<typeof createCrewTemplateSchema>;
export type ApplyCrewTemplateInput = z.infer<typeof applyCrewTemplateSchema>;

