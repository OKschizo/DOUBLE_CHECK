import { z } from 'zod';
import { budgetCategorySchema, budgetItemSchema, budgetPhaseSchema } from './budget';

export const budgetTemplateTypeSchema = z.enum([
  'film',
  'commercial',
  'documentary',
  'episodic',
  'music_video',
  'corporate',
  'custom',
]);

export const budgetTemplateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  order: z.number().int(),
  department: z.string().optional(),
  phase: budgetPhaseSchema.optional(),
  isSubtotal: z.boolean().default(false).optional(),
  parentCategoryId: z.string().optional(),
});

const baseBudgetTemplateItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  estimatedAmount: z.number().min(0),
  actualAmount: z.number().min(0).default(0),
  status: z.enum(['pending', 'approved', 'estimated', 'paid', 'rejected']).default('estimated'),
  notes: z.string().optional(),
  linkedCrewMemberId: z.string().optional(),
  linkedEquipmentId: z.string().optional(),
  linkedLocationId: z.string().optional(),
  linkedCastMemberId: z.string().optional(),
  linkedScheduleEventId: z.string().optional(),
  linkedSceneId: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().min(0).default(1),
  unitRate: z.number().min(0).optional(),
  vendor: z.string().optional(),
  accountCode: z.string().optional(),
  phase: budgetPhaseSchema.optional(),
});

export const budgetTemplateItemSchema = baseBudgetTemplateItemSchema.partial({
  actualAmount: true,
  status: true,
  quantity: true,
}).extend({
  description: z.string().min(1, 'Description is required'),
  estimatedAmount: z.number().min(0),
});

export const budgetTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  type: budgetTemplateTypeSchema,
  description: z.string().optional(),
  // Template structure
  categories: z.array(z.object({
    category: budgetTemplateCategorySchema,
    items: z.array(budgetTemplateItemSchema).default([]),
  })),
  // Metadata
  isPublic: z.boolean().default(false), // System templates vs user templates
  createdBy: z.string().optional(), // User ID for custom templates
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBudgetTemplateSchema = budgetTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const applyBudgetTemplateSchema = z.object({
  projectId: z.string(),
  templateId: z.string(),
  phase: budgetPhaseSchema.optional(),
  // Options for template application
  includeItems: z.boolean().default(true),
  overwriteExisting: z.boolean().default(false),
});

export type BudgetTemplate = z.infer<typeof budgetTemplateSchema>;
export type BudgetTemplateType = z.infer<typeof budgetTemplateTypeSchema>;
export type BudgetTemplateCategory = z.infer<typeof budgetTemplateCategorySchema>;
export type BudgetTemplateItem = z.infer<typeof budgetTemplateItemSchema>;
export type CreateBudgetTemplateInput = z.infer<typeof createBudgetTemplateSchema>;
export type ApplyBudgetTemplateInput = z.infer<typeof applyBudgetTemplateSchema>;

