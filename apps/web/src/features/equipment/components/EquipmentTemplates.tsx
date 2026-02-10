'use client';

import { useState } from 'react';
import { useEquipmentTemplates } from '../hooks/useEquipmentTemplates';

interface TemplateItem {
  name: string;
  category: string;
  quantity: number;
  required?: boolean;
  dailyRate?: number;
  weeklyRate?: number;
  description?: string;
}

interface EquipmentTemplatesProps {
  projectId: string;
  onClose: () => void;
}

export function EquipmentTemplates({ projectId, onClose }: EquipmentTemplatesProps) {
  const { templates, isLoading, applyTemplate } = useEquipmentTemplates();
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
        alert(`Template applied successfully! Created ${result.itemsCreated} equipment items.${result.itemsSkipped > 0 ? ` Skipped ${result.itemsSkipped} existing items.` : ''}`);
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
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default md:rounded-lg p-4 md:p-6 w-full md:max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-t-lg animate-in slide-in-from-bottom md:fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary">Apply Template</h2>
            <p className="text-sm text-text-secondary md:hidden">Choose an equipment package</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-tertiary"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all active:scale-[0.98] ${
                selectedTemplate === template.id
                  ? 'border-accent-primary bg-accent-primary/10 ring-2 ring-accent-primary/20'
                  : 'border-border-default hover:border-accent-primary/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-text-primary mb-1">{template.name}</h3>
                {selectedTemplate === template.id && (
                  <svg className="w-5 h-5 text-accent-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </div>
              <p className="text-sm text-text-secondary mb-2 line-clamp-2">{template.description}</p>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span className="px-2 py-1 bg-background-secondary rounded">
                  {template.type}
                </span>
                <span>{template.items.length} items</span>
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
                  (selectedTemplateData.items as TemplateItem[]).reduce<Record<string, TemplateItem[]>>((acc, item) => {
                    const key = item.category;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <div key={category} className="mb-3">
                    <h4 className="font-medium text-text-primary mb-1 capitalize">
                      {category.replace('_', ' ')}
                    </h4>
                    <ul className="text-sm text-text-secondary space-y-1 ml-4">
                      {items.map((item: TemplateItem, idx: number) => (
                        <li key={idx}>
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="text-text-tertiary ml-1">(×{item.quantity})</span>
                          )}
                          {item.required && (
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
              Skip existing items (don&apos;t create duplicates)
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
              Overwrite existing items (update existing equipment)
            </label>
          </div>
        </div>

        {/* Action buttons - sticky on mobile */}
        <div className="sticky bottom-0 -mx-4 md:mx-0 px-4 md:px-0 py-4 md:py-0 bg-background-primary border-t border-border-default md:border-0 mt-4 md:mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 safe-area-bottom">
          <button
            onClick={onClose}
            className="order-2 md:order-1 px-4 py-3 md:py-2 border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-text-primary font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedTemplate || (applyTemplate as any).isPending}
            className="order-1 md:order-2 px-4 py-3 md:py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            {(applyTemplate as any).isPending ? 'Applying...' : 'Apply Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

