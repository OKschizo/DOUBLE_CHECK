'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';

interface CreateFromModalProps {
  projectId: string;
  onClose: () => void;
  onCreateFromCrew: (ids: string[]) => void;
  onCreateFromEquipment: (ids: string[]) => void;
  onCreateFromLocations: (ids: string[]) => void;
  onCreateFromCast: (ids: string[]) => void;
}

export function CreateFromModal({
  projectId,
  onClose,
  onCreateFromCrew,
  onCreateFromEquipment,
  onCreateFromLocations,
  onCreateFromCast,
}: CreateFromModalProps) {
  const [sourceType, setSourceType] = useState<'crew' | 'equipment' | 'locations' | 'cast'>('crew');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: crewMembers = [] } = trpc.crew.listByProject.useQuery({ projectId });
  const { data: equipment = [] } = trpc.equipment.listByProject.useQuery({ projectId });
  const { data: locations = [] } = trpc.locations.listByProject.useQuery({ projectId });
  const { data: castMembers = [] } = trpc.cast.listByProject.useQuery({ projectId });

  const handleCreate = () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    if (sourceType === 'crew') {
      onCreateFromCrew(ids);
    } else if (sourceType === 'equipment') {
      onCreateFromEquipment(ids);
    } else if (sourceType === 'locations') {
      onCreateFromLocations(ids);
    } else {
      onCreateFromCast(ids);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (sourceType === 'crew') {
      setSelectedIds(new Set(crewMembers.map(c => c.id)));
    } else if (sourceType === 'equipment') {
      setSelectedIds(new Set(equipment.map(e => e.id)));
    } else if (sourceType === 'locations') {
      setSelectedIds(new Set(locations.map(l => l.id)));
    } else {
      setSelectedIds(new Set(castMembers.map(c => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background-secondary rounded-lg border border-border-default p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create Budget Items From</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Source Type Tabs */}
        <div className="flex gap-2 mb-4 border-b border-border-default">
          {(['crew', 'equipment', 'locations', 'cast'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setSourceType(type);
                setSelectedIds(new Set());
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                sourceType === type
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {type === 'crew' ? 'Crew' : type === 'equipment' ? 'Equipment' : type === 'locations' ? 'Locations' : 'Cast'}
            </button>
          ))}
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-text-secondary">
            {selectedIds.size} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-xs bg-background-tertiary border border-border-default rounded hover:bg-background-secondary transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-xs bg-background-tertiary border border-border-default rounded hover:bg-background-secondary transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {sourceType === 'crew' && crewMembers.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg border border-border-default hover:bg-background-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(member.id)}
                onChange={() => toggleSelection(member.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-text-secondary">
                  {member.role} • {member.department}
                  {member.rate && ` • $${member.rate}/${member.rateType || 'day'}`}
                </div>
              </div>
            </label>
          ))}
          {sourceType === 'equipment' && equipment.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg border border-border-default hover:bg-background-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleSelection(item.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-text-secondary">
                  {item.category}
                  {item.dailyRate && ` • $${item.dailyRate}/day`}
                  {item.weeklyRate && ` • $${item.weeklyRate}/week`}
                </div>
              </div>
            </label>
          ))}
          {sourceType === 'locations' && locations.map((location) => (
            <label
              key={location.id}
              className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg border border-border-default hover:bg-background-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(location.id)}
                onChange={() => toggleSelection(location.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-text-secondary">
                  {location.address}
                  {location.rentalCost && ` • $${location.rentalCost}`}
                </div>
              </div>
            </label>
          ))}
          {sourceType === 'cast' && castMembers.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg border border-border-default hover:bg-background-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(member.id)}
                onChange={() => toggleSelection(member.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-medium">{member.actorName}</div>
                <div className="text-sm text-text-secondary">
                  as {member.characterName} • {member.castType}
                  {member.rate && ` • $${member.rate}`}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-tertiary border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Create Budget Items ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}

