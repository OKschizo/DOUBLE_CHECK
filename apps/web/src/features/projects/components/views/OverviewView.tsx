'use client';

import type { Project } from '@doublecheck/schemas';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OverviewViewProps {
  project: Project;
  projectId: string;
  onNavigate?: (view: string) => void;
}

const statusConfig = {
  planning: { gradient: 'from-blue-500 to-cyan-500', icon: '📝' },
  'pre-production': { gradient: 'from-amber-500 to-yellow-500', icon: '⚙️' },
  production: { gradient: 'from-green-500 to-emerald-500', icon: '🎬' },
  'post-production': { gradient: 'from-purple-500 to-pink-500', icon: '✂️' },
  completed: { gradient: 'from-gray-500 to-slate-500', icon: '✓' },
  archived: { gradient: 'from-gray-700 to-gray-800', icon: '📦' },
};

export function OverviewView({ project, projectId, onNavigate }: OverviewViewProps) {
  const router = useRouter();
  const status = statusConfig[project.status] || statusConfig.planning;

  const handleEditDetails = () => {
    if (onNavigate) {
      onNavigate('admin');
      // Store the desired tab in sessionStorage so AdminView can read it
      sessionStorage.setItem(`adminTab_${projectId}`, 'settings');
    }
  };

  const handleExportData = () => {
    // Export project data as JSON
    const exportData = {
      project: {
        title: project.title,
        client: project.client,
        description: project.description,
        status: project.status,
        budget: project.budget,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInviteTeam = () => {
    if (onNavigate) {
      onNavigate('admin');
      // Store the desired tab in sessionStorage so AdminView can read it
      sessionStorage.setItem(`adminTab_${projectId}`, 'team');
    }
  };

  const handleViewReports = () => {
    if (onNavigate) {
      onNavigate('analytics');
    }
  };

  return (
    <div className="p-8">
      {/* Project Header */}
      <div className="card-elevated mb-8 overflow-hidden relative">
        {/* Project Image */}
        {project.coverImageUrl && (
          <div className="relative w-full h-64 overflow-hidden bg-background-secondary">
            <Image
              src={project.coverImageUrl}
              alt={project.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex items-start gap-6 relative">
            {!project.coverImageUrl && (
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${status.gradient} flex items-center justify-center text-4xl shadow-xl flex-shrink-0`}>
                {status.icon}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-text-primary">
                {project.title}
              </h1>
              <p className="text-text-secondary text-lg mb-4">
                Client: <span className="text-text-primary font-medium">{project.client}</span>
              </p>
              {project.description && (
                <p className="text-text-secondary leading-relaxed">{project.description}</p>
              )}
            </div>
            <div className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 bg-gradient-to-br ${status.gradient} text-white shadow-lg`}>
              <span>{status.icon}</span>
              <span className="capitalize">{project.status.replace('-', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-elevated p-6">
          <div className="text-text-tertiary text-sm font-medium mb-2">Timeline</div>
          <div className="text-2xl font-bold mb-1">
            {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
          </div>
          <div className="text-text-secondary text-sm">
            {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
          </div>
        </div>

        {project.budget && (
          <div className="card-elevated p-6">
            <div className="text-text-tertiary text-sm font-medium mb-2">Budget</div>
            <div className="text-2xl font-bold mb-1">${project.budget.toLocaleString()}</div>
            <div className="text-text-secondary text-sm">Total allocated</div>
          </div>
        )}

        <div className="card-elevated p-6">
          <div className="text-text-tertiary text-sm font-medium mb-2">Last Updated</div>
          <div className="text-2xl font-bold mb-1">
            {new Date(project.updatedAt).toLocaleDateString()}
          </div>
          <div className="text-text-secondary text-sm">
            {new Date(project.updatedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-elevated p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleEditDetails}
            className="btn-secondary justify-center hover:bg-accent-primary/10 transition-colors"
          >
            <span className="mr-2">📝</span>
            Edit Details
          </button>
          <button 
            onClick={handleExportData}
            className="btn-secondary justify-center hover:bg-accent-primary/10 transition-colors"
          >
            <span className="mr-2">📤</span>
            Export Data
          </button>
          <button 
            onClick={handleInviteTeam}
            className="btn-secondary justify-center hover:bg-accent-primary/10 transition-colors"
          >
            <span className="mr-2">👥</span>
            Invite Team
          </button>
          <button 
            onClick={handleViewReports}
            className="btn-secondary justify-center hover:bg-accent-primary/10 transition-colors"
          >
            <span className="mr-2">📊</span>
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}

