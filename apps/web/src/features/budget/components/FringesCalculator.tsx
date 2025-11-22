'use client';

import { useState } from 'react';
import { useBudgetFringes } from '../hooks/useBudgetFringes';
import { trpc } from '@/lib/trpc/client';
import type { FringeRate, CreateFringeRateInput } from '@doublecheck/schemas';

interface FringesCalculatorProps {
  projectId: string;
  onClose: () => void;
}

export function FringesCalculator({ projectId, onClose }: FringesCalculatorProps) {
  const { fringes, createFringe, updateFringe, deleteFringe } = useBudgetFringes(projectId);
  const [baseAmount, setBaseAmount] = useState(0);
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFringe, setEditingFringe] = useState<FringeRate | null>(null);

  const { data: calculation } = trpc.budgetFringes.calculate.useQuery(
    {
      projectId,
      baseAmount,
      department: department || undefined,
      role: role || undefined,
    },
    { enabled: baseAmount > 0 }
  );

  const [formData, setFormData] = useState<Partial<CreateFringeRateInput>>({
    projectId,
    name: '',
    type: 'other',
    rate: 0,
    isPercentage: true,
    appliesToDepartments: [],
    appliesToRoles: [],
    state: '',
  });

  const handleCreate = async () => {
    if (!formData.name || formData.rate === undefined) return;

    await createFringe.mutateAsync(formData as CreateFringeRateInput);
    setFormData({
      projectId,
      name: '',
      type: 'other',
      rate: 0,
      isPercentage: true,
      appliesToDepartments: [],
      appliesToRoles: [],
      state: '',
    });
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingFringe || !formData.name || formData.rate === undefined) return;

    await updateFringe.mutateAsync({
      id: editingFringe.id,
      data: formData,
    });
    setEditingFringe(null);
    setFormData({
      projectId,
      name: '',
      type: 'other',
      rate: 0,
      isPercentage: true,
      appliesToDepartments: [],
      appliesToRoles: [],
      state: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Production Fringes Calculator</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Calculator Section */}
          <div className="bg-background-secondary p-4 rounded-lg border border-border-default">
            <h3 className="font-semibold mb-4">Calculate Fringes</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Base Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department (Optional)</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., camera"
                  className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role (Optional)</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Director of Photography"
                  className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded"
                />
              </div>
            </div>

            {calculation && (
              <div className="mt-4 p-4 bg-background-tertiary rounded border border-border-default">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-text-secondary">Base Amount</div>
                    <div className="text-lg font-semibold">${calculation.baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">Total Fringes</div>
                    <div className="text-lg font-semibold">${calculation.totalFringes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
                <div className="border-t border-border-default pt-4">
                  <div className="text-sm text-text-secondary mb-2">Fringe Breakdown:</div>
                  <div className="space-y-1">
                    {calculation.fringes.map((fringe, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{fringe.fringeName}</span>
                        <span>${fringe.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({fringe.rate}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border-default pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-text-secondary">Total with Fringes</div>
                    <div className="text-2xl font-bold text-accent-primary">
                      ${calculation.totalWithFringes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fringe Rates Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Fringe Rates</h3>
              {!showAddForm && !editingFringe && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors text-sm font-medium"
                  style={{ color: 'rgb(var(--colored-button-text))' }}
                >
                  + Add Fringe Rate
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="bg-background-secondary p-4 rounded-lg border border-border-default mb-4">
                <h4 className="font-medium mb-4">Add Fringe Rate</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded"
                      placeholder="e.g., State Tax"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded"
                    >
                      <option value="state_tax">State Tax</option>
                      <option value="federal_tax">Federal Tax</option>
                      <option value="union_dues">Union Dues</option>
                      <option value="pension">Pension</option>
                      <option value="health_welfare">Health & Welfare</option>
                      <option value="workers_comp">Workers Comp</option>
                      <option value="unemployment">Unemployment</option>
                      <option value="general_liability">General Liability</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rate *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                        className="flex-1 px-3 py-2 bg-background-tertiary border border-border-default rounded"
                      />
                      <select
                        value={formData.isPercentage ? 'percent' : 'flat'}
                        onChange={(e) => setFormData({ ...formData, isPercentage: e.target.value === 'percent' })}
                        className="px-3 py-2 bg-background-tertiary border border-border-default rounded"
                      >
                        <option value="percent">%</option>
                        <option value="flat">Flat</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State (Optional)</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g., CA"
                      className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        projectId,
                        name: '',
                        type: 'other',
                        rate: 0,
                        isPercentage: true,
                        appliesToDepartments: [],
                        appliesToRoles: [],
                        state: '',
                      });
                    }}
                    className="px-4 py-2 bg-background-tertiary border border-border-default rounded hover:bg-background-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={createFringe.isPending}
                    className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium"
                    style={{ color: 'rgb(var(--colored-button-text))' }}
                  >
                    {createFringe.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {fringes.map((fringe) => (
                <div
                  key={fringe.id}
                  className="bg-background-secondary p-4 rounded-lg border border-border-default flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{fringe.name}</div>
                    <div className="text-sm text-text-secondary">
                      {fringe.isPercentage ? `${fringe.rate}%` : `$${fringe.rate}`} • {fringe.type}
                      {fringe.state && ` • ${fringe.state}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingFringe(fringe as any);
                        setFormData({
                          projectId,
                          name: fringe.name,
                          type: fringe.type,
                          rate: fringe.rate,
                          isPercentage: fringe.isPercentage,
                          flatAmount: fringe.flatAmount,
                          appliesToDepartments: fringe.appliesToDepartments,
                          appliesToRoles: fringe.appliesToRoles,
                          state: fringe.state,
                        });
                        setShowAddForm(false);
                      }}
                      className="px-3 py-1 bg-background-tertiary border border-border-default rounded hover:bg-background-secondary transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this fringe rate?')) {
                          deleteFringe.mutate({ id: fringe.id });
                        }
                      }}
                      className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded hover:bg-red-500/30 transition-colors text-sm text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

