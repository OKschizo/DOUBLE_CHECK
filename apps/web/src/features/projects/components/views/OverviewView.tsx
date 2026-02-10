'use client';

import type { Project } from '@/lib/schemas';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OverviewViewProps {
  project: Project;
  projectId: string;
  onNavigate?: (view: string) => void;
}

const statusConfig = {
  planning: { gradient: 'from-blue-500 to-cyan-500', icon: '📝', label: 'Planning' },
  'pre-production': { gradient: 'from-amber-500 to-yellow-500', icon: '⚙️', label: 'Pre-Prod' },
  production: { gradient: 'from-green-500 to-emerald-500', icon: '🎬', label: 'Production' },
  'post-production': { gradient: 'from-purple-500 to-pink-500', icon: '✂️', label: 'Post-Prod' },
  completed: { gradient: 'from-gray-500 to-slate-500', icon: '✓', label: 'Completed' },
  archived: { gradient: 'from-gray-700 to-gray-800', icon: '📦', label: 'Archived' },
};

export function OverviewView({ project, projectId, onNavigate }: OverviewViewProps) {
  const router = useRouter();
  const status = statusConfig[project.status] || statusConfig.planning;

  const handleEditDetails = () => {
    if (onNavigate) {
      onNavigate('admin');
      sessionStorage.setItem(`adminTab_${projectId}`, 'settings');
    }
  };

  const handleExportData = () => {
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
      sessionStorage.setItem(`adminTab_${projectId}`, 'team');
    }
  };

  const handleViewReports = () => {
    if (onNavigate) {
      onNavigate('analytics');
    }
  };

  const timelineDays = Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Project Header - Mobile Optimized */}
      <div className="card-elevated mb-4 md:mb-8 overflow-hidden">
        {/* Cover Image */}
        {project.coverImageUrl && (
          <div className="relative w-full h-40 md:h-64 overflow-hidden bg-background-secondary">
            <Image
              src={project.coverImageUrl}
              alt={project.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}
        
        <div className="p-4 md:p-6">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
            {/* Status icon - only show if no cover image */}
            {!project.coverImageUrl && (
              <div className={`hidden md:flex w-16 h-16 rounded-xl bg-gradient-to-br ${status.gradient} items-center justify-center text-3xl shadow-lg flex-shrink-0`}>
                {status.icon}
              </div>
            )}
            
            {/* Title & Status Row (Mobile) */}
            <div className="flex items-start justify-between gap-2 md:hidden">
              <h1 className="text-xl font-bold text-text-primary leading-tight flex-1">
                {project.title}
              </h1>
              <span className={`px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-br ${status.gradient} text-white whitespace-nowrap flex-shrink-0`}>
                {status.label}
              </span>
            </div>
            
            {/* Desktop Title */}
            <div className="hidden md:block flex-1">
              <h1 className="text-3xl font-bold mb-2 text-text-primary">
                {project.title}
              </h1>
              <p className="text-text-secondary mb-3">
                Client: <span className="text-text-primary font-medium">{project.client}</span>
              </p>
              {project.description && (
                <p className="text-text-secondary text-sm leading-relaxed">{project.description}</p>
              )}
            </div>
            
            {/* Desktop Status Badge */}
            <div className={`hidden md:flex px-4 py-2 rounded-xl font-semibold items-center gap-2 bg-gradient-to-br ${status.gradient} text-white shadow-lg`}>
              <span>{status.icon}</span>
              <span className="capitalize">{project.status.replace('-', ' ')}</span>
            </div>
          </div>
          
          {/* Mobile: Client & Description below title */}
          <div className="md:hidden mt-2">
            <p className="text-text-secondary text-sm">
              Client: <span className="text-text-primary font-medium">{project.client}</span>
            </p>
            {project.description && (
              <p className="text-text-secondary text-sm mt-2 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats - Horizontal scroll on mobile, grid on desktop */}
      <div className="mb-4 md:mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible scrollbar-hide">
          {/* Timeline */}
          <div className="card-elevated p-3 md:p-4 flex-shrink-0 min-w-[140px] md:min-w-0">
            <div className="text-text-tertiary text-xs font-medium mb-1">Timeline</div>
            <div className="text-lg md:text-xl font-bold text-text-primary">{timelineDays} days</div>
            <div className="text-text-secondary text-xs truncate">
              {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Budget */}
          {project.budget && (
            <div className="card-elevated p-3 md:p-4 flex-shrink-0 min-w-[140px] md:min-w-0">
              <div className="text-text-tertiary text-xs font-medium mb-1">Budget</div>
              <div className="text-lg md:text-xl font-bold text-text-primary">${project.budget.toLocaleString()}</div>
              <div className="text-text-secondary text-xs">Total allocated</div>
            </div>
          )}

          {/* Updated */}
          <div className="card-elevated p-3 md:p-4 flex-shrink-0 min-w-[140px] md:min-w-0">
            <div className="text-text-tertiary text-xs font-medium mb-1">Updated</div>
            <div className="text-lg md:text-xl font-bold text-text-primary">
              {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-text-secondary text-xs">
              {new Date(project.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - 2x2 grid on mobile */}
      <div className="card-elevated p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <button 
            onClick={handleEditDetails}
            className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-lg border border-border-default hover:bg-background-secondary transition-colors text-sm"
          >
            <span>📝</span>
            <span className="text-text-primary">Edit</span>
          </button>
          <button 
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-lg border border-border-default hover:bg-background-secondary transition-colors text-sm"
          >
            <span>📤</span>
            <span className="text-text-primary">Export</span>
          </button>
          <button 
            onClick={handleInviteTeam}
            className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-lg border border-border-default hover:bg-background-secondary transition-colors text-sm"
          >
            <span>👥</span>
            <span className="text-text-primary">Team</span>
          </button>
          <button 
            onClick={handleViewReports}
            className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-lg border border-border-default hover:bg-background-secondary transition-colors text-sm"
          >
            <span>📊</span>
            <span className="text-text-primary">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}

