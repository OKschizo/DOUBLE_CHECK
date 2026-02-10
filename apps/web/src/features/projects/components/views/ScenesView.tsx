'use client';

import React, { useState, useMemo, Component, ReactNode, ErrorInfo } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useScenesByProject, useCreateScene, useUpdateScene, useDeleteScene, useUpdateSceneOrder } from '@/features/scenes/hooks/useScenes';
import { useProject } from '@/features/projects/hooks/useProjects';
import { useCastByProject } from '@/features/cast/hooks/useCast';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import { useEquipmentByProject } from '@/features/equipment/hooks/useEquipment';
import { useLocationsByProject } from '@/features/locations/hooks/useLocations';
import { useSchedule } from '@/features/projects/hooks/useSchedule';
import { useMyRole } from '@/features/projectMembers/hooks/useProjectMembers';
import { getProjectTerminology } from '@/shared/utils/projectTerminology';
import type { Scene } from '@/lib/schemas';

import { SceneDetailModal } from '@/features/scenes/components/SceneDetailModal';
import { SceneViewModal } from '@/features/scenes/components/SceneViewModal';
import { StripboardView } from '@/features/scenes/components/StripboardView';
import { TimelineView } from '@/features/scenes/components/TimelineView';
import { CoverageTemplateModal } from '@/features/scenes/components/CoverageTemplateModal';
import { KeyboardShortcutsLegend } from '@/features/scenes/components/KeyboardShortcutsLegend';
import { useApplyCoverageTemplate } from '@/features/scenes/hooks/useCoverageTemplates';
import { useKeyboardShortcuts } from '@/features/scenes/hooks/useKeyboardShortcuts';
import { useProjectShots, useUpdateShot } from '@/features/scenes/hooks/useShots';
import { ShotSchedulingModal } from '@/features/scenes/components/ShotSchedulingModal';
import { ShotListExport } from '@/features/scenes/components/ShotListExport';
import { ShotDetailModal } from '@/features/scenes/components/ShotDetailModal';
import Image from 'next/image';
import { isFirebaseStorageUrl } from '@/lib/firebase/storage';

// Error Boundary Component
class ScenesErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ScenesErrorBoundary] Caught error:', error.message);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ScenesErrorBoundary] Full error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900/30 border-2 border-red-500 rounded-lg m-4">
          <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Scenes View Error</h2>
          <div className="space-y-4">
            <div className="bg-black/50 p-4 rounded-lg">
              <h3 className="text-red-300 font-semibold mb-2">Error Message:</h3>
              <p className="text-red-200 font-mono">{this.state.error?.message}</p>
            </div>
            <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-64">
              <h3 className="text-red-300 font-semibold mb-2">Stack Trace:</h3>
              <pre className="text-xs text-red-200/70 whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </div>
            {this.state.errorInfo && (
              <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-64">
                <h3 className="text-red-300 font-semibold mb-2">Component Stack:</h3>
                <pre className="text-xs text-red-200/70 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ScenesViewProps {
  projectId: string;
}

function ScenesViewContent({ projectId }: ScenesViewProps) {
  // Modal states
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showSceneViewModal, setShowSceneViewModal] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'stripboard' | 'timeline'>('grid');
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [coverageTargetScene, setCoverageTargetScene] = useState<Scene | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShotModal, setShowShotModal] = useState(false);
  const [selectedShotSceneId, setSelectedShotSceneId] = useState<string | null>(null);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [intExtFilter, setIntExtFilter] = useState<string>('all');
  const [dayNightFilter, setDayNightFilter] = useState<string>('all');
  
  // Batch selection
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [batchStatusValue, setBatchStatusValue] = useState<string>('');
  
  // Drag and drop
  const [draggedScene, setDraggedScene] = useState<Scene | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

  // Data hooks
  const { user } = useAuth();
  const { data: scenes = [], isLoading: scenesLoading, error: scenesError } = useScenesByProject(projectId);
  const { data: project } = useProject(projectId);
  const { data: castMembers = [] } = useCastByProject(projectId);
  const { data: crewMembers = [] } = useCrewByProject(projectId);
  const { data: equipment = [] } = useEquipmentByProject(projectId);
  const { data: locations = [] } = useLocationsByProject(projectId);
  const { schedule, createDay } = useSchedule(projectId);
  const { data: userRole } = useMyRole(projectId);
  const { data: allShots = [] } = useProjectShots(projectId);
  const applyCoverageTemplate = useApplyCoverageTemplate();
  const updateShot = useUpdateShot();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewScene: () => {
      setSelectedScene(null);
      setShowSceneModal(true);
    },
    onToggleView: () => {
      setViewMode(prev => prev === 'grid' ? 'stripboard' : prev === 'stripboard' ? 'timeline' : 'grid');
    },
    onShowHelp: () => setShowKeyboardHelp(true),
    enabled: true,
  });

  // Get terminology (not a hook)
  const terminology = getProjectTerminology(project?.projectType);
  const canEdit = userRole === 'owner' || userRole === 'admin';
  const deleteScene = useDeleteScene();
  const updateSceneOrder = useUpdateSceneOrder();
  const createScene = useCreateScene();
  const updateScene = useUpdateScene();

  // Filtered scenes
  const filteredScenes = useMemo(() => {
    return scenes.filter(scene => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = scene.sceneNumber?.toLowerCase().includes(query);
        const matchesTitle = scene.title?.toLowerCase().includes(query);
        const matchesDesc = scene.description?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesTitle && !matchesDesc) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && scene.status !== statusFilter) return false;
      // INT/EXT filter
      if (intExtFilter !== 'all' && scene.intExt !== intExtFilter) return false;
      // DAY/NIGHT filter
      if (dayNightFilter !== 'all' && scene.dayNight !== dayNightFilter) return false;
      return true;
    });
  }, [scenes, searchQuery, statusFilter, intExtFilter, dayNightFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalPages = scenes.reduce((sum, s) => sum + (Number(s.pageCount) || 0), 0);
    const completed = scenes.filter(s => s.status === 'completed').length;
    const inProgress = scenes.filter(s => s.status === 'in-progress').length;
    const notShot = scenes.filter(s => !s.status || s.status === 'not-shot').length;
    return { totalPages, completed, inProgress, notShot, totalScenes: scenes.length };
  }, [scenes]);

  // Shot counts per scene
  const shotCountByScene = useMemo(() => {
    const counts: Record<string, number> = {};
    allShots.forEach(shot => {
      counts[shot.sceneId] = (counts[shot.sceneId] || 0) + 1;
    });
    return counts;
  }, [allShots]);

  // Batch actions
  const handleSelectAll = () => {
    if (selectedScenes.size === filteredScenes.length) {
      setSelectedScenes(new Set());
    } else {
      setSelectedScenes(new Set(filteredScenes.map(s => s.id)));
    }
  };

  const handleToggleSelect = (sceneId: string) => {
    const newSelected = new Set(selectedScenes);
    if (newSelected.has(sceneId)) {
      newSelected.delete(sceneId);
    } else {
      newSelected.add(sceneId);
    }
    setSelectedScenes(newSelected);
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedScenes.size} scenes? This cannot be undone.`)) return;
    for (const sceneId of selectedScenes) {
      await deleteScene.mutateAsync(sceneId);
    }
    setSelectedScenes(new Set());
  };

  const handleBatchApplyCoverage = () => {
    const firstScene = scenes.find(s => selectedScenes.has(s.id));
    if (firstScene) {
      setCoverageTargetScene(firstScene);
      setShowCoverageModal(true);
    }
  };

  // Handle batch status update
  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (!newStatus || selectedScenes.size === 0) return;
    
    const confirmed = window.confirm(
      `Update status to "${newStatus}" for ${selectedScenes.size} scene(s)?`
    );
    
    if (!confirmed) {
      setBatchStatusValue('');
      return;
    }
    
    try {
      await Promise.all(
        Array.from(selectedScenes).map(sceneId => 
          updateScene.mutateAsync({ id: sceneId, data: { status: newStatus } })
        )
      );
      setSelectedScenes(new Set());
      setShowBatchActions(false);
      setBatchStatusValue('');
    } catch (error) {
      console.error('Failed to update scene statuses:', error);
      alert('Failed to update some scene statuses');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, scene: Scene) => {
    setDraggedScene(scene);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('sceneId', scene.id);
  };

  const handleDragOver = (e: React.DragEvent, sceneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSceneId(sceneId);
  };

  const handleDragLeave = () => {
    setDragOverSceneId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetScene: Scene) => {
    e.preventDefault();
    setDragOverSceneId(null);
    
    if (!draggedScene || draggedScene.id === targetScene.id) {
      setDraggedScene(null);
      return;
    }

    // Get current order of filtered scenes
    const sceneList = [...filteredScenes];
    const draggedIndex = sceneList.findIndex(s => s.id === draggedScene.id);
    const targetIndex = sceneList.findIndex(s => s.id === targetScene.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedScene(null);
      return;
    }

    // Reorder the list
    sceneList.splice(draggedIndex, 1);
    sceneList.splice(targetIndex, 0, draggedScene);

    // Create updates with new sort orders
    const updates = sceneList.map((scene, index) => ({
      id: scene.id,
      sortOrder: (index + 1) * 1000,
    }));

    try {
      await updateSceneOrder.mutateAsync(updates);
    } catch (error) {
      console.error('Failed to update scene order:', error);
    }

    setDraggedScene(null);
  };

  const handleDragEnd = () => {
    setDraggedScene(null);
    setDragOverSceneId(null);
  };

  // Loading state
  if (scenesLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
          </div>
          <p className="text-text-secondary">Loading scenes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (scenesError) {
    return (
      <div className="p-8 bg-red-900/30 border border-red-500 rounded-lg m-4">
        <h2 className="text-xl font-bold text-red-400">Error loading scenes</h2>
        <p className="text-red-300 mt-2">{scenesError.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header - Full width, stacked on mobile */}
      <div className="mb-4 md:mb-6">
        {/* Title Section - Always full width */}
        <div className="mb-3">
          <h1 className="text-xl md:text-3xl font-bold text-text-primary">{terminology.scenes.label}</h1>
          <p className="text-sm md:text-base text-text-secondary">
            Manage {terminology.scenes.plural.toLowerCase()} &amp; {terminology.shots.plural.toLowerCase()}
          </p>
        </div>

        {/* Stats Row - Compact inline on mobile */}
        {scenes.length > 0 && (
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-background-secondary rounded-lg flex-shrink-0">
              <span className="text-sm md:text-base font-bold text-text-primary">{stats.totalScenes}</span>
              <span className="text-xs text-text-secondary">{terminology.scenes.plural}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-background-secondary rounded-lg flex-shrink-0">
              <span className="text-sm md:text-base font-bold text-text-primary">{allShots.length}</span>
              <span className="text-xs text-text-secondary">{terminology.shots.plural}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-background-secondary rounded-lg flex-shrink-0">
              <span className="text-sm md:text-base font-bold text-green-400">{stats.completed}</span>
              <span className="text-xs text-text-secondary">Done</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-background-secondary rounded-lg flex-shrink-0">
              <span className="text-sm md:text-base font-bold text-blue-400">{stats.inProgress}</span>
              <span className="text-xs text-text-secondary">Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-background-secondary rounded-lg flex-shrink-0">
              <span className="text-sm md:text-base font-bold text-text-primary">{Number(stats.totalPages).toFixed(1)}</span>
              <span className="text-xs text-text-secondary">Pgs</span>
            </div>
          </div>
        )}

        {/* View Mode Tabs - Horizontal scrollable like M3 tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-3 scrollbar-hide border-b border-border-subtle">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              viewMode === 'grid' 
                ? 'border-accent-primary text-accent-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('stripboard')}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              viewMode === 'stripboard' 
                ? 'border-accent-primary text-accent-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Stripboard
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              viewMode === 'timeline' 
                ? 'border-accent-primary text-accent-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Timeline
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Primary Action */}
          <button 
            onClick={() => {
              setSelectedScene(null);
              setShowSceneModal(true);
            }}
            className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add {terminology.scenes.singular}</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Secondary Actions */}
          {allShots.length > 0 && (
            <button
              onClick={() => setShowSchedulingModal(true)}
              className="px-3 py-2 rounded-lg text-sm bg-background-secondary border border-border-default text-text-secondary hover:text-text-primary flex items-center gap-1.5 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Schedule</span>
            </button>
          )}

          {allShots.length > 0 && (
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 rounded-lg text-sm bg-background-secondary border border-border-default text-text-secondary hover:text-text-primary flex items-center gap-1.5 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 rounded-lg bg-background-secondary border border-border-default text-text-secondary hover:text-text-primary flex-shrink-0"
            title="Keyboard shortcuts"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      {scenes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search scenes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border border-text-primary rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-text-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }}
          >
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="all">All Status</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="not-shot">Not Shot</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="in-progress">In Progress</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="completed">Completed</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="omitted">Omitted</option>
          </select>

          {/* INT/EXT Filter */}
          <select
            value={intExtFilter}
            onChange={(e) => setIntExtFilter(e.target.value)}
            className="px-3 py-2 border border-text-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }}
          >
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="all">INT/EXT</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="INT">Interior</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="EXT">Exterior</option>
          </select>

          {/* DAY/NIGHT Filter */}
          <select
            value={dayNightFilter}
            onChange={(e) => setDayNightFilter(e.target.value)}
            className="px-3 py-2 border border-text-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }}
          >
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="all">DAY/NIGHT</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="DAY">Day</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="NIGHT">Night</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="DAWN">Dawn</option>
            <option style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }} value="DUSK">Dusk</option>
          </select>

          {/* Batch Select Toggle */}
          <button
            onClick={() => {
              setShowBatchActions(!showBatchActions);
              if (showBatchActions) setSelectedScenes(new Set());
            }}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showBatchActions 
                ? 'bg-accent-primary text-white' 
                : 'bg-bg-secondary border border-border-default hover:border-accent-primary'
            }`}
          >
            {showBatchActions ? 'Cancel Selection' : 'Batch Select'}
          </button>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'all' || intExtFilter !== 'all' || dayNightFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setIntExtFilter('all');
                setDayNightFilter('all');
              }}
              className="px-3 py-2 text-sm text-accent-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Batch Actions Bar */}
      {showBatchActions && selectedScenes.size > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
          <span className="text-sm font-medium">{selectedScenes.size} scene(s) selected</span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-accent-primary hover:underline"
          >
            {selectedScenes.size === filteredScenes.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBatchApplyCoverage}
            className="px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-sm hover:border-accent-primary"
          >
            Apply Coverage
          </button>
          
          {/* Batch Status Update */}
          <select
            value={batchStatusValue}
            onChange={(e) => {
              setBatchStatusValue(e.target.value);
              if (e.target.value) {
                handleBatchStatusUpdate(e.target.value);
              }
            }}
            className="px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-sm"
            style={{ backgroundColor: 'rgb(var(--background-primary))', color: 'rgb(var(--text-primary))' }}
          >
            <option value="">Set Status...</option>
            <option value="not-shot">Not Shot</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="omitted">Omitted</option>
          </select>
          
          <button
            onClick={handleBatchDelete}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm hover:bg-red-500/30"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Filter Results Info */}
      {filteredScenes.length !== scenes.length && (
        <p className="text-sm text-text-secondary mb-4">
          Showing {filteredScenes.length} of {scenes.length} {terminology.scenes.plural.toLowerCase()}
        </p>
      )}

      {/* View Modes */}
      {viewMode === 'stripboard' && (
        <StripboardView
          scenes={scenes}
          projectId={projectId}
          onSceneClick={(scene) => {
            setSelectedScene(scene);
            setShowSceneViewModal(true);
          }}
          onSceneEdit={canEdit ? (scene) => {
            setSelectedScene(scene);
            setShowSceneModal(true);
          } : undefined}
        />
      )}

      {viewMode === 'timeline' && (
        <TimelineView
          scenes={scenes}
          projectId={projectId}
          onSceneClick={(scene) => {
            setSelectedScene(scene);
            setShowSceneViewModal(true);
          }}
        />
      )}

      {viewMode === 'grid' && (
        filteredScenes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary">
              {scenes.length === 0 
                ? `No ${terminology.scenes.plural.toLowerCase()} found`
                : 'No scenes match your filters'
              }
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {scenes.length === 0 
                ? `Get started by creating your first ${terminology.scenes.singular.toLowerCase()}`
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenes.map((scene) => {
              const shotCount = shotCountByScene[scene.id] || 0;
              const isSelected = selectedScenes.has(scene.id);
              const isDragging = draggedScene?.id === scene.id;
              const isDragOver = dragOverSceneId === scene.id;
              
              return (
                <div 
                  key={scene.id} 
                  draggable={canEdit && !showBatchActions}
                  onDragStart={(e) => handleDragStart(e, scene)}
                  onDragOver={(e) => handleDragOver(e, scene.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, scene)}
                  onDragEnd={handleDragEnd}
                  className={`card-elevated p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-accent-primary bg-accent-primary/5' 
                      : isDragOver
                        ? 'border-accent-primary border-2 border-dashed bg-accent-primary/10'
                        : isDragging
                          ? 'opacity-50 border-dashed'
                          : 'hover:border-accent-primary'
                  }`}
                  onClick={() => {
                    if (showBatchActions) {
                      handleToggleSelect(scene.id);
                    } else {
                      setSelectedScene(scene);
                      setShowSceneViewModal(true);
                    }
                  }}
                >
                  {/* Scene Image */}
                  {scene.imageUrl && (
                    <div className="relative w-full h-32 -mt-4 -mx-4 mb-3 overflow-hidden rounded-t-lg">
                      <Image
                        src={scene.imageUrl}
                        alt={`Scene ${scene.sceneNumber}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized={scene.imageUrl.startsWith('blob:') || scene.imageUrl.startsWith('data:') || isFirebaseStorageUrl(scene.imageUrl)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {canEdit && !showBatchActions && (
                        <div className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
                          </svg>
                        </div>
                      )}
                      {showBatchActions && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(scene.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-border-default"
                        />
                      )}
                      <h3 className="font-bold text-text-primary text-lg">
                        {terminology.scenes.singular} {scene.sceneNumber}
                      </h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      scene.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      scene.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                      scene.status === 'omitted' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {scene.status?.replace('-', ' ') || 'not shot'}
                    </span>
                  </div>
                  {scene.title && (
                    <p className="text-sm text-text-secondary mb-2 font-medium">{scene.title}</p>
                  )}
                  {scene.description && (
                    <p className="text-xs text-text-tertiary line-clamp-2">{scene.description}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
                    <div className="flex items-center gap-3">
                      <span>{scene.intExt || 'INT'}/{scene.dayNight || 'DAY'}</span>
                      {scene.pageCount && <span>{scene.pageCount} pgs</span>}
                    </div>
                    {shotCount > 0 && (
                      <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded-full text-xs font-medium">
                        {shotCount} {shotCount === 1 ? terminology.shots.singular.toLowerCase() : terminology.shots.plural.toLowerCase()}
                      </span>
                    )}
                  </div>
                  {canEdit && !showBatchActions && (
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScene(scene);
                          setShowSceneModal(true);
                        }}
                        className="text-xs px-2 py-1 bg-bg-tertiary hover:bg-accent-primary/20 rounded"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverageTargetScene(scene);
                          setShowCoverageModal(true);
                        }}
                        className="text-xs px-2 py-1 bg-bg-tertiary hover:bg-accent-primary/20 rounded"
                      >
                        Apply Coverage
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${terminology.scenes.singular} ${scene.sceneNumber}?`)) {
                            await deleteScene.mutateAsync(scene.id);
                          }
                        }}
                        className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Scene Detail Modal (Create/Edit) */}
      {showSceneModal && (
        <SceneDetailModal
          scene={selectedScene}
          projectId={projectId}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          previousScene={selectedScene ? scenes.find(s => 
            parseInt(s.sceneNumber || '0') === parseInt(selectedScene.sceneNumber || '0') - 1
          ) : undefined}
          nextScene={selectedScene ? scenes.find(s => 
            parseInt(s.sceneNumber || '0') === parseInt(selectedScene.sceneNumber || '0') + 1
          ) : undefined}
          allScenes={scenes}
          onClose={() => {
            setShowSceneModal(false);
            setSelectedScene(null);
          }}
          onSave={async (data) => {
            try {
              if (selectedScene) {
                // Update existing scene
                await updateScene.mutateAsync({
                  id: selectedScene.id,
                  data: { ...data, projectId },
                });
              } else {
                // Create new scene
                const maxSortOrder = scenes.reduce((max, s) => Math.max(max, (s as any).sortOrder || 0), 0);
                await createScene.mutateAsync({
                  ...data,
                  projectId,
                  sortOrder: maxSortOrder + 1000,
                });
              }
              setShowSceneModal(false);
              setSelectedScene(null);
            } catch (error) {
              console.error('Failed to save scene:', error);
              alert('Failed to save scene');
            }
          }}
        />
      )}

      {/* Scene View Modal */}
      {showSceneViewModal && selectedScene && (
        <SceneViewModal
          scene={selectedScene}
          projectId={projectId}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          onClose={() => {
            setShowSceneViewModal(false);
            setSelectedScene(null);
          }}
          onEdit={() => {
            setShowSceneViewModal(false);
            setShowSceneModal(true);
          }}
          onViewShot={(shot) => {
            setSelectedShotSceneId(selectedScene.id);
            setSelectedShotId(shot.id);
            setShowShotModal(true);
          }}
        />
      )}

      {/* Coverage Template Modal */}
      {showCoverageModal && coverageTargetScene && (
        <CoverageTemplateModal
          scene={coverageTargetScene}
          projectId={projectId}
          onClose={() => {
            setShowCoverageModal(false);
            setCoverageTargetScene(null);
          }}
          onApply={async (templateId) => {
            await applyCoverageTemplate.mutateAsync({
              sceneId: coverageTargetScene.id,
              projectId,
              templateId,
            });
            setShowCoverageModal(false);
            setCoverageTargetScene(null);
          }}
        />
      )}

      {/* Shot Scheduling Modal */}
      {showSchedulingModal && (
        <ShotSchedulingModal
          shots={allShots}
          scenes={scenes}
          shootingDays={schedule?.days || []}
          onClose={() => setShowSchedulingModal(false)}
          onSchedule={async (shotIds, dayId, timeSlot) => {
            // Update each shot to include the new shooting day
            for (const shotId of shotIds) {
              const shot = allShots.find(s => s.id === shotId);
              if (shot) {
                const currentDayIds = shot.shootingDayIds || [];
                if (!currentDayIds.includes(dayId)) {
                  await updateShot.mutateAsync({
                    id: shotId,
                    data: { 
                      shootingDayIds: [...currentDayIds, dayId],
                      ...(timeSlot ? { scheduledTime: timeSlot } : {})
                    }
                  });
                }
              }
            }
            setShowSchedulingModal(false);
          }}
          onCreateDay={async (data) => {
            // Create a new shooting day that will sync to Production > Schedule
            const newDayId = await createDay.mutateAsync(data);
            return newDayId;
          }}
        />
      )}

      {/* Shot List Export Modal */}
      {showExportModal && (
        <ShotListExport
          scenes={scenes}
          shots={allShots}
          shootingDays={schedule?.days || []}
          castMembers={castMembers}
          equipment={equipment}
          projectTitle={project?.title || 'Untitled Project'}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Shot Detail Modal */}
      {showShotModal && selectedShotSceneId && (
        <ShotDetailModal
          sceneId={selectedShotSceneId}
          projectId={projectId}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          initialShotId={selectedShotId || undefined}
          onClose={() => {
            setShowShotModal(false);
            setSelectedShotSceneId(null);
            setSelectedShotId(null);
          }}
        />
      )}

      {/* Keyboard Shortcuts Legend */}
      {showKeyboardHelp && (
        <KeyboardShortcutsLegend onClose={() => setShowKeyboardHelp(false)} />
      )}
    </div>
  );
}

// Main export with error boundary
export function ScenesView(props: ScenesViewProps) {
  return (
    <ScenesErrorBoundary>
      <ScenesViewContent {...props} />
    </ScenesErrorBoundary>
  );
}
