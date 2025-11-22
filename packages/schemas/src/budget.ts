import { z } from 'zod';

export const budgetItemStatusSchema = z.enum([
  'estimated',
  'pending',
  'paid',
  'approved',
  'rejected',
]);

export const budgetPhaseSchema = z.enum([
  'pre-production',
  'production',
  'post-production',
  'wrap',
  'other',
]);

export const budgetCategorySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, 'Name is required'),
  order: z.number().int(),
  department: z.string().optional(), // Link to crew department
  phase: budgetPhaseSchema.optional(), // Budget phase
  isSubtotal: z.boolean().default(false), // For subtotal rows
  parentCategoryId: z.string().optional(), // For nested categories
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const budgetItemSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  projectId: z.string(),
  description: z.string().min(1, 'Description is required'),
  estimatedAmount: z.number().min(0),
  actualAmount: z.number().min(0).optional().default(0),
  status: budgetItemStatusSchema.default('estimated'),
  notes: z.string().optional(),
  // Integration fields
  linkedCrewMemberId: z.string().optional(), // Link to crew member
  linkedEquipmentId: z.string().optional(), // Link to equipment
  linkedLocationId: z.string().optional(), // Link to location
  linkedCastMemberId: z.string().optional(), // Link to cast member
  linkedScheduleEventId: z.string().optional(), // Link to schedule event
  linkedSceneId: z.string().optional(), // Link to scene
  // Additional fields
  unit: z.string().optional(), // e.g., "days", "hours", "units"
  quantity: z.number().min(0).optional().default(1),
  unitRate: z.number().min(0).optional(), // Rate per unit
  vendor: z.string().optional(), // Vendor/payee name
  accountCode: z.string().optional(), // Accounting code
  phase: budgetPhaseSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBudgetCategorySchema = budgetCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  order: true, // Order is handled by backend
});

export const updateBudgetCategorySchema = budgetCategorySchema
  .omit({
    id: true,
    projectId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export const createBudgetItemSchema = budgetItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBudgetItemSchema = budgetItemSchema
  .omit({
    id: true,
    projectId: true,
    categoryId: true, // Moving items between categories should be a separate operation if needed, or allow it here
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .extend({
    categoryId: z.string().optional(), // Allow moving items
  });

// Budget Comment Schema
export const budgetCommentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  budgetItemId: z.string().optional(), // Optional - can be category-level comment
  budgetCategoryId: z.string().optional(),
  userId: z.string(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  content: z.string().min(1, 'Comment is required'),
  mentions: z.array(z.string()).default([]), // Array of user IDs mentioned
  resolved: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBudgetCommentSchema = budgetCommentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBudgetCommentSchema = budgetCommentSchema
  .omit({
    id: true,
    projectId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// Budget Version/Comparison Schema
export const budgetVersionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, 'Version name is required'),
  description: z.string().optional(),
  isCurrent: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
});

export const createBudgetVersionSchema = budgetVersionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type BudgetCategory = z.infer<typeof budgetCategorySchema>;
export type BudgetItem = z.infer<typeof budgetItemSchema>;
export type BudgetItemStatus = z.infer<typeof budgetItemStatusSchema>;
export type BudgetPhase = z.infer<typeof budgetPhaseSchema>;
export type BudgetComment = z.infer<typeof budgetCommentSchema>;
export type BudgetVersion = z.infer<typeof budgetVersionSchema>;
export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>;
export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategorySchema>;
export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
export type CreateBudgetCommentInput = z.infer<typeof createBudgetCommentSchema>;
export type UpdateBudgetCommentInput = z.infer<typeof updateBudgetCommentSchema>;
export type CreateBudgetVersionInput = z.infer<typeof createBudgetVersionSchema>;


