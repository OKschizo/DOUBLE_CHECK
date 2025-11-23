import { z } from 'zod';

export const userRoleSchema = z.enum([
  'admin',
  'producer',
  'coordinator',
  'dept_head',
  'crew',
]);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1),
  orgId: z.string(),
  role: userRoleSchema,
  photoURL: z.string().url().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional(),
  socials: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    imdb: z.string().optional(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

