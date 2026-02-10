'use client';

import { useState, useMemo } from 'react';
import { useBudgetVersions, BudgetVersion } from '../hooks/useBudgetVersions';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';

interface BudgetVersionsProps {
  projectId: string;
  categories: BudgetCategory[];
  items: BudgetItem[];
  onClose: () => void;
  onRestore?: (version: BudgetVersion) => void;
}

export function BudgetVersions({ 
  projectId, 
  categories, 
  items, 
  onClose,
  onRestore 
}: BudgetVersionsProps) {
  const { versions, isLoading, saveVersion, deleteVersion, compareVersions } = useBudgetVersions(projectId);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null]);
  const [showCompare, setShowCompare] = useState(false);

  // Current budget totals
  const currentTotals = useMemo(() => ({
    estimated: items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0),
    actual: items.reduce((sum, item) => sum + (item.actualAmount || 0), 0),
    categories: categories.length,
    items: items.length,
  }), [categories, items]);

  const handleSaveVersion = async () => {
    if (!versionName.trim()) return;
    setIsSaving(true);
    
    try {
      await saveVersion.mutateAsync(categories, items, versionName, versionDescription);
      setVersionName('');
      setVersionDescription('');
      setShowSaveForm(false);
    } catch (err: any) {
      alert(`Failed to save version: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (confirm('Delete this version? This cannot be undone.')) {
      await deleteVersion.mutateAsync(versionId);
    }
  };

  const handleCompare = () => {
    if (selectedVersions[0] && selectedVersions[1]) {
      setShowCompare(true);
    }
  };

  const formatCurrency = (n: number) => 
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const formatDate = (date: Date) => 
    date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  // Comparison data
  const comparison = useMemo(() => {
    if (!showCompare || !selectedVersions[0] || !selectedVersions[1]) return null;
    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);
    if (!v1 || !v2) return null;
    return { v1, v2, diff: compareVersions(v1, v2) };
  }, [showCompare, selectedVersions, versions, compareVersions]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background-primary border border-border-default rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary border border-border-default rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Budget Versions</h2>
            <p className="text-sm text-text-secondary mt-1">
              Save snapshots and track changes over time
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Budget Summary */}
          <div className="bg-background-secondary rounded-lg border border-border-default p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Current Budget</h3>
              <button
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors text-sm font-medium"
                style={{ color: 'rgb(var(--colored-button-text))' }}
              >
                💾 Save Version
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-text-tertiary">Estimated:</span>
                <span className="ml-2 font-semibold">${formatCurrency(currentTotals.estimated)}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Actual:</span>
                <span className="ml-2 font-semibold">${formatCurrency(currentTotals.actual)}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Categories:</span>
                <span className="ml-2 font-semibold">{currentTotals.categories}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Items:</span>
                <span className="ml-2 font-semibold">{currentTotals.items}</span>
              </div>
            </div>
          </div>

          {/* Save Form */}
          {showSaveForm && (
            <div className="bg-background-secondary rounded-lg border border-accent-primary/30 p-4 mb-6">
              <h4 className="font-medium mb-3">Save Current Budget as Version</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Version Name *</label>
                  <input
                    type="text"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="e.g., Initial Budget, Pre-Production Lock, Final v2"
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Description (optional)</label>
                  <textarea
                    value={versionDescription}
                    onChange={(e) => setVersionDescription(e.target.value)}
                    placeholder="Notes about this version..."
                    rows={2}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded text-sm resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="px-4 py-2 bg-background-tertiary border border-border-default rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVersion}
                    disabled={!versionName.trim() || isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Version'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Compare Tool */}
          {versions.length >= 2 && (
            <div className="bg-background-secondary rounded-lg border border-border-default p-4 mb-6">
              <h4 className="font-medium mb-3">Compare Versions</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={selectedVersions[0] || ''}
                  onChange={(e) => setSelectedVersions([e.target.value || null, selectedVersions[1]])}
                  className="px-3 py-2 bg-background-primary border border-border-default rounded text-sm"
                >
                  <option value="">Select first version...</option>
                  {versions.map(v => (
                    <option key={v.id} value={v.id} disabled={v.id === selectedVersions[1]}>
                      {v.name} - {formatDate(v.createdAt)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedVersions[1] || ''}
                  onChange={(e) => setSelectedVersions([selectedVersions[0], e.target.value || null])}
                  className="px-3 py-2 bg-background-primary border border-border-default rounded text-sm"
                >
                  <option value="">Select second version...</option>
                  {versions.map(v => (
                    <option key={v.id} value={v.id} disabled={v.id === selectedVersions[0]}>
                      {v.name} - {formatDate(v.createdAt)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCompare}
                  disabled={!selectedVersions[0] || !selectedVersions[1]}
                  className="px-4 py-2 bg-accent-primary rounded text-sm font-medium disabled:opacity-50"
                  style={{ color: 'rgb(var(--colored-button-text))' }}
                >
                  Compare
                </button>
              </div>
            </div>
          )}

          {/* Comparison Results */}
          {comparison && (
            <div className="bg-background-secondary rounded-lg border border-accent-primary/30 p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">
                  Comparison: {comparison.v1.name} → {comparison.v2.name}
                </h4>
                <button
                  onClick={() => setShowCompare(false)}
                  className="text-sm text-text-tertiary hover:text-text-primary"
                >
                  Close
                </button>
              </div>
              
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className={`p-3 rounded-lg ${comparison.diff.estimatedDiff >= 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                  <div className="text-xs text-text-tertiary">Estimated Change</div>
                  <div className={`font-semibold ${comparison.diff.estimatedDiff >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {comparison.diff.estimatedDiff >= 0 ? '+' : ''}${formatCurrency(comparison.diff.estimatedDiff)}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {comparison.diff.percentChange >= 0 ? '+' : ''}{comparison.diff.percentChange.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background-tertiary">
                  <div className="text-xs text-text-tertiary">Actual Change</div>
                  <div className="font-semibold">
                    {comparison.diff.actualDiff >= 0 ? '+' : ''}${formatCurrency(comparison.diff.actualDiff)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background-tertiary">
                  <div className="text-xs text-text-tertiary">Items Added</div>
                  <div className="font-semibold text-green-500">+{comparison.diff.addedItems.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-background-tertiary">
                  <div className="text-xs text-text-tertiary">Items Removed</div>
                  <div className="font-semibold text-red-500">-{comparison.diff.removedItems.length}</div>
                </div>
              </div>

              {/* Changed Items */}
              {comparison.diff.changedItems.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-2">Changed Items ({comparison.diff.changedItems.length})</h5>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-background-tertiary">
                        <tr>
                          <th className="px-2 py-1 text-left">Item</th>
                          <th className="px-2 py-1 text-right">Before</th>
                          <th className="px-2 py-1 text-right">After</th>
                          <th className="px-2 py-1 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {comparison.diff.changedItems.slice(0, 20).map(item => (
                          <tr key={item.id}>
                            <td className="px-2 py-1 truncate max-w-[150px]">{item.description}</td>
                            <td className="px-2 py-1 text-right">${formatCurrency(item.estimatedBefore)}</td>
                            <td className="px-2 py-1 text-right">${formatCurrency(item.estimatedAfter)}</td>
                            <td className={`px-2 py-1 text-right ${item.estimatedAfter > item.estimatedBefore ? 'text-red-500' : 'text-green-500'}`}>
                              {item.estimatedAfter > item.estimatedBefore ? '+' : ''}${formatCurrency(item.estimatedAfter - item.estimatedBefore)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Version History */}
          <div>
            <h3 className="font-semibold mb-3">Version History ({versions.length})</h3>
            {versions.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <div className="text-4xl mb-2">📋</div>
                <p>No versions saved yet</p>
                <p className="text-sm mt-1">Save your first version to start tracking changes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version, idx) => (
                  <div
                    key={version.id}
                    className="bg-background-secondary rounded-lg border border-border-default p-4 hover:border-accent-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{version.name}</h4>
                          {idx === 0 && (
                            <span className="text-xs px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                              Latest
                            </span>
                          )}
                        </div>
                        {version.description && (
                          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                            {version.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-tertiary">
                          <span>Est: ${formatCurrency(version.totalEstimated)}</span>
                          <span>Act: ${formatCurrency(version.totalActual)}</span>
                          <span>{version.categoryCount} categories</span>
                          <span>{version.itemCount} items</span>
                        </div>
                        <div className="text-xs text-text-tertiary mt-1">
                          Saved by {version.createdByName} on {formatDate(version.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {onRestore && (
                          <button
                            onClick={() => {
                              if (confirm('Restore this version? Current budget will be replaced.')) {
                                onRestore(version);
                              }
                            }}
                            className="px-3 py-1.5 bg-background-tertiary border border-border-default rounded text-xs hover:bg-background-primary transition-colors"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVersion(version.id)}
                          className="px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
