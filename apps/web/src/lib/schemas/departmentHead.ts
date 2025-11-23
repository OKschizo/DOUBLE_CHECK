import { z } from 'zod';

// Department Head Schema
export const departmentHeadSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  department: z.string(), // Department name (e.g., "camera", "lighting")
  userId: z.string(), // User who is the department head
  userName: z.string(), // Denormalized for display
  assignedBy: z.string(), // User who assigned them
  assignedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DepartmentHead = z.infer<typeof departmentHeadSchema>;

export const assignDepartmentHeadSchema = z.object({
  projectId: z.string(),
  department: z.string(),
  userId: z.string(),
  userName: z.string(),
});

export const removeDepartmentHeadSchema = z.object({
  id: z.string(),
});

export type AssignDepartmentHeadInput = z.infer<typeof assignDepartmentHeadSchema>;
export type RemoveDepartmentHeadInput = z.infer<typeof removeDepartmentHeadSchema>;

