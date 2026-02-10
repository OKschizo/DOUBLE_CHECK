'use client';

import { useState, useRef } from 'react';
import { useExpenses } from '@/features/budget/hooks/useExpenses';
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from '@/lib/schemas';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

interface ExpenseModalProps {
  projectId: string;
  expense?: Expense;
  budgetItemId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExpenseModal({ projectId, expense, budgetItemId, onClose, onSuccess }: ExpenseModalProps) {
  const { createExpense, updateExpense } = useExpenses(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<CreateExpenseInput>>({
    projectId,
    budgetItemId,
    description: expense?.description || '',
    amount: expense?.amount || 0,
    category: expense?.category || 'other',
    status: expense?.status || 'pending',
    transactionDate: expense?.transactionDate || new Date(),
    vendor: expense?.vendor || '',
    notes: expense?.notes || '',
    receiptUrl: expense?.receiptUrl,
    receiptFileName: expense?.receiptFileName,
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `expenses/${projectId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setFormData({
        ...formData,
        receiptUrl: downloadURL,
        receiptFileName: file.name,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        if (expense) {
          await updateExpense.mutateAsync({
            id: expense.id,
            data: formData as UpdateExpenseInput,
          });
        } else {
          await createExpense.mutateAsync(formData as CreateExpenseInput);
        }
        onSuccess?.();
        onClose();
    } catch (e) {
        console.error(e);
        alert("Failed to save expense");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              >
                <option value="labor">Labor</option>
                <option value="equipment">Equipment</option>
                <option value="location">Location</option>
                <option value="transportation">Transportation</option>
                <option value="catering">Catering</option>
                <option value="post_production">Post-Production</option>
                <option value="insurance">Insurance</option>
                <option value="permits">Permits</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Transaction Date *</label>
              <input
                type="date"
                value={formData.transactionDate ? new Date(formData.transactionDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, transactionDate: new Date(e.target.value) })}
                className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="reimbursed">Reimbursed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vendor/Payee</label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Receipt</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-background-secondary border border-border-default rounded hover:bg-background-tertiary transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload Receipt'}
              </button>
              {formData.receiptFileName && (
                <span className="text-sm text-text-secondary">{formData.receiptFileName}</span>
              )}
            </div>
            {formData.receiptUrl && (
              <a
                href={formData.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-primary hover:underline mt-1 block"
              >
                View Receipt
              </a>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background-secondary border border-border-default rounded hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium"
              style={{ color: 'rgb(var(--colored-button-text))' }}
            >
              {isSaving ? 'Saving...' : expense ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

