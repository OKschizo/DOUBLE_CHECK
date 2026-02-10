'use client';

import { useState } from 'react';
// import { trpc } from '@/lib/trpc/client';
import { getProjectTerminology } from '@/shared/utils/projectTerminology';
import { useProject } from '@/features/projects/hooks/useProjects';
import { useScenesByProject } from '@/features/scenes/hooks/useScenes';
import { useShotsByScene } from '@/features/scenes/hooks/useShots';
import { useSchedule } from '@/features/projects/hooks/useSchedule';

interface ScheduleSyncModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleSyncModal({ projectId, isOpen, onClose }: ScheduleSyncModalProps) {
  const { data: project } = useProject(projectId);
  const { data: scenes = [] } = useScenesByProject(projectId);
  const terminology = getProjectTerminology(project?.projectType);
  const { schedule } = useSchedule(projectId);

  // Placeholder mutations
  const syncAllScenes = { isPending: false, mutate: (args: any) => alert("Sync logic needs to be implemented on client or cloud function") };
  const syncScene = { isPending: false, mutate: (args: any) => alert("Sync logic needs to be implemented on client or cloud function") };
  const syncShot = { isPending: false, mutate: (args: any) => alert("Sync logic needs to be implemented on client or cloud function") };

  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const { data: shots = [] } = useShotsByScene(selectedSceneId);

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  if (!isOpen) return null;

  const scenesWithShootingDays = scenes.filter(scene => {
    const shootingDayIds = scene.shootingDayIds || (scene.shootingDayId ? [scene.shootingDayId] : []);
    return shootingDayIds.length > 0;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border-default rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-2xl font-bold text-text-primary">Sync to Schedule</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Sync All Scenes */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                Sync All {terminology.scenes.plural}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Sync all {terminology.scenes.plural.toLowerCase()} with shooting days to the schedule. This will add schedule events for all shots within those {terminology.scenes.plural.toLowerCase()}.
              </p>
              <button
                onClick={() => syncAllScenes.mutate({ projectId })}
                disabled={syncAllScenes.isPending || scenesWithShootingDays.length === 0}
                className="btn-primary w-full"
              >
                {syncAllScenes.isPending ? 'Syncing...' : `Sync All ${terminology.scenes.plural} (${scenesWithShootingDays.length})`}
              </button>
            </div>

            {/* Sync Individual Scene */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                Sync Individual {terminology.scenes.singular}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Select a {terminology.scenes.singular.toLowerCase()} to sync all its shots to the schedule.
              </p>
              <select
                value={selectedSceneId}
                onChange={(e) => setSelectedSceneId(e.target.value)}
                className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary mb-3"
              >
                <option value="">Select a {terminology.scenes.singular.toLowerCase()}...</option>
                {scenesWithShootingDays.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {terminology.scenes.singular} {scene.sceneNumber} {scene.title ? `- ${scene.title}` : ''}
                  </option>
                ))}
              </select>
              {selectedSceneId && (
                <button
                  onClick={() => syncScene.mutate({ sceneId: selectedSceneId })}
                  disabled={syncScene.isPending}
                  className="btn-primary w-full"
                >
                  {syncScene.isPending ? 'Syncing...' : `Sync ${terminology.scenes.singular}`}
                </button>
              )}
            </div>

            {/* Sync Individual Shot */}
            {selectedSceneId && shots.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  Sync Individual {terminology.shots.singular}
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Select a {terminology.shots.singular.toLowerCase()} to sync it to the schedule.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {shots.map((shot) => {
                    const shotShootingDayIds = shot.shootingDayIds || [];
                    const hasShootingDays = shotShootingDayIds.length > 0;
                    
                    return (
                      <div
                        key={shot.id}
                        className="flex items-center justify-between p-3 bg-background-primary rounded-lg border border-border-default"
                      >
                        <div>
                          <div className="font-medium text-text-primary">
                            {terminology.shots.singular} {shot.shotNumber} {shot.title ? `- ${shot.title}` : ''}
                          </div>
                          {hasShootingDays ? (
                            <div className="text-xs text-text-tertiary mt-1">
                              {shotShootingDayIds.length} shooting day(s)
                            </div>
                          ) : (
                            <div className="text-xs text-text-tertiary mt-1">
                              Will inherit from {terminology.scenes.singular.toLowerCase()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => syncShot.mutate({ shotId: shot.id })}
                          disabled={syncShot.isPending}
                          className="btn-secondary text-sm"
                        >
                          {syncShot.isPending ? 'Syncing...' : 'Sync'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
