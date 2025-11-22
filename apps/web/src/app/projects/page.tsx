'use client';

import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import Link from 'next/link';

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Projects</h1>
              <p className="text-text-secondary">Manage your film production projects</p>
            </div>
            <Link
              href="/projects/new"
              className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
            >
              + New Project
            </Link>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent-primary border-r-transparent"></div>
              <p className="mt-4 text-text-secondary">Loading projects...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
              Error loading projects: {error.message}
            </div>
          )}

          {projects && projects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-text-secondary mb-6">
                Get started by creating your first project
              </p>
              <Link
                href="/projects/new"
                className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
              >
                Create Your First Project
              </Link>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

