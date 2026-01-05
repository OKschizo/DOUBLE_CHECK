import { useState } from 'react';
import { useBudgetFringes } from '../hooks/useBudgetFringes';

interface FringesCalculatorProps {
  projectId: string;
}

export function FringesCalculator({ projectId }: FringesCalculatorProps) {
  // Placeholder component
  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800">
      <h3 className="font-medium mb-4">Fringes & Taxes</h3>
      <div className="text-sm text-text-secondary">
        Fringes calculation is being migrated to client-side.
      </div>
    </div>
  );
}
