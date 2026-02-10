'use client';

import { useState } from 'react';
import { useCrewTemplates } from '../hooks/useCrewTemplates';
import { useCrewByProject } from '../hooks/useCrew';

interface CrewTemplatesProps {
  projectId: string;
  onClose: () => void;
}

export function CrewTemplates({ projectId, onClose }: CrewTemplatesProps) {
  const { templates, isLoading, applyTemplate } = useCrewTemplates();
  // We might need to re-fetch crew list to invalidate, but onSnapshot in useCrewByProject handles it automatically
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const handleApply = async () => {
    if (!selectedTemplate) return;

    try {
        const result = await applyTemplate.mutateAsync({
          projectId,
          templateId: selectedTemplate,
          skipExisting,
          overwriteExisting,
        });
        
        alert(`Template applied successfully! Created ${result.positionsCreated} crew positions.${result.positionsSkipped > 0 ? ` Skipped ${result.positionsSkipped} existing positions.` : ''}`);
        onClose();
    } catch (error: any) {
        alert(`Failed to apply template: ${error.message}`);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

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
      <div className="bg-background-primary border border-border-default rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Apply Crew Template</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-default hover:border-accent-primary/50'
              }`}
            >
              <h3 className="font-semibold text-text-primary mb-1">{template.name}</h3>
              <p className="text-sm text-text-secondary mb-2">{template.description}</p>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span className="px-2 py-1 bg-background-secondary rounded">
                  {template.type}
                </span>
                <span>{template.positions.length} positions</span>
              </div>
            </div>
          ))}
        </div>

        {selectedTemplateData && (
          <div className="mb-6">
            <h3 className="font-semibold text-text-primary mb-3">Template Preview</h3>
            <div className="bg-background-secondary border border-border-default rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {Object.entries(
                  selectedTemplateData.positions.reduce((acc, pos) => {
                    const key = pos.department;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(pos);
                    return acc;
                  }, {} as Record<string, typeof selectedTemplateData.positions>)
                ).map(([department, positions]) => (
                  <div key={department} className="mb-3">
                    <h4 className="font-medium text-text-primary mb-1 capitalize">
                      {department.replace('_', ' ')}
                    </h4>
                    <ul className="text-sm text-text-secondary space-y-1 ml-4">
                      {positions.map((pos, idx) => (
                        <li key={idx}>
                          {pos.role}
                          {pos.quantity > 1 && (
                            <span className="text-text-tertiary ml-1">(×{pos.quantity})</span>
                          )}
                          {pos.required && (
                            <span className="text-accent-primary ml-1 text-xs">Required</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skipExisting"
              checked={skipExisting}
              onChange={(e) => {
                setSkipExisting(e.target.checked);
                if (e.target.checked) setOverwriteExisting(false);
              }}
              className="w-4 h-4"
            />
            <label htmlFor="skipExisting" className="text-sm text-text-primary">
              Skip existing positions (don&apos;t create duplicates)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overwriteExisting"
              checked={overwriteExisting}
              onChange={(e) => {
                setOverwriteExisting(e.target.checked);
                if (e.target.checked) setSkipExisting(false);
              }}
              className="w-4 h-4"
            />
            <label htmlFor="overwriteExisting" className="text-sm text-text-primary">
              Overwrite existing positions (update existing crew members)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedTemplate || (applyTemplate as any).isPending}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            {(applyTemplate as any).isPending ? 'Applying...' : 'Apply Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

