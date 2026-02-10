'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProjectShots } from '@/features/scenes/hooks/useShots';
import { useScenesByProject } from '@/features/scenes/hooks/useScenes';
import { useUpdateShot } from '@/features/scenes/hooks/useShots';

interface ScheduledShotsPanelProps {
  projectId: string;
  shootingDayId: string;
  canEdit: boolean;
  onAddShots?: () => void;
}

export function ScheduledShotsPanel({ 
  projectId, 
  shootingDayId, 
  canEdit,
  onAddShots 
}: ScheduledShotsPanelProps) {
  const { data: allShots = [] } = useProjectShots(projectId);
  const { data: scenes = [] } = useScenesByProject(projectId);
  const updateShot = useUpdateShot();
  
  const [showAddShotModal, setShowAddShotModal] = useState(false);
  const [dragOverShot, setDragOverShot] = useState<string | null>(null);

  // Get shots scheduled for this day
  const scheduledShots = allShots.filter(shot => 
    shot.shootingDayIds?.includes(shootingDayId)
  );

  // Get shots not on this day (available to add)
  const availableShots = allShots.filter(shot => 
    !shot.shootingDayIds?.includes(shootingDayId)
  );

  // Get scene info for a shot
  const getSceneForShot = (sceneId: string) => {
    return scenes.find(s => s.id === sceneId);
  };

  // Remove shot from this day
  const handleRemoveShot = async (shot: any) => {
    const newDayIds = (shot.shootingDayIds || []).filter((id: string) => id !== shootingDayId);
    await updateShot.mutateAsync({
      id: shot.id,
      data: { shootingDayIds: newDayIds }
    });
  };

  // Add shot to this day
  const handleAddShot = async (shot: any) => {
    const currentDayIds = shot.shootingDayIds || [];
    if (!currentDayIds.includes(shootingDayId)) {
      await updateShot.mutateAsync({
        id: shot.id,
        data: { shootingDayIds: [...currentDayIds, shootingDayId] }
      });
    }
    setShowAddShotModal(false);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverShot('panel');
  };

  const handleDragLeave = () => {
    setDragOverShot(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverShot(null);
    
    const shotId = e.dataTransfer.getData('shotId');
    if (shotId) {
      const shot = allShots.find(s => s.id === shotId);
      if (shot) {
        await handleAddShot(shot);
      }
    }
  };

  return (
    <div className="bg-background-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border-default flex justify-between items-center">
        <h4 className="font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Shots ({scheduledShots.length})
        </h4>
        <button
          onClick={() => setShowAddShotModal(true)}
          className="text-sm text-accent-primary hover:text-accent-hover flex items-center gap-1"
        >
          <span>+ Add Shots</span>
        </button>
      </div>

      <div 
        className={`p-4 min-h-[120px] ${dragOverShot === 'panel' ? 'bg-accent-primary/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {scheduledShots.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">
            <p className="text-sm">No shots scheduled for this day</p>
            {canEdit && (
              <p className="text-xs mt-1">Click &quot;Add Shots&quot; or drag shots here</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {scheduledShots.map(shot => {
              const scene = getSceneForShot(shot.sceneId);
              return (
                <div 
                  key={shot.id}
                  className="bg-background-primary border border-border-default rounded-lg overflow-hidden group hover:border-accent-primary transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative bg-background-tertiary">
                    {shot.imageUrl ? (
                      <Image 
                        src={shot.imageUrl} 
                        alt={shot.shotNumber}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveShot(shot)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="text-white text-xs">×</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      {scene && (
                        <span className="text-xs px-1.5 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                          {scene.sceneNumber}
                        </span>
                      )}
                      <span className="text-sm font-medium text-text-primary">{shot.shotNumber}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 truncate">
                      {shot.shotType || 'No type'} {shot.angle && `• ${shot.angle}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Shot Modal */}
      {showAddShotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-primary border border-border-default rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Add Shots to Day</h3>
              <button
                onClick={() => setShowAddShotModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {availableShots.length === 0 ? (
                <p className="text-center text-text-tertiary py-8">
                  All shots are already added to this day
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Group by scene */}
                  {scenes.map(scene => {
                    const sceneAvailableShots = availableShots.filter(s => s.sceneId === scene.id);
                    if (sceneAvailableShots.length === 0) return null;
                    
                    return (
                      <div key={scene.id} className="border border-border-default rounded-lg">
                        <div className="px-3 py-2 bg-background-secondary border-b border-border-default">
                          <span className="font-medium text-text-primary">
                            Scene {scene.sceneNumber}
                          </span>
                          {scene.title && (
                            <span className="text-text-secondary ml-2">- {scene.title}</span>
                          )}
                        </div>
                        <div className="p-2 grid grid-cols-2 gap-2">
                          {sceneAvailableShots.map(shot => (
                            <button
                              key={shot.id}
                              onClick={() => handleAddShot(shot)}
                              className="flex items-center gap-2 p-2 bg-background-tertiary hover:bg-accent-primary/10 rounded-lg text-left transition-colors"
                            >
                              <div className="w-16 h-10 bg-background-secondary rounded overflow-hidden flex-shrink-0">
                                {shot.imageUrl ? (
                                  <Image 
                                    src={shot.imageUrl}
                                    alt={shot.shotNumber}
                                    width={64}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                                    🎬
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{shot.shotNumber}</p>
                                <p className="text-xs text-text-secondary truncate">
                                  {shot.shotType || 'No type'}
                                </p>
                              </div>
                              <span className="text-accent-primary text-sm">+</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border-default">
              <button
                onClick={() => setShowAddShotModal(false)}
                className="w-full py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
