'use client';

import { useState } from 'react';
import { useBudgetFringes, FringeType, DEFAULT_FRINGE_PRESETS } from '../hooks/useBudgetFringes';

interface BudgetFringesProps {
  projectId: string;
  onClose: () => void;
  laborTotal?: number; // Optional: pass total labor to see fringe calculations
}

const FRINGE_TYPE_LABELS: Record<FringeType, string> = {
  state_tax: 'State Tax',
  federal_tax: 'Federal Tax',
  union_dues: 'Union Dues',
  pension: 'Pension',
  health_welfare: 'Health & Welfare',
  workers_comp: 'Workers Comp',
  unemployment: 'Unemployment',
  general_liability: 'General Liability',
  production_fee: 'Production Fee',
  other: 'Other',
};

export function BudgetFringes({ projectId, onClose, laborTotal = 0 }: BudgetFringesProps) {
  const { 
    fringes, 
    isLoading, 
    totalFringeRate,
    createFringe, 
    updateFringe, 
    deleteFringe,
    addGuildPackage,
    calculateFringes,
    presets,
  } = useBudgetFringes(projectId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as FringeType,
    rate: 0,
    isPercentage: true,
    flatAmount: 0,
    appliesToLabor: true,
    appliesToRentals: false,
    enabled: true,
  });

  const handleAddFringe = async () => {
    if (!formData.name || formData.rate <= 0) return;
    
    await createFringe.mutateAsync({
      name: formData.name,
      type: formData.type,
      rate: formData.rate,
      isPercentage: formData.isPercentage,
      flatAmount: formData.flatAmount,
      appliesToDepartments: [],
      appliesToLabor: formData.appliesToLabor,
      appliesToRentals: formData.appliesToRentals,
      enabled: formData.enabled,
    });
    
    setFormData({
      name: '',
      type: 'other',
      rate: 0,
      isPercentage: true,
      flatAmount: 0,
      appliesToLabor: true,
      appliesToRentals: false,
      enabled: true,
    });
    setShowAddForm(false);
  };

  const handleAddPreset = async (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;
    
    // Check if already exists
    if (fringes.some(f => f.name === presetName)) {
      alert('This fringe rate already exists');
      return;
    }
    
    await createFringe.mutateAsync({
      name: preset.name,
      type: preset.type,
      rate: preset.rate,
      isPercentage: true,
      appliesToDepartments: [],
      appliesToLabor: preset.appliesToLabor ?? true,
      appliesToRentals: preset.appliesToRentals ?? false,
      state: preset.state,
      enabled: true,
    });
  };

  const handleToggleEnabled = async (fringeId: string, enabled: boolean) => {
    await updateFringe.mutateAsync({ id: fringeId, data: { enabled } });
  };

  const handleDelete = async (fringeId: string) => {
    if (confirm('Delete this fringe rate?')) {
      await deleteFringe.mutateAsync({ id: fringeId });
    }
  };

  // Calculate totals
  const calculation = calculateFringes(laborTotal);

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Fringe Rates</h2>
            <p className="text-sm text-text-secondary mt-1">
              Payroll taxes, union contributions, and production fees
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-xl"
          >
            ✕
          </button>
        </div>

        {/* Quick Add Packages */}
        <div className="mb-6 p-4 bg-background-secondary rounded-lg border border-border-default">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Quick Add Packages</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => addGuildPackage.mutate('payroll')}
              className="px-3 py-1.5 text-sm bg-background-tertiary border border-border-default rounded hover:bg-background-primary transition-colors"
            >
              + Payroll Taxes
            </button>
            <button
              onClick={() => addGuildPackage.mutate('dga')}
              className="px-3 py-1.5 text-sm bg-background-tertiary border border-border-default rounded hover:bg-background-primary transition-colors"
            >
              + DGA Fringes
            </button>
            <button
              onClick={() => addGuildPackage.mutate('sag')}
              className="px-3 py-1.5 text-sm bg-background-tertiary border border-border-default rounded hover:bg-background-primary transition-colors"
            >
              + SAG-AFTRA Fringes
            </button>
            <button
              onClick={() => addGuildPackage.mutate('iatse')}
              className="px-3 py-1.5 text-sm bg-background-tertiary border border-border-default rounded hover:bg-background-primary transition-colors"
            >
              + IATSE Fringes
            </button>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-1.5 text-sm bg-accent-primary/10 text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/20 transition-colors"
            >
              Browse All Presets
            </button>
          </div>
          
          {/* Presets Dropdown */}
          {showPresets && (
            <div className="mt-4 p-3 bg-background-tertiary rounded border border-border-default">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {presets.map((preset) => {
                  const exists = fringes.some(f => f.name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleAddPreset(preset.name)}
                      disabled={exists}
                      className={`p-2 text-left text-sm rounded border transition-colors ${
                        exists 
                          ? 'bg-background-secondary border-border-default text-text-tertiary cursor-not-allowed'
                          : 'bg-background-primary border-border-default hover:border-accent-primary'
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-text-tertiary">
                        {preset.rate}% • {FRINGE_TYPE_LABELS[preset.type]}
                      </div>
                      {exists && <div className="text-xs text-text-tertiary mt-1">✓ Added</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current Fringes Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Active Fringe Rates</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 text-sm bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium"
              style={{ color: 'rgb(var(--colored-button-text))' }}
            >
              + Add Custom
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-4 p-4 bg-background-secondary rounded-lg border border-border-default">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Custom Tax"
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FringeType })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded text-sm"
                  >
                    {Object.entries(FRINGE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleAddFringe}
                    disabled={!formData.name || formData.rate <= 0}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-background-tertiary border border-border-default rounded hover:bg-background-primary transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.appliesToLabor}
                    onChange={(e) => setFormData({ ...formData, appliesToLabor: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Applies to Labor
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.appliesToRentals}
                    onChange={(e) => setFormData({ ...formData, appliesToRentals: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Applies to Rentals
                </label>
              </div>
            </div>
          )}

          {/* Fringes List */}
          {fringes.length === 0 ? (
            <div className="p-8 text-center text-text-tertiary bg-background-secondary rounded-lg border border-border-default">
              No fringe rates configured. Use the quick add packages above or add custom rates.
            </div>
          ) : (
            <div className="bg-background-secondary rounded-lg border border-border-default overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background-tertiary border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Enabled</th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Rate</th>
                    <th className="px-4 py-3 text-center font-semibold">Applies To</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {fringes.map((fringe) => (
                    <tr key={fringe.id} className={!fringe.enabled ? 'opacity-50' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={fringe.enabled}
                          onChange={(e) => handleToggleEnabled(fringe.id, e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{fringe.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs bg-background-tertiary rounded">
                          {FRINGE_TYPE_LABELS[fringe.type] || fringe.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {fringe.isPercentage ? `${fringe.rate}%` : `$${fringe.flatAmount?.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {fringe.appliesToLabor && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">Labor</span>
                          )}
                          {fringe.appliesToRentals && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">Rentals</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(fringe.id)}
                          className="text-red-500 hover:text-red-400 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-background-tertiary border-t border-border-default">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-semibold">
                      Total Fringe Rate (Labor)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {totalFringeRate.toFixed(2)}%
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Calculation Preview */}
        {laborTotal > 0 && fringes.length > 0 && (
          <div className="mb-6 p-4 bg-background-secondary rounded-lg border border-border-default">
            <h3 className="font-medium mb-3">Fringe Calculation Preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-text-tertiary">Base Labor</div>
                <div className="text-lg font-semibold">
                  ${calculation.baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary">Total Fringes</div>
                <div className="text-lg font-semibold text-amber-500">
                  +${calculation.totalFringes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary">Fringe Rate</div>
                <div className="text-lg font-semibold">
                  {totalFringeRate.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary">Total with Fringes</div>
                <div className="text-lg font-semibold text-green-500">
                  ${calculation.totalWithFringes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            {calculation.fringes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-default">
                <div className="text-xs text-text-tertiary mb-2">Breakdown:</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {calculation.fringes.map((f) => (
                    <div key={f.fringeId} className="flex justify-between">
                      <span className="text-text-secondary">{f.fringeName}:</span>
                      <span className="font-mono">${f.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
