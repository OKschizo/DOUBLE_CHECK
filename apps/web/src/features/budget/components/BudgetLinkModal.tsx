'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { BudgetItem } from '@/lib/schemas';

interface BudgetLinkModalProps {
  projectId: string;
  budgetItem: BudgetItem;
  onClose: () => void;
  onLink: (linkData: {
    linkedCrewMemberId?: string;
    linkedEquipmentId?: string;
    linkedLocationId?: string;
    linkedCastMemberId?: string;
  }) => void;
}

export function BudgetLinkModal({ projectId, budgetItem, onClose, onLink }: BudgetLinkModalProps) {
  const [linkType, setLinkType] = useState<'crew' | 'equipment' | 'location' | 'cast'>('crew');
  const [selectedId, setSelectedId] = useState<string>('');

  const { data: crewMembers = [] } = trpc.crew.listByProject.useQuery({ projectId });
  const { data: equipment = [] } = trpc.equipment.listByProject.useQuery({ projectId });
  const { data: locations = [] } = trpc.locations.listByProject.useQuery({ projectId });
  const { data: castMembers = [] } = trpc.cast.listByProject.useQuery({ projectId });

  const handleLink = () => {
    if (!selectedId) return;

    const linkData: any = {};
    if (linkType === 'crew') linkData.linkedCrewMemberId = selectedId;
    if (linkType === 'equipment') linkData.linkedEquipmentId = selectedId;
    if (linkType === 'location') linkData.linkedLocationId = selectedId;
    if (linkType === 'cast') linkData.linkedCastMemberId = selectedId;

    onLink(linkData);
    onClose();
  };

  const getSelectedItem = () => {
    if (!selectedId) return null;
    if (linkType === 'crew') return crewMembers.find(c => c.id === selectedId);
    if (linkType === 'equipment') return equipment.find(e => e.id === selectedId);
    if (linkType === 'location') return locations.find(l => l.id === selectedId);
    if (linkType === 'cast') return castMembers.find(c => c.id === selectedId);
    return null;
  };

  const selectedItem = getSelectedItem();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background-secondary rounded-lg border border-border-default p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Link Budget Item</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-text-secondary mb-2">
            Link &quot;{budgetItem.description}&quot; to:
          </p>
        </div>

        {/* Link Type Tabs */}
        <div className="flex gap-2 mb-4 border-b border-border-default">
          {(['crew', 'equipment', 'location', 'cast'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setLinkType(type);
                setSelectedId('');
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                linkType === type
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select {linkType === 'crew' ? 'Crew Member' : linkType === 'equipment' ? 'Equipment' : linkType === 'location' ? 'Location' : 'Cast Member'}
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 bg-background-tertiary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="">-- Select --</option>
            {linkType === 'crew' && crewMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} - {member.role} ({member.department})
                {member.rate && ` - $${member.rate}/${member.rateType || 'day'}`}
              </option>
            ))}
            {linkType === 'equipment' && equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category})
                {item.dailyRate && ` - $${item.dailyRate}/day`}
                {item.weeklyRate && ` - $${item.weeklyRate}/week`}
              </option>
            ))}
            {linkType === 'location' && locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} - {location.address}
                {location.rentalCost && ` - $${location.rentalCost}`}
              </option>
            ))}
            {linkType === 'cast' && castMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.actorName} as {member.characterName} ({member.castType})
                {member.rate && ` - $${member.rate}`}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {selectedItem && (
          <div className="mb-4 p-4 bg-background-tertiary rounded-lg border border-border-default">
            <h3 className="font-medium mb-2">Preview:</h3>
            {linkType === 'crew' && (
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {(selectedItem as any).name}</p>
                <p><strong>Role:</strong> {(selectedItem as any).role}</p>
                <p><strong>Department:</strong> {(selectedItem as any).department}</p>
                {(selectedItem as any).rate && (
                  <p><strong>Rate:</strong> ${(selectedItem as any).rate}/{(selectedItem as any).rateType || 'day'}</p>
                )}
              </div>
            )}
            {linkType === 'equipment' && (
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {(selectedItem as any).name}</p>
                <p><strong>Category:</strong> {(selectedItem as any).category}</p>
                {(selectedItem as any).dailyRate && (
                  <p><strong>Daily Rate:</strong> ${(selectedItem as any).dailyRate}</p>
                )}
                {(selectedItem as any).weeklyRate && (
                  <p><strong>Weekly Rate:</strong> ${(selectedItem as any).weeklyRate}</p>
                )}
              </div>
            )}
            {linkType === 'location' && (
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {(selectedItem as any).name}</p>
                <p><strong>Address:</strong> {(selectedItem as any).address}</p>
                {(selectedItem as any).rentalCost && (
                  <p><strong>Rental Cost:</strong> ${(selectedItem as any).rentalCost}</p>
                )}
              </div>
            )}
            {linkType === 'cast' && (
              <div className="space-y-1 text-sm">
                <p><strong>Actor:</strong> {(selectedItem as any).actorName}</p>
                <p><strong>Character:</strong> {(selectedItem as any).characterName}</p>
                {(selectedItem as any).rate && (
                  <p><strong>Rate:</strong> ${(selectedItem as any).rate}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-tertiary border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedId}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Link
          </button>
        </div>
      </div>
    </div>
  );
}

