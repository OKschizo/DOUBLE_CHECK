'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Shot } from '@/lib/schemas';
import { uploadImage } from '@/lib/firebase/storage';

interface ExpandableShotCardProps {
  shot: Shot;
  sceneNumber: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (data: Partial<Shot>) => Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  onCreateVariant: () => void;
  castMembers: any[];
  equipment: any[];
}

export function ExpandableShotCard({
  shot,
  sceneNumber,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onDuplicate,
  onCreateVariant,
  castMembers,
  equipment,
}: ExpandableShotCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    shotType: shot.shotType || 'master',
    cameraAngle: shot.cameraAngle || '',
    lens: shot.lens || '',
    duration: shot.duration || 0,
    description: shot.description || '',
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    await onUpdate(editData);
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const path = `shots/${shot.id}/${Date.now()}-${file.name}`;
      const url = await uploadImage(file, path);
      await onUpdate({ imageUrl: url });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const coverageTypeColors = {
    master: 'bg-purple-500/20 text-purple-400',
    medium: 'bg-blue-500/20 text-blue-400',
    closeup: 'bg-green-500/20 text-green-400',
    insert: 'bg-yellow-500/20 text-yellow-400',
    cutaway: 'bg-orange-500/20 text-orange-400',
  };

  const coverageType = (shot as any).coverageType || 'medium';

  return (
    <div
      className={`
        group bg-background-secondary border-2 border-border-default rounded-lg overflow-hidden
        transition-all duration-200
        ${isExpanded ? 'shadow-xl scale-105 border-accent-primary' : 'hover:border-accent-primary/50 hover:shadow-md'}
      `}
    >
      {/* Compact View */}
      <div
        onClick={onToggleExpand}
        className="cursor-pointer"
      >
        {/* Image */}
        <div className="relative aspect-video bg-black/20">
          {shot.imageUrl ? (
            <Image
              src={shot.imageUrl}
              alt={`Shot ${shot.shotNumber}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
              <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Shot number badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-background-primary/90 rounded font-bold text-sm">
            {shot.shotNumber}
          </div>

          {/* Coverage type badge */}
          {(shot as any).isMaster && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500 text-white rounded text-xs font-bold">
              MASTER
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${coverageTypeColors[coverageType as keyof typeof coverageTypeColors] || coverageTypeColors.medium}`}>
              {shot.shotType || 'Shot'}
            </span>
            {shot.duration && (
              <span className="text-xs text-text-tertiary">⏱ {shot.duration}s</span>
            )}
          </div>
          <p className="text-sm text-text-secondary line-clamp-2">
            {shot.description || shot.actionDescription || 'No description'}
          </p>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-border-default p-4 bg-background-primary">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Shot Type</label>
                  <select
                    value={editData.shotType}
                    onChange={(e) => setEditData({ ...editData, shotType: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="master">Master</option>
                    <option value="wide">Wide</option>
                    <option value="medium">Medium</option>
                    <option value="close-up">Close-up</option>
                    <option value="insert">Insert</option>
                    <option value="cutaway">Cutaway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Camera Angle</label>
                  <input
                    type="text"
                    value={editData.cameraAngle}
                    onChange={(e) => setEditData({ ...editData, cameraAngle: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Eye level, High angle..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Lens</label>
                  <input
                    type="text"
                    value={editData.lens}
                    onChange={(e) => setEditData({ ...editData, lens: e.target.value })}
                    className="input-field text-sm"
                    placeholder="24mm, 50mm..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    value={editData.duration}
                    onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) })}
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="input-field text-sm"
                  rows={3}
                  placeholder="Shot description..."
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSave} className="btn-primary text-sm">
                  Save Changes
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-3">
              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-tertiary">Angle:</span>
                  <span className="ml-2 text-text-primary">{shot.cameraAngle || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Lens:</span>
                  <span className="ml-2 text-text-primary">{shot.lens || 'Not specified'}</span>
                </div>
                {shot.movement && (
                  <div className="col-span-2">
                    <span className="text-text-tertiary">Movement:</span>
                    <span className="ml-2 text-text-primary">{shot.movement}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border-subtle flex-wrap">
                <button onClick={() => setIsEditing(true)} className="btn-secondary text-xs">
                  ✏️ Edit
                </button>
                <label className="btn-secondary text-xs cursor-pointer">
                  {isUploading ? '⏳ Uploading...' : '📷 Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    disabled={isUploading}
                  />
                </label>
                <button onClick={onDuplicate} className="btn-secondary text-xs">
                  📋 Duplicate
                </button>
                <button onClick={onCreateVariant} className="btn-secondary text-xs">
                  🔀 Variant
                </button>
                <button onClick={onDelete} className="btn-secondary text-xs text-error hover:bg-error/10">
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

