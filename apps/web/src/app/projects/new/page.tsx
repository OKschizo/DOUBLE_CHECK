'use client';

import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning' as const,
    budget: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.client || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const project = await createProject.mutateAsync({
        title: formData.title,
        client: formData.client,
        description: formData.description || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      });

      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      console.error('Create project error:', err);
      setError(err.message || 'Failed to create project');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-text-tertiary mb-4">
              <Link href="/dashboard" className="hover:text-accent-primary transition-colors">
                Dashboard
              </Link>
              <span>›</span>
              <span className="text-text-primary font-medium">New Project</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-text-primary">
              Create New Project
            </h1>
            <p className="text-text-secondary text-lg">
              Start a new film production and bring your vision to life
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card card-elevated p-8 rounded-2xl space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2 text-text-secondary">
                  Project Title <span className="text-error">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Space Ranger"
                  required
                />
              </div>

              {/* Client */}
              <div>
                <label htmlFor="client" className="block text-sm font-medium mb-2 text-text-secondary">
                  Client / Production Company <span className="text-error">*</span>
                </label>
                <input
                  id="client"
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Sypher Studios"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2 text-text-secondary">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Brief description of the project, its goals, and key details..."
                  rows={4}
                />
              </div>

              {/* Dates and Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium mb-2 text-text-secondary">
                    Start Date <span className="text-error">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium mb-2 text-text-secondary">
                    End Date <span className="text-error">*</span>
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-2 text-text-secondary">
                    Initial Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="planning">📝 Planning</option>
                    <option value="pre-production">⚙️ Pre-Production</option>
                    <option value="production">🎬 Production</option>
                    <option value="post-production">✂️ Post-Production</option>
                    <option value="completed">✓ Completed</option>
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="budget" className="block text-sm font-medium mb-2 text-text-secondary">
                  Budget (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                  <input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="input-field pl-8"
                    placeholder="500,000"
                    min="0"
                    step="1000"
                  />
                </div>
                <p className="mt-2 text-xs text-text-tertiary">
                  Optional: Set a budget for tracking expenses
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-error mb-1">Error Creating Project</h4>
                  <p className="text-sm text-text-secondary">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createProject.isPending}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createProject.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Project'
                )}
              </button>
              <Link href="/dashboard" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
