import { trpc } from '@/lib/trpc/client';
import type { CreateBudgetCategoryInput, UpdateBudgetCategoryInput, CreateBudgetItemInput, UpdateBudgetItemInput } from '@/lib/schemas';

export function useBudget(projectId: string) {
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.budget.getBudget.useQuery({ projectId });

  const createCategory = trpc.budget.createCategory.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const updateCategory = trpc.budget.updateCategory.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const deleteCategory = trpc.budget.deleteCategory.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const createItem = trpc.budget.createItem.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const updateItem = trpc.budget.updateItem.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const deleteItem = trpc.budget.deleteItem.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  return {
    budget: data,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
  };
}




