import { z } from 'zod';

// Default departments (for reference)
export const defaultDepartments = [
  'camera',
  'lighting_grip',
  'sound',
  'art',
  'wardrobe',
  'makeup_hair',
  'production',
  'post_production',
  'transportation',
  'catering',
  'stunts',
  'vfx',
  'other',
] as const;

export const departmentSchema = z.enum([
  'camera',
  'lighting_grip',
  'sound',
  'art',
  'wardrobe',
  'makeup_hair',
  'production',
  'post_production',
  'transportation',
  'catering',
  'stunts',
  'vfx',
  'other',
]);

export type Department = z.infer<typeof departmentSchema>;

// Role can be free text since each department has different roles
export const crewMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string().optional(), // Link to user account (optional for manually added crew)
  name: z.string().min(1, 'Name is required'),
  department: z.string().min(1, 'Department is required'), // Changed to string to allow custom departments
  role: z.string().min(1, 'Role is required'), // Free text now
  photoUrl: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  rate: z.number().positive().optional(),
  rateType: z.enum(['hourly', 'daily', 'weekly', 'flat']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  notes: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CrewMember = z.infer<typeof crewMemberSchema>;

export const createCrewMemberSchema = crewMemberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCrewMemberSchema = crewMemberSchema
  .omit({
    id: true,
    projectId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type CreateCrewMemberInput = z.infer<typeof createCrewMemberSchema>;
export type UpdateCrewMemberInput = z.infer<typeof updateCrewMemberSchema>;
