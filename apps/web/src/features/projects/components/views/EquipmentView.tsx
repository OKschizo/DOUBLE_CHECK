'use client';

import { useState } from 'react';
import { useEquipmentByProject, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '@/features/equipment/hooks/useEquipment';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import { useProject, useUpdateProject } from '@/features/projects/hooks/useProjects';
import { useSchedule } from '@/features/projects/hooks/useSchedule';
import { EquipmentTemplates } from '@/features/equipment/components/EquipmentTemplates';
import { EquipmentKits } from '@/features/equipment/components/EquipmentKits';
import { EQUIPMENT_CATEGORIES, getItemsForCategory, getCategoryIcon } from '@/features/equipment/data/categoriesAndItems';
import { DEPARTMENTS_AND_ROLES } from '@/features/crew/data/departmentsAndRoles';

interface EquipmentViewProps {
  projectId: string;
}

// Get category names from comprehensive list plus 'Other' for custom
const CATEGORIES = [...EQUIPMENT_CATEGORIES.map(c => c.name), 'Other'];

// Procurement status options with labels and colors
const PROCUREMENT_STATUSES = [
  { value: 'needed', label: 'Needed', color: 'bg-gray-500', icon: '📋' },
  { value: 'requested', label: 'Requested', color: 'bg-blue-500', icon: '📤' },
  { value: 'reserved', label: 'Reserved', color: 'bg-yellow-500', icon: '📅' },
  { value: 'picked_up', label: 'Picked Up', color: 'bg-purple-500', icon: '🚚' },
  { value: 'on_set', label: 'On Set', color: 'bg-green-500', icon: '🎬' },
  { value: 'wrapped', label: 'Wrapped', color: 'bg-orange-500', icon: '📦' },
  { value: 'returned', label: 'Returned', color: 'bg-teal-500', icon: '✅' },
  { value: 'unavailable', label: 'Unavailable', color: 'bg-red-500', icon: '❌' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-400', icon: '🚫' },
];

// Source options
const SOURCE_OPTIONS = [
  { value: 'rental', label: 'Rental', icon: '🏪' },
  { value: 'owned', label: 'Owned', icon: '🏠' },
  { value: 'crew_provided', label: 'Crew Provided', icon: '👤' },
];

// Get procurement status info
const getProcurementStatus = (status: string) => {
  return PROCUREMENT_STATUSES.find(s => s.value === status) || PROCUREMENT_STATUSES[0];
};

export function EquipmentView({ projectId }: EquipmentViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showKitsModal, setShowKitsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'tracking' | 'assignment'>('info');
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORIES));
  const [useCustomItem, setUseCustomItem] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    dailyRate: '',
    weeklyRate: '',
    quantity: '1',
    // New tracking fields
    procurementStatus: 'needed',
    source: 'rental',
    daysNeeded: '',
    reservedDate: '',
    pickupDate: '',
    returnDate: '',
    // Vendor info
    rentalVendor: '',
    vendorContact: '',
    vendorPhone: '',
    confirmationNumber: '',
    // Assignment
    responsiblePartyId: '',
    responsibleDepartment: '',
    assignedTo: [] as string[],
    shootingDayIds: [] as string[],
    // Notes
    notes: '',
  });

  const { data: project } = useProject(projectId);
  const { mutateAsync: updateProject } = useUpdateProject();
  const { data: equipment = [], isLoading } = useEquipmentByProject(projectId);
  const { data: crewMembers = [] } = useCrewByProject(projectId);
  const { days: shootingDays = [] } = useSchedule(projectId);

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
    const itemToUpdate = editingItem || detailItem;
    if (!itemToUpdate) return;
    try {
      const updateData: any = {
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        quantity: Number(formData.quantity) || 1,
        // Tracking
        procurementStatus: formData.procurementStatus,
        source: formData.source,
        // Assignment
        responsiblePartyId: formData.responsiblePartyId || undefined,
        responsibleDepartment: formData.responsibleDepartment || undefined,
        assignedTo: formData.assignedTo,
        shootingDayIds: formData.shootingDayIds,
        // Vendor
        rentalVendor: formData.rentalVendor || undefined,
        vendorContact: formData.vendorContact || undefined,
        vendorPhone: formData.vendorPhone || undefined,
        confirmationNumber: formData.confirmationNumber || undefined,
        // Notes
        notes: formData.notes || undefined,
      };

      // Only add numeric fields if they have values
      if (formData.dailyRate) updateData.dailyRate = Number(formData.dailyRate);
      if (formData.weeklyRate) updateData.weeklyRate = Number(formData.weeklyRate);
      if (formData.daysNeeded) updateData.daysNeeded = Number(formData.daysNeeded);

      // Only add date fields if they have values
      if (formData.reservedDate) updateData.reservedDate = new Date(formData.reservedDate);
      if (formData.pickupDate) updateData.pickupDate = new Date(formData.pickupDate);
      if (formData.returnDate) updateData.returnDate = new Date(formData.returnDate);

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      await updateEquipment.mutateAsync({
        id: itemToUpdate.id,
        data: updateData,
      });
      setShowEditModal(false);
      setShowDetailModal(false);
      setEditingItem(null);
      setDetailItem(null);
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
    if (selectedItems.size === filteredEquipment.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredEquipment.map((i: any) => i.id)));
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      dailyRate: item.dailyRate?.toString() || '',
      weeklyRate: item.weeklyRate?.toString() || '',
      quantity: item.quantity?.toString() || '1',
      // Tracking fields
      procurementStatus: item.procurementStatus || 'needed',
      source: item.source || 'rental',
      daysNeeded: item.daysNeeded?.toString() || '',
      reservedDate: item.reservedDate ? new Date(item.reservedDate).toISOString().split('T')[0] : '',
      pickupDate: item.pickupDate ? new Date(item.pickupDate).toISOString().split('T')[0] : '',
      returnDate: item.returnDate ? new Date(item.returnDate).toISOString().split('T')[0] : '',
      // Vendor info
      rentalVendor: item.rentalVendor || '',
      vendorContact: item.vendorContact || '',
      vendorPhone: item.vendorPhone || '',
      confirmationNumber: item.confirmationNumber || '',
      // Assignment
      responsiblePartyId: item.responsiblePartyId || '',
      responsibleDepartment: item.responsibleDepartment || '',
      assignedTo: item.assignedTo || [],
      shootingDayIds: item.shootingDayIds || [],
      // Notes
      notes: item.notes || '',
    });
    setShowDetailModal(true);
    setActiveDetailTab('info');
  };

  // Open detail view for an item
  const handleViewDetail = (item: any) => {
    setDetailItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      dailyRate: item.dailyRate?.toString() || '',
      weeklyRate: item.weeklyRate?.toString() || '',
      quantity: item.quantity?.toString() || '1',
      procurementStatus: item.procurementStatus || 'needed',
      source: item.source || 'rental',
      daysNeeded: item.daysNeeded?.toString() || '',
      reservedDate: item.reservedDate ? new Date(item.reservedDate).toISOString().split('T')[0] : '',
      pickupDate: item.pickupDate ? new Date(item.pickupDate).toISOString().split('T')[0] : '',
      returnDate: item.returnDate ? new Date(item.returnDate).toISOString().split('T')[0] : '',
      rentalVendor: item.rentalVendor || '',
      vendorContact: item.vendorContact || '',
      vendorPhone: item.vendorPhone || '',
      confirmationNumber: item.confirmationNumber || '',
      responsiblePartyId: item.responsiblePartyId || '',
      responsibleDepartment: item.responsibleDepartment || '',
      assignedTo: item.assignedTo || [],
      shootingDayIds: item.shootingDayIds || [],
      notes: item.notes || '',
    });
    setShowDetailModal(true);
    setActiveDetailTab('info');
  };

  // Quick status update
  const handleQuickStatusUpdate = async (itemId: string, newStatus: string) => {
    try {
      const now = new Date();
      const updates: any = { procurementStatus: newStatus };
      
      // Auto-set dates based on status change
      if (newStatus === 'reserved' && !equipment.find((e: any) => e.id === itemId)?.reservedDate) {
        updates.reservedDate = now;
      } else if (newStatus === 'picked_up' && !equipment.find((e: any) => e.id === itemId)?.pickedUpDate) {
        updates.pickedUpDate = now;
      } else if (newStatus === 'returned' && !equipment.find((e: any) => e.id === itemId)?.returnedDate) {
        updates.returnedDate = now;
      }
      
      await updateEquipment.mutateAsync({ id: itemId, data: updates });
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const allCategories = [
    ...CATEGORIES,
    ...(project?.customEquipmentCategories || []),
  ].sort();

  // Filter equipment by search, selected categories, and status
  const filteredEquipment = equipment.filter((item: any) => {
    // Filter by category
    if (!selectedCategories.has(item.category)) return false;
    
    // Filter by procurement status
    if (statusFilter !== 'all' && item.procurementStatus !== statusFilter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.rentalVendor?.toLowerCase().includes(query) ||
        item.confirmationNumber?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const itemsByCategory = filteredEquipment.reduce((acc: any, item: any) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Get count per category (from all equipment, not filtered)
  const getCategoryCount = (cat: string) => {
    return equipment.filter((i: any) => i.category === cat).length;
  };

  // Toggle category filter
  const toggleCategory = (cat: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(cat)) {
      newSelected.delete(cat);
    } else {
      newSelected.add(cat);
    }
    setSelectedCategories(newSelected);
  };

  // Select/deselect all categories
  const selectAllCategories = () => setSelectedCategories(new Set(allCategories));
  const deselectAllCategories = () => setSelectedCategories(new Set());

  // Get items for selected category in form
  const availableItems = formData.category ? getItemsForCategory(formData.category) : [];

  // Calculate total value
  const totalDailyValue = equipment.reduce((sum: number, item: any) => 
    sum + ((item.dailyRate || 0) * (item.quantity || 1)), 0
  );

  if (isLoading) {
    return <div className="text-center py-10">Loading equipment...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header and Actions - Simplified */}
        <div className="mb-8">
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2 text-text-primary">Equipment</h1>
              <p className="text-text-secondary">
                {filteredEquipment.length} of {equipment.length} items
                {searchQuery && <span className="text-accent-primary"> • Searching &quot;{searchQuery}&quot;</span>}
              </p>
            </div>
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
                <button onClick={() => setShowKitsModal(true)} className="btn-secondary">📦 Kits</button>
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
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">Category *</label>
                          <select 
                            className="input-field w-full" 
                            value={formData.category} 
                            onChange={e => {
                              setFormData({...formData, category: e.target.value, name: ''});
                              setUseCustomItem(false);
                            }} 
                            required
                          >
                            <option value="">Select Category</option>
                            {allCategories.map(c => <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">Item Name *</label>
                          {availableItems.length > 0 && !useCustomItem ? (
                            <div className="space-y-1">
                              <select 
                                className="input-field w-full" 
                                value={formData.name} 
                                onChange={e => {
                                  const item = availableItems.find(i => i.name === e.target.value);
                                  if (item) {
                                    setFormData({
                                      ...formData, 
                                      name: item.name,
                                      description: item.description || '',
                                      dailyRate: item.typicalDailyRate?.toString() || '',
                                      weeklyRate: item.typicalWeeklyRate?.toString() || '',
                                    });
                                  } else {
                                    setFormData({...formData, name: e.target.value});
                                  }
                                }} 
                                required
                              >
                                <option value="">Select Item...</option>
                                {availableItems.map(item => (
                                  <option key={item.id} value={item.name}>{item.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setUseCustomItem(true)}
                                className="text-xs text-accent-primary hover:text-accent-hover"
                              >
                                + Custom Item
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <input 
                                className="input-field w-full" 
                                placeholder="Enter custom item name..." 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                              />
                              {availableItems.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUseCustomItem(false);
                                    setFormData({...formData, name: ''});
                                  }}
                                  className="text-xs text-accent-primary hover:text-accent-hover"
                                >
                                  ← Select from list
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                    </div>
                    <textarea className="input-field" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">Daily Rate ($)</label>
                          <input type="number" className="input-field w-full" placeholder="0" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">Weekly Rate ($)</label>
                          <input type="number" className="input-field w-full" placeholder="0" value={formData.weeklyRate} onChange={e => setFormData({...formData, weeklyRate: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-1">Quantity *</label>
                          <input type="number" className="input-field w-full" placeholder="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                        </div>
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
                          {/* Status Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${getProcurementStatus(item.procurementStatus || 'needed').color}`}>
                              {getProcurementStatus(item.procurementStatus || 'needed').icon} {getProcurementStatus(item.procurementStatus || 'needed').label}
                            </span>
                            {item.source && (
                              <span className="text-xs text-text-tertiary">
                                {SOURCE_OPTIONS.find(s => s.value === item.source)?.icon} {SOURCE_OPTIONS.find(s => s.value === item.source)?.label}
                              </span>
                            )}
                            {item.packageId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                📦 In Kit
                              </span>
                            )}
                          </div>
                          {item.description && <div className="line-clamp-1">{item.description}</div>}
                          {item.quantity && <div>📦 Quantity: {item.quantity}</div>}
                          {item.dailyRate && <div>💰 ${item.dailyRate}/day</div>}
                          {item.weeklyRate && <div>💵 ${item.weeklyRate}/week</div>}
                          {item.daysNeeded && <div>📅 {item.daysNeeded} day{item.daysNeeded > 1 ? 's' : ''} needed</div>}
                          {item.responsiblePartyId && (
                            <div className="text-xs">
                              👤 {crewMembers.find((c: any) => c.id === item.responsiblePartyId)?.name || 'Assigned'}
                            </div>
                          )}
                          {item.shootingDayIds?.length > 0 && (
                            <div className="text-xs">
                              🎬 {item.shootingDayIds.length} shoot day{item.shootingDayIds.length > 1 ? 's' : ''}
                            </div>
                          )}
                          {item.rentalVendor && (
                            <div className="text-xs text-text-tertiary">
                              🏪 {item.rentalVendor}
                            </div>
                          )}
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

      {/* Right Sidebar - Equipment Overview & Filters */}
      <aside className="w-80 bg-background-secondary border-l border-border-subtle overflow-y-auto p-6">
        <h3 className="text-lg font-bold mb-4 text-text-primary">Equipment Overview</h3>
        
        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-secondary mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by name, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-secondary mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="all">All Statuses</option>
            {PROCUREMENT_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.icon} {status.label}</option>
            ))}
          </select>
        </div>

        {/* Filter by Category */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-secondary">Filter by Category</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllCategories}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                All
              </button>
              <button
                onClick={deselectAllCategories}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                None
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {allCategories.map((cat) => {
              const count = getCategoryCount(cat);
              const isSelected = selectedCategories.has(cat);
              const icon = getCategoryIcon(cat);
              const isCustom = project?.customEquipmentCategories?.includes(cat);
              return (
                <div key={cat} className="flex items-center justify-between">
                  <label
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent-primary/10 text-text-primary'
                        : 'hover:bg-background-tertiary text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
                      />
                      <span className="text-sm">{icon} {cat}</span>
                    </div>
                    <span className="text-xs text-text-tertiary bg-background-tertiary px-2 py-0.5 rounded">
                      {count}
                    </span>
                  </label>
                  {isCustom && (
                    <button 
                      onClick={() => handleRemoveCustomCategory(cat)}
                      className="ml-1 text-text-tertiary hover:text-error px-1"
                      title="Remove custom category"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="w-full mt-3 py-2 border-2 border-dashed border-border-default rounded-lg text-sm text-text-secondary hover:border-accent-primary hover:text-accent-primary"
          >
            + Add Custom Category
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-secondary mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background-tertiary rounded-lg p-3">
              <div className="text-2xl font-bold text-accent-primary">{equipment.length}</div>
              <div className="text-xs text-text-secondary">Total Items</div>
            </div>
            <div className="bg-background-tertiary rounded-lg p-3">
              <div className="text-2xl font-bold text-green-500">
                {Object.keys(itemsByCategory).length}
              </div>
              <div className="text-xs text-text-secondary">Categories</div>
            </div>
            <div className="col-span-2 bg-background-tertiary rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-500">
                ${totalDailyValue.toLocaleString()}
              </div>
              <div className="text-xs text-text-secondary">Est. Daily Rate</div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-secondary mb-3">Status Overview</h4>
          <div className="space-y-2">
            {PROCUREMENT_STATUSES.slice(0, 6).map(status => {
              const count = equipment.filter((e: any) => (e.procurementStatus || 'needed') === status.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(statusFilter === status.value ? 'all' : status.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    statusFilter === status.value
                      ? `${status.color} text-white`
                      : 'bg-background-tertiary hover:bg-background-secondary text-text-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{status.icon}</span>
                    <span className="text-sm">{status.label}</span>
                  </span>
                  <span className="font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedCategories.size !== allCategories.length) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategories(new Set(allCategories));
            }}
            className="w-full py-2 text-sm text-accent-primary hover:text-accent-hover border border-accent-primary rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </aside>

      {/* Equipment Detail/Edit Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-primary border border-border-default rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{formData.name || 'Equipment Details'}</h2>
                <p className="text-sm text-text-secondary">{formData.category}</p>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setEditingItem(null); setDetailItem(null); }}
                className="text-text-tertiary hover:text-text-primary text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-border-default">
              <div className="flex gap-4">
                {[
                  { id: 'info', label: '📋 Basic Info' },
                  { id: 'tracking', label: '📦 Tracking & Dates' },
                  { id: 'assignment', label: '👥 Assignment' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`py-3 px-1 border-b-2 transition-colors ${
                      activeDetailTab === tab.id
                        ? 'border-accent-primary text-accent-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto p-6">
              {activeDetailTab === 'info' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
                      <input
                        className="input-field w-full"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Category *</label>
                      <select
                        className="input-field w-full"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        required
                      >
                        <option value="">Select Category</option>
                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                    <textarea
                      className="input-field w-full"
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Equipment description, specs, notes..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                      <input
                        type="number"
                        className="input-field w-full"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Daily Rate ($)</label>
                      <input
                        type="number"
                        className="input-field w-full"
                        value={formData.dailyRate}
                        onChange={e => setFormData({...formData, dailyRate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Weekly Rate ($)</label>
                      <input
                        type="number"
                        className="input-field w-full"
                        value={formData.weeklyRate}
                        onChange={e => setFormData({...formData, weeklyRate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Source</label>
                      <select
                        className="input-field w-full"
                        value={formData.source}
                        onChange={e => setFormData({...formData, source: e.target.value})}
                      >
                        {SOURCE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Days Needed</label>
                      <input
                        type="number"
                        className="input-field w-full"
                        value={formData.daysNeeded}
                        onChange={e => setFormData({...formData, daysNeeded: e.target.value})}
                        min="1"
                        placeholder="Number of days"
                      />
                    </div>
                  </div>

                  {/* Vendor Info (show if rental) */}
                  {formData.source === 'rental' && (
                    <div className="border border-border-default rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-text-primary">🏪 Rental Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Rental Vendor</label>
                          <input
                            className="input-field w-full"
                            value={formData.rentalVendor}
                            onChange={e => setFormData({...formData, rentalVendor: e.target.value})}
                            placeholder="e.g., Panavision, ARRI Rental"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Confirmation/PO #</label>
                          <input
                            className="input-field w-full"
                            value={formData.confirmationNumber}
                            onChange={e => setFormData({...formData, confirmationNumber: e.target.value})}
                            placeholder="Rental confirmation number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Vendor Contact</label>
                          <input
                            className="input-field w-full"
                            value={formData.vendorContact}
                            onChange={e => setFormData({...formData, vendorContact: e.target.value})}
                            placeholder="Contact person name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Vendor Phone</label>
                          <input
                            className="input-field w-full"
                            value={formData.vendorPhone}
                            onChange={e => setFormData({...formData, vendorPhone: e.target.value})}
                            placeholder="(555) 555-5555"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'tracking' && (
                <div className="space-y-6">
                  {/* Procurement Status */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Procurement Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PROCUREMENT_STATUSES.map(status => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData({...formData, procurementStatus: status.value})}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                            formData.procurementStatus === status.value
                              ? `${status.color} border-transparent text-white`
                              : 'border-border-default hover:border-accent-primary text-text-secondary'
                          }`}
                        >
                          <span>{status.icon}</span>
                          <span className="font-medium">{status.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Tracking */}
                  <div className="border border-border-default rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-text-primary">📅 Date Tracking</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Reserved Date</label>
                        <input
                          type="date"
                          className="input-field w-full"
                          value={formData.reservedDate}
                          onChange={e => setFormData({...formData, reservedDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Pickup Date</label>
                        <input
                          type="date"
                          className="input-field w-full"
                          value={formData.pickupDate}
                          onChange={e => setFormData({...formData, pickupDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Return Date</label>
                        <input
                          type="date"
                          className="input-field w-full"
                          value={formData.returnDate}
                          onChange={e => setFormData({...formData, returnDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Link to Shoot Days */}
                  <div className="border border-border-default rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-text-primary">🎬 Shoot Day Assignment</h4>
                    <p className="text-sm text-text-secondary">Select which shoot days this equipment is needed for:</p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {shootingDays.length > 0 ? shootingDays.map((day: any) => (
                        <label
                          key={day.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            formData.shootingDayIds.includes(day.id)
                              ? 'border-accent-primary bg-accent-primary/10'
                              : 'border-border-default hover:border-accent-primary/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.shootingDayIds.includes(day.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData({...formData, shootingDayIds: [...formData.shootingDayIds, day.id]});
                              } else {
                                setFormData({...formData, shootingDayIds: formData.shootingDayIds.filter((id: string) => id !== day.id)});
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">
                            Day {day.dayNumber || '?'} - {day.date ? new Date(day.date).toLocaleDateString() : 'No date'}
                          </span>
                        </label>
                      )) : (
                        <p className="col-span-2 text-text-tertiary text-sm">No shoot days scheduled yet</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                    <textarea
                      className="input-field w-full"
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Special instructions, pickup/return notes, etc."
                    />
                  </div>
                </div>
              )}

              {activeDetailTab === 'assignment' && (
                <div className="space-y-6">
                  {/* Responsible Department */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Responsible Department</label>
                    <select
                      className="input-field w-full"
                      value={formData.responsibleDepartment}
                      onChange={e => setFormData({...formData, responsibleDepartment: e.target.value})}
                    >
                      <option value="">Select Department...</option>
                      {DEPARTMENTS_AND_ROLES.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.icon} {dept.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Responsible Party */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Responsible Party (Primary Contact)</label>
                    <select
                      className="input-field w-full"
                      value={formData.responsiblePartyId}
                      onChange={e => setFormData({...formData, responsiblePartyId: e.target.value})}
                    >
                      <option value="">Select Crew Member...</option>
                      {crewMembers.map((crew: any) => (
                        <option key={crew.id} value={crew.id}>{crew.name} - {crew.role}</option>
                      ))}
                    </select>
                    {formData.responsiblePartyId && (
                      <p className="mt-1 text-xs text-text-tertiary">
                        This person is accountable for pickup, care, and return of this equipment.
                      </p>
                    )}
                  </div>

                  {/* Assigned To (Multiple) */}
                  <div className="border border-border-default rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-text-primary">👥 Assigned Crew Members</h4>
                    <p className="text-sm text-text-secondary">Select crew members who will be using this equipment:</p>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {crewMembers.map((crew: any) => (
                        <label
                          key={crew.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            formData.assignedTo.includes(crew.id)
                              ? 'border-accent-primary bg-accent-primary/10'
                              : 'border-border-default hover:border-accent-primary/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedTo.includes(crew.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData({...formData, assignedTo: [...formData.assignedTo, crew.id]});
                              } else {
                                setFormData({...formData, assignedTo: formData.assignedTo.filter((id: string) => id !== crew.id)});
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{crew.name}</div>
                            <div className="text-xs text-text-tertiary">{crew.role} • {crew.department}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-default flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowDetailModal(false); setEditingItem(null); setDetailItem(null); }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSubmit}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
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

      {showKitsModal && (
        <EquipmentKits projectId={projectId} onClose={() => setShowKitsModal(false)} />
      )}
    </div>
  );
}
