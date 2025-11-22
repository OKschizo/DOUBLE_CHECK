import { z } from 'zod';

export const castTemplateTypeSchema = z.enum([
  'film',
  'commercial',
  'documentary',
  'episodic',
  'music_video',
  'photoshoot',
  'corporate',
  'custom',
]);

export const castTemplateRoleSchema = z.object({
  characterName: z.string().min(1),
  castType: z.string().min(1), // lead, supporting, featured, etc.
  required: z.boolean().default(true),
  quantity: z.number().int().positive().default(1), // For extras/background
  notes: z.string().optional(),
});

export const castTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  type: castTemplateTypeSchema,
  description: z.string().optional(),
  roles: z.array(castTemplateRoleSchema).default([]),
  isPublic: z.boolean().default(false),
  createdBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCastTemplateSchema = castTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const applyCastTemplateSchema = z.object({
  projectId: z.string(),
  templateId: z.string(),
  overwriteExisting: z.boolean().default(false),
  skipExisting: z.boolean().default(true),
});

export type CastTemplate = z.infer<typeof castTemplateSchema>;
export type CastTemplateType = z.infer<typeof castTemplateTypeSchema>;
export type CastTemplateRole = z.infer<typeof castTemplateRoleSchema>;
export type CreateCastTemplateInput = z.infer<typeof createCastTemplateSchema>;
export type ApplyCastTemplateInput = z.infer<typeof applyCastTemplateSchema>;

