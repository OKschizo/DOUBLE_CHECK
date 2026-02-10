'use client';

import { useMemo, useState } from 'react';
import type { Scene } from '@/lib/schemas';

interface TimelineViewProps {
  scenes: Scene[];
  onSceneClick: (scene: Scene) => void;
  terminology: any;
}

export function TimelineView({ scenes, onSceneClick, terminology }: TimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<'compact' | 'normal' | 'detailed'>('normal');

  // Sort scenes by story order (can add storyOrder field) or scene number
  const sortedScenes = useMemo(() => {
    return [...scenes].sort((a, b) => {
      // Use storyOrder if available, otherwise scene number
      const orderA = (a as any).storyOrder || parseInt(a.sceneNumber) || 0;
      const orderB = (b as any).storyOrder || parseInt(b.sceneNumber) || 0;
      return orderA - orderB;
    });
  }, [scenes]);

  // Calculate timeline positions
  const totalDuration = useMemo(() => {
    return sortedScenes.reduce((sum, scene) => sum + (scene.duration || 60), 0);
  }, [sortedScenes]);

  // Detect act breaks (can be enhanced with actual act markers)
  const actBreaks = useMemo(() => {
    const breaks: number[] = [];
    const actSize = Math.ceil(sortedScenes.length / 3); // Rough 3-act structure
    
    if (sortedScenes.length > 6) {
      breaks.push(actSize);
      breaks.push(actSize * 2);
    }
    
    return breaks;
  }, [sortedScenes]);

  const getSceneWidth = (scene: Scene) => {
    if (zoomLevel === 'compact') return 80;
    if (zoomLevel === 'detailed') return 200;
    return 120;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-shot': return 'bg-gray-400';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'omitted': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Zoom:</span>
          <button
            onClick={() => setZoomLevel('compact')}
            className={`px-3 py-1 text-xs rounded ${
              zoomLevel === 'compact' 
                ? 'bg-accent-primary text-white' 
                : 'bg-background-secondary text-text-secondary'
            }`}
          >
            Compact
          </button>
          <button
            onClick={() => setZoomLevel('normal')}
            className={`px-3 py-1 text-xs rounded ${
              zoomLevel === 'normal' 
                ? 'bg-accent-primary text-white' 
                : 'bg-background-secondary text-text-secondary'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setZoomLevel('detailed')}
            className={`px-3 py-1 text-xs rounded ${
              zoomLevel === 'detailed' 
                ? 'bg-accent-primary text-white' 
                : 'bg-background-secondary text-text-secondary'
            }`}
          >
            Detailed
          </button>
        </div>

        <div className="text-sm text-text-secondary">
          {sortedScenes.length} scenes · {(totalDuration / 60).toFixed(1)} min total
        </div>
      </div>

      {/* Timeline */}
      <div className="relative bg-background-secondary border border-border-default rounded-lg p-8 overflow-x-auto">
        {/* Act labels */}
        <div className="flex mb-4 text-xs text-text-tertiary font-semibold tracking-wider">
          <div style={{ width: `${33.33}%` }}>ACT I</div>
          <div style={{ width: `${33.33}%` }} className="text-center">ACT II</div>
          <div style={{ width: `${33.33}%` }} className="text-right">ACT III</div>
        </div>

        {/* Timeline track */}
        <div className="relative h-24 bg-background-tertiary rounded-lg mb-4">
          {/* Act break markers */}
          {actBreaks.map((breakIndex, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-0.5 bg-accent-primary/50"
              style={{ left: `${(breakIndex / sortedScenes.length) * 100}%` }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-accent-primary font-semibold">
                Act {i + 2}
              </div>
            </div>
          ))}

          {/* Scene markers on timeline */}
          {sortedScenes.map((scene, index) => (
            <div
              key={scene.id}
              className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform ${getStatusColor(scene.status)}`}
              style={{
                left: `${(index / sortedScenes.length) * 100}%`,
              }}
              onClick={() => onSceneClick(scene)}
              title={`Scene ${scene.sceneNumber}: ${scene.title || scene.description}`}
            />
          ))}
        </div>

        {/* Scene cards in chronological order */}
        <div className="flex gap-4 pb-4" style={{ minWidth: `${sortedScenes.length * getSceneWidth(sortedScenes[0] || {} as Scene)}px` }}>
          {sortedScenes.map((scene) => {
            const width = getSceneWidth(scene);
            
            return (
              <div
                key={scene.id}
                onClick={() => onSceneClick(scene)}
                className="flex-shrink-0 bg-background-primary border border-border-default rounded-lg p-3 cursor-pointer hover:border-accent-primary hover:shadow-lg transition-all"
                style={{ width: `${width}px` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-text-primary text-sm">
                    {scene.sceneNumber}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(scene.status)}`} />
                </div>
                
                {zoomLevel !== 'compact' && (
                  <>
                    {scene.title && (
                      <div className="text-xs text-text-secondary line-clamp-2 mb-2">
                        {scene.title}
                      </div>
                    )}
                    <div className="text-xs text-text-tertiary">
                      {scene.intExt}/{scene.dayNight}
                    </div>
                  </>
                )}
                
                {zoomLevel === 'detailed' && (
                  <div className="mt-2 pt-2 border-t border-border-subtle text-xs text-text-tertiary">
                    {scene.duration}s · {scene.pageCount || '?'} pgs
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs flex-wrap">
        <span className="text-text-tertiary">Status:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span className="text-text-secondary">Not Shot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-text-secondary">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-text-secondary">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-text-secondary">Omitted</span>
        </div>
      </div>
    </div>
  );
}

