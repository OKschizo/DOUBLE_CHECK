'use client';

import { useState, useMemo } from 'react';
import type { Scene } from '@/lib/schemas';

interface StripboardViewProps {
  scenes: Scene[];
  onReorder: (reorderedScenes: Scene[]) => void;
  onSceneClick: (scene: Scene) => void;
  onEditScene: (scene: Scene) => void;
  castMembers: any[];
  locations: any[];
  terminology: any;
}

// Stripboard color coding (traditional film production colors)
const getStripColor = (scene: Scene) => {
  const intExt = scene.intExt?.toUpperCase();
  const dayNight = scene.dayNight?.toUpperCase();
  
  if (intExt === 'INT' && dayNight === 'DAY') return 'bg-blue-200 border-blue-400 text-blue-900';
  if (intExt === 'INT' && dayNight === 'NIGHT') return 'bg-blue-600 border-blue-800 text-white';
  if (intExt === 'EXT' && dayNight === 'DAY') return 'bg-yellow-200 border-yellow-400 text-yellow-900';
  if (intExt === 'EXT' && dayNight === 'NIGHT') return 'bg-blue-800 border-blue-950 text-white';
  if (intExt === 'EXT' && dayNight === 'DAWN') return 'bg-orange-300 border-orange-500 text-orange-900';
  if (intExt === 'EXT' && dayNight === 'DUSK') return 'bg-purple-300 border-purple-500 text-purple-900';
  
  return 'bg-gray-200 border-gray-400 text-gray-900'; // Default
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'not-shot': return '⚪';
    case 'in-progress': return '🔵';
    case 'completed': return '✅';
    case 'omitted': return '❌';
    default: return '⚪';
  }
};

export function StripboardView({
  scenes,
  onReorder,
  onSceneClick,
  onEditScene,
  castMembers,
  locations,
  terminology,
}: StripboardViewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'location' | 'dayNight' | 'intExt'>('none');
  const [sortBy, setSortBy] = useState<'scene' | 'location' | 'pages'>('scene');

  // Calculate total pages
  const totalPages = useMemo(() => {
    return scenes.reduce((sum, scene) => {
      const pages = parseFloat(scene.pageCount as any) || 0;
      return sum + pages;
    }, 0);
  }, [scenes]);

  // Group scenes if requested
  const groupedScenes = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Scenes': scenes };
    }

    const groups: Record<string, Scene[]> = {};
    
    scenes.forEach(scene => {
      let key = 'Ungrouped';
      
      if (groupBy === 'location') {
        key = scene.locationNames?.[0] || scene.locationName || 'No Location';
      } else if (groupBy === 'dayNight') {
        key = scene.dayNight || 'Unspecified';
      } else if (groupBy === 'intExt') {
        key = scene.intExt || 'Unspecified';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(scene);
    });
    
    return groups;
  }, [scenes, groupBy]);

  // Get cast count for scene
  const getCastCount = (scene: Scene) => {
    return scene.castIds?.length || 0;
  };

  // Handle drag and drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...scenes];
    const [draggedScene] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedScene);
    
    onReorder(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between bg-background-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="input-field py-1 text-sm"
            >
              <option value="none">None</option>
              <option value="location">Location</option>
              <option value="intExt">INT/EXT</option>
              <option value="dayNight">Day/Night</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field py-1 text-sm"
            >
              <option value="scene">Scene Number</option>
              <option value="location">Location</option>
              <option value="pages">Page Count</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-text-secondary">
            <span className="font-bold text-text-primary">{scenes.length}</span> scenes
            {' · '}
            <span className="font-bold text-text-primary">{totalPages.toFixed(2)}</span> pages
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <span className="text-text-tertiary">Strip Colors:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
          <span className="text-text-secondary">INT/DAY</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 border border-blue-800 rounded"></div>
          <span className="text-text-secondary">INT/NIGHT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
          <span className="text-text-secondary">EXT/DAY</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-800 border border-blue-950 rounded"></div>
          <span className="text-text-secondary">EXT/NIGHT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-300 border border-orange-500 rounded"></div>
          <span className="text-text-secondary">DAWN</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-300 border border-purple-500 rounded"></div>
          <span className="text-text-secondary">DUSK</span>
        </div>
      </div>

      {/* Stripboard */}
      <div className="space-y-6">
        {Object.entries(groupedScenes).map(([groupName, groupScenes]) => (
          <div key={groupName}>
            {groupBy !== 'none' && (
              <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                {groupName}
                <span className="text-sm font-normal text-text-tertiary">
                  ({groupScenes.length} scenes)
                </span>
              </h3>
            )}
            
            <div className="space-y-2">
              {groupScenes.map((scene, index) => {
                const actualIndex = scenes.indexOf(scene);
                const stripColor = getStripColor(scene);
                const castCount = getCastCount(scene);
                const pages = parseFloat(scene.pageCount as any) || 0;
                const isDragging = draggedIndex === actualIndex;
                const isDragOver = dragOverIndex === actualIndex;
                
                return (
                  <div
                    key={scene.id}
                    draggable
                    onDragStart={() => handleDragStart(actualIndex)}
                    onDragOver={(e) => handleDragOver(e, actualIndex)}
                    onDrop={(e) => handleDrop(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    className={`
                      ${stripColor}
                      border-2 rounded-lg p-4 cursor-move transition-all
                      hover:shadow-lg hover:scale-[1.01]
                      ${isDragging ? 'opacity-50 scale-95' : ''}
                      ${isDragOver ? 'border-accent-primary border-dashed scale-105' : ''}
                    `}
                    onClick={() => onSceneClick(scene)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Scene Number */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-2xl font-bold">{scene.sceneNumber}</div>
                        <div className="text-xs opacity-70">{getStatusIcon(scene.status)}</div>
                      </div>

                      {/* Scene Heading */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg mb-1">
                          {scene.intExt}. {scene.locationNames?.[0] || scene.locationName || 'Location'} - {scene.dayNight}
                        </div>
                        <div className="text-sm opacity-90 truncate">
                          {scene.description || scene.title}
                        </div>
                      </div>

                      {/* Cast Count */}
                      {castCount > 0 && (
                        <div className="flex items-center gap-1 text-sm px-3 py-1 bg-black/10 rounded">
                          <span>👤</span>
                          <span className="font-semibold">{castCount}</span>
                        </div>
                      )}

                      {/* Pages */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xl font-bold">{pages.toFixed(1)}</div>
                        <div className="text-xs opacity-70">pages</div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditScene(scene);
                          }}
                          className="p-2 hover:bg-black/10 rounded transition-colors"
                          title="Edit Scene"
                        >
                          ✏️
                        </button>
                        <button
                          className="p-2 hover:bg-black/10 rounded transition-colors cursor-grab active:cursor-grabbing"
                          title="Drag to Reorder"
                        >
                          ⋮⋮
                        </button>
                      </div>
                    </div>

                    {/* Additional Info Row */}
                    <div className="mt-2 pt-2 border-t border-current/20 flex items-center gap-4 text-xs opacity-75">
                      {scene.locationNames?.[0] && (
                        <span>📍 {scene.locationNames[0]}</span>
                      )}
                      {scene.duration && (
                        <span>⏱ {scene.duration}s</span>
                      )}
                      {scene.specialRequirements && (
                        <span>⚠️ Special Requirements</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Footer */}
      <div className="card-elevated p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-text-primary">{scenes.length}</div>
            <div className="text-xs text-text-secondary">Total Scenes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{totalPages.toFixed(1)}</div>
            <div className="text-xs text-text-secondary">Total Pages</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">
              {scenes.filter(s => s.intExt === 'INT').length}
            </div>
            <div className="text-xs text-text-secondary">Interior Scenes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">
              {scenes.filter(s => s.intExt === 'EXT').length}
            </div>
            <div className="text-xs text-text-secondary">Exterior Scenes</div>
          </div>
        </div>
      </div>
    </div>
  );
}

