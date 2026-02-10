'use client';

import { useState } from 'react';

interface ShootingDayTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  callTime: string;
  shootCall: string;
  lunchBreak?: string;
  wrapTime?: string;
  notes?: string;
}

const SHOOTING_DAY_TEMPLATES: ShootingDayTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Day',
    description: '12-hour day with standard call times',
    icon: '☀️',
    callTime: '07:00',
    shootCall: '08:00',
    lunchBreak: '13:00',
    wrapTime: '19:00',
    notes: 'Standard 12-hour shooting day',
  },
  {
    id: 'early-call',
    name: 'Early Call',
    description: 'Early morning shoot for sunrise/golden hour',
    icon: '🌅',
    callTime: '05:00',
    shootCall: '05:30',
    lunchBreak: '11:00',
    wrapTime: '17:00',
    notes: 'Early call for sunrise/golden hour shots',
  },
  {
    id: 'night-shoot',
    name: 'Night Shoot',
    description: 'Overnight shooting schedule',
    icon: '🌙',
    callTime: '18:00',
    shootCall: '19:00',
    lunchBreak: '00:00',
    wrapTime: '06:00',
    notes: 'Night shoot - ensure proper turnaround time',
  },
  {
    id: 'half-day',
    name: 'Half Day',
    description: '6-hour abbreviated schedule',
    icon: '⏱️',
    callTime: '08:00',
    shootCall: '09:00',
    wrapTime: '15:00',
    notes: 'Half day schedule - no meal break required',
  },
  {
    id: 'split-day',
    name: 'Split Day',
    description: 'Afternoon to late evening schedule',
    icon: '🌆',
    callTime: '12:00',
    shootCall: '13:00',
    lunchBreak: '18:00',
    wrapTime: '00:00',
    notes: 'Split day - afternoon to late evening',
  },
  {
    id: 'french-hours',
    name: 'French Hours',
    description: 'Continuous shoot with rolling breaks',
    icon: '🥐',
    callTime: '08:00',
    shootCall: '08:30',
    wrapTime: '18:00',
    notes: 'French hours - no official meal break, rolling catering',
  },
  {
    id: 'company-move',
    name: 'Company Move Day',
    description: 'Day with location change mid-shoot',
    icon: '🚛',
    callTime: '06:00',
    shootCall: '07:00',
    lunchBreak: '12:00',
    wrapTime: '18:00',
    notes: 'Company move scheduled - allow travel time',
  },
  {
    id: 'exterior-weather',
    name: 'Exterior Day (Weather Dependent)',
    description: 'Flexible schedule for weather-dependent exteriors',
    icon: '🌤️',
    callTime: '07:00',
    shootCall: 'Weather Call',
    wrapTime: '19:00',
    notes: 'Weather dependent - cover set ready, check forecast night before',
  },
];

interface ShootingDayTemplatesProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: ShootingDayTemplate) => void;
}

export function ShootingDayTemplates({
  isOpen,
  onClose,
  onApply,
}: ShootingDayTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  if (!isOpen) return null;

  const selected = SHOOTING_DAY_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Shooting Day Templates</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-text-secondary mb-6">
          Choose a template to pre-fill your shooting day with standard times and settings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {SHOOTING_DAY_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-default hover:border-accent-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{template.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-background-secondary rounded">
                      Call: {template.callTime}
                    </span>
                    <span className="text-xs px-2 py-1 bg-background-secondary rounded">
                      Shoot: {template.shootCall}
                    </span>
                    {template.wrapTime && (
                      <span className="text-xs px-2 py-1 bg-background-secondary rounded">
                        Wrap: {template.wrapTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Template Preview */}
        {selected && (
          <div className="mb-6 p-4 bg-background-secondary border border-border-default rounded-lg">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span>{selected.icon}</span>
              <span>{selected.name} - Schedule Preview</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-text-tertiary block">Call Time</span>
                <span className="text-text-primary font-medium">{selected.callTime}</span>
              </div>
              <div>
                <span className="text-text-tertiary block">Shoot Call</span>
                <span className="text-text-primary font-medium">{selected.shootCall}</span>
              </div>
              {selected.lunchBreak && (
                <div>
                  <span className="text-text-tertiary block">Lunch Break</span>
                  <span className="text-text-primary font-medium">{selected.lunchBreak}</span>
                </div>
              )}
              {selected.wrapTime && (
                <div>
                  <span className="text-text-tertiary block">Est. Wrap</span>
                  <span className="text-text-primary font-medium">{selected.wrapTime}</span>
                </div>
              )}
            </div>
            {selected.notes && (
              <p className="mt-3 text-sm text-text-secondary italic">{selected.notes}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selected) {
                onApply(selected);
                onClose();
              }
            }}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
}

// Export the templates for use elsewhere
export { SHOOTING_DAY_TEMPLATES };
export type { ShootingDayTemplate };
