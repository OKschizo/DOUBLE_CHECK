'use client';

import { useState } from 'react';
import { useBudgetTemplates } from '../hooks/useBudgetTemplates';
import { trpc } from '@/lib/trpc/client';

interface BudgetTemplatesProps {
  projectId: string;
  onClose: () => void;
}

export function BudgetTemplates({ projectId, onClose }: BudgetTemplatesProps) {
  const { templates, isLoading } = useBudgetTemplates();
  const utils = trpc.useUtils();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>('all');

  const applyTemplate = trpc.budgetTemplates.applyTemplate.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
      onClose();
    },
  });

  const handleApply = async () => {
    if (!selectedTemplate) return;

    await applyTemplate.mutateAsync({
      projectId,
      templateId: selectedTemplate,
      includeItems: true,
      overwriteExisting: false,
      phase: phase !== 'all' ? phase as any : undefined,
    });
  };

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
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Apply Budget Template</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Template</label>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 text-left rounded-lg border transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-border-default hover:bg-background-secondary'
                  }`}
                >
                  <div className="font-semibold">{template.name}</div>
                  {template.description && (
                    <div className="text-sm text-text-secondary mt-1">{template.description}</div>
                  )}
                  <div className="text-xs text-text-tertiary mt-1">
                    {template.categories.length} categories
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Apply to Phase (Optional)</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded"
            >
              <option value="all">All Phases</option>
              <option value="pre-production">Pre-Production</option>
              <option value="production">Production</option>
              <option value="post-production">Post-Production</option>
              <option value="wrap">Wrap</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-background-secondary border border-border-default rounded hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedTemplate || applyTemplate.isPending}
              className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium"
              style={{ color: 'rgb(var(--colored-button-text))' }}
            >
              {applyTemplate.isPending ? 'Applying...' : 'Apply Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

