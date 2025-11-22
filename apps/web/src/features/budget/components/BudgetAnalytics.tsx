'use client';

import { useMemo } from 'react';
import type { BudgetCategory, BudgetItem } from '@doublecheck/schemas';

interface BudgetAnalyticsProps {
  categories: BudgetCategory[];
  items: BudgetItem[];
}

export function BudgetAnalytics({ categories, items }: BudgetAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    const variance = totalEstimated - totalActual;
    const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

    // Category breakdown
    const categoryBreakdown = categories.map(cat => {
      const categoryItems = items.filter(item => item.categoryId === cat.id);
      const estimated = categoryItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
      const actual = categoryItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
      const variance = estimated - actual;
      const percentOfTotal = totalEstimated > 0 ? (estimated / totalEstimated) * 100 : 0;

      return {
        category: cat.name,
        estimated,
        actual,
        variance,
        percentOfTotal,
      };
    }).sort((a, b) => b.estimated - a.estimated);

    // Status breakdown
    const statusBreakdown = items.reduce((acc, item) => {
      const status = item.status;
      if (!acc[status]) {
        acc[status] = { count: 0, estimated: 0, actual: 0 };
      }
      acc[status].count++;
      acc[status].estimated += item.estimatedAmount || 0;
      acc[status].actual += item.actualAmount || 0;
      return acc;
    }, {} as Record<string, { count: number; estimated: number; actual: number }>);

    // Phase breakdown
    const phaseBreakdown = categories.reduce((acc, cat) => {
      const phase = cat.phase || 'other';
      if (!acc[phase]) {
        acc[phase] = { estimated: 0, actual: 0 };
      }
      const categoryItems = items.filter(item => item.categoryId === cat.id);
      acc[phase].estimated += categoryItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
      acc[phase].actual += categoryItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
      return acc;
    }, {} as Record<string, { estimated: number; actual: number }>);

    return {
      totalEstimated,
      totalActual,
      variance,
      variancePercent,
      categoryBreakdown,
      statusBreakdown,
      phaseBreakdown,
    };
  }, [categories, items]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
          <div className="text-sm text-text-secondary mb-1">Total Estimated</div>
          <div className="text-xl font-bold">${analytics.totalEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
          <div className="text-sm text-text-secondary mb-1">Total Actual</div>
          <div className="text-xl font-bold">${analytics.totalActual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
          <div className="text-sm text-text-secondary mb-1">Variance</div>
          <div className={`text-xl font-bold ${analytics.variance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {analytics.variance >= 0 ? '+' : ''}${analytics.variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
          <div className="text-sm text-text-secondary mb-1">Variance %</div>
          <div className={`text-xl font-bold ${analytics.variancePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {analytics.variancePercent >= 0 ? '+' : ''}{analytics.variancePercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-background-secondary p-6 rounded-lg border border-border-default">
        <h3 className="font-semibold mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {analytics.categoryBreakdown.slice(0, 10).map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{cat.category}</span>
                <span className="text-sm text-text-secondary">
                  ${cat.estimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 
                  ${cat.actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-primary transition-all"
                    style={{ width: `${Math.min(100, cat.percentOfTotal)}%` }}
                  />
                </div>
                <span className="text-xs text-text-tertiary w-12 text-right">
                  {cat.percentOfTotal.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-background-secondary p-6 rounded-lg border border-border-default">
        <h3 className="font-semibold mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(analytics.statusBreakdown).map(([status, data]) => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold mb-1">{data.count}</div>
              <div className="text-xs text-text-secondary capitalize">{status}</div>
              <div className="text-xs text-text-tertiary mt-1">
                ${data.estimated.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Breakdown */}
      {Object.keys(analytics.phaseBreakdown).length > 0 && (
        <div className="bg-background-secondary p-6 rounded-lg border border-border-default">
          <h3 className="font-semibold mb-4">Phase Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(analytics.phaseBreakdown).map(([phase, data]) => {
              const phaseEstimated = data.estimated;
              const phaseActual = data.actual;
              const phasePercent = analytics.totalEstimated > 0 ? (phaseEstimated / analytics.totalEstimated) * 100 : 0;

              return (
                <div key={phase}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{phase.replace('-', ' ')}</span>
                    <span className="text-sm text-text-secondary">
                      ${phaseEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 
                      ${phaseActual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-primary transition-all"
                        style={{ width: `${Math.min(100, phasePercent)}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-tertiary w-12 text-right">
                      {phasePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

