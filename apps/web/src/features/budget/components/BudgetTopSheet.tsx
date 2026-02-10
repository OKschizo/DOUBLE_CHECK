'use client';

import { useMemo } from 'react';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';
import { useBudgetFringes } from '../hooks/useBudgetFringes';

interface BudgetTopSheetProps {
  projectId: string;
  categories: BudgetCategory[];
  items: BudgetItem[];
  totalBudget?: number;
  projectName?: string;
  onClose: () => void;
}

export function BudgetTopSheet({ 
  projectId,
  categories, 
  items, 
  totalBudget,
  projectName,
  onClose 
}: BudgetTopSheetProps) {
  const { fringes, totalFringeRate, calculateFringes } = useBudgetFringes(projectId);

  const summary = useMemo(() => {
    // Calculate totals
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    const variance = totalEstimated - totalActual;
    
    // Separate Above The Line (ATL) vs Below The Line (BTL)
    const atlCategories = new Set(['Above The Line', 'Cast/Talent', 'Director', 'Producer', 'Writer']);
    const postCategories = new Set(['Post-Production', 'Post Production']);
    const otherCategories = new Set(['Insurance & Legal', 'Contingency', 'Production Fee']);
    
    const categorySummaries = categories.map(cat => {
      const categoryItems = items.filter(item => item.categoryId === cat.id);
      const estimated = categoryItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
      const actual = categoryItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
      
      let type: 'atl' | 'btl' | 'post' | 'other' = 'btl';
      if (atlCategories.has(cat.name)) type = 'atl';
      else if (postCategories.has(cat.name)) type = 'post';
      else if (otherCategories.has(cat.name)) type = 'other';
      else if (cat.phase === 'post-production') type = 'post';
      else if (cat.phase === 'pre-production' && cat.name.toLowerCase().includes('talent')) type = 'atl';
      
      return {
        id: cat.id,
        name: cat.name,
        type,
        department: cat.department,
        phase: cat.phase,
        estimated,
        actual,
        variance: estimated - actual,
        itemCount: categoryItems.length,
      };
    }).sort((a, b) => b.estimated - a.estimated);

    // Group by type
    const atl = categorySummaries.filter(c => c.type === 'atl');
    const btl = categorySummaries.filter(c => c.type === 'btl');
    const post = categorySummaries.filter(c => c.type === 'post');
    const other = categorySummaries.filter(c => c.type === 'other');

    const atlTotal = atl.reduce((sum, c) => sum + c.estimated, 0);
    const btlTotal = btl.reduce((sum, c) => sum + c.estimated, 0);
    const postTotal = post.reduce((sum, c) => sum + c.estimated, 0);
    const otherTotal = other.reduce((sum, c) => sum + c.estimated, 0);

    // Calculate labor for fringes
    const laborItems = items.filter(item => item.linkedCrewMemberId || item.linkedCastMemberId);
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const fringeCalculation = calculateFringes(laborTotal);

    // Budget with fringes
    const subtotal = totalEstimated;
    const grandTotal = subtotal + fringeCalculation.totalFringes;

    return {
      totalEstimated,
      totalActual,
      variance,
      atlTotal,
      btlTotal,
      postTotal,
      otherTotal,
      laborTotal,
      fringeTotal: fringeCalculation.totalFringes,
      grandTotal,
      categorySummaries,
      atl,
      btl,
      post,
      other,
      fringeCalculation,
      percentUsed: totalBudget ? (grandTotal / totalBudget) * 100 : 0,
      remaining: totalBudget ? totalBudget - grandTotal : 0,
    };
  }, [categories, items, totalBudget, calculateFringes]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary border border-border-default rounded-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background-primary border-b border-border-default p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Budget Top Sheet</h2>
            {projectName && <p className="text-text-secondary">{projectName}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-sm font-medium"
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Executive Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {totalBudget && totalBudget > 0 && (
              <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
                <div className="text-xs text-text-tertiary uppercase tracking-wide">Approved Budget</div>
                <div className="text-2xl font-bold mt-1">${formatCurrency(totalBudget)}</div>
              </div>
            )}
            <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
              <div className="text-xs text-text-tertiary uppercase tracking-wide">Grand Total (Est.)</div>
              <div className="text-2xl font-bold mt-1">${formatCurrency(summary.grandTotal)}</div>
              <div className="text-xs text-text-tertiary mt-1">incl. {totalFringeRate.toFixed(1)}% fringes</div>
            </div>
            <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
              <div className="text-xs text-text-tertiary uppercase tracking-wide">Actual Spent</div>
              <div className="text-2xl font-bold mt-1">${formatCurrency(summary.totalActual)}</div>
            </div>
            <div className={`p-4 rounded-lg border ${summary.variance >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="text-xs text-text-tertiary uppercase tracking-wide">Variance</div>
              <div className={`text-2xl font-bold mt-1 ${summary.variance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {summary.variance >= 0 ? '+' : ''}${formatCurrency(summary.variance)}
              </div>
            </div>
          </div>

          {/* Budget Health Bar */}
          {totalBudget && totalBudget > 0 && (
            <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Budget Utilization</span>
                <span className={`text-sm font-semibold ${summary.percentUsed > 100 ? 'text-red-500' : summary.percentUsed > 90 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {summary.percentUsed.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${summary.percentUsed > 100 ? 'bg-red-500' : summary.percentUsed > 90 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, summary.percentUsed)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-text-tertiary">
                <span>Estimated: ${formatCurrency(summary.grandTotal)}</span>
                <span>{summary.remaining >= 0 ? `Remaining: $${formatCurrency(summary.remaining)}` : `Over by: $${formatCurrency(Math.abs(summary.remaining))}`}</span>
              </div>
            </div>
          )}

          {/* ATL/BTL Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Above The Line */}
            <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
              <div className="bg-background-tertiary px-4 py-3 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Above The Line</h3>
                  <span className="text-lg font-bold">${formatCurrency(summary.atlTotal)}</span>
                </div>
              </div>
              <div className="p-4">
                {summary.atl.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No ATL categories</p>
                ) : (
                  <div className="space-y-2">
                    {summary.atl.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between text-sm">
                        <span>{cat.name}</span>
                        <span className="font-mono">${formatCurrency(cat.estimated)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Below The Line */}
            <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
              <div className="bg-background-tertiary px-4 py-3 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Below The Line</h3>
                  <span className="text-lg font-bold">${formatCurrency(summary.btlTotal)}</span>
                </div>
              </div>
              <div className="p-4 max-h-48 overflow-y-auto">
                {summary.btl.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No BTL categories</p>
                ) : (
                  <div className="space-y-2">
                    {summary.btl.slice(0, 10).map(cat => (
                      <div key={cat.id} className="flex items-center justify-between text-sm">
                        <span className="truncate mr-2">{cat.name}</span>
                        <span className="font-mono flex-shrink-0">${formatCurrency(cat.estimated)}</span>
                      </div>
                    ))}
                    {summary.btl.length > 10 && (
                      <div className="text-xs text-text-tertiary">
                        +{summary.btl.length - 10} more categories
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Post & Other */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
              <div className="bg-background-tertiary px-4 py-3 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Post-Production</h3>
                  <span className="text-lg font-bold">${formatCurrency(summary.postTotal)}</span>
                </div>
              </div>
              <div className="p-4">
                {summary.post.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No post-production categories</p>
                ) : (
                  <div className="space-y-2">
                    {summary.post.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between text-sm">
                        <span>{cat.name}</span>
                        <span className="font-mono">${formatCurrency(cat.estimated)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
              <div className="bg-background-tertiary px-4 py-3 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Other (Insurance, Contingency)</h3>
                  <span className="text-lg font-bold">${formatCurrency(summary.otherTotal)}</span>
                </div>
              </div>
              <div className="p-4">
                {summary.other.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No other categories</p>
                ) : (
                  <div className="space-y-2">
                    {summary.other.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between text-sm">
                        <span>{cat.name}</span>
                        <span className="font-mono">${formatCurrency(cat.estimated)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fringes Summary */}
          {fringes.length > 0 && (
            <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
              <div className="bg-background-tertiary px-4 py-3 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Fringes & Payroll Taxes</h3>
                  <span className="text-lg font-bold text-amber-500">
                    +${formatCurrency(summary.fringeTotal)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-text-tertiary">Labor Base</div>
                    <div className="font-semibold">${formatCurrency(summary.laborTotal)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary">Fringe Rate</div>
                    <div className="font-semibold">{totalFringeRate.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary">Total Fringes</div>
                    <div className="font-semibold text-amber-500">${formatCurrency(summary.fringeTotal)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary">Labor + Fringes</div>
                    <div className="font-semibold">${formatCurrency(summary.laborTotal + summary.fringeTotal)}</div>
                  </div>
                </div>
                {summary.fringeCalculation.fringes.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-4 border-t border-border-default text-sm">
                    {summary.fringeCalculation.fringes.map(f => (
                      <div key={f.fringeId} className="flex justify-between">
                        <span className="text-text-secondary truncate mr-2">{f.fringeName}</span>
                        <span className="font-mono flex-shrink-0">${formatCurrency(f.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Grand Total (Estimated)</h3>
                <p className="text-sm text-text-secondary">Including all fringes and production fees</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${formatCurrency(summary.grandTotal)}</div>
                {totalBudget && totalBudget > 0 && (
                  <div className={`text-sm ${summary.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {summary.remaining >= 0 ? 'Under' : 'Over'} budget by ${formatCurrency(Math.abs(summary.remaining))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
