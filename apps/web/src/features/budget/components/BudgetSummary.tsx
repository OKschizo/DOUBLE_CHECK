'use client';

import type { BudgetCategory, BudgetItem } from '@doublecheck/schemas';

interface BudgetSummaryProps {
  categories: BudgetCategory[];
  items: BudgetItem[];
  totalBudget?: number; // Project's total allocated budget
}

export function BudgetSummary({ categories, items, totalBudget }: BudgetSummaryProps) {
  const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
  const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  
  // Variance: estimated vs actual (spending accuracy)
  const variance = totalEstimated - totalActual;
  const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;
  
  // Budget health: compare against total allocated budget if available
  // If totalBudget is set, compare estimated/actual against it
  // Otherwise, fall back to estimated vs actual comparison
  let budgetHealthPercent = 0;
  let budgetHealthStatus: 'On Track' | 'Warning' | 'Over' = 'On Track';
  let budgetHealthColor = 'text-green-500';
  let budgetHealthBgColor = 'bg-green-500';
  
  if (totalBudget && totalBudget > 0) {
    // Compare estimated against allocated budget
    const estimatedPercent = (totalEstimated / totalBudget) * 100;
    const actualPercent = (totalActual / totalBudget) * 100;
    
    // Use the higher of estimated or actual to determine health
    budgetHealthPercent = Math.max(estimatedPercent, actualPercent);
    
    if (budgetHealthPercent > 100) {
      budgetHealthStatus = 'Over';
      budgetHealthColor = 'text-red-500';
      budgetHealthBgColor = 'bg-red-500';
    } else if (budgetHealthPercent > 90) {
      budgetHealthStatus = 'Warning';
      budgetHealthColor = 'text-yellow-500';
      budgetHealthBgColor = 'bg-yellow-500';
    } else {
      budgetHealthStatus = 'On Track';
      budgetHealthColor = 'text-green-500';
      budgetHealthBgColor = 'bg-green-500';
    }
  } else {
    // Fallback: use variance percent (estimated vs actual)
    budgetHealthPercent = Math.abs(variancePercent);
    if (variancePercent < -10) {
      budgetHealthStatus = 'Over';
      budgetHealthColor = 'text-red-500';
      budgetHealthBgColor = 'bg-red-500';
    } else if (variancePercent < -5) {
      budgetHealthStatus = 'Warning';
      budgetHealthColor = 'text-yellow-500';
      budgetHealthBgColor = 'bg-yellow-500';
    } else {
      budgetHealthStatus = 'On Track';
      budgetHealthColor = 'text-green-500';
      budgetHealthBgColor = 'bg-green-500';
    }
  }

  // Calculate by phase
  const phaseTotals = categories.reduce((acc, cat) => {
    const phase = cat.phase || 'other';
    if (!acc[phase]) {
      acc[phase] = { estimated: 0, actual: 0 };
    }
    const phaseItems = items.filter(item => item.categoryId === cat.id);
    acc[phase].estimated += phaseItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    acc[phase].actual += phaseItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    return acc;
  }, {} as Record<string, { estimated: number; actual: number }>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-background-secondary p-6 rounded-lg border border-border-default">
        <h3 className="text-text-secondary text-sm font-medium mb-2">Total Estimated</h3>
        <p className="text-2xl font-bold text-text-primary">${totalEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="bg-background-secondary p-6 rounded-lg border border-border-default">
        <h3 className="text-text-secondary text-sm font-medium mb-2">Total Actual</h3>
        <p className="text-2xl font-bold text-text-primary">${totalActual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="bg-background-secondary p-6 rounded-lg border border-border-default">
        <h3 className="text-text-secondary text-sm font-medium mb-2">Variance</h3>
        <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {variance >= 0 ? '+' : ''}${variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={`text-xs mt-1 ${variance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
        </p>
      </div>
      <div className="bg-background-secondary p-6 rounded-lg border border-border-default">
        <h3 className="text-text-secondary text-sm font-medium mb-2">Budget Health</h3>
        {totalBudget && totalBudget > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${budgetHealthBgColor}`}
                  style={{ width: `${Math.min(100, budgetHealthPercent)}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${budgetHealthColor}`}>
                {budgetHealthStatus}
              </span>
            </div>
            <p className="text-xs text-text-tertiary">
              {totalEstimated > totalBudget ? (
                <>${(totalEstimated - totalBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over budget</>
              ) : (
                <>${(totalBudget - totalEstimated).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining</>
              )}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              {budgetHealthPercent.toFixed(1)}% of ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} used
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${budgetHealthBgColor}`}
                style={{ width: `${Math.min(100, budgetHealthPercent)}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${budgetHealthColor}`}>
              {budgetHealthStatus}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

