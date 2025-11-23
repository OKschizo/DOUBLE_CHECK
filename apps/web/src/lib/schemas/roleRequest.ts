import { z } from 'zod';

export const roleRequestStatusSchema = z.enum([
  'pending',
  'approved',
  'denied',
  'cancelled',
]);

export const roleRequestSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  crewMemberId: z.string(), // The crew card being updated
  requestedBy: z.string(), // userId of requester
  requesterName: z.string(),
  currentDepartment: z.string(),
  currentRole: z.string(),
  requestedDepartment: z.string(),
  requestedRole: z.string(),
  reason: z.string().optional(),
  status: roleRequestStatusSchema,
  reviewedBy: z.string().optional(), // userId of approver/denier
  reviewerName: z.string().optional(),
  reviewedAt: z.date().optional(),
  reviewNote: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createRoleRequestSchema = z.object({
  projectId: z.string(),
  crewMemberId: z.string(),
  requestedDepartment: z.string().min(1, 'Department is required'),
  requestedRole: z.string().min(1, 'Role is required'),
  reason: z.string().optional(),
});

export const reviewRoleRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['approve', 'deny']),
  reviewNote: z.string().optional(),
});

export type RoleRequest = z.infer<typeof roleRequestSchema>;
export type RoleRequestStatus = z.infer<typeof roleRequestStatusSchema>;
export type CreateRoleRequestInput = z.infer<typeof createRoleRequestSchema>;
export type ReviewRoleRequestInput = z.infer<typeof reviewRoleRequestSchema>;

