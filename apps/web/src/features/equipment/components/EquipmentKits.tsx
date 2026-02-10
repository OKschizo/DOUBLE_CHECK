'use client';

import { useState, useMemo } from 'react';
import {
  useEquipmentKits,
  useCreateKit,
  useUpdateKit,
  useDeleteKit,
  useAddToKit,
  useRemoveFromKit,
  useCreateKitFromTemplate,
  useUpdateKitStatus,
} from '../hooks/useEquipmentKits';
import { useEquipmentByProject } from '@/features/equipment/hooks/useEquipment';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import type { EquipmentPackage, Equipment } from '@/lib/schemas/equipment';

// Pre-defined Kit Templates
const KIT_TEMPLATES = [
  {
    id: 'camera-basic',
    name: 'Basic Camera Package',
    category: 'Camera',
    description: 'Essential camera gear for small productions',
    items: [
      { name: 'Camera Body', category: 'Cameras', required: true },
      { name: 'Standard Zoom Lens', category: 'Lenses', required: true },
      { name: 'Batteries (2x)', category: 'Power & Distribution', required: true },
      { name: 'Memory Cards (3x)', category: 'Cameras', required: true },
      { name: 'Tripod', category: 'Camera Support', required: true },
    ],
  },
  {
    id: 'camera-cinema',
    name: 'Cinema Camera Package',
    category: 'Camera',
    description: 'Full cinema camera setup with monitoring',
    items: [
      { name: 'Cinema Camera Body', category: 'Cameras', required: true },
      { name: 'Prime Lens Set', category: 'Lenses', required: true },
      { name: 'Zoom Lens', category: 'Lenses', required: false },
      { name: 'Matte Box', category: 'Camera Support', required: true },
      { name: 'Follow Focus', category: 'Camera Support', required: true },
      { name: 'V-Mount Batteries (4x)', category: 'Power & Distribution', required: true },
      { name: 'CFast/SSD Media', category: 'Cameras', required: true },
      { name: 'On-Board Monitor', category: 'Video Assist & Monitors', required: true },
      { name: 'Camera Cage/Rig', category: 'Camera Support', required: true },
    ],
  },
  {
    id: 'sound-basic',
    name: 'Basic Sound Package',
    category: 'Sound',
    description: 'Essential sound recording gear',
    items: [
      { name: 'Field Recorder', category: 'Sound', required: true },
      { name: 'Boom Microphone', category: 'Sound', required: true },
      { name: 'Boom Pole', category: 'Sound', required: true },
      { name: 'Wireless Lav Kit (2x)', category: 'Sound', required: true },
      { name: 'Headphones', category: 'Sound', required: true },
      { name: 'XLR Cables', category: 'Sound', required: true },
    ],
  },
  {
    id: 'sound-full',
    name: 'Full Sound Package',
    category: 'Sound',
    description: 'Complete professional sound department',
    items: [
      { name: 'Mixer/Recorder (Sound Devices 833/888)', category: 'Sound', required: true },
      { name: 'Boom Microphone (Sennheiser MKH 416)', category: 'Sound', required: true },
      { name: 'Boom Pole (K-Tek)', category: 'Sound', required: true },
      { name: 'Wireless Lav Kit (4x)', category: 'Sound', required: true },
      { name: 'IFB System (4x)', category: 'Sound', required: true },
      { name: 'Comtek System', category: 'Sound', required: false },
      { name: 'Sound Cart', category: 'Sound', required: false },
      { name: 'Timecode Slate', category: 'Sound', required: true },
      { name: 'Windshield/Blimp', category: 'Sound', required: true },
    ],
  },
  {
    id: 'lighting-basic',
    name: 'Basic Lighting Package',
    category: 'Lighting',
    description: 'Simple 3-point lighting setup',
    items: [
      { name: 'LED Panel (2x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'Light Stands (3x)', category: 'Grip & Rigging', required: true },
      { name: 'Softbox/Diffusion', category: 'Grip & Rigging', required: true },
      { name: 'Reflector', category: 'Grip & Rigging', required: true },
      { name: 'Extension Cords', category: 'Power & Distribution', required: true },
    ],
  },
  {
    id: 'lighting-full',
    name: 'Full Lighting Package',
    category: 'Lighting',
    description: 'Professional lighting for larger productions',
    items: [
      { name: 'HMI 1.2K', category: 'Lighting - HMI/LED', required: true },
      { name: 'HMI 575W (2x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'LED Panel (4x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'Kino Flo 4-Bank (2x)', category: 'Lighting - HMI/LED', required: true },
      { name: 'C-Stands (6x)', category: 'Grip & Rigging', required: true },
      { name: '4x4 Frames (2x)', category: 'Grip & Rigging', required: true },
      { name: 'Flags/Nets Set', category: 'Grip & Rigging', required: true },
      { name: 'Sandbags (12x)', category: 'Grip & Rigging', required: true },
      { name: 'Stinger/Extension Cords', category: 'Power & Distribution', required: true },
      { name: 'Distro Box', category: 'Power & Distribution', required: true },
    ],
  },
  {
    id: 'grip-basic',
    name: 'Basic Grip Package',
    category: 'Grip',
    description: 'Essential grip equipment',
    items: [
      { name: 'C-Stands (4x)', category: 'Grip & Rigging', required: true },
      { name: 'Sandbags (8x)', category: 'Grip & Rigging', required: true },
      { name: 'Apple Boxes (Set)', category: 'Grip & Rigging', required: true },
      { name: 'Clamps Assorted', category: 'Grip & Rigging', required: true },
      { name: 'Flags 18x24 (Set)', category: 'Grip & Rigging', required: true },
    ],
  },
  {
    id: 'dolly-package',
    name: 'Dolly/Movement Package',
    category: 'Camera Support',
    description: 'Camera movement equipment',
    items: [
      { name: 'Doorway Dolly', category: 'Camera Support', required: true },
      { name: 'Track (24ft)', category: 'Camera Support', required: true },
      { name: 'Slider', category: 'Camera Support', required: false },
      { name: 'Jib Arm', category: 'Camera Support', required: false },
      { name: 'Fluid Head Tripod', category: 'Camera Support', required: true },
    ],
  },
];

// Status options with emojis
const PROCUREMENT_STATUSES = [
  { value: 'needed', label: 'Needed', emoji: '📋' },
  { value: 'requested', label: 'Requested', emoji: '📤' },
  { value: 'reserved', label: 'Reserved', emoji: '📅' },
  { value: 'picked_up', label: 'Picked Up', emoji: '🚚' },
  { value: 'on_set', label: 'On Set', emoji: '🎬' },
  { value: 'wrapped', label: 'Wrapped', emoji: '📦' },
  { value: 'returned', label: 'Returned', emoji: '✅' },
  { value: 'unavailable', label: 'Unavailable', emoji: '❌' },
  { value: 'cancelled', label: 'Cancelled', emoji: '🚫' },
];

interface EquipmentKitsProps {
  projectId: string;
  onClose: () => void;
}

export function EquipmentKits({ projectId, onClose }: EquipmentKitsProps) {
  const { data: kits = [], isLoading: kitsLoading } = useEquipmentKits(projectId);
  const { data: equipment = [] } = useEquipmentByProject(projectId);
  const { data: crewMembers = [] } = useCrewByProject(projectId);
  
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'template'>('list');
  const [selectedKit, setSelectedKit] = useState<EquipmentPackage | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const createKit = useCreateKit(projectId);
  const updateKit = useUpdateKit(projectId);
  const deleteKit = useDeleteKit(projectId);
  const addToKit = useAddToKit(projectId);
  const removeFromKit = useRemoveFromKit(projectId);
  const createFromTemplate = useCreateKitFromTemplate(projectId);
  const updateKitStatus = useUpdateKitStatus(projectId);

  // Equipment not in any kit
  const availableEquipment = useMemo(() => {
    return equipment.filter((e: Equipment) => !e.packageId);
  }, [equipment]);

  // Get equipment items for a specific kit
  const getKitEquipment = (kitId: string) => {
    return equipment.filter((e: Equipment) => e.packageId === kitId);
  };

  // Calculate kit totals
  const getKitTotals = (kitId: string) => {
    const items = getKitEquipment(kitId);
    const dailyRate = items.reduce((sum: number, e: Equipment) => sum + (e.dailyRate || 0), 0);
    const weeklyRate = items.reduce((sum: number, e: Equipment) => sum + (e.weeklyRate || 0), 0);
    return { count: items.length, dailyRate, weeklyRate };
  };

  const getStatusBadge = (status: string) => {
    const found = PROCUREMENT_STATUSES.find(s => s.value === status);
    return found ? `${found.emoji} ${found.label}` : status;
  };

  if (kitsLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background-primary border border-border-default rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-text-primary">📦 Equipment Kits</h2>
            {view !== 'list' && (
              <button
                onClick={() => {
                  setView('list');
                  setSelectedKit(null);
                  setSelectedTemplate(null);
                }}
                className="text-sm text-accent-primary hover:underline"
              >
                ← Back to Kits
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content based on view */}
        <div className="flex-1 overflow-y-auto">
          {view === 'list' && (
            <KitsList
              kits={kits}
              equipment={equipment}
              getKitEquipment={getKitEquipment}
              getKitTotals={getKitTotals}
              getStatusBadge={getStatusBadge}
              onCreateNew={() => setView('create')}
              onCreateFromTemplate={() => setView('template')}
              onEdit={(kit) => {
                setSelectedKit(kit);
                setView('edit');
              }}
              onDelete={(kitId) => {
                if (confirm('Delete this kit? Equipment items will be kept but removed from the kit.')) {
                  deleteKit.mutate(kitId);
                }
              }}
              onUpdateStatus={(kitId, status) => {
                updateKitStatus.mutate({ kitId, status });
              }}
            />
          )}

          {view === 'create' && (
            <CreateKitForm
              projectId={projectId}
              availableEquipment={availableEquipment}
              crewMembers={crewMembers}
              onSave={(data) => {
                createKit.mutate(data, {
                  onSuccess: () => setView('list'),
                });
              }}
              onCancel={() => setView('list')}
              isPending={createKit.isPending}
            />
          )}

          {view === 'edit' && selectedKit && (
            <EditKitForm
              kit={selectedKit}
              kitEquipment={getKitEquipment(selectedKit.id)}
              availableEquipment={availableEquipment}
              crewMembers={crewMembers}
              onSave={(data) => {
                updateKit.mutate({ kitId: selectedKit.id, data }, {
                  onSuccess: () => setView('list'),
                });
              }}
              onAddEquipment={(equipmentIds) => {
                addToKit.mutate({ kitId: selectedKit.id, equipmentIds });
              }}
              onRemoveEquipment={(equipmentIds) => {
                removeFromKit.mutate({ kitId: selectedKit.id, equipmentIds });
              }}
              onCancel={() => setView('list')}
              isPending={updateKit.isPending}
            />
          )}

          {view === 'template' && (
            <CreateFromTemplate
              templates={KIT_TEMPLATES}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
              onApply={(templateId, kitName) => {
                const template = KIT_TEMPLATES.find(t => t.id === templateId);
                if (!template) {
                  alert('Template not found');
                  return;
                }
                createFromTemplate.mutate(
                  { templateId, kitName, items: [...template.items] },
                  { 
                    onSuccess: (result) => {
                      alert(`Kit "${kitName}" created successfully with ${result.itemsCreated} equipment items!`);
                      setView('list');
                    },
                    onError: (err) => {
                      console.error('Failed to create kit from template:', err);
                      alert(`Failed to create kit: ${err.message}`);
                    }
                  }
                );
              }}
              onCancel={() => {
                setSelectedTemplate(null);
                setView('list');
              }}
              isPending={createFromTemplate.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Kits List Component
interface KitsListProps {
  kits: EquipmentPackage[];
  equipment: Equipment[];
  getKitEquipment: (kitId: string) => Equipment[];
  getKitTotals: (kitId: string) => { count: number; dailyRate: number; weeklyRate: number };
  getStatusBadge: (status: string) => string;
  onCreateNew: () => void;
  onCreateFromTemplate: () => void;
  onEdit: (kit: EquipmentPackage) => void;
  onDelete: (kitId: string) => void;
  onUpdateStatus: (kitId: string, status: string) => void;
}

function KitsList({
  kits,
  getKitEquipment,
  getKitTotals,
  getStatusBadge,
  onCreateNew,
  onCreateFromTemplate,
  onEdit,
  onDelete,
  onUpdateStatus,
}: KitsListProps) {
  const [expandedKit, setExpandedKit] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors"
          style={{ color: 'rgb(var(--colored-button-text))' }}
        >
          + Create Custom Kit
        </button>
        <button
          onClick={onCreateFromTemplate}
          className="px-4 py-2 border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
        >
          📋 Create from Template
        </button>
      </div>

      {/* Kits list */}
      {kits.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-lg mb-2">No equipment kits yet</p>
          <p className="text-sm">Create a kit to bundle related equipment together</p>
        </div>
      ) : (
        <div className="space-y-3">
          {kits.map((kit) => {
            const totals = getKitTotals(kit.id);
            const kitEquipment = getKitEquipment(kit.id);
            const isExpanded = expandedKit === kit.id;

            return (
              <div
                key={kit.id}
                className="border border-border-default rounded-lg bg-background-secondary"
              >
                {/* Kit header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setExpandedKit(isExpanded ? null : kit.id)}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <div>
                      <h3 className="font-semibold text-text-primary text-lg">{kit.name}</h3>
                      {kit.description && (
                        <p className="text-sm text-text-secondary">{kit.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                        <span>📦 {totals.count} items</span>
                        {totals.dailyRate > 0 && <span>💰 ${totals.dailyRate}/day</span>}
                        {totals.weeklyRate > 0 && <span>💵 ${totals.weeklyRate}/week</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status dropdown */}
                    <select
                      value={kit.procurementStatus || 'needed'}
                      onChange={(e) => onUpdateStatus(kit.id, e.target.value)}
                      className="px-3 py-1 bg-background-primary border border-border-default rounded text-sm text-text-primary"
                    >
                      {PROCUREMENT_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.emoji} {status.label}
                        </option>
                      ))}
                    </select>

                    {/* Action buttons */}
                    <button
                      onClick={() => onEdit(kit)}
                      className="p-2 hover:bg-background-tertiary rounded transition-colors"
                      title="Edit kit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(kit.id)}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors"
                      title="Delete kit"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border-default p-4">
                    <h4 className="font-medium text-text-primary mb-2">Kit Contents:</h4>
                    {kitEquipment.length === 0 ? (
                      <p className="text-sm text-text-tertiary">No equipment in this kit</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {kitEquipment.map((item: Equipment) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-background-primary rounded"
                          >
                            <div>
                              <span className="text-text-primary">{item.name}</span>
                              <span className="text-xs text-text-tertiary ml-2">({item.category})</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-background-secondary rounded">
                              {getStatusBadge(item.procurementStatus || 'needed')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Create Kit Form
interface CreateKitFormProps {
  projectId: string;
  availableEquipment: Equipment[];
  crewMembers: any[];
  onSave: (data: Partial<EquipmentPackage>) => void;
  onCancel: () => void;
  isPending: boolean;
}

function CreateKitForm({
  availableEquipment,
  crewMembers,
  onSave,
  onCancel,
  isPending,
}: CreateKitFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    trackAsUnit: true,
    source: 'rental',
    rentalVendor: '',
    dailyRate: '',
    weeklyRate: '',
    responsiblePartyId: '',
    responsibleDepartment: '',
    notes: '',
  });
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      trackAsUnit: formData.trackAsUnit,
      source: formData.source as any,
      rentalVendor: formData.rentalVendor || undefined,
      dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
      weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
      responsiblePartyId: formData.responsiblePartyId || undefined,
      responsibleDepartment: formData.responsibleDepartment || undefined,
      notes: formData.notes || undefined,
      equipmentIds: selectedEquipment,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Kit Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
            placeholder="e.g., A-Cam Package"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="">Select Category</option>
            <option value="Camera">📷 Camera</option>
            <option value="Sound">🎙️ Sound</option>
            <option value="Lighting">💡 Lighting</option>
            <option value="Grip">🔧 Grip</option>
            <option value="Video Village">🖥️ Video Village</option>
            <option value="Other">📦 Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          rows={2}
          placeholder="What's included in this kit?"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Source</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="rental">🏪 Rental</option>
            <option value="owned">🏠 Owned</option>
            <option value="crew_provided">👤 Crew Provided</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Daily Rate ($)</label>
          <input
            type="number"
            value={formData.dailyRate}
            onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Weekly Rate ($)</label>
          <input
            type="number"
            value={formData.weeklyRate}
            onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {formData.source === 'rental' && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Rental Vendor</label>
          <input
            type="text"
            value={formData.rentalVendor}
            onChange={(e) => setFormData({ ...formData, rentalVendor: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
            placeholder="e.g., Panavision, ARRI Rental"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Responsible Party</label>
          <select
            value={formData.responsiblePartyId}
            onChange={(e) => setFormData({ ...formData, responsiblePartyId: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="">Select crew member...</option>
            {crewMembers.map((crew: any) => (
              <option key={crew.id} value={crew.id}>
                {crew.name} - {crew.role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Responsible Department</label>
          <select
            value={formData.responsibleDepartment}
            onChange={(e) => setFormData({ ...formData, responsibleDepartment: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="">Select department...</option>
            <option value="Camera">📷 Camera</option>
            <option value="Sound">🎙️ Sound</option>
            <option value="Lighting">💡 Lighting / Electric</option>
            <option value="Grip">🔧 Grip</option>
            <option value="Production">🎬 Production</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="trackAsUnit"
          checked={formData.trackAsUnit}
          onChange={(e) => setFormData({ ...formData, trackAsUnit: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="trackAsUnit" className="text-sm text-text-primary">
          Track kit as a unit (status changes apply to all items)
        </label>
      </div>

      {/* Equipment selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Add Equipment to Kit ({selectedEquipment.length} selected)
        </label>
        <div className="max-h-48 overflow-y-auto border border-border-default rounded-lg p-2 bg-background-tertiary">
          {availableEquipment.length === 0 ? (
            <p className="text-sm text-text-tertiary p-2">No unassigned equipment available</p>
          ) : (
            availableEquipment.map((item: Equipment) => (
              <label
                key={item.id}
                className="flex items-center gap-2 p-2 hover:bg-background-secondary rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedEquipment.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEquipment([...selectedEquipment, item.id]);
                    } else {
                      setSelectedEquipment(selectedEquipment.filter((id) => id !== item.id));
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-text-primary">{item.name}</span>
                <span className="text-xs text-text-tertiary">({item.category})</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !formData.name.trim()}
          className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          style={{ color: 'rgb(var(--colored-button-text))' }}
        >
          {isPending ? 'Creating...' : 'Create Kit'}
        </button>
      </div>
    </form>
  );
}

// Edit Kit Form
interface EditKitFormProps {
  kit: EquipmentPackage;
  kitEquipment: Equipment[];
  availableEquipment: Equipment[];
  crewMembers: any[];
  onSave: (data: Partial<EquipmentPackage>) => void;
  onAddEquipment: (equipmentIds: string[]) => void;
  onRemoveEquipment: (equipmentIds: string[]) => void;
  onCancel: () => void;
  isPending: boolean;
}

function EditKitForm({
  kit,
  kitEquipment,
  availableEquipment,
  crewMembers,
  onSave,
  onAddEquipment,
  onRemoveEquipment,
  onCancel,
  isPending,
}: EditKitFormProps) {
  const [formData, setFormData] = useState({
    name: kit.name || '',
    description: kit.description || '',
    category: kit.category || '',
    trackAsUnit: kit.trackAsUnit ?? true,
    source: kit.source || 'rental',
    rentalVendor: kit.rentalVendor || '',
    dailyRate: kit.dailyRate?.toString() || '',
    weeklyRate: kit.weeklyRate?.toString() || '',
    responsiblePartyId: kit.responsiblePartyId || '',
    responsibleDepartment: kit.responsibleDepartment || '',
    notes: kit.notes || '',
  });
  const [equipmentToAdd, setEquipmentToAdd] = useState<string[]>([]);
  const [equipmentToRemove, setEquipmentToRemove] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Save kit data
    onSave({
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      trackAsUnit: formData.trackAsUnit,
      source: formData.source as any,
      rentalVendor: formData.rentalVendor || undefined,
      dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
      weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
      responsiblePartyId: formData.responsiblePartyId || undefined,
      responsibleDepartment: formData.responsibleDepartment || undefined,
      notes: formData.notes || undefined,
    });

    // Handle equipment changes
    if (equipmentToAdd.length > 0) onAddEquipment(equipmentToAdd);
    if (equipmentToRemove.length > 0) onRemoveEquipment(equipmentToRemove);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Kit Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="">Select Category</option>
            <option value="Camera">📷 Camera</option>
            <option value="Sound">🎙️ Sound</option>
            <option value="Lighting">💡 Lighting</option>
            <option value="Grip">🔧 Grip</option>
            <option value="Video Village">🖥️ Video Village</option>
            <option value="Other">📦 Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Source</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="rental">🏪 Rental</option>
            <option value="owned">🏠 Owned</option>
            <option value="crew_provided">👤 Crew Provided</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Daily Rate ($)</label>
          <input
            type="number"
            value={formData.dailyRate}
            onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Weekly Rate ($)</label>
          <input
            type="number"
            value={formData.weeklyRate}
            onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Responsible Party</label>
          <select
            value={formData.responsiblePartyId}
            onChange={(e) => setFormData({ ...formData, responsiblePartyId: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="">Select crew member...</option>
            {crewMembers.map((crew: any) => (
              <option key={crew.id} value={crew.id}>
                {crew.name} - {crew.role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Responsible Department</label>
          <select
            value={formData.responsibleDepartment}
            onChange={(e) => setFormData({ ...formData, responsibleDepartment: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
          >
            <option value="">Select department...</option>
            <option value="Camera">📷 Camera</option>
            <option value="Sound">🎙️ Sound</option>
            <option value="Lighting">💡 Lighting / Electric</option>
            <option value="Grip">🔧 Grip</option>
            <option value="Production">🎬 Production</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="trackAsUnit"
          checked={formData.trackAsUnit}
          onChange={(e) => setFormData({ ...formData, trackAsUnit: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="trackAsUnit" className="text-sm text-text-primary">
          Track kit as a unit (status changes apply to all items)
        </label>
      </div>

      {/* Current kit contents */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Current Kit Contents ({kitEquipment.length} items)
        </label>
        <div className="max-h-36 overflow-y-auto border border-border-default rounded-lg p-2 bg-background-tertiary">
          {kitEquipment.length === 0 ? (
            <p className="text-sm text-text-tertiary p-2">No equipment in this kit</p>
          ) : (
            kitEquipment.map((item: Equipment) => (
              <label
                key={item.id}
                className="flex items-center gap-2 p-2 hover:bg-background-secondary rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={equipmentToRemove.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEquipmentToRemove([...equipmentToRemove, item.id]);
                    } else {
                      setEquipmentToRemove(equipmentToRemove.filter((id) => id !== item.id));
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-text-primary">{item.name}</span>
                <span className="text-xs text-text-tertiary">({item.category})</span>
                {equipmentToRemove.includes(item.id) && (
                  <span className="text-xs text-red-500 ml-auto">Will be removed</span>
                )}
              </label>
            ))
          )}
        </div>
        {equipmentToRemove.length > 0 && (
          <p className="text-xs text-text-tertiary mt-1">
            Check items to remove from kit
          </p>
        )}
      </div>

      {/* Add equipment */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Add Equipment ({equipmentToAdd.length} to add)
        </label>
        <div className="max-h-36 overflow-y-auto border border-border-default rounded-lg p-2 bg-background-tertiary">
          {availableEquipment.length === 0 ? (
            <p className="text-sm text-text-tertiary p-2">No unassigned equipment available</p>
          ) : (
            availableEquipment.map((item: Equipment) => (
              <label
                key={item.id}
                className="flex items-center gap-2 p-2 hover:bg-background-secondary rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={equipmentToAdd.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEquipmentToAdd([...equipmentToAdd, item.id]);
                    } else {
                      setEquipmentToAdd(equipmentToAdd.filter((id) => id !== item.id));
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-text-primary">{item.name}</span>
                <span className="text-xs text-text-tertiary">({item.category})</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !formData.name.trim()}
          className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          style={{ color: 'rgb(var(--colored-button-text))' }}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// Create from Template
interface CreateFromTemplateProps {
  templates: typeof KIT_TEMPLATES;
  selectedTemplate: string | null;
  onSelectTemplate: (id: string | null) => void;
  onApply: (templateId: string, kitName: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

function CreateFromTemplate({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onApply,
  onCancel,
  isPending,
}: CreateFromTemplateProps) {
  const [kitName, setKitName] = useState('');
  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <p className="text-text-secondary">
        Choose a template to quickly create a kit with pre-configured equipment items.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => {
              onSelectTemplate(template.id);
              setKitName(template.name);
            }}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-border-default hover:border-accent-primary/50'
            }`}
          >
            <h3 className="font-semibold text-text-primary mb-1">{template.name}</h3>
            <p className="text-sm text-text-secondary mb-2">{template.description}</p>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="px-2 py-1 bg-background-secondary rounded">{template.category}</span>
              <span>{template.items.length} items</span>
            </div>
          </div>
        ))}
      </div>

      {selectedTemplateData && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Kit Name</label>
            <input
              type="text"
              value={kitName}
              onChange={(e) => setKitName(e.target.value)}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-text-primary"
              placeholder="Enter kit name"
            />
          </div>

          <div>
            <h3 className="font-semibold text-text-primary mb-3">Template Preview</h3>
            <div className="bg-background-secondary border border-border-default rounded-lg p-4 max-h-48 overflow-y-auto">
              <ul className="space-y-1">
                {selectedTemplateData.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className={item.required ? 'text-text-primary' : 'text-text-secondary'}>
                      {item.name}
                    </span>
                    <span className="text-xs text-text-tertiary">({item.category})</span>
                    {item.required && (
                      <span className="text-xs text-accent-primary">Required</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border-default rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (selectedTemplate && kitName.trim()) {
              onApply(selectedTemplate, kitName);
            }
          }}
          disabled={isPending || !selectedTemplate || !kitName.trim()}
          className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          style={{ color: 'rgb(var(--colored-button-text))' }}
        >
          {isPending ? 'Creating...' : 'Create Kit from Template'}
        </button>
      </div>
    </div>
  );
}
