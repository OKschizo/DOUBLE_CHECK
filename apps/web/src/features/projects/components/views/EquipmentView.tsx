'use client';

import { useState } from 'react';
import { useEquipmentByProject, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '@/features/equipment/hooks/useEquipment';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import { useProject, useUpdateProject } from '@/features/projects/hooks/useProjects';
import { EquipmentTemplates } from '@/features/equipment/components/EquipmentTemplates';

interface EquipmentViewProps {
  projectId: string;
}

const CATEGORIES = [
  'Camera',
  'Lenses',
  'Lighting',
  'Grip',
  'Sound',
  'Art Dept',
  'Wardrobe',
  'Makeup',
  'Production',
  'Transportation',
  'Post-Production',
  'Other',
];

export function EquipmentView({ projectId }: EquipmentViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    dailyRate: '',
    weeklyRate: '',
    quantity: '1',
  });

  const { data: project } = useProject(projectId);
  const { mutateAsync: updateProject } = useUpdateProject();
  const { data: equipment = [], isLoading } = useEquipmentByProject(projectId);
  const { data: crewMembers = [] } = useCrewByProject(projectId);

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const createFromEquipment = { mutate: () => alert("Not implemented") }; // Placeholder

  const handleBulkCreateBudget = () => {
    if (selectedItems.size === 0) return;
    createFromEquipment.mutate();
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Delete ${selectedItems.size} items?`)) return;
    for (const id of Array.from(selectedItems)) {
      await deleteEquipment.mutateAsync({ id });
    }
    setSelectedItems(new Set());
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEquipment.mutateAsync({
        projectId,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        dailyRate: formData.dailyRate ? Number(formData.dailyRate) : undefined,
        weeklyRate: formData.weeklyRate ? Number(formData.weeklyRate) : undefined,
        quantity: Number(formData.quantity),
      });
      setShowAddForm(false);
      setFormData({
        name: '',
        category: '',
        description: '',
        dailyRate: '',
        weeklyRate: '',
        quantity: '1',
      });
    } catch (error) {
      console.error(error);
      alert("Failed to add equipment");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updateEquipment.mutateAsync({
        id: editingItem.id,
        data: {
          name: formData.name,
          category: formData.category,
          description: formData.description,
          dailyRate: formData.dailyRate ? Number(formData.dailyRate) : undefined,
          weeklyRate: formData.weeklyRate ? Number(formData.weeklyRate) : undefined,
          quantity: Number(formData.quantity),
        },
      });
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update equipment");
    }
  };

  const handleAddCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !project) return;
    
    const currentCats = project.customEquipmentCategories || [];
    try {
        await updateProject({
            id: projectId,
            data: { customEquipmentCategories: [...currentCats, newCategoryName.trim()] }
        });
        setNewCategoryName('');
        setShowAddCategoryModal(false);
    } catch (e) {
        console.error(e);
        alert("Failed to add category");
    }
  };

  const handleRemoveCustomCategory = async (cat: string) => {
    if (!project) return;
    if (confirm(`Remove category "${cat}"?`)) {
        const currentCats = project.customEquipmentCategories || [];
        try {
            await updateProject({
                id: projectId,
                data: { customEquipmentCategories: currentCats.filter(c => c !== cat) }
            });
        } catch (e) {
            console.error(e);
            alert("Failed to remove category");
        }
    }
  };

  const handleToggleSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === equipment.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(equipment.map(i => i.id)));
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      dailyRate: item.dailyRate || '',
      weeklyRate: item.weeklyRate || '',
      quantity: item.quantity || '1',
    });
    setShowEditModal(true);
  };

  const allCategories = [
    ...CATEGORIES,
    ...(project?.customEquipmentCategories || []),
  ].sort();

  const itemsByCategory = equipment.reduce((acc: any, item: any) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-center py-10">Loading equipment...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header and Actions - Simplified */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Equipment</h1>
            <div className="flex gap-2 mb-4">
                <button onClick={() => {
                    setFormData({
                        name: '',
                        category: '',
                        description: '',
                        dailyRate: '',
                        weeklyRate: '',
                        quantity: '1',
                    });
                    setShowAddForm(true);
                }} className="btn-primary">+ Add Item</button>
                <button onClick={() => setShowTemplatesModal(true)} className="btn-secondary">Templates</button>
                {selectedItems.size > 0 && (
                    <>
                        <button onClick={handleBulkCreateBudget} className="btn-secondary">To Budget</button>
                        <button onClick={handleBulkDelete} className="btn-danger">Delete Selected</button>
                    </>
                )}
            </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
            <div className="card-elevated p-6 mb-8">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input className="input-field" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                            <option value="">Select Category</option>
                            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <textarea className="input-field" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" className="input-field" placeholder="Daily Rate" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: e.target.value})} />
                        <input type="number" className="input-field" placeholder="Weekly Rate" value={formData.weeklyRate} onChange={e => setFormData({...formData, weeklyRate: e.target.value})} />
                        <input type="number" className="input-field" placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Save</button>
                    </div>
                </form>
            </div>
        )}

        {/* Equipment List */}
        <div className="space-y-8">
          {Object.entries(itemsByCategory).map(([cat, items]: [string, any]) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-text-primary">{cat}</h2>
                <span className="badge-primary">{items.length}</span>
              </div>
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={`card p-4 relative ${selectedItems.has(item.id) ? 'ring-2 ring-accent-primary border-accent-primary' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleToggleSelect(item.id)}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-text-primary">{item.name}</h3>
                            <p className="text-sm text-accent-primary">{item.category}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-text-tertiary hover:text-accent-primary p-1"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete equipment item?')) {
                                  deleteEquipment.mutateAsync({ id: item.id });
                                }
                              }}
                              className="text-text-tertiary hover:text-error p-1"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-text-secondary">
                          {item.description && <div>{item.description}</div>}
                          {item.quantity && <div>📦 Quantity: {item.quantity}</div>}
                          {item.dailyRate && <div>💰 ${item.dailyRate}/day</div>}
                          {item.weeklyRate && <div>💵 ${item.weeklyRate}/week</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-80 bg-background-secondary border-l border-border-subtle p-6 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 text-text-primary">Categories</h3>
        <div className="space-y-2">
          {allCategories.map(cat => (
            <div key={cat} className="flex justify-between items-center p-2 hover:bg-background-tertiary rounded">
              <span className="text-sm text-text-secondary">{cat}</span>
              {project?.customEquipmentCategories?.includes(cat) && (
                <button 
                  onClick={() => handleRemoveCustomCategory(cat)}
                  className="text-text-tertiary hover:text-error"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="w-full mt-4 py-2 border-2 border-dashed border-border-default rounded-lg text-sm text-text-secondary hover:border-accent-primary hover:text-accent-primary"
          >
            + Add Category
          </button>
        </div>
      </aside>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card-elevated p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Edit Equipment</h2>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input className="input-field" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                            <option value="">Select Category</option>
                            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <textarea className="input-field" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" className="input-field" placeholder="Daily Rate" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: e.target.value})} />
                        <input type="number" className="input-field" placeholder="Weekly Rate" value={formData.weeklyRate} onChange={e => setFormData({...formData, weeklyRate: e.target.value})} />
                        <input type="number" className="input-field" placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Update</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card-elevated p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Custom Category</h3>
            <form onSubmit={handleAddCustomCategory}>
              <input
                autoFocus
                className="input-field w-full mb-4"
                placeholder="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddCategoryModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplatesModal && (
        <EquipmentTemplates projectId={projectId} onClose={() => setShowTemplatesModal(false)} />
      )}
    </div>
  );
}
