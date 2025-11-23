import { z } from 'zod';

export const equipmentTemplateTypeSchema = z.enum([
  'film',
  'commercial',
  'documentary',
  'episodic',
  'music_video',
  'photoshoot',
  'corporate',
  'custom',
]);

export const equipmentTemplateItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  required: z.boolean().default(true),
  source: z.enum(['owned', 'rental', 'crew_provided']).default('rental'),
  notes: z.string().optional(),
});

export const equipmentTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  type: equipmentTemplateTypeSchema,
  description: z.string().optional(),
  items: z.array(equipmentTemplateItemSchema).default([]),
  isPublic: z.boolean().default(false),
  createdBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createEquipmentTemplateSchema = equipmentTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const applyEquipmentTemplateSchema = z.object({
  projectId: z.string(),
  templateId: z.string(),
  overwriteExisting: z.boolean().default(false),
  skipExisting: z.boolean().default(true),
});

export type EquipmentTemplate = z.infer<typeof equipmentTemplateSchema>;
export type EquipmentTemplateType = z.infer<typeof equipmentTemplateTypeSchema>;
export type EquipmentTemplateItem = z.infer<typeof equipmentTemplateItemSchema>;
export type CreateEquipmentTemplateInput = z.infer<typeof createEquipmentTemplateSchema>;
export type ApplyEquipmentTemplateInput = z.infer<typeof applyEquipmentTemplateSchema>;

