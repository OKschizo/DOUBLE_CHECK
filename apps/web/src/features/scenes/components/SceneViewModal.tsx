'use client';

import { useShots } from '@/features/scenes/hooks/useShots';
import { getProjectTerminology } from '@/shared/utils/projectTerminology';
import { isFirebaseStorageUrl } from '@/lib/firebase/storage';
import type { Scene } from '@/lib/schemas';
import Image from 'next/image';
import { useProject } from '@/features/projects/hooks/useProjects';

interface SceneViewModalProps {
  scene: Scene;
  projectId: string;
  castMembers: any[];
  crewMembers: any[];
  equipment: any[];
  locations: any[];
  schedule: any;
  onClose: () => void;
  onEdit?: () => void;
  onNavigate?: (view: string) => void;
  onViewShot?: (shot: any) => void;
}

export function SceneViewModal({
  scene,
  projectId,
  castMembers,
  crewMembers,
  equipment,
  locations,
  schedule,
  onClose,
  onEdit,
  onNavigate,
  onViewShot,
}: SceneViewModalProps) {
  const { data: project } = useProject(projectId);
  const { shots = [] } = useShots(scene.id);
  const terminology = getProjectTerminology(project?.projectType);

  // Placeholder for syncScene - this would need to be implemented as a Cloud Function
  const syncScene = {
    mutate: async ({ sceneId }: { sceneId: string }) => {
      console.log('Sync scene to schedule', sceneId);
      alert('Sync to schedule functionality needs to be implemented');
    },
    isPending: false,
  };

  // Placeholder for syncShot - this would need to be implemented as a Cloud Function
  const syncShot = {
    mutate: async ({ shotId }: { shotId: string }) => {
      console.log('Sync shot to schedule', shotId);
      alert('Sync to schedule functionality needs to be implemented');
    },
    isPending: false,
  };

  const handleNavigate = (view: string, elementId?: string) => {
    const hash = elementId ? `${view}?id=${elementId}` : view;
    // Navigate first
    if (onNavigate) {
      onNavigate(hash);
    } else {
      // Use hash navigation to avoid full page reload
      window.location.hash = hash;
      // Close modal after navigation
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  const sceneLocationIds = scene.locationIds || (scene.locationId ? [scene.locationId] : []);
  const sceneLocations = locations.filter((loc) => sceneLocationIds.includes(loc.id));
  const sceneCast = castMembers.filter((cast) => scene.castIds?.includes(cast.id));
  const sceneCrew = crewMembers.filter((crew) => scene.crewIds?.includes(crew.id));
  const sceneEquipment = equipment.filter((eq) => scene.equipmentIds?.includes(eq.id));
  const sceneShootingDayIds = scene.shootingDayIds || (scene.shootingDayId ? [scene.shootingDayId] : []);
  const shootingDays = schedule?.days?.filter((day: any) => sceneShootingDayIds.includes(day.id)) || [];

  const statusColors = {
    'not-shot': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'completed': 'bg-green-500/10 text-green-400 border-green-500/30',
    'omitted': 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background-primary rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-text-primary">
                {terminology.scenes.singular} {scene.sceneNumber}
              </h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded capitalize border ${
                statusColors[scene.status] || statusColors['not-shot']
              }`}>
                {scene.status.replace('-', ' ')}
              </span>
            </div>
            {scene.title && (
              <p className="text-lg text-text-secondary">{scene.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Image */}
            {scene.imageUrl && (
              <div className="relative w-full h-64 md:h-96 overflow-hidden bg-background-secondary rounded-lg">
                <Image
                  src={scene.imageUrl}
                  alt={scene.title || `${terminology.scenes.singular} ${scene.sceneNumber}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                  unoptimized={scene.imageUrl.startsWith('blob:') || scene.imageUrl.startsWith('data:') || isFirebaseStorageUrl(scene.imageUrl)}
                />
              </div>
            )}

            {/* Description */}
            {scene.description && (
              <div>
                <h3 className="text-lg font-semibold text-accent-primary mb-2">Description</h3>
                <p className="text-text-secondary whitespace-pre-wrap">{scene.description}</p>
              </div>
            )}

            {/* Script Information */}
            {(scene.scriptText || scene.pageCount || scene.scriptPageStart || scene.scriptPageEnd) && (
              <div>
                <h3 className="text-lg font-semibold text-accent-primary mb-3">Script Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {scene.pageCount && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Pages</span>
                      <p className="text-text-primary font-medium mt-1">{scene.pageCount}</p>
                    </div>
                  )}
                  {scene.scriptPageStart && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Page Start</span>
                      <p className="text-text-primary font-medium mt-1">{scene.scriptPageStart}</p>
                    </div>
                  )}
                  {scene.scriptPageEnd && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Page End</span>
                      <p className="text-text-primary font-medium mt-1">{scene.scriptPageEnd}</p>
                    </div>
                  )}
                </div>
                {scene.scriptText && (
                  <div className="mt-4">
                    <span className="text-sm text-accent-secondary font-medium">Script Text</span>
                    <div className="mt-2 p-4 bg-background-secondary rounded-lg">
                      <p className="text-text-secondary whitespace-pre-wrap">{scene.scriptText}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Production Information */}
            <div>
              <h3 className="text-lg font-semibold text-accent-primary mb-3">Production Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sceneLocations.length > 0 && (
                  <div>
                    <span className="text-sm text-accent-secondary font-medium">Locations</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {sceneLocations.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => handleNavigate('locations', loc.id)}
                            className="px-2 py-1 bg-background-tertiary rounded text-sm text-text-primary hover:bg-background-elevated transition-colors cursor-pointer border border-accent-primary/30 hover:border-accent-primary ring-1 ring-transparent hover:ring-accent-primary/20"
                          >
                            {loc.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {shootingDays.length > 0 && (
                  <div>
                    <span className="text-sm text-accent-secondary font-medium">Shooting Days</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {shootingDays.map((day: any) => (
                        <span key={day.id} className="px-2 py-1 bg-background-tertiary rounded text-sm text-text-primary">
                          {new Date(day.date).toLocaleDateString()} - Day {day.dayNumber || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {scene.scheduledDate && (
                  <div>
                    <span className="text-sm text-accent-secondary font-medium">Scheduled Date</span>
                    <p className="text-text-primary font-medium mt-1">{new Date(scene.scheduledDate).toLocaleDateString()}</p>
                  </div>
                )}
                {scene.estimatedDuration && (
                  <div>
                    <span className="text-sm text-accent-secondary font-medium">Estimated Duration</span>
                    <p className="text-text-primary font-medium mt-1">{scene.estimatedDuration} min</p>
                  </div>
                )}
              </div>
            </div>

            {/* Creative Information */}
            {(scene.timeOfDay || scene.weather || scene.mood || scene.visualNotes) && (
              <div>
                <h3 className="text-lg font-semibold text-accent-primary mb-3">Creative Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {scene.timeOfDay && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Time of Day</span>
                      <p className="text-text-primary font-medium mt-1">{scene.timeOfDay}</p>
                    </div>
                  )}
                  {scene.weather && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Weather</span>
                      <p className="text-text-primary font-medium mt-1">{scene.weather}</p>
                    </div>
                  )}
                  {scene.mood && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Mood</span>
                      <p className="text-text-primary font-medium mt-1">{scene.mood}</p>
                    </div>
                  )}
                </div>
                {scene.visualNotes && (
                  <div className="mt-4">
                    <span className="text-sm text-accent-secondary font-medium">Visual Notes</span>
                    <p className="text-text-secondary mt-2 whitespace-pre-wrap">{scene.visualNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Assignments */}
            {(sceneCast.length > 0 || sceneCrew.length > 0 || sceneEquipment.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-accent-primary mb-3">Assignments</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sceneCast.length > 0 && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium mb-2 block">Cast</span>
                      <div className="flex flex-wrap gap-2">
                        {sceneCast.map((cast) => (
                          <button
                            key={cast.id}
                            onClick={() => handleNavigate('cast', cast.id)}
                            className="px-3 py-1.5 bg-background-tertiary rounded-lg border-2 border-accent-primary/30 hover:border-accent-primary transition-colors cursor-pointer text-left ring-1 ring-transparent hover:ring-accent-primary/20"
                          >
                            <span className="text-sm text-text-primary">{cast.characterName}</span>
                            {cast.actorName && (
                              <span className="text-xs text-text-tertiary ml-2">({cast.actorName})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {sceneCrew.length > 0 && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium mb-2 block">Crew</span>
                      <div className="flex flex-wrap gap-2">
                        {sceneCrew.map((crew) => (
                          <button
                            key={crew.id}
                            onClick={() => handleNavigate('crew', crew.id)}
                            className="px-3 py-1.5 bg-background-tertiary rounded-lg border-2 border-accent-primary/30 hover:border-accent-primary transition-colors cursor-pointer text-left ring-1 ring-transparent hover:ring-accent-primary/20"
                          >
                            <span className="text-sm text-text-primary">{crew.name}</span>
                            {crew.role && (
                              <span className="text-xs text-text-tertiary ml-2">- {crew.role}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {sceneEquipment.length > 0 && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium mb-2 block">Equipment</span>
                      <div className="flex flex-wrap gap-2">
                        {sceneEquipment.map((eq) => (
                          <button
                            key={eq.id}
                            onClick={() => handleNavigate('equipment', eq.id)}
                            className="px-3 py-1.5 bg-background-tertiary rounded-lg border-2 border-accent-primary/30 hover:border-accent-primary transition-colors cursor-pointer text-left ring-1 ring-transparent hover:ring-accent-primary/20"
                          >
                            <span className="text-sm text-text-primary">{eq.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Production Details */}
            {(scene.continuityNotes || scene.specialRequirements || scene.vfxNotes || scene.stuntsRequired) && (
              <div>
                <h3 className="text-lg font-semibold text-accent-primary mb-3">Production Details</h3>
                <div className="space-y-3">
                  {scene.stuntsRequired && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm font-semibold text-error">Stunts Required</span>
                    </div>
                  )}
                  {scene.continuityNotes && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Continuity Notes</span>
                      <p className="text-text-secondary mt-1 whitespace-pre-wrap">{scene.continuityNotes}</p>
                    </div>
                  )}
                  {scene.specialRequirements && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">Special Requirements</span>
                      <p className="text-text-secondary mt-1 whitespace-pre-wrap">{scene.specialRequirements}</p>
                    </div>
                  )}
                  {scene.vfxNotes && (
                    <div>
                      <span className="text-sm text-accent-secondary font-medium">VFX Notes</span>
                      <p className="text-text-secondary mt-1 whitespace-pre-wrap">{scene.vfxNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shots List */}
            {shots && shots.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-accent-primary mb-3">{terminology.shots.plural}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        className="p-4 bg-background-secondary rounded-lg border border-border-default hover:bg-background-tertiary hover:border-accent-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <button
                            onClick={() => onViewShot?.(shot)}
                            className="text-left flex-1"
                          >
                            <h4 className="text-base font-semibold text-text-primary">
                              {terminology.shots.singular} {shot.shotNumber}
                              {shot.title && <span className="text-text-secondary ml-2">- {shot.title}</span>}
                            </h4>
                            {shot.shotType && (
                              <span className="text-xs text-text-tertiary capitalize mt-1 inline-block">
                                {shot.shotType.replace('-', ' ')}
                              </span>
                            )}
                            {shot.description && (
                              <p className="text-sm text-text-secondary line-clamp-2 mt-2">{shot.description}</p>
                            )}
                          </button>
                          <div className="flex items-center gap-2 ml-2">
                            {(shot.shootingDayIds?.length > 0 || shot.shootingDayId || scene.shootingDayIds?.length > 0 || scene.shootingDayId) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  syncShot.mutate({ shotId: shot.id });
                                }}
                                className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                                title="Sync to Schedule"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                            <span className={`px-2 py-1 text-xs font-semibold rounded capitalize ${
                              shotStatusColors[shot.status] || shotStatusColors['not-shot']
                            }`}>
                              {shot.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                        {shot.imageUrl && (
                          <div className="relative w-full h-32 mt-3 overflow-hidden bg-background-tertiary rounded">
                            <Image
                              src={shot.imageUrl}
                              alt={shot.title || `${terminology.shots.singular} ${shot.shotNumber}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              unoptimized={shot.imageUrl.startsWith('blob:') || shot.imageUrl.startsWith('data:') || isFirebaseStorageUrl(shot.imageUrl)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-default flex justify-between items-center">
          {(scene.shootingDayIds?.length > 0 || scene.shootingDayId) && (
            <button
              onClick={() => syncScene.mutate({ sceneId: scene.id })}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync to Schedule
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {onEdit && (
              <button onClick={onEdit} className="btn-secondary">
                Edit
              </button>
            )}
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

