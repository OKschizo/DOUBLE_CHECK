'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useScenes } from '@/features/scenes/hooks/useScenes';
import { useShots } from '@/features/scenes/hooks/useShots';
import { SceneDetailModal } from '@/features/scenes/components/SceneDetailModal';
import { SceneViewModal } from '@/features/scenes/components/SceneViewModal';
import { ShotDetailModal } from '@/features/scenes/components/ShotDetailModal';
import { ShotViewModal } from '@/features/scenes/components/ShotViewModal';
import { getProjectTerminology } from '@/shared/utils/projectTerminology';
import { isFirebaseStorageUrl } from '@/lib/firebase/storage';
import type { Scene } from '@/lib/schemas';

interface ScenesViewProps {
  projectId: string;
}

type LayoutMode = 'creative' | 'production';

export function ScenesView({ projectId }: ScenesViewProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('creative');
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showSceneViewModal, setShowSceneViewModal] = useState(false);
  const [showShotModal, setShowShotModal] = useState(false);
  const [showShotViewModal, setShowShotViewModal] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedShot, setSelectedShot] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(
    new Set(['not-shot', 'in-progress', 'completed', 'omitted'])
  );
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set());

  const { scenes, isLoading, error, createScene, updateScene, deleteScene } = useScenes(projectId);
  const { data: project } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: castMembers = [] } = trpc.cast.listByProject.useQuery({ projectId });
  const { data: crewMembers = [] } = trpc.crew.listByProject.useQuery({ projectId });
  const { data: equipment = [] } = trpc.equipment.listByProject.useQuery({ projectId });
  const { data: locations = [] } = trpc.locations.listByProject.useQuery({ projectId });
  const { data: schedule } = trpc.schedule.getSchedule.useQuery({ projectId });
  const { data: userRole } = trpc.projectMembers.getMyRole.useQuery({ projectId });

  const syncAllScenes = trpc.scenes.syncAllToSchedule.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      utils.schedule.getSchedule.invalidate({ projectId });
    },
    onError: (error) => {
      alert(`Failed to sync: ${error.message}`);
    },
  });

  const syncScene = trpc.scenes.syncToSchedule.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      utils.schedule.getSchedule.invalidate({ projectId });
    },
    onError: (error) => {
      alert(`Failed to sync: ${error.message}`);
    },
  });

  const syncShot = trpc.shots.syncToSchedule.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      utils.schedule.getSchedule.invalidate({ projectId });
    },
    onError: (error) => {
      alert(`Failed to sync: ${error.message}`);
    },
  });

  // Get dynamic terminology based on project type
  const terminology = getProjectTerminology(project?.projectType);

  const canEdit = userRole === 'owner' || userRole === 'admin';

  // Filter scenes
  const filteredScenes = scenes.filter((scene) => {
    const matchesSearch =
      !searchQuery ||
      scene.sceneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter.has(scene.status);

    return matchesSearch && matchesStatus;
  });

  const handleCreateScene = () => {
    setSelectedScene(null);
    setShowSceneModal(true);
  };

  const handleEditScene = (scene: Scene) => {
    setSelectedScene(scene);
    setShowSceneModal(true);
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm(`Are you sure you want to delete this ${terminology.scenes.singular.toLowerCase()}? All ${terminology.shots.plural.toLowerCase()} will also be deleted.`)) {
      return;
    }
    await deleteScene.mutateAsync({ id: sceneId });
  };

  const handleViewScene = (scene: Scene) => {
    setSelectedScene(scene);
    setShowSceneViewModal(true);
  };

  const handleViewShots = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    setShowShotModal(true);
  };

  const handleViewShot = (shot: any) => {
    setSelectedShot(shot);
    setShowShotViewModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-error/10 border border-error/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-error flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-error mb-1">Error Loading {terminology.scenes.plural}</h3>
              <p className="text-text-secondary text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-text-primary">{terminology.scenes.label}</h1>
          <p className="text-text-secondary">Manage your production {terminology.scenes.plural.toLowerCase()} and {terminology.shots.plural.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Layout Toggle */}
          <div className="flex items-center gap-2 bg-background-secondary border border-border-default rounded-lg p-1">
            <button
              onClick={() => setLayoutMode('creative')}
              className={`px-4 py-2 text-sm font-medium transition-all rounded ${
                layoutMode === 'creative'
                  ? 'bg-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              style={layoutMode === 'creative' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
            >
              Creative
            </button>
            <button
              onClick={() => setLayoutMode('production')}
              className={`px-4 py-2 text-sm font-medium transition-all rounded ${
                layoutMode === 'production'
                  ? 'bg-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              style={layoutMode === 'production' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
            >
              Production
            </button>
          </div>
          {canEdit && (
            <>
              <button
                onClick={() => syncAllScenes.mutate({ projectId })}
                disabled={syncAllScenes.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncAllScenes.isPending ? 'Syncing...' : 'Sync All to Schedule'}
              </button>
              <button onClick={handleCreateScene} className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add {terminology.scenes.singular}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={`Search ${terminology.scenes.plural.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Status:</span>
            {['not-shot', 'in-progress', 'completed', 'omitted'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  const newFilter = new Set(statusFilter);
                  if (newFilter.has(status)) {
                    newFilter.delete(status);
                  } else {
                    newFilter.add(status);
                  }
                  setStatusFilter(newFilter);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter.has(status)
                    ? 'bg-accent-primary'
                    : 'bg-background-tertiary text-text-secondary hover:bg-background-elevated'
                }`}
                style={statusFilter.has(status) ? { color: 'rgb(var(--colored-button-text))' } : undefined}
              >
                {status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredScenes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No {terminology.scenes.plural.toLowerCase()} found</h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            {searchQuery || statusFilter.size < 4
              ? 'Try adjusting your filters'
              : `Get started by creating your first ${terminology.scenes.singular.toLowerCase()}`}
          </p>
          {canEdit && !searchQuery && statusFilter.size === 4 && (
            <button onClick={handleCreateScene} className="btn-primary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First {terminology.scenes.singular}
            </button>
          )}
        </div>
      ) : layoutMode === 'creative' ? (
        <CreativeLayout
          scenes={filteredScenes}
          onViewScene={handleViewScene}
          onEditScene={handleEditScene}
          onDeleteScene={handleDeleteScene}
          onViewShots={handleViewShots}
          onSyncScene={(sceneId) => syncScene.mutate({ sceneId })}
          canEdit={canEdit}
          castMembers={castMembers}
          crewMembers={crewMembers}
          locations={locations}
          terminology={terminology}
        />
      ) : (
        <ProductionLayout
          scenes={filteredScenes}
          onViewScene={handleViewScene}
          onEditScene={handleEditScene}
          onDeleteScene={handleDeleteScene}
          onViewShots={handleViewShots}
          onViewShot={handleViewShot}
          onSyncScene={(sceneId) => syncScene.mutate({ sceneId })}
          onSyncShot={(shotId) => syncShot.mutate({ shotId })}
          canEdit={canEdit}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          projectId={projectId}
          terminology={terminology}
        />
      )}

      {/* Scene Detail Modal */}
      {showSceneModal && (
        <SceneDetailModal
          scene={selectedScene}
          projectId={projectId}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          onClose={() => {
            setShowSceneModal(false);
            setSelectedScene(null);
          }}
          onSave={async (data) => {
            if (selectedScene) {
              await updateScene.mutateAsync({ id: selectedScene.id, data });
            } else {
              await createScene.mutateAsync({ ...data, projectId, createdBy: user?.id || '' });
            }
            setShowSceneModal(false);
            setSelectedScene(null);
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
          onEdit={canEdit ? () => {
            setShowSceneViewModal(false);
            handleEditScene(selectedScene);
          } : undefined}
          onNavigate={(view) => {
            // Navigation is handled via hash in the URL
            window.location.hash = view;
            // Close modal after navigation
            setShowSceneViewModal(false);
            setSelectedScene(null);
          }}
          onViewShot={handleViewShot}
        />
      )}

      {/* Shot Detail Modal */}
      {showShotModal && selectedSceneId && (
        <ShotDetailModal
          sceneId={selectedSceneId}
          projectId={projectId}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          initialShotId={selectedShot?.id} // Pass the shot ID to open directly in edit mode
          onClose={() => {
            setShowShotModal(false);
            setSelectedSceneId(null);
            setSelectedShot(null); // Clear selected shot when closing
          }}
          onViewShot={handleViewShot}
        />
      )}

      {/* Shot View Modal */}
      {showShotViewModal && selectedShot && (
        <ShotViewModal
          shot={selectedShot}
          projectId={projectId}
          castMembers={castMembers}
          crewMembers={crewMembers}
          equipment={equipment}
          locations={locations}
          schedule={schedule}
          onClose={() => {
            setShowShotViewModal(false);
            setSelectedShot(null);
          }}
          onEdit={canEdit ? () => {
            setShowShotViewModal(false);
            // Keep selectedShot so we can pass its ID to ShotDetailModal
            setSelectedSceneId(selectedShot.sceneId);
            setShowShotModal(true);
          } : undefined}
          onNavigate={(view) => {
            // Navigation is handled via hash in the URL
            window.location.hash = view;
            // Close modal after navigation
            setShowShotViewModal(false);
            setSelectedShot(null);
          }}
        />
      )}
    </div>
  );
}

// Creative Layout Component
function CreativeLayout({
  scenes,
  onViewScene,
  onEditScene,
  onDeleteScene,
  onViewShots,
  onSyncScene,
  canEdit,
  castMembers,
  crewMembers,
  locations,
  terminology,
}: {
  scenes: Scene[];
  onViewScene: (scene: Scene) => void;
  onEditScene: (scene: Scene) => void;
  onDeleteScene: (sceneId: string) => void;
  onViewShots: (sceneId: string) => void;
  onSyncScene?: (sceneId: string) => void;
  canEdit: boolean;
  castMembers: any[];
  crewMembers: any[];
  locations: any[];
  terminology: ReturnType<typeof getProjectTerminology>;
}) {
  const statusColors = {
    'not-shot': 'bg-gray-500/10 border-gray-500/30',
    'in-progress': 'bg-blue-500/10 border-blue-500/30',
    'completed': 'bg-green-500/10 border-green-500/30',
    'omitted': 'bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenes.map((scene) => {
        const sceneLocationIds = scene.locationIds || (scene.locationId ? [scene.locationId] : []);
        const sceneLocations = locations.filter((loc) => sceneLocationIds.includes(loc.id));
        const sceneCast = castMembers.filter((cast) => scene.castIds?.includes(cast.id));
        const sceneCrew = crewMembers.filter((crew) => scene.crewIds?.includes(crew.id));

        return (
          <div
            key={scene.id}
            className={`card-elevated overflow-hidden hover:scale-105 transition-transform cursor-pointer border-2 ${
              statusColors[scene.status] || statusColors['not-shot']
            }`}
            onClick={() => onViewScene(scene)}
          >
            {/* Scene Image */}
            {scene.imageUrl && (
              <div className="relative w-full h-48 overflow-hidden bg-background-secondary">
                <Image
                  src={scene.imageUrl}
                  alt={scene.title || `Scene ${scene.sceneNumber}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized={scene.imageUrl.startsWith('blob:') || scene.imageUrl.startsWith('data:') || isFirebaseStorageUrl(scene.imageUrl)}
                />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {terminology.scenes.singular} {scene.sceneNumber}
                  </h3>
                  {scene.title && (
                    <p className="text-sm text-text-secondary">{scene.title}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                  statusColors[scene.status] || statusColors['not-shot']
                }`}>
                  {scene.status.replace('-', ' ')}
                </span>
              </div>

              {scene.description && (
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">{scene.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {sceneLocations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {sceneLocations.slice(0, 3).map((loc) => (
                      <button
                        key={loc.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          const hash = `locations?id=${loc.id}`;
                          window.location.hash = hash;
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-background-tertiary rounded text-sm text-text-secondary hover:bg-background-elevated transition-colors cursor-pointer border border-accent-primary/30 hover:border-accent-primary ring-1 ring-transparent hover:ring-accent-primary/20"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{loc.name}</span>
                      </button>
                    ))}
                    {sceneLocations.length > 3 && (
                      <span className="text-xs text-text-tertiary">+{sceneLocations.length - 3} more</span>
                    )}
                  </div>
                )}
                {scene.pageCount && (
                  <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{scene.pageCount} pages</span>
                  </div>
                )}
              </div>

              {(sceneCast.length > 0 || sceneCrew.length > 0) && (
                <div className="flex items-center gap-2 mb-4">
                  {sceneCast.slice(0, 3).map((cast) => (
                    <button
                      key={cast.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        const hash = `cast?id=${cast.id}`;
                        window.location.hash = hash;
                      }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-accent-primary/50 hover:border-accent-primary transition-colors cursor-pointer ring-2 ring-transparent hover:ring-accent-primary/30"
                      title={cast.characterName}
                    >
                      {cast.characterName.charAt(0)}
                    </button>
                  ))}
                  {sceneCast.length > 3 && (
                    <span className="text-xs text-text-tertiary">+{sceneCast.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border-default">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewShots(scene.id);
                    }}
                    className="text-sm text-accent-primary hover:text-accent-hover font-medium"
                  >
                    View {terminology.shots.plural}
                  </button>
                  {canEdit && onSyncScene && (scene.shootingDayIds?.length > 0 || scene.shootingDayId) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSyncScene(scene.id);
                      }}
                      className="text-sm text-text-secondary hover:text-accent-primary font-medium flex items-center gap-1"
                      title="Sync to Schedule"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync
                    </button>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditScene(scene);
                      }}
                      className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete this ${terminology.scenes.singular.toLowerCase()}?`)) {
                          onDeleteScene(scene.id);
                        }
                      }}
                      className="p-2 text-error hover:bg-error/10 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Production Layout Component
function ProductionLayout({
  scenes,
  onViewScene,
  onEditScene,
  onDeleteScene,
  onViewShots,
  onViewShot,
  onSyncScene,
  onSyncShot,
  canEdit,
  castMembers,
  crewMembers,
  equipment,
  locations,
  schedule,
  projectId,
  terminology,
}: {
  scenes: Scene[];
  onViewScene: (scene: Scene) => void;
  onEditScene: (scene: Scene) => void;
  onDeleteScene: (sceneId: string) => void;
  onViewShots: (sceneId: string) => void;
  onViewShot?: (shot: any) => void;
  onSyncScene?: (sceneId: string) => void;
  onSyncShot?: (shotId: string) => void;
  canEdit: boolean;
  castMembers: any[];
  crewMembers: any[];
  equipment: any[];
  locations: any[];
  schedule: any;
  projectId: string;
  terminology: ReturnType<typeof getProjectTerminology>;
}) {
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

  const toggleExpand = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  return (
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-secondary border-b border-border-default">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                {terminology.scenes.singular} #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Scheduled
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Cast
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Crew
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {scenes.map((scene) => {
              const sceneLocationIds = scene.locationIds || (scene.locationId ? [scene.locationId] : []);
              const sceneLocations = locations.filter((loc) => sceneLocationIds.includes(loc.id));
              const sceneCast = castMembers.filter((cast) => scene.castIds?.includes(cast.id));
              const sceneCrew = crewMembers.filter((crew) => scene.crewIds?.includes(crew.id));
              const isExpanded = expandedScenes.has(scene.id);
              const sceneShootingDayIds = scene.shootingDayIds || (scene.shootingDayId ? [scene.shootingDayId] : []);
              const shootingDays = schedule?.days?.filter((day: any) => sceneShootingDayIds.includes(day.id)) || [];

              return (
                <React.Fragment key={scene.id}>
                  <tr
                    className="hover:bg-background-tertiary"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                      {scene.sceneNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {scene.title || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                        scene.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        scene.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
                        scene.status === 'omitted' ? 'bg-red-500/10 text-red-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {scene.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {sceneLocations.length > 0
                        ? sceneLocations.length === 1
                          ? sceneLocations[0].name
                          : `${sceneLocations.length} locations`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {shootingDays.length > 0
                        ? shootingDays.length === 1
                          ? new Date(shootingDays[0].date).toLocaleDateString()
                          : `${shootingDays.length} days`
                        : scene.scheduledDate
                        ? new Date(scene.scheduledDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {scene.estimatedDuration ? `${scene.estimatedDuration} min` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {sceneCast.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {sceneCast.slice(0, 2).map((cast) => (
                            <div
                              key={cast.id}
                              className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs"
                              title={cast.characterName}
                            >
                              {cast.characterName.charAt(0)}
                            </div>
                          ))}
                          {sceneCast.length > 2 && (
                            <span className="text-xs">+{sceneCast.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {sceneCrew.length > 0 ? `${sceneCrew.length} crew` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewScene(scene)}
                          className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                          title={`View ${terminology.scenes.singular} Details`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleExpand(scene.id)}
                          className={`p-1.5 text-text-secondary hover:text-text-primary hover:bg-background-elevated rounded transition-colors ${
                            isExpanded ? 'bg-background-elevated' : ''
                          }`}
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {canEdit && (
                          <>
                            {onSyncScene && (scene.shootingDayIds?.length > 0 || scene.shootingDayId) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSyncScene(scene.id);
                                }}
                                className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                                title="Sync to Schedule"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewShots(scene.id);
                              }}
                              className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                              title={`View ${terminology.shots.plural}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditScene(scene);
                              }}
                              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-background-elevated rounded transition-colors"
                              title={`Edit ${terminology.scenes.singular}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete this ${terminology.scenes.singular.toLowerCase()}?`)) {
                                  onDeleteScene(scene.id);
                                }
                              }}
                              className="p-1.5 text-error hover:bg-error/10 rounded transition-colors"
                              title={`Delete ${terminology.scenes.singular}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 bg-background-secondary">
                        <SceneExpandedDetails
                          scene={scene}
                          castMembers={sceneCast}
                          crewMembers={sceneCrew}
                          equipment={equipment.filter((eq) => scene.equipmentIds?.includes(eq.id))}
                          locations={sceneLocations}
                          onViewShots={() => onViewShots(scene.id)}
                          onSyncShot={onSyncShot}
                          projectId={projectId}
                          terminology={terminology}
                          onNavigate={(view) => {
                            window.location.href = `/projects/${projectId}#${view}`;
                          }}
                          onViewShot={onViewShot}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Expanded Scene Details Component
function SceneExpandedDetails({
  scene,
  castMembers,
  crewMembers,
  equipment,
  locations,
  onViewShots,
  onSyncShot,
  projectId,
  terminology,
  onNavigate,
  onViewShot,
}: {
  scene: Scene;
  castMembers: any[];
  crewMembers: any[];
  equipment: any[];
  locations: any[];
  onViewShots: () => void;
  onSyncShot?: (shotId: string) => void;
  projectId: string;
  terminology: ReturnType<typeof getProjectTerminology>;
  onNavigate?: (view: string) => void;
  onViewShot?: (shot: any) => void;
}) {
  const { shots } = useShots(scene.id);

  const handleNavigate = (view: string, elementId?: string) => {
    const hash = elementId ? `${view}?id=${elementId}` : view;
    if (onNavigate) {
      onNavigate(hash);
    } else {
      window.location.href = `/projects/${projectId}#${hash}`;
    }
  };

  return (
    <div className="space-y-4">
      {scene.description && (
        <div>
          <h4 className="text-sm font-semibold text-accent-primary mb-2">Description</h4>
          <p className="text-sm text-text-secondary">{scene.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {scene.pageCount && (
          <div>
            <h4 className="text-xs font-semibold text-accent-secondary mb-1">Pages</h4>
            <p className="text-sm text-text-primary">{scene.pageCount}</p>
          </div>
        )}
        {scene.timeOfDay && (
          <div>
            <h4 className="text-xs font-semibold text-accent-secondary mb-1">Time of Day</h4>
            <p className="text-sm text-text-primary">{scene.timeOfDay}</p>
          </div>
        )}
        {scene.weather && (
          <div>
            <h4 className="text-xs font-semibold text-accent-secondary mb-1">Weather</h4>
            <p className="text-sm text-text-primary">{scene.weather}</p>
          </div>
        )}
        {scene.mood && (
          <div>
            <h4 className="text-xs font-semibold text-accent-secondary mb-1">Mood</h4>
            <p className="text-sm text-text-primary">{scene.mood}</p>
          </div>
        )}
      </div>

      {castMembers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-accent-primary mb-2">Cast</h4>
          <div className="flex flex-wrap gap-2">
            {castMembers.map((cast) => (
              <button
                key={cast.id}
                onClick={() => handleNavigate('cast', cast.id)}
                className="px-3 py-1 bg-background-tertiary rounded text-sm text-text-secondary hover:bg-background-elevated transition-colors cursor-pointer border border-accent-primary/30 hover:border-accent-primary ring-1 ring-transparent hover:ring-accent-primary/20"
              >
                {cast.characterName}
              </button>
            ))}
          </div>
        </div>
      )}

      {crewMembers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-accent-primary mb-2">Crew</h4>
          <div className="flex flex-wrap gap-2">
            {crewMembers.map((crew) => (
              <button
                key={crew.id}
                onClick={() => handleNavigate('crew', crew.id)}
                className="px-3 py-1 bg-background-tertiary rounded text-sm text-text-secondary hover:bg-background-elevated transition-colors cursor-pointer border border-accent-primary/30 hover:border-accent-primary ring-1 ring-transparent hover:ring-accent-primary/20"
              >
                {crew.name} - {crew.role}
              </button>
            ))}
          </div>
        </div>
      )}

      {equipment.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-accent-primary mb-2">Equipment</h4>
          <div className="flex flex-wrap gap-2">
            {equipment.map((eq) => (
              <button
                key={eq.id}
                onClick={() => handleNavigate('equipment', eq.id)}
                className="px-3 py-1 bg-background-tertiary rounded text-sm text-text-secondary hover:bg-background-elevated transition-colors cursor-pointer border border-accent-primary/30 hover:border-accent-primary ring-1 ring-transparent hover:ring-accent-primary/20"
              >
                {eq.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {locations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-accent-primary mb-2">Locations</h4>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleNavigate('locations', loc.id)}
                className="px-3 py-1 bg-background-tertiary rounded text-sm text-text-secondary hover:bg-background-elevated transition-colors cursor-pointer border border-accent-primary/30 hover:border-accent-primary ring-1 ring-transparent hover:ring-accent-primary/20"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {shots && shots.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-accent-primary mb-2">{terminology.shots.plural}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {shots.map((shot) => {
              const shotStatusColors = {
                'not-shot': 'bg-gray-500/10 text-gray-400',
                'in-progress': 'bg-blue-500/10 text-blue-400',
                'completed': 'bg-green-500/10 text-green-400',
                'omitted': 'bg-red-500/10 text-red-400',
              };

              return (
                <div
                  key={shot.id}
                  className="p-2 bg-background-tertiary rounded border border-border-default hover:bg-background-elevated hover:border-accent-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => onViewShot?.(shot)}
                      className="text-left flex-1"
                    >
                      <span className="text-xs font-semibold text-text-primary">
                        {terminology.shots.singular} {shot.shotNumber}
                      </span>
                      {shot.title && (
                        <p className="text-xs text-text-secondary truncate">{shot.title}</p>
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      {onSyncShot && (shot.shootingDayIds?.length > 0 || shot.shootingDayId || scene.shootingDayIds?.length > 0 || scene.shootingDayId) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSyncShot(shot.id);
                          }}
                          className="p-1 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                          title="Sync to Schedule"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded capitalize ${
                        shotStatusColors[shot.status] || shotStatusColors['not-shot']
                      }`}>
                        {shot.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onViewShots}
          className="btn-secondary text-sm"
        >
          View {terminology.shots.plural}
        </button>
      </div>
    </div>
  );
}


