import { z } from 'zod';

// Default cast types (for reference)
export const defaultCastTypes = [
  'lead',
  'supporting',
  'featured',
  'extra',
  'stunt',
  'voice',
] as const;

export const castTypeSchema = z.enum([
  'lead',
  'supporting',
  'featured',
  'extra',
  'stunt',
  'voice',
]);

export const castMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  actorName: z.string().min(1, 'Actor name is required'),
  characterName: z.string().min(1, 'Character name is required'),
  castType: z.string().min(1, 'Cast type is required'), // Changed to string to allow custom types
  photoUrl: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  agent: z.string().optional(),
  rate: z.number().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCastMemberSchema = castMemberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCastMemberSchema = castMemberSchema
  .omit({
    id: true,
    projectId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type CastMember = z.infer<typeof castMemberSchema>;
export type CreateCastMember = z.infer<typeof createCastMemberSchema>;
export type UpdateCastMember = z.infer<typeof updateCastMemberSchema>;
export type CastType = z.infer<typeof castTypeSchema>;



