'use client';

import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/projects/hooks/useProjects';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Import view components
import { OverviewView } from '@/features/projects/components/views/OverviewView';
import { CastView } from '@/features/projects/components/views/CastView';
import { CrewView } from '@/features/projects/components/views/CrewView';
import { EquipmentView } from '@/features/projects/components/views/EquipmentView';
import { ScheduleView } from '@/features/projects/components/views/ScheduleView';
import { BudgetView } from '@/features/projects/components/views/BudgetView';
import { AdminView } from '@/features/projects/components/views/AdminView';
import { CallSheetsView } from '@/features/projects/components/views/CallSheetsView';
import { LocationsView } from '@/features/projects/components/views/LocationsView';
import { ScenesView } from '@/features/projects/components/views/ScenesView';
import { IntegrationsView } from '@/features/integrations/components/IntegrationsView';
import { StoryboardView } from '@/features/projects/components/views/StoryboardView';
import { getCastLabel, getProjectTerminology } from '@/shared/utils/projectTerminology';

const navigationIcons = {
  overview: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  scenes: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  storyboards: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  schedule: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  cast: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  crew: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  equipment: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  locations: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  documents: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  budget: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  callsheets: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  analytics: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  admin: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  integrations: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

const navigationSections = [
  {
    title: 'PLANNING',
    items: [
      { id: 'overview', name: 'Overview', icon: navigationIcons.overview },
      { id: 'scenes', name: 'Scenes & Shots', icon: navigationIcons.scenes },
      { id: 'storyboards', name: 'Storyboards', icon: navigationIcons.storyboards },
    ],
  },
  {
    title: 'PRODUCTION',
    items: [
      { id: 'schedule', name: 'Schedule', icon: navigationIcons.schedule },
      { id: 'cast', name: 'Cast', icon: navigationIcons.cast }, // Will be dynamically updated
      { id: 'crew', name: 'Crew', icon: navigationIcons.crew },
      { id: 'equipment', name: 'Equipment', icon: navigationIcons.equipment },
      { id: 'locations', name: 'Locations', icon: navigationIcons.locations },
    ],
  },
  {
    title: 'POST-PRODUCTION',
    items: [
      { id: 'documents', name: 'Documents', icon: navigationIcons.documents },
      { id: 'budget', name: 'Budget', icon: navigationIcons.budget },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { id: 'callsheets', name: 'Call Sheets', icon: navigationIcons.callsheets },
      { id: 'analytics', name: 'Analytics', icon: navigationIcons.analytics },
    ],
  },
  {
    title: 'INTEGRATIONS',
    items: [
      { id: 'integrations', name: 'Integrations', icon: navigationIcons.integrations },
    ],
  },
];

export default function ProjectClient() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [activeView, setActiveView] = useState('overview');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Handle view change - close mobile sidebar when view changes
  const handleViewChange = useCallback((viewId: string) => {
    setActiveView(viewId);
    setShowMobileSidebar(false);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (showMobileSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileSidebar]);

  // Read view from URL hash on mount and handle element selection
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.slice(1); // Remove #
        if (hash) {
          // Check if hash contains element ID (format: view?id=elementId)
          const [view, query] = hash.split('?');
          const params = new URLSearchParams(query || '');
          const elementId = params.get('id');
          
          // Check if view is valid
          if (view && navigationSections.some(section => 
            section.items.some(item => item.id === view)
          )) {
            setActiveView(view);
            
            // Scroll to element if ID is provided
            if (elementId) {
              setTimeout(() => {
                const element = document.getElementById(`element-${elementId}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Highlight the element temporarily
                  element.classList.add('ring-2', 'ring-accent-primary', 'bg-accent-primary/10');
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-accent-primary', 'bg-accent-primary/10');
                  }, 2000);
                }
              }, 500);
            }
          }
        }
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const { data: project, isLoading, error } = useProject(projectId);
  // Use simple project membership check for now, refine later
  const userRole = 'owner'; // Placeholder until projectMembers refactor
  const isRoleLoading = false;

  // Redirect if user doesn't have access
  useEffect(() => {
    if (!isLoading && !project) {
      router.push('/dashboard');
    }
  }, [project, isLoading, router]);

  if (isLoading || isRoleLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-full">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-16">
            <p className="text-text-secondary">Project not found</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Render the active view component
  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView project={project as any} projectId={projectId} onNavigate={setActiveView} />;
      case 'scenes':
        return <ScenesView projectId={projectId} />;
      case 'storyboards':
        return <StoryboardView projectId={projectId} />;
      case 'cast':
        return <CastView projectId={projectId} />;
      case 'crew':
        return <CrewView projectId={projectId} />;
      case 'equipment':
        return <EquipmentView projectId={projectId} />;
      case 'schedule':
        return <ScheduleView projectId={projectId} />;
      case 'budget':
        return <BudgetView projectId={projectId} />;
      case 'locations':
        return <LocationsView projectId={projectId} />;
      case 'integrations':
        return <IntegrationsView projectId={projectId} />;
      case 'admin':
        return <AdminView projectId={projectId} userRole={userRole} />;
      case 'callsheets':
        return <CallSheetsView projectId={projectId} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
              <p className="text-text-secondary">This module is under development</p>
            </div>
          </div>
        );
    }
  };

  // Sidebar content - shared between desktop and mobile
  const sidebarContent = (
    <div className="p-4">
      {/* Project Header */}
      <div className="mb-6 pb-4 border-b border-border-subtle">
        <Link href="/dashboard" className="text-xs text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1 mb-3">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="text-xs font-semibold text-text-tertiary mb-1 uppercase tracking-wider">
          Project
        </div>
        <div className="text-sm font-bold text-text-primary truncate" title={project.title}>
          {project.title}
        </div>
        <div className="text-xs text-text-tertiary mt-1">{project.client}</div>
      </div>

      {/* Navigation Sections */}
      <nav className="space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <div className="text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                // Dynamically update cast label based on project type
                const displayName = item.id === 'cast' 
                  ? getCastLabel(project?.projectType)
                  : item.id === 'scenes'
                  ? getProjectTerminology(project?.projectType).scenes.label
                  : item.name;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeView === item.id
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                    }`}
                  >
                    {item.icon}
                    <span>{displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings & Admin */}
      <div className="mt-6 pt-6 border-t border-border-subtle">
        <div className="text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">
          SETTINGS
        </div>
        <div className="space-y-1">
          {/* Admin Button - Visible to owner/admin/dept_head */}
          {(userRole === 'owner' || userRole === 'admin' || userRole === 'dept_head') && (
            <button
              onClick={() => handleViewChange('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === 'admin'
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
              }`}
            >
              {navigationIcons.admin}
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout fullWidth={true}>
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Mobile Sidebar Toggle Button - Fixed at bottom */}
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden fixed bottom-4 left-4 z-30 w-14 h-14 bg-accent-primary rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            style={{ color: 'rgb(var(--colored-button-text))' }}
            aria-label="Open navigation"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile Sidebar Overlay */}
          {showMobileSidebar && (
            <div className="fixed inset-0 z-40 md:hidden">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowMobileSidebar(false)}
              />
              
              {/* Sidebar Panel */}
              <aside className="absolute left-0 top-0 bottom-0 w-72 bg-background-secondary border-r border-border-subtle overflow-y-auto animate-in slide-in-from-left duration-200">
                {/* Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                  <span className="text-sm font-semibold text-text-primary">Navigation</span>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-tertiary"
                    aria-label="Close navigation"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {sidebarContent}
              </aside>
            </div>
          )}

          {/* Desktop Sidebar - Hidden on mobile */}
          <aside className="hidden md:block w-56 bg-background-secondary border-r border-border-subtle overflow-y-auto flex-shrink-0">
            {sidebarContent}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-background-primary">
            {renderView()}
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

