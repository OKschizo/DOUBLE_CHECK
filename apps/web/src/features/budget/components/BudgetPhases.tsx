'use client';

import type { BudgetPhase } from '@/lib/schemas';

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
    <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
      {phases.map((phase) => (
        <button
          key={phase.value}
          onClick={() => onPhaseChange(phase.value)}
          className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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

