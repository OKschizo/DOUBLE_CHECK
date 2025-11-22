import { z } from 'zod';

export const fringeTypeSchema = z.enum([
  'state_tax',
  'federal_tax',
  'union_dues',
  'pension',
  'health_welfare',
  'workers_comp',
  'unemployment',
  'general_liability',
  'other',
]);

export const fringeRateSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, 'Fringe name is required'),
  type: fringeTypeSchema,
  rate: z.number().min(0).max(100), // Percentage rate
  // Applicability
  appliesToDepartments: z.array(z.string()).default([]), // Empty = all departments
  appliesToRoles: z.array(z.string()).default([]), // Empty = all roles
  // Calculation method
  isPercentage: z.boolean().default(true), // true = percentage, false = flat amount
  flatAmount: z.number().min(0).optional(), // For flat rate fringes
  // State/region specific
  state: z.string().optional(), // e.g., "CA", "NY"
  // Metadata
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createFringeRateSchema = fringeRateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFringeRateSchema = fringeRateSchema
  .omit({
    id: true,
    projectId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// Fringe calculation result
export const fringeCalculationSchema = z.object({
  baseAmount: z.number().min(0),
  fringes: z.array(z.object({
    fringeId: z.string(),
    fringeName: z.string(),
    amount: z.number().min(0),
    rate: z.number(),
  })),
  totalFringes: z.number().min(0),
  totalWithFringes: z.number().min(0),
});

export type FringeRate = z.infer<typeof fringeRateSchema>;
export type FringeType = z.infer<typeof fringeTypeSchema>;
export type FringeCalculation = z.infer<typeof fringeCalculationSchema>;
export type CreateFringeRateInput = z.infer<typeof createFringeRateSchema>;
export type UpdateFringeRateInput = z.infer<typeof updateFringeRateSchema>;

