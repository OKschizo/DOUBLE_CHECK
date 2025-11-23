import { z } from 'zod';

export const referenceImageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  url: z.string(),
  name: z.string(),
  category: z.enum(['wardrobe', 'camera', 'location', 'character', 'other']).optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createReferenceImageSchema = referenceImageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ReferenceImage = z.infer<typeof referenceImageSchema>;
export type CreateReferenceImageInput = z.infer<typeof createReferenceImageSchema>;

