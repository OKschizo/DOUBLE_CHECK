'use client';

import Image from 'next/image';
import type { Scene } from '@/lib/schemas';
import { isFirebaseStorageUrl } from '@/lib/firebase/storage';

const statusConfig = {
  'not-shot': { 
    icon: '⚪', 
    color: 'text-gray-400',
    bg: 'bg-gray-500/10', 
    border: 'border-gray-500/30',
    label: 'Not Shot'
  },
  'in-progress': { 
    icon: '🔵', 
    color: 'text-blue-400',
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30',
    label: 'In Progress'
  },
  'completed': { 
    icon: '✅', 
    color: 'text-green-400',
    bg: 'bg-green-500/10', 
    border: 'border-green-500/30',
    label: 'Completed'
  },
  'omitted': { 
    icon: '❌', 
    color: 'text-red-400',
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30',
    label: 'Omitted'
  },
};

interface EnhancedSceneCardProps {
  scene: Scene;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onApplyCoverage: () => void;
  castMembers: any[];
  locations: any[];
  terminology: any;
  shotCount?: number;
}

export function EnhancedSceneCard({
  scene,
  onClick,
  onEdit,
  onDelete,
  onApplyCoverage,
  castMembers,
  locations,
  terminology,
  shotCount = 0,
}: EnhancedSceneCardProps) {
  const shots = { length: shotCount }; // Use passed shotCount prop
  const status = statusConfig[scene.status as keyof typeof statusConfig] || statusConfig['not-shot'];
  
  const sceneLocationIds = scene.locationIds || (scene.locationId ? [scene.locationId] : []);
  const sceneLocations = locations.filter((loc: any) => sceneLocationIds.includes(loc.id));
  const sceneCast = castMembers.filter((cast: any) => scene.castIds?.includes(cast.id));

  return (
    <div
      className={`group card-elevated overflow-hidden hover:scale-105 transition-all cursor-pointer border-2 ${status.border}`}
      onClick={onClick}
    >
      {/* Image - Larger for visual impact */}
      {scene.imageUrl ? (
        <div className="relative w-full h-56 overflow-hidden bg-background-secondary">
          <Image
            src={scene.imageUrl}
            alt={scene.title || `Scene ${scene.sceneNumber}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={scene.imageUrl.startsWith('blob:') || scene.imageUrl.startsWith('data:') || isFirebaseStorageUrl(scene.imageUrl)}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Shot count badge on image */}
          {shots.length > 0 && (
            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full flex items-center gap-2 text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">{shots.length}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-56 bg-gradient-to-br from-background-secondary to-background-tertiary flex items-center justify-center">
          <svg className="w-20 h-20 text-text-tertiary opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="p-6">
        {/* Header with scene number and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-text-primary">
                {terminology.scenes.singular} {scene.sceneNumber}
              </h3>
              <div className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${status.bg} ${status.border} border`}>
                <span>{status.icon}</span>
                <span className={status.color}>{status.label}</span>
              </div>
            </div>
            {scene.title && (
              <p className="text-sm font-medium text-text-secondary">{scene.title}</p>
            )}
          </div>
        </div>

        {/* Scene heading (INT/EXT, Location, Day/Night) */}
        <div className="mb-4 py-2 px-3 bg-background-secondary rounded-lg border border-border-subtle">
          <p className="text-sm font-mono font-semibold text-accent-primary">
            {scene.intExt}. {sceneLocations[0]?.name || scene.locationName || 'Location'} - {scene.dayNight}
          </p>
        </div>

        {/* Description */}
        {scene.description && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-3">
            {scene.description}
          </p>
        )}

        {/* Quick Stats Row */}
        <div className="flex items-center gap-3 mb-4 text-xs text-text-tertiary flex-wrap">
          {scene.pageCount && (
            <div className="flex items-center gap-1">
              <span>📄</span>
              <span>{scene.pageCount} pages</span>
            </div>
          )}
          {scene.duration && (
            <div className="flex items-center gap-1">
              <span>⏱</span>
              <span>{scene.duration}s</span>
            </div>
          )}
          {sceneCast.length > 0 && (
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>{sceneCast.length} cast</span>
            </div>
          )}
          {shots.length > 0 && (
            <div className="flex items-center gap-1 font-semibold text-accent-primary">
              <span>🎬</span>
              <span>{shots.length} shots</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border-subtle mb-4"></div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 btn-secondary text-sm py-2"
          >
            ✏️ Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApplyCoverage();
            }}
            className="flex-1 btn-secondary text-sm py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"
          >
            📋 Coverage
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete scene ${scene.sceneNumber}?`)) {
                onDelete();
              }
            }}
            className="p-2 hover:bg-error/10 rounded transition-colors text-text-tertiary hover:text-error"
            title="Delete Scene"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

