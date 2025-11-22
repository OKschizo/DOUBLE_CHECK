import { trpc } from '@/lib/trpc/client';
import type { CreateBudgetTemplateInput, ApplyBudgetTemplateInput } from '@doublecheck/schemas';

export function useBudgetTemplates() {
  const utils = trpc.useUtils();

  const { data: templates, isLoading, error } = trpc.budgetTemplates.getAll.useQuery();

  const createTemplate = trpc.budgetTemplates.create.useMutation({
    onSuccess: () => {
      utils.budgetTemplates.getAll.invalidate();
    },
  });

  const applyTemplate = trpc.budgetTemplates.applyTemplate.useMutation({
    onSuccess: () => {
      // Invalidate budget for all projects (or specific project if we track it)
    },
  });

  return {
    templates: templates || [],
    isLoading,
    error,
    createTemplate,
    applyTemplate,
  };
}

export function useBudgetTemplate(templateId: string) {
  const { data: template, isLoading, error } = trpc.budgetTemplates.getById.useQuery({ templateId });

  return {
    template,
    isLoading,
    error,
  };
}

