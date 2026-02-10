'use client';

import { useState } from 'react';
import { useBudgetTemplates } from '../hooks/useBudgetTemplates';

interface BudgetTemplatesProps {
  projectId: string;
  onClose: () => void;
}

export function BudgetTemplates({ projectId, onClose }: BudgetTemplatesProps) {
  const { templates, isLoading, applyTemplate } = useBudgetTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>('all');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!selectedTemplate) return;
    setIsApplying(true);
    
    try {
      const result = await applyTemplate.mutateAsync({
        projectId,
        templateId: selectedTemplate,
        phase: phase !== 'all' ? phase : undefined,
      });
      
      alert(`Template applied successfully!\n\nCreated ${result.categoriesCreated} categories and ${result.itemsCreated} items.`);
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(`Failed to apply template: ${e.message}`);
    } finally {
      setIsApplying(false);
    }
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

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const totalItems = selectedTemplateData?.categories?.reduce(
    (sum: number, cat: any) => sum + (cat.items?.length || 0), 
    0
  ) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Apply Budget Template</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Template Selection */}
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
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{template.name}</div>
                      {template.type && (
                        <span className="text-xs px-2 py-0.5 bg-background-tertiary rounded capitalize">
                          {template.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <div className="text-sm text-text-secondary mt-1">{template.description}</div>
                    )}
                    <div className="text-xs text-text-tertiary mt-2">
                      {template.categories?.length || 0} categories
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
          </div>

          {/* Right Column - Template Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Template Preview</label>
            {selectedTemplateData ? (
              <div className="bg-background-secondary border border-border-default rounded-lg p-4 max-h-80 overflow-y-auto">
                <div className="mb-3 pb-3 border-b border-border-default">
                  <div className="font-semibold">{selectedTemplateData.name}</div>
                  <div className="text-xs text-text-tertiary mt-1">
                    {selectedTemplateData.categories?.length || 0} categories • {totalItems} line items
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedTemplateData.categories?.map((cat: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{cat.name}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-background-tertiary rounded capitalize">
                          {cat.phase?.replace('-', ' ') || 'production'}
                        </span>
                      </div>
                      {cat.items?.length > 0 && (
                        <ul className="mt-1 ml-4 text-xs text-text-secondary space-y-0.5">
                          {cat.items.slice(0, 5).map((item: any, itemIdx: number) => (
                            <li key={itemIdx} className="flex items-center gap-1">
                              <span className="text-text-tertiary">•</span>
                              {item.description || item.name}
                            </li>
                          ))}
                          {cat.items.length > 5 && (
                            <li className="text-text-tertiary italic">
                              +{cat.items.length - 5} more...
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-background-secondary border border-border-default rounded-lg p-8 text-center text-text-tertiary">
                Select a template to see preview
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-6 border-t border-border-default mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-secondary border border-border-default rounded hover:bg-background-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedTemplate || isApplying}
            className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium disabled:opacity-50"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            {isApplying ? 'Applying...' : `Apply Template (${selectedTemplateData?.categories?.length || 0} categories)`}
          </button>
        </div>
      </div>
    </div>
  );
}

