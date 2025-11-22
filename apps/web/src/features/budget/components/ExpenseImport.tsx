'use client';

import { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import type { ExpenseImportRow } from '@doublecheck/schemas';

interface ExpenseImportProps {
  projectId: string;
  onClose: () => void;
}

export function ExpenseImport({ projectId, onClose }: ExpenseImportProps) {
  const { importExpenses } = useExpenses(projectId);
  const [csvData, setCsvData] = useState('');
  const [parsedExpenses, setParsedExpenses] = useState<ExpenseImportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (csv: string): ExpenseImportRow[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['date', 'description', 'amount'];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`CSV must include "${required}" column`);
      }
    }

    const expenses: ExpenseImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      if (!row.date || !row.description || !row.amount) {
        continue; // Skip incomplete rows
      }

      expenses.push({
        date: row.date,
        description: row.description,
        amount: parseFloat(row.amount) || 0,
        vendor: row.vendor || undefined,
        category: row.category || undefined,
        budgetItem: row.budgetitem || row['budget item'] || undefined,
      });
    }

    return expenses;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      try {
        const parsed = parseCSV(text);
        setParsedExpenses(parsed);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setParsedExpenses([]);
      }
    };
    reader.readAsText(file);
  };

  const handleManualInput = () => {
    try {
      const parsed = parseCSV(csvData);
      setParsedExpenses(parsed);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setParsedExpenses([]);
    }
  };

  const handleImport = async () => {
    if (parsedExpenses.length === 0) {
      setError('No expenses to import');
      return;
    }

    try {
      await importExpenses.mutateAsync({
        projectId,
        expenses: parsedExpenses,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import expenses');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Import Expenses</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded"
            />
            <p className="text-xs text-text-secondary mt-1">
              CSV must include: date, description, amount (optional: vendor, category, budgetItem)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Or Paste CSV Data</label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded font-mono text-sm"
              placeholder="date,description,amount,vendor,category&#10;2024-01-15,Camera Rental,5000,ABC Rentals,equipment"
            />
            <button
              onClick={handleManualInput}
              className="mt-2 px-4 py-2 bg-background-secondary border border-border-default rounded hover:bg-background-tertiary transition-colors text-sm"
            >
              Parse CSV
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {parsedExpenses.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Found {parsedExpenses.length} expenses to import
              </h3>
              <div className="max-h-64 overflow-y-auto border border-border-default rounded">
                <table className="w-full text-sm">
                  <thead className="bg-background-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Vendor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedExpenses.slice(0, 10).map((expense, idx) => (
                      <tr key={idx} className="border-t border-border-default">
                        <td className="px-3 py-2">{expense.date}</td>
                        <td className="px-3 py-2">{expense.description}</td>
                        <td className="px-3 py-2 text-right">${expense.amount.toLocaleString()}</td>
                        <td className="px-3 py-2">{expense.vendor || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedExpenses.length > 10 && (
                  <div className="px-3 py-2 text-sm text-text-secondary text-center">
                    ... and {parsedExpenses.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-background-secondary border border-border-default rounded hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={parsedExpenses.length === 0 || importExpenses.isPending}
              className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium"
              style={{ color: 'rgb(var(--colored-button-text))' }}
            >
              {importExpenses.isPending ? 'Importing...' : `Import ${parsedExpenses.length} Expenses`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

