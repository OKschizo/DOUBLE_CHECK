import { z } from 'zod';

export const projectStatusSchema = z.enum([
  'planning',
  'pre-production',
  'production',
  'post-production',
  'completed',
  'archived',
]);

export const projectTypeSchema = z.enum([
  'film',
  'commercial',
  'documentary',
  'episodic',
  'music_video',
  'photoshoot',
  'corporate',
  'custom',
]);

export const projectSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string().min(1, 'Title is required'),
  client: z.string().min(1, 'Client is required'),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: projectStatusSchema,
  budget: z.number().positive().optional(),
  coverImageUrl: z.string().url().optional(),
  projectType: projectTypeSchema.optional(), // Type of project (photoshoot, film, etc.)
  customCastTypes: z.array(z.string()).optional().default([]),
  customCrewDepartments: z.array(z.string()).optional().default([]),
  customRolesByDepartment: z.record(z.array(z.string())).optional().default({}),
  customEquipmentCategories: z.array(z.string()).optional().default([]),
  isTemplate: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(false),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const createProjectSchema = projectSchema.omit({
  id: true,
  orgId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = projectSchema
  .omit({
    id: true,
    orgId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

