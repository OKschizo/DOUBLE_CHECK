import { trpc } from '@/lib/trpc/client';
import type { CreateExpenseInput, UpdateExpenseInput } from '@doublecheck/schemas';

export function useExpenses(projectId: string) {
  const utils = trpc.useUtils();

  const { data: expenses, isLoading, error } = trpc.expenses.listByProject.useQuery({ projectId });

  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      utils.expenses.listByProject.invalidate({ projectId });
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const updateExpense = trpc.expenses.update.useMutation({
    onSuccess: () => {
      utils.expenses.listByProject.invalidate({ projectId });
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.listByProject.invalidate({ projectId });
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  const importExpenses = trpc.expenses.import.useMutation({
    onSuccess: () => {
      utils.expenses.listByProject.invalidate({ projectId });
      utils.budget.getBudget.invalidate({ projectId });
    },
  });

  return {
    expenses: expenses || [],
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    importExpenses,
  };
}

export function useExpensesByBudgetItem(budgetItemId: string) {
  const utils = trpc.useUtils();

  const { data: expenses, isLoading, error } = trpc.expenses.listByBudgetItem.useQuery({ budgetItemId });

  return {
    expenses: expenses || [],
    isLoading,
    error,
  };
}

