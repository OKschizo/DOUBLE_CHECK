'use client';

import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function DashboardPage() {
  const { firebaseUser, user } = useAuth();
  const { data: projects, isLoading, error } = useProjects();
  const { data: templates = [] } = trpc.projects.listTemplates.useQuery();
  const { data: pendingInvites = [], refetch: refetchInvites } = trpc.projectMembers.getPendingInvites.useQuery();
  const utils = trpc.useUtils();

  const acceptInvite = trpc.projectMembers.acceptInvite.useMutation({
    onSuccess: () => {
      refetchInvites();
      utils.projects.list.invalidate();
    },
  });

  const createFromTemplate = trpc.projects.createFromTemplate.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      setShowTemplateModal(false);
      setSelectedTemplate(null);
    },
  });

  const seedTemplate = trpc.projects.seedTemplate.useMutation({
    onSuccess: () => {
      utils.projects.listTemplates.invalidate();
      // Show success message for 2 seconds before closing
      setTimeout(() => {
        setShowSeedProgress(false);
      }, 2000);
    },
    onError: () => {
      setShowSeedProgress(false);
    },
  });

  const [showSeedProgress, setShowSeedProgress] = useState(false);

  const deleteTemplate = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.listTemplates.invalidate();
    },
  });

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState(new Date().toISOString().split('T')[0]);

  const stats = useMemo(() => {
    if (!projects) return { total: 0, production: 0, preProduction: 0, completed: 0 };

    return {
      total: projects.length,
      production: projects.filter((p) => p.status === 'production').length,
      preProduction: projects.filter((p) => p.status === 'pre-production').length,
      completed: projects.filter((p) => p.status === 'completed').length,
    };
  }, [projects]);

  const statCards = [
    { 
      label: 'Total Projects', 
      value: stats.total, 
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      label: 'In Production', 
      value: stats.production, 
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      label: 'Pre-Production', 
      value: stats.preProduction, 
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      icon: (
        <svg className="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2 text-text-primary">
              Welcome back, {user?.displayName || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-text-secondary text-lg">
              Here&apos;s what&apos;s happening with your projects
            </p>
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="card-elevated p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Pending Invitations ({pendingInvites.length})
                  </h2>
                  <p className="text-text-secondary text-sm mt-1">
                    You&apos;ve been invited to join the following projects
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {pendingInvites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="bg-background-secondary border border-border-default rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">
                        {invite.projectTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <span>Role:</span>
                          <span className="font-medium text-text-primary capitalize">
                            {invite.role === 'dept_head' ? 'Department Head' : invite.role}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          Invited {new Date(invite.invitedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (confirm(`Accept invitation to ${invite.projectTitle}?`)) {
                            acceptInvite.mutate({ inviteId: invite.id });
                          }
                        }}
                        disabled={acceptInvite.isPending}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {acceptInvite.isPending ? 'Accepting...' : '✓ Accept'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="card-elevated p-6 hover:scale-105 transition-transform duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center border border-border-default">
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-4xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Projects Section */}
          <div className="card-elevated p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your Projects</h2>
                <p className="text-text-secondary">Manage and track your film productions</p>
              </div>
              <button
                onClick={() => {
                  setShowSeedProgress(true);
                  seedTemplate.mutate();
                }}
                disabled={seedTemplate.isPending}
                className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                style={{ color: 'rgb(var(--colored-button-text))' }}
              >
                {seedTemplate.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load Template
                  </>
                )}
              </button>
              <Link
                href="/projects/new"
                className="btn-primary flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                New Project
              </Link>
            </div>

            {/* Templates Section */}
            {templates.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg font-semibold mb-4 text-text-secondary uppercase tracking-wider">Start from a Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className="bg-background-secondary border border-border-default rounded-xl overflow-hidden hover:border-accent-primary transition-all group relative"
                    >
                      {/* Delete Template Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete the template "${template.title}"?`)) {
                            deleteTemplate.mutate({ id: template.id });
                          }
                        }}
                        className="absolute top-3 left-3 z-20 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Delete Template"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div 
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setNewProjectTitle(`${template.title} (Copy)`);
                          setShowTemplateModal(true);
                        }}
                      >
                        <div className="h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative">
                          {template.coverImageUrl ? (
                            <img src={template.coverImageUrl} alt={template.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-4xl">
                              📝
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-accent-primary text-white text-xs font-bold px-2 py-1 rounded shadow">
                            TEMPLATE
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="font-bold text-lg text-text-primary mb-1 group-hover:text-accent-primary transition-colors">
                            {template.title}
                          </h4>
                          <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                            {template.description || 'No description available.'}
                          </p>
                          <button className="w-full py-2 bg-background-tertiary hover:bg-accent-primary hover:text-white text-text-primary rounded-lg transition-colors text-sm font-medium">
                            Use Template
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
                </div>
                <p className="text-text-secondary">Loading projects...</p>
              </div>
            )}

            {error && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-error flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-error mb-1">Error Loading Projects</h3>
                    <p className="text-text-secondary text-sm">{error.message}</p>
                  </div>
                </div>
              </div>
            )}

            {projects && projects.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  Get started by creating your first project and bring your film production to life
                </p>
                <Link
                  href="/projects/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Create Your First Project
                </Link>
              </div>
            )}

            {projects && projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project as any} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Seed Template Progress Modal */}
      {showSeedProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border-default rounded-lg w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">Loading Template</h3>
              {!seedTemplate.isPending && (
                <button
                  onClick={() => setShowSeedProgress(false)}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-text-secondary mb-6">
              Creating the Nike - Air Max Launch template project with comprehensive production data... This can take up to 1 minute.
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-background-tertiary rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out relative ${
                  seedTemplate.isError ? 'bg-error' : 'bg-accent-primary'
                }`}
                style={{
                  width: seedTemplate.isPending ? '100%' : seedTemplate.isSuccess || seedTemplate.isError ? '100%' : '0%',
                }}
              >
                {seedTemplate.isPending && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {seedTemplate.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary"></div>
                  <span>
                    Creating project, crew, cast, locations, equipment, scenes, shots, schedule, and budget...
                  </span>
                </>
              ) : seedTemplate.isError ? (
                <>
                  <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-error">Failed to load template. Please try again.</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Template loaded successfully!</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border-default rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Create from Template</h3>
            <p className="text-text-secondary mb-6">
              You are creating a new project based on <span className="font-semibold text-accent-primary">{selectedTemplate.title}</span>.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                  placeholder="Enter project title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newProjectStartDate}
                  onChange={(e) => setNewProjectStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  All schedule dates will be shifted relative to this start date.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  createFromTemplate.mutate({
                    templateId: selectedTemplate.id,
                    title: newProjectTitle,
                    client: selectedTemplate.client, // Inherit client or make editable
                    startDate: new Date(newProjectStartDate),
                  });
                }}
                disabled={createFromTemplate.isPending || !newProjectTitle}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createFromTemplate.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
