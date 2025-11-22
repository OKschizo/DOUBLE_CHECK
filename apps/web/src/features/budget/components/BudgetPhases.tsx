'use client';

import type { BudgetPhase } from '@doublecheck/schemas';

interface BudgetPhasesProps {
  selectedPhase: BudgetPhase | 'all';
  onPhaseChange: (phase: BudgetPhase | 'all') => void;
}

const phases: Array<{ value: BudgetPhase | 'all'; label: string }> = [
  { value: 'all', label: 'All Phases' },
  { value: 'pre-production', label: 'Pre-Production' },
  { value: 'production', label: 'Production' },
  { value: 'post-production', label: 'Post-Production' },
  { value: 'wrap', label: 'Wrap' },
  { value: 'other', label: 'Other' },
];

export function BudgetPhases({ selectedPhase, onPhaseChange }: BudgetPhasesProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {phases.map((phase) => (
        <button
          key={phase.value}
          onClick={() => onPhaseChange(phase.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedPhase === phase.value
              ? 'bg-accent-primary'
              : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
          }`}
          style={selectedPhase === phase.value ? { color: 'rgb(var(--colored-button-text))' } : undefined}
        >
          {phase.label}
        </button>
      ))}
    </div>
  );
}

