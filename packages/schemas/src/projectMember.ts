import { z } from 'zod';

export const projectRoleSchema = z.enum([
  'owner',      // Full control, can delete project
  'admin',      // Can manage members and settings
  'dept_head',  // Can manage their department(s) (but not project-wide unless also admin)
  'crew',       // Basic crew member - can view and create/update their own items (crew, cast, equipment, locations)
]);

export const projectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  userEmail: z.string().email(),
  userName: z.string(),
  role: projectRoleSchema,
  invitedBy: z.string(),
  invitedAt: z.date(),
  acceptedAt: z.date().optional(),
  status: z.enum(['pending', 'active', 'declined']),
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;
export type ProjectRole = z.infer<typeof projectRoleSchema>;

export const addProjectMemberSchema = z.object({
  projectId: z.string(),
  userEmail: z.string().email(),
  role: projectRoleSchema.default('crew'),
});

export const updateProjectMemberRoleSchema = z.object({
  id: z.string(),
  role: projectRoleSchema,
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>;

