import { trpc } from '@/lib/trpc/client';
import type { CreateFringeRateInput, UpdateFringeRateInput } from '@/lib/schemas';

export function useBudgetFringes(projectId: string): {
  fringes: any[];
  isLoading: boolean;
  error: any;
  createFringe: ReturnType<typeof trpc.budgetFringes.create.useMutation>;
  updateFringe: ReturnType<typeof trpc.budgetFringes.update.useMutation>;
  deleteFringe: ReturnType<typeof trpc.budgetFringes.delete.useMutation>;
  calculateFringes: typeof trpc.budgetFringes.calculate.useQuery;
} {
  const utils = trpc.useUtils();

  const queryResult = trpc.budgetFringes.listByProject.useQuery({ projectId });
  const fringes = queryResult.data || [];
  const isLoading = queryResult.isLoading || queryResult.isPending;
  const error = queryResult.error;

  const createFringe = trpc.budgetFringes.create.useMutation({
    onSuccess: () => {
      utils.budgetFringes.listByProject.invalidate({ projectId });
    },
  });

  const updateFringe = trpc.budgetFringes.update.useMutation({
    onSuccess: () => {
      utils.budgetFringes.listByProject.invalidate({ projectId });
    },
  });

  const deleteFringe = trpc.budgetFringes.delete.useMutation({
    onSuccess: () => {
      utils.budgetFringes.listByProject.invalidate({ projectId });
    },
  });

  const calculateFringes = trpc.budgetFringes.calculate.useQuery;

  return {
    fringes,
    isLoading,
    error,
    createFringe,
    updateFringe,
    deleteFringe,
    calculateFringes,
  };
}

