'use client';

import { useMemo, useState } from 'react';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';
import { useBudgetVersions } from '../hooks/useBudgetVersions';

interface WeeklyCostReportProps {
  projectId: string;
  categories: BudgetCategory[];
  items: BudgetItem[];
  totalBudget?: number;
  projectStartDate?: Date;
  projectEndDate?: Date;
  onClose: () => void;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  estimated: number;
  actual: number;
  variance: number;
  cumulativeEstimated: number;
  cumulativeActual: number;
  items: BudgetItem[];
}

export function WeeklyCostReport({
  projectId,
  categories,
  items,
  totalBudget = 0,
  projectStartDate,
  projectEndDate,
  onClose,
}: WeeklyCostReportProps) {
  const { versions } = useBudgetVersions(projectId);
  const [selectedView, setSelectedView] = useState<'summary' | 'weekly' | 'category' | 'trend'>('summary');

  // Calculate current totals
  const currentTotals = useMemo(() => {
    const estimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const actual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    return { estimated, actual, variance: estimated - actual };
  }, [items]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    return categories.map(cat => {
      const categoryItems = items.filter(item => item.categoryId === cat.id);
      const estimated = categoryItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
      const actual = categoryItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
      return {
        id: cat.id,
        name: cat.name,
        estimated,
        actual,
        variance: estimated - actual,
        variancePercent: estimated > 0 ? ((estimated - actual) / estimated) * 100 : 0,
        itemCount: categoryItems.length,
      };
    }).sort((a, b) => b.estimated - a.estimated);
  }, [categories, items]);

  // Version trend data for chart
  const versionTrend = useMemo(() => {
    const sortedVersions = [...versions].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    
    return sortedVersions.map((v, idx) => ({
      name: v.name,
      date: v.createdAt,
      estimated: v.totalEstimated,
      actual: v.totalActual,
      changeFromPrevious: idx > 0 
        ? v.totalEstimated - sortedVersions[idx - 1].totalEstimated 
        : 0,
    }));
  }, [versions]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const groups: Record<string, { count: number; estimated: number; actual: number }> = {
      estimated: { count: 0, estimated: 0, actual: 0 },
      committed: { count: 0, estimated: 0, actual: 0 },
      spent: { count: 0, estimated: 0, actual: 0 },
      paid: { count: 0, estimated: 0, actual: 0 },
    };
    
    items.forEach(item => {
      const status = item.status || 'estimated';
      if (!groups[status]) groups[status] = { count: 0, estimated: 0, actual: 0 };
      groups[status].count++;
      groups[status].estimated += item.estimatedAmount || 0;
      groups[status].actual += item.actualAmount || 0;
    });
    
    return groups;
  }, [items]);

  const formatCurrency = (n: number) => 
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const formatDate = (date: Date) => 
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Progress bar calculation
  const budgetUsedPercent = totalBudget > 0 
    ? (currentTotals.actual / totalBudget) * 100 
    : 0;
  const budgetEstimatedPercent = totalBudget > 0 
    ? (currentTotals.estimated / totalBudget) * 100 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary border border-border-default rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Cost Report</h2>
              <p className="text-sm text-text-secondary">
                Budget tracking and variance analysis
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary text-xl">✕</button>
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'summary', label: '📊 Summary' },
              { id: 'category', label: '📁 By Category' },
              { id: 'trend', label: '📈 Trend' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedView === tab.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-background-secondary hover:bg-background-tertiary'
                }`}
                style={selectedView === tab.id ? { color: 'rgb(var(--colored-button-text))' } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary View */}
          {selectedView === 'summary' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background-secondary rounded-lg p-4 border border-border-default">
                  <div className="text-xs text-text-tertiary mb-1">Total Budget</div>
                  <div className="text-xl font-bold">${formatCurrency(totalBudget)}</div>
                </div>
                <div className="bg-background-secondary rounded-lg p-4 border border-border-default">
                  <div className="text-xs text-text-tertiary mb-1">Estimated</div>
                  <div className="text-xl font-bold">${formatCurrency(currentTotals.estimated)}</div>
                  <div className="text-xs text-text-tertiary">
                    {budgetEstimatedPercent.toFixed(1)}% of budget
                  </div>
                </div>
                <div className="bg-background-secondary rounded-lg p-4 border border-border-default">
                  <div className="text-xs text-text-tertiary mb-1">Actual Spent</div>
                  <div className="text-xl font-bold">${formatCurrency(currentTotals.actual)}</div>
                  <div className="text-xs text-text-tertiary">
                    {budgetUsedPercent.toFixed(1)}% of budget
                  </div>
                </div>
                <div className={`rounded-lg p-4 border ${
                  currentTotals.variance >= 0 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="text-xs text-text-tertiary mb-1">Variance</div>
                  <div className={`text-xl font-bold ${currentTotals.variance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {currentTotals.variance >= 0 ? '+' : ''}${formatCurrency(currentTotals.variance)}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {currentTotals.variance >= 0 ? 'Under budget' : 'Over budget'}
                  </div>
                </div>
              </div>

              {/* Budget Progress Bar */}
              {totalBudget > 0 && (
                <div className="bg-background-secondary rounded-lg p-4 border border-border-default">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-tertiary">Budget Utilization</span>
                    <span className="font-medium">${formatCurrency(currentTotals.actual)} / ${formatCurrency(totalBudget)}</span>
                  </div>
                  <div className="h-4 bg-background-tertiary rounded-full overflow-hidden relative">
                    <div 
                      className="absolute h-full bg-accent-primary/30"
                      style={{ width: `${Math.min(100, budgetEstimatedPercent)}%` }}
                    />
                    <div 
                      className={`absolute h-full ${budgetUsedPercent > 100 ? 'bg-red-500' : 'bg-accent-primary'}`}
                      style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-tertiary mt-2">
                    <span>Actual: {budgetUsedPercent.toFixed(1)}%</span>
                    <span>Estimated: {budgetEstimatedPercent.toFixed(1)}%</span>
                    <span>Remaining: ${formatCurrency(totalBudget - currentTotals.actual)}</span>
                  </div>
                </div>
              )}

              {/* Status Breakdown */}
              <div className="bg-background-secondary rounded-lg p-4 border border-border-default">
                <h3 className="font-semibold mb-4">Status Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(statusBreakdown).map(([status, data]) => (
                    <div key={status} className="bg-background-tertiary rounded-lg p-3">
                      <div className="text-xs text-text-tertiary capitalize mb-1">{status}</div>
                      <div className="font-semibold">${formatCurrency(data.estimated)}</div>
                      <div className="text-xs text-text-tertiary">{data.count} items</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category View */}
          {selectedView === 'category' && (
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.id} className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{cat.name}</h4>
                      <span className="text-sm text-text-tertiary">{cat.itemCount} items</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-text-tertiary">Estimated:</span>
                        <span className="ml-2 font-semibold">${formatCurrency(cat.estimated)}</span>
                      </div>
                      <div>
                        <span className="text-text-tertiary">Actual:</span>
                        <span className="ml-2 font-semibold">${formatCurrency(cat.actual)}</span>
                      </div>
                      <div>
                        <span className="text-text-tertiary">Variance:</span>
                        <span className={`ml-2 font-semibold ${cat.variance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {cat.variance >= 0 ? '+' : ''}${formatCurrency(cat.variance)}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cat.variance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, cat.estimated > 0 ? (cat.actual / cat.estimated) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trend View */}
          {selectedView === 'trend' && (
            <div className="space-y-6">
              {versionTrend.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  <div className="text-4xl mb-2">📈</div>
                  <p>No version history available</p>
                  <p className="text-sm mt-1">Save budget versions to track changes over time</p>
                </div>
              ) : (
                <>
                  {/* Simple bar chart representation */}
                  <div className="bg-background-secondary rounded-lg p-4 border border-border-default">
                    <h3 className="font-semibold mb-4">Budget History</h3>
                    <div className="space-y-3">
                      {versionTrend.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-24 text-xs text-text-tertiary truncate">
                            {point.name}
                          </div>
                          <div className="flex-1 relative">
                            <div className="h-6 bg-background-tertiary rounded">
                              <div 
                                className="h-full bg-accent-primary rounded"
                                style={{ 
                                  width: `${Math.max(5, (point.estimated / Math.max(...versionTrend.map(v => v.estimated))) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-24 text-right text-sm font-medium">
                            ${formatCurrency(point.estimated)}
                          </div>
                          {point.changeFromPrevious !== 0 && (
                            <div className={`w-20 text-right text-xs ${point.changeFromPrevious > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {point.changeFromPrevious > 0 ? '+' : ''}${formatCurrency(point.changeFromPrevious)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Version details table */}
                  <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
                    <h3 className="font-semibold p-4 border-b border-border-default">Version History</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-background-tertiary">
                          <tr>
                            <th className="px-4 py-2 text-left">Version</th>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-right">Estimated</th>
                            <th className="px-4 py-2 text-right">Actual</th>
                            <th className="px-4 py-2 text-right">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {versionTrend.map((point, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 font-medium">{point.name}</td>
                              <td className="px-4 py-2 text-text-tertiary">{formatDate(point.date)}</td>
                              <td className="px-4 py-2 text-right">${formatCurrency(point.estimated)}</td>
                              <td className="px-4 py-2 text-right">${formatCurrency(point.actual)}</td>
                              <td className={`px-4 py-2 text-right ${point.changeFromPrevious > 0 ? 'text-red-500' : point.changeFromPrevious < 0 ? 'text-green-500' : ''}`}>
                                {point.changeFromPrevious !== 0 && (
                                  <>{point.changeFromPrevious > 0 ? '+' : ''}${formatCurrency(point.changeFromPrevious)}</>
                                )}
                                {point.changeFromPrevious === 0 && '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default flex justify-between items-center">
          <div className="text-xs text-text-tertiary">
            Report generated: {new Date().toLocaleString()}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
