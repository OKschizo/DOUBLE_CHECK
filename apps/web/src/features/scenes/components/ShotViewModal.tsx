'use client';

import { trpc } from '@/lib/trpc/client';
import { getProjectTerminology } from '@/shared/utils/projectTerminology';
import { isFirebaseStorageUrl } from '@/lib/firebase/storage';
import type { Shot } from '@/lib/schemas';
import Image from 'next/image';

interface ShotViewModalProps {
  shot: Shot;
  projectId: string;
  castMembers: any[];
  crewMembers: any[];
  equipment: any[];
  locations: any[];
  schedule: any;
  onClose: () => void;
  onEdit?: () => void;
  onNavigate?: (view: string) => void;
}

export function ShotViewModal({
  shot,
  projectId,
  castMembers,
  crewMembers,
  equipment,
  locations,
  schedule,
  onClose,
  onEdit,
  onNavigate,
}: ShotViewModalProps) {
  const utils = trpc.useUtils();
  const { data: project } = trpc.projects.getById.useQuery({ id: projectId });
  const terminology = getProjectTerminology(project?.projectType);

  const handleNavigate = (view: string, elementId?: string) => {
    const hash = elementId ? `${view}?id=${elementId}` : view;
    if (onNavigate) {
      onNavigate(hash);
    } else {
      window.location.hash = hash;
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  const shotLocationIds = shot.locationIds || [];
  const shotLocations = locations.filter((loc) => shotLocationIds.includes(loc.id));
  const shotCast = castMembers.filter((cast) => shot.castIds?.includes(cast.id));
  const shotCrew = crewMembers.filter((crew) => shot.crewIds?.includes(crew.id));
  const shotEquipment = equipment.filter((eq) => shot.equipmentIds?.includes(eq.id));
  const shotShootingDayIds = shot.shootingDayIds || [];
  const shootingDays = schedule?.days?.filter((day: any) => shotShootingDayIds.includes(day.id)) || [];

  const statusColors = {
    'not-shot': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'completed': 'bg-green-500/10 text-green-400 border-green-500/30',
    'omitted': 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  // Group references by category
  const referencesByCategory = (shot.shotReferences || []).reduce((acc, ref) => {
    if (!acc[ref.category]) acc[ref.category] = [];
    acc[ref.category].push(ref);
    return acc;
  }, {} as Record<string, typeof shot.shotReferences>);

  const categoryLabels: Record<string, string> = {
    wardrobe: 'Wardrobe',
    camera: 'Camera',
    location: 'Location',
    character: 'Character',
    other: 'Other',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background-primary rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-text-primary">
                {terminology.shots.singular} {shot.shotNumber}
              </h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded capitalize border ${
                statusColors[shot.status] || statusColors['not-shot']
              }`}>
                {shot.status.replace('-', ' ')}
              </span>
              {shot.shotType && (
                <span className="px-3 py-1 text-sm bg-background-tertiary rounded capitalize text-text-secondary">
                  {shot.shotType.replace('-', ' ')}
                </span>
              )}
            </div>
            {shot.title && (
              <p className="text-lg text-text-secondary">{shot.title}</p>
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
          <div className="space-y-8">
            {/* Main Image and References */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {shot.imageUrl ? (
                        <div className="relative w-full aspect-video overflow-hidden bg-background-secondary rounded-lg border border-border-default">
                            <Image
                                src={shot.imageUrl}
                                alt={shot.title || `${terminology.shots.singular} ${shot.shotNumber}`}
                                fill
                                className="object-contain"
                                unoptimized={shot.imageUrl.startsWith('blob:') || shot.imageUrl.startsWith('data:') || isFirebaseStorageUrl(shot.imageUrl)}
                            />
                        </div>
                    ) : (
                        <div className="aspect-video bg-background-secondary rounded-lg border border-border-default flex items-center justify-center text-text-tertiary">
                            No storyboard image
                        </div>
                    )}
                </div>
                
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold text-accent-primary border-b border-border-default pb-2">Reference Images</h3>
                    {Object.keys(referencesByCategory).length === 0 ? (
                        <p className="text-sm text-text-tertiary italic">No reference images attached.</p>
                    ) : (
                        Object.entries(referencesByCategory).map(([category, refs]) => (
                            <div key={category}>
                                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{categoryLabels[category] || category}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {refs?.map((ref: any) => (
                                        <div key={ref.id} className="relative aspect-square rounded-lg overflow-hidden border border-border-subtle group cursor-pointer hover:border-accent-primary transition-colors">
                                            <Image
                                                src={ref.url}
                                                alt={category}
                                                fill
                                                className="object-cover"
                                                unoptimized={isFirebaseStorageUrl(ref.url)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Description & Production */}
                <div className="space-y-6">
                    {shot.description && (
                    <div>
                        <h3 className="text-lg font-semibold text-accent-primary mb-2">Description</h3>
                        <p className="text-text-secondary whitespace-pre-wrap">{shot.description}</p>
                    </div>
                    )}

                    {(shot.duration || shot.lightingSetup || shot.slateInfo || shot.takeNumbers?.length > 0) && (
                    <div>
                        <h3 className="text-lg font-semibold text-accent-primary mb-3">Production Info</h3>
                        <div className="space-y-3">
                            {shot.duration && (
                                <div className="flex justify-between border-b border-border-subtle pb-1">
                                    <span className="text-sm text-text-secondary">Duration</span>
                                    <span className="text-sm text-text-primary font-medium">{shot.duration}s</span>
                                </div>
                            )}
                            {shot.lightingSetup && (
                                <div className="flex justify-between border-b border-border-subtle pb-1">
                                    <span className="text-sm text-text-secondary">Lighting</span>
                                    <span className="text-sm text-text-primary font-medium">{shot.lightingSetup}</span>
                                </div>
                            )}
                            {shot.slateInfo && (
                                <div className="flex justify-between border-b border-border-subtle pb-1">
                                    <span className="text-sm text-text-secondary">Slate</span>
                                    <span className="text-sm text-text-primary font-medium">{shot.slateInfo}</span>
                                </div>
                            )}
                        </div>
                        {shot.takeNumbers && shot.takeNumbers.length > 0 && (
                        <div className="mt-3">
                            <span className="text-sm text-text-secondary mb-2 block">Takes</span>
                            <div className="flex flex-wrap gap-2">
                            {shot.takeNumbers.map((take) => (
                                <span key={take} className={`px-2 py-1 rounded text-xs font-medium border ${shot.bestTake === take ? 'bg-accent-primary border-accent-primary' : 'bg-background-tertiary border-border-default'}`} style={shot.bestTake === take ? { color: 'rgb(var(--colored-button-text))' } : undefined}>
                                    Take {take} {shot.bestTake === take && '✓'}
                                </span>
                            ))}
                            </div>
                        </div>
                        )}
                    </div>
                    )}
                </div>

                {/* Right Column: Camera, Location, Assignments */}
                <div className="space-y-6">
                    {(shot.cameraAngle || shot.cameraMovement || shot.lens || shot.focalLength || shot.frameRate || shot.resolution) && (
                    <div>
                        <h3 className="text-lg font-semibold text-accent-primary mb-3">Camera</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {shot.cameraAngle && <div><span className="text-xs text-text-tertiary block">Angle</span><span className="text-sm text-text-primary">{shot.cameraAngle}</span></div>}
                            {shot.cameraMovement && <div><span className="text-xs text-text-tertiary block">Movement</span><span className="text-sm text-text-primary">{shot.cameraMovement}</span></div>}
                            {shot.lens && <div><span className="text-xs text-text-tertiary block">Lens</span><span className="text-sm text-text-primary">{shot.lens}</span></div>}
                            {shot.focalLength && <div><span className="text-xs text-text-tertiary block">Focal Length</span><span className="text-sm text-text-primary">{shot.focalLength}mm</span></div>}
                            {shot.frameRate && <div><span className="text-xs text-text-tertiary block">FPS</span><span className="text-sm text-text-primary">{shot.frameRate}</span></div>}
                            {shot.resolution && <div><span className="text-xs text-text-tertiary block">Res</span><span className="text-sm text-text-primary">{shot.resolution}</span></div>}
                        </div>
                    </div>
                    )}

                    {(shotLocations.length > 0 || shootingDays.length > 0) && (
                    <div>
                        <h3 className="text-lg font-semibold text-accent-primary mb-3">Logistics</h3>
                        <div className="space-y-3">
                            {shotLocations.length > 0 && (
                                <div>
                                    <span className="text-xs text-text-tertiary block mb-1">Locations</span>
                                    <div className="flex flex-wrap gap-2">
                                        {shotLocations.map(loc => (
                                            <span key={loc.id} className="px-2 py-1 bg-background-tertiary rounded text-xs border border-border-default">{loc.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {shootingDays.length > 0 && (
                                <div>
                                    <span className="text-xs text-text-tertiary block mb-1">Schedule</span>
                                    <div className="flex flex-wrap gap-2">
                                        {shootingDays.map((day: any) => (
                                            <span key={day.id} className="px-2 py-1 bg-background-tertiary rounded text-xs border border-border-default">
                                                {new Date(day.date).toLocaleDateString()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* Creative Information - Full Width */}
            {(shot.composition || shot.blocking || shot.actionDescription) && (
              <div>
                <h3 className="text-lg font-semibold text-accent-primary mb-3">Creative Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {shot.composition && (
                    <div className="bg-background-secondary p-3 rounded border border-border-subtle">
                      <span className="text-xs text-accent-secondary font-bold uppercase tracking-wider mb-1 block">Composition</span>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{shot.composition}</p>
                    </div>
                  )}
                  {shot.blocking && (
                    <div className="bg-background-secondary p-3 rounded border border-border-subtle">
                      <span className="text-xs text-accent-secondary font-bold uppercase tracking-wider mb-1 block">Blocking</span>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{shot.blocking}</p>
                    </div>
                  )}
                  {shot.actionDescription && (
                    <div className="bg-background-secondary p-3 rounded border border-border-subtle">
                      <span className="text-xs text-accent-secondary font-bold uppercase tracking-wider mb-1 block">Action</span>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{shot.actionDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-default flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
