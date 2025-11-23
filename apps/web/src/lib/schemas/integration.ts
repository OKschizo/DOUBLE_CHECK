import { z } from 'zod';

export const integrationTypeSchema = z.enum([
  'movie_magic_budgeting',
  'plaid',
  'quickbooks',
  'showbiz_budgeting',
  'slack',
  'wrapbook',
]);

export const integrationStatusSchema = z.enum([
  'disconnected',
  'connecting',
  'connected',
  'error',
]);

export const integrationConfigSchema = z.object({
  // OAuth tokens (for Plaid, Quickbooks, Slack, Wrapbook)
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  
  // Plaid specific
  plaidItemId: z.string().optional(),
  plaidInstitutionId: z.string().optional(),
  
  // Quickbooks specific
  quickbooksRealmId: z.string().optional(),
  quickbooksCompanyName: z.string().optional(),
  
  // Slack specific
  slackTeamId: z.string().optional(),
  slackTeamName: z.string().optional(),
  slackChannelId: z.string().optional(),
  slackChannelName: z.string().optional(),
  
  // Wrapbook specific
  wrapbookProjectId: z.string().optional(),
  
  // File import settings (for Movie Magic, Showbiz)
  lastImportDate: z.date().optional(),
  importSettings: z.object({
    autoSync: z.boolean().optional().default(false),
    syncFrequency: z.enum(['daily', 'weekly', 'monthly', 'manual']).optional().default('manual'),
  }).optional(),
  
  // General settings
  enabled: z.boolean().optional().default(true),
  syncDirection: z.enum(['import', 'export', 'both']).optional().default('import'),
});

export const integrationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: integrationTypeSchema,
  status: integrationStatusSchema,
  config: integrationConfigSchema,
  name: z.string(), // Display name
  description: z.string().optional(),
  lastSyncAt: z.date().optional(),
  lastSyncStatus: z.enum(['success', 'error', 'pending']).optional(),
  lastSyncError: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
});

export type Integration = z.infer<typeof integrationSchema>;
export type IntegrationType = z.infer<typeof integrationTypeSchema>;
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;

// Integration metadata for UI display
export const integrationMetadata = {
  movie_magic_budgeting: {
    name: 'Movie Magic Budgeting',
    description: 'Import Movie Magic Budgeting files to manage and actualize in DoubleCheck.',
    icon: '🎬',
    category: 'budgeting',
    requiresOAuth: false,
    supportsImport: true,
    supportsExport: false,
  },
  plaid: {
    name: 'Plaid',
    description: 'Connect to your bank and credit card accounts to make actualizing quicker.',
    icon: '🏦',
    category: 'finance',
    requiresOAuth: true,
    supportsImport: true,
    supportsExport: false,
  },
  quickbooks: {
    name: 'Quickbooks',
    description: 'Import all your project transactions to Quickbooks for accounting.',
    icon: '📊',
    category: 'accounting',
    requiresOAuth: true,
    supportsImport: false,
    supportsExport: true,
  },
  showbiz_budgeting: {
    name: 'Showbiz Budgeting',
    description: 'Import Showbiz budgets right into DoubleCheck.',
    icon: '🎭',
    category: 'budgeting',
    requiresOAuth: false,
    supportsImport: true,
    supportsExport: false,
  },
  slack: {
    name: 'Slack',
    description: 'Get in app notifications to your Slack channels to stay in the loop.',
    icon: '💬',
    category: 'communication',
    requiresOAuth: true,
    supportsImport: false,
    supportsExport: false,
  },
  wrapbook: {
    name: 'Wrapbook',
    description: 'Import Wrapbook payroll into DoubleCheck to actualize faster.',
    icon: '💰',
    category: 'payroll',
    requiresOAuth: true,
    supportsImport: true,
    supportsExport: false,
  },
} as const;

