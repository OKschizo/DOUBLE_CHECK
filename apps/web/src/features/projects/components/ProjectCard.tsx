import type { Project } from '@/lib/schemas';
import Link from 'next/link';
import Image from 'next/image';
import { useDeleteProject } from '../hooks/useProjects';

interface ProjectCardProps {
  project: Project | Omit<Project, 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
    createdAt: Date | string;
    updatedAt: Date | string;
    startDate: Date | string;
    endDate: Date | string;
  };
  onDelete?: () => void;
}

const statusConfig = {
  planning: { 
    color: 'from-blue-500 to-cyan-500', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: '📝'
  },
  'pre-production': { 
    color: 'from-amber-500 to-yellow-500', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: '⚙️'
  },
  production: { 
    color: 'from-green-500 to-emerald-500', 
    bg: 'bg-green-500/10', 
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: '🎬'
  },
  'post-production': { 
    color: 'from-purple-500 to-pink-500', 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    icon: '✂️'
  },
  completed: { 
    color: 'from-gray-500 to-slate-500', 
    bg: 'bg-gray-500/10', 
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    icon: '✓'
  },
  archived: { 
    color: 'from-gray-700 to-gray-800', 
    bg: 'bg-gray-700/10', 
    border: 'border-gray-700/30',
    text: 'text-gray-500',
    icon: '📦'
  },
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.planning;
  const { mutateAsync: deleteProject } = useDeleteProject();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Attempting to delete project:', {
      id: project.id,
      title: project.title,
      orgId: (project as any).orgId,
      isPublic: (project as any).isPublic,
      isClonedDemo: (project as any).isClonedDemo,
    });
    
    if (confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
      try {
        await deleteProject({ id: project.id });
        if (onDelete) onDelete();
      } catch (error: any) {
        console.error("Failed to delete project:", error);
        alert(`Failed to delete project: ${error.message || 'Unknown error'}\n\nCheck console for details.`);
      }
    }
  };
  
  const isClonedDemo = (project as any).isClonedDemo;
  const isPublicDemo = (project as any).isPublic;

  return (
    <div className="group block h-full relative">
      <div className="card-elevated h-full hover:border-accent-primary hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
        {/* Demo Badge - Show for cloned demo projects */}
        {isClonedDemo && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
            <span>✨</span>
            <span>DEMO</span>
          </div>
        )}

        {/* Delete Button - Show for user's projects (but not public template demo) */}
        {!isPublicDemo && (
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Delete Project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {/* Gradient accent bar */}
        <div className={`h-1.5 bg-gradient-to-r ${status.color}`} />
        
        {/* Project Image */}
        {project.coverImageUrl && (
          <div className="relative w-full h-48 overflow-hidden bg-background-secondary">
            <Image
              src={project.coverImageUrl}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        <div className="p-6 flex flex-col flex-grow">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-1 truncate group-hover:text-accent-primary transition-colors">
                {project.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary text-sm truncate">
                  {project.client}
                </span>
              </div>
            </div>
            <div className={`ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${status.bg} ${status.border} border ${status.text}`}>
              <span>{status.icon}</span>
              <span className="capitalize">{project.status.replace('-', ' ')}</span>
            </div>
          </div>
          
          {/* Description */}
          {project.description && (
            <p className="text-text-secondary text-sm mb-4 line-clamp-2 flex-grow">
              {project.description}
            </p>
          )}
          
          {/* Divider */}
          <div className="h-px bg-border-subtle mb-4" />
          
          {/* Footer */}
          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-tertiary">
                <span className="text-base">📅</span>
                <span>{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {project.budget && (
                <div className="flex items-center gap-2 text-text-tertiary">
                  <span className="text-base">💰</span>
                  <span className="font-semibold">${(project.budget / 1000).toFixed(0)}k</span>
                </div>
              )}
            </div>
            
            {/* Footer with updated date and Open Project button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-muted">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </span>
              <Link
                href={`/projects/${project.id}`}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform"
              >
                Open Project
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
