import { z } from 'zod';

export const expenseStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'paid',
  'reimbursed',
]);

export const expenseCategorySchema = z.enum([
  'labor',
  'equipment',
  'location',
  'transportation',
  'catering',
  'post_production',
  'insurance',
  'permits',
  'other',
]);

export const expenseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  budgetItemId: z.string().optional(), // Link to budget item
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0),
  category: expenseCategorySchema,
  status: expenseStatusSchema.default('pending'),
  // Transaction details
  transactionDate: z.date(),
  vendor: z.string().optional(), // Vendor/payee name
  vendorId: z.string().optional(), // Link to contact/vendor
  // Receipt/documentation
  receiptUrl: z.string().optional(), // Firebase Storage URL
  receiptFileName: z.string().optional(),
  // Payment details
  paymentMethod: z.string().optional(), // e.g., "credit_card", "check", "wire"
  paymentDate: z.date().optional(),
  checkNumber: z.string().optional(),
  // Approval workflow
  approvedBy: z.string().optional(), // User ID
  approvedAt: z.date().optional(),
  rejectedReason: z.string().optional(),
  // Notes and tags
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Metadata
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createExpenseSchema = expenseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExpenseSchema = expenseSchema
  .omit({
    id: true,
    projectId: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export const expenseImportRowSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  vendor: z.string().optional(),
  category: z.string().optional(),
  budgetItem: z.string().optional(), // Description or ID to match
});

export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseImportRow = z.infer<typeof expenseImportRowSchema>;

