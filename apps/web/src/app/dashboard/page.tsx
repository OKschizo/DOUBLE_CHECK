'use client';

import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProjects, usePendingInvites, useAcceptInvite, useDeclineInvite } from '@/features/projects/hooks/useProjects';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { CloneDemoButton } from '@/features/projects/components/CloneDemoButton';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { firebaseUser, user } = useAuth();
  const { data: projects, isLoading, error } = useProjects();
  const { data: pendingInvites } = usePendingInvites();
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();
  const router = useRouter();
  
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);

  const handleAcceptInvite = async (inviteId: string, projectId: string) => {
    setProcessingInvite(inviteId);
    try {
      await acceptInvite.mutateAsync(inviteId);
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('Failed to accept invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setProcessingInvite(inviteId);
    try {
      await declineInvite.mutateAsync(inviteId);
    } catch (error) {
      console.error('Error declining invite:', error);
      alert('Failed to decline invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const stats = useMemo(() => {
    if (!projects) return { total: 0, production: 0, preProduction: 0, completed: 0, invited: 0 };

    return {
      total: projects.length,
      production: projects.filter((p) => p.status === 'production').length,
      preProduction: projects.filter((p) => p.status === 'pre-production').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      invited: projects.filter((p: any) => p.isInvited).length,
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
          {pendingInvites && pendingInvites.length > 0 && (
            <div className="card-elevated p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Project Invitations</h3>
                  <p className="text-text-secondary text-sm">You&apos;ve been invited to collaborate</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {pendingInvites.map((invite: any) => (
                  <div key={invite.id} className="flex items-center justify-between bg-background-secondary/50 rounded-lg p-4">
                    <div>
                      <p className="font-medium">{invite.project?.name || 'Untitled Project'}</p>
                      <p className="text-sm text-text-secondary">
                        Role: <span className="capitalize text-blue-400">{invite.role}</span>
                        {invite.invitedByName && ` • Invited by ${invite.invitedByName}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeclineInvite(invite.id)}
                        disabled={processingInvite === invite.id}
                        className="px-3 py-1.5 text-sm rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptInvite(invite.id, invite.projectId)}
                        disabled={processingInvite === invite.id}
                        className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {processingInvite === invite.id ? 'Processing...' : 'Accept'}
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
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your Projects</h2>
                <p className="text-text-secondary">
                  Manage and track your film productions
                  {stats.invited > 0 && (
                    <span className="ml-2 text-blue-400">
                      ({stats.invited} invited)
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <CloneDemoButton />
                <Link
                  href="/projects/new"
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="text-xl">+</span>
                  New Project
                </Link>
              </div>
            </div>

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
                  Get started by creating your first project or try our fully-featured demo
                </p>
                <p className="text-text-muted text-sm mb-4">
                  Use the buttons above to create a project or get the Nike demo
                </p>
              </div>
            )}

            {projects && projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: any) => (
                  <div key={project.id} className="relative">
                    {project.isInvited && (
                      <div className="absolute -top-2 -right-2 z-10 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        Invited
                      </div>
                    )}
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
