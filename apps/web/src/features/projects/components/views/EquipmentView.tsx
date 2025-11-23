'use client';

import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Equipment, CheckoutHistory, EquipmentSource, EquipmentStatus } from '@/lib/schemas';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl, isFirebaseStorageUrl } from '@/lib/firebase/storage';
import { EQUIPMENT_CATEGORIES, getCategoryDisplayName, getAllCategories } from '@/features/projects/constants/equipmentCategories';
import { useMyRole } from '@/features/projectMembers/hooks/useProjectMembers';
import { EquipmentTemplates } from '@/features/equipment/components/EquipmentTemplates';

interface EquipmentViewProps {
  projectId: string;
}

export function EquipmentView({ projectId }: EquipmentViewProps) {
  const { firebaseUser, user: firestoreUser, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  // Queries
  const { data: project } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: equipment = [], isLoading } = trpc.equipment.listByProject.useQuery({ projectId });
  const { data: activeCheckouts = [] } = trpc.equipment.getActiveCheckouts.useQuery({ projectId });
  const { data: crewMembers = [] } = trpc.crew.listByProject.useQuery({ projectId });
  const { data: packages = [] } = trpc.equipment.listPackages.useQuery({ projectId });
  const { data: myRole } = useMyRole(projectId);
  const canEdit = myRole === 'owner' || myRole === 'admin' || myRole === 'dept_head' || myRole === 'crew';

  // Budget mutations
  const createFromEquipment = trpc.budget.createFromEquipment.useMutation({
    onSuccess: () => {
      utils.budget.getBudget.invalidate({ projectId });
      alert('Budget items created successfully!');
    },
  });

  // Mutations
  const createEquipment = trpc.equipment.create.useMutation({
    onSuccess: () => {
      utils.equipment.listByProject.invalidate({ projectId });
      setShowAddForm(false);
      resetForm();
    },
  });

  const updateEquipment = trpc.equipment.update.useMutation({
    onSuccess: () => {
      utils.equipment.listByProject.invalidate({ projectId });
      setShowEditModal(false);
      setEditingEquipment(null);
      resetForm();
    },
  });

  const deleteEquipment = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      utils.equipment.listByProject.invalidate({ projectId });
    },
  });

  // Bulk delete mutation
  const bulkDeleteEquipment = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      utils.equipment.listByProject.invalidate({ projectId });
      setSelectedEquipment(new Set());
    },
  });

  // Handle bulk actions
  const handleBulkCreateBudget = () => {
    if (selectedEquipment.size === 0) return;
    const equipmentIds = Array.from(selectedEquipment);
    createFromEquipment.mutate({ 
      projectId, 
      equipmentIds 
    });
    setSelectedEquipment(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedEquipment.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedEquipment.size} equipment item(s)?`)) return;
    
    Promise.all(
      Array.from(selectedEquipment).map(id => 
        bulkDeleteEquipment.mutateAsync({ id })
      )
    ).then(() => {
      setSelectedEquipment(new Set());
    });
  };

  const handleSelectAll = () => {
    if (selectedEquipment.size === filteredEquipment.length) {
      setSelectedEquipment(new Set());
    } else {
      setSelectedEquipment(new Set(filteredEquipment.map(e => e.id)));
    }
  };

  const handleToggleSelect = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipment);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipment(newSelected);
  };

  const checkoutEquipment = trpc.equipment.checkout.useMutation({
    onSuccess: () => {
      utils.equipment.listByProject.invalidate({ projectId });
      utils.equipment.getActiveCheckouts.invalidate({ projectId });
      setShowCheckoutModal(false);
      resetCheckoutForm();
    },
  });

  const returnEquipment = trpc.equipment.returnEquipment.useMutation({
    onSuccess: () => {
      utils.equipment.listByProject.invalidate({ projectId });
      utils.equipment.getActiveCheckouts.invalidate({ projectId });
    },
  });

  const addCustomCategory = trpc.projects.addCustomEquipmentCategory.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
    },
  });

  const removeCustomCategory = trpc.projects.removeCustomEquipmentCategory.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
    },
  });

  const createPackage = trpc.equipment.createPackage.useMutation({
    onSuccess: () => {
      utils.equipment.listPackages.invalidate({ projectId });
      setShowAddPackageForm(false);
      setPackageFormData({ name: '', description: '', equipmentIds: [] });
      setPackageEquipmentSearch('');
      setPackageCategoryFilter('');
    },
  });

  const deletePackage = trpc.equipment.deletePackage.useMutation({
    onSuccess: () => {
      utils.equipment.listPackages.invalidate({ projectId });
    },
  });

  // View state
  const [activeView, setActiveView] = useState<'equipment' | 'packages'>('equipment');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutEquipmentItem, setCheckoutEquipmentItem] = useState<Equipment | null>(null);
  const [showAddPackageForm, setShowAddPackageForm] = useState(false);
  const [showPackageCheckoutModal, setShowPackageCheckoutModal] = useState(false);
  const [checkoutPackage, setCheckoutPackage] = useState<any>(null);
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    equipmentIds: [] as string[],
  });
  const [packageEquipmentSearch, setPackageEquipmentSearch] = useState('');
  const [packageCategoryFilter, setPackageCategoryFilter] = useState('');
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    status: 'available' as EquipmentStatus,
    source: 'owned' as EquipmentSource,
    rentalVendor: '',
    dailyRate: '',
    weeklyRate: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    responsibleParty: '',
    notes: '',
    photoUrl: '',
  });

  // Checkout form state
  const [checkoutFormData, setCheckoutFormData] = useState({
    userId: '',
    userName: '',
    quantity: 1,
    dueDate: '',
    notes: '',
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(Object.keys(EQUIPMENT_CATEGORIES))
  );
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EquipmentStatus>>(
    new Set(['available', 'checked_out', 'reserved', 'maintenance', 'not_available'])
  );
  const [selectedSources, setSelectedSources] = useState<Set<EquipmentSource>>(
    new Set(['owned', 'rental', 'crew_provided'])
  );

  // Custom category management
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showInlineCategoryInput, setShowInlineCategoryInput] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');

  const customCategories = project?.customEquipmentCategories || [];
  const allCategories = getAllCategories(customCategories);

  // Auto-select custom categories on load
  useEffect(() => {
    if (customCategories.length > 0) {
      setSelectedCategories((prev) => {
        const updated = new Set(prev);
        customCategories.forEach((cat) => updated.add(cat));
        return updated;
      });
    }
  }, [customCategories.length]);

  // Filtered equipment for package builder
  const availableEquipmentForPackage = useMemo(() => {
    return equipment.filter((item) => {
      // Already selected
      if (packageFormData.equipmentIds.includes(item.id)) return false;
      
      // Search filter
      const searchLower = packageEquipmentSearch.toLowerCase();
      const matchesSearch =
        !searchLower ||
        item.name.toLowerCase().includes(searchLower) ||
        item.manufacturer?.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = !packageCategoryFilter || item.category === packageCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [equipment, packageFormData.equipmentIds, packageEquipmentSearch, packageCategoryFilter]);

  const selectedEquipmentForPackage = useMemo(() => {
    return equipment.filter((item) => packageFormData.equipmentIds.includes(item.id));
  }, [equipment, packageFormData.equipmentIds]);

  // Filtered equipment
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter (OR within group)
      const matchesCategory =
        selectedCategories.size === 0 || selectedCategories.has(item.category);

      // Status filter (OR within group)
      const matchesStatus =
        selectedStatuses.size === 0 || selectedStatuses.has(item.status);

      // Source filter (OR within group)
      const matchesSource =
        selectedSources.size === 0 || selectedSources.has(item.source);

      // AND between groups
      return matchesCategory && matchesStatus && matchesSource;
    });
  }, [equipment, searchQuery, selectedCategories, selectedStatuses, selectedSources]);

  // Category hierarchy order (most important first)
  const categoryOrder: Record<string, number> = {
    camera: 1,
    lenses: 2,
    lighting: 3,
    audio: 4,
    grip: 5,
    power: 6,
    monitors: 7,
    wireless_video: 8,
    specialty: 9,
    vehicles: 10,
    other: 999, // Always last
  };

  // Group filtered equipment by category
  const equipmentByCategory = useMemo(() => {
    return filteredEquipment.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof filteredEquipment>);
  }, [filteredEquipment]);

  // Sort categories by hierarchy
  const sortedCategoryEntries = useMemo(() => {
    return Object.entries(equipmentByCategory).sort(([catA], [catB]) => {
      const orderA = categoryOrder[catA] ?? 500; // Custom categories go in the middle
      const orderB = categoryOrder[catB] ?? 500;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If same order, sort alphabetically
      return catA.localeCompare(catB);
    });
  }, [equipmentByCategory]);

  // Get count for each category (from all equipment, not filtered)
  const getCategoryCount = (category: string) => {
    return equipment.filter(e => e.category === category).length;
  };

  // Stats
  const stats = useMemo(() => {
    const total = equipment.length;
    const available = equipment.filter((e) => e.status === 'available').length;
    const checkedOut = equipment.filter((e) => e.status === 'checked_out').length;
    const totalValue = equipment.reduce((sum, e) => sum + (e.dailyRate || 0), 0);

    return { total, available, checkedOut, totalValue };
  }, [equipment]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: 1,
      status: 'available',
      source: 'owned',
      rentalVendor: '',
      dailyRate: '',
      weeklyRate: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      responsibleParty: '',
      notes: '',
      photoUrl: '',
    });
    setImagePreview(null);
    setImageFile(null);
  };

  const resetCheckoutForm = () => {
    setCheckoutFormData({
      userId: '',
      userName: '',
      quantity: 1,
      dueDate: '',
      notes: '',
    });
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      status: item.status,
      source: item.source,
      rentalVendor: item.rentalVendor || '',
      dailyRate: item.dailyRate?.toString() || '',
      weeklyRate: item.weeklyRate?.toString() || '',
      serialNumber: item.serialNumber || '',
      manufacturer: item.manufacturer || '',
      model: item.model || '',
      responsibleParty: item.responsibleParty || '',
      notes: item.notes || '',
      photoUrl: item.photoUrl || '',
    });
    setImagePreview(item.photoUrl || null);
    setImageFile(null); // Clear file when editing existing equipment
    setShowEditModal(true);
  };

  const handleCheckout = (item: Equipment) => {
    setCheckoutEquipmentItem(item);
    setCheckoutFormData({
      userId: firebaseUser?.uid || '',
      userName: firebaseUser?.displayName || firebaseUser?.email || '',
      quantity: 1,
      dueDate: '',
      notes: '',
    });
    setShowCheckoutModal(true);
  };

  const handleReturn = async (checkout: CheckoutHistory) => {
    if (confirm(`Return ${checkout.equipmentName}?`)) {
      await returnEquipment.mutateAsync({
        checkoutId: checkout.id,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      await deleteEquipment.mutateAsync({ id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !firebaseUser.uid) {
      alert('Please wait for authentication to complete');
      return;
    }

    let finalPhotoUrl = formData.photoUrl;

    // Handle image upload if it's a blob URL
    if (imagePreview && isBlobUrl(imagePreview) && imageFile) {
      setUploadingImage(true);
      try {
        const filename = generateUniqueFilename(imageFile.name);
        const storagePath = `equipment/${projectId}/${filename}`;
        finalPhotoUrl = await uploadImage(imageFile, storagePath);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    const equipmentData = {
      projectId,
      name: formData.name,
      category: formData.category,
      quantity: formData.quantity,
      status: formData.status,
      source: formData.source,
      rentalVendor: formData.rentalVendor || undefined,
      dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
      weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
      serialNumber: formData.serialNumber || undefined,
      manufacturer: formData.manufacturer || undefined,
      model: formData.model || undefined,
      responsibleParty: formData.responsibleParty || undefined,
      notes: formData.notes || undefined,
      photoUrl: finalPhotoUrl || undefined,
      assignedTo: [],
      createdBy: firebaseUser.uid,
    };

    if (editingEquipment) {
      // Delete old image if changed
      if (
        editingEquipment.photoUrl &&
        isFirebaseStorageUrl(editingEquipment.photoUrl) &&
        editingEquipment.photoUrl !== finalPhotoUrl
      ) {
        try {
          await deleteImage(editingEquipment.photoUrl);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      await updateEquipment.mutateAsync({
        id: editingEquipment.id,
        data: equipmentData,
      });
    } else {
      await createEquipment.mutateAsync(equipmentData);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEquipmentItem) return;

    await checkoutEquipment.mutateAsync({
      projectId,
      equipmentId: checkoutEquipmentItem.id,
      equipmentName: checkoutEquipmentItem.name,
      userId: checkoutFormData.userId,
      userName: checkoutFormData.userName,
      quantity: checkoutFormData.quantity,
      checkoutDate: new Date(),
      dueDate: checkoutFormData.dueDate ? new Date(checkoutFormData.dueDate) : undefined,
      notes: checkoutFormData.notes || undefined,
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);
    setFormData({ ...formData, photoUrl: previewUrl });
  };

  const handleImageDelete = async () => {
    if (imagePreview) {
      if (isBlobUrl(imagePreview)) {
        URL.revokeObjectURL(imagePreview);
      } else if (isFirebaseStorageUrl(imagePreview)) {
        try {
          await deleteImage(imagePreview);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    }
    setImagePreview(null);
    setImageFile(null);
    setImageFile(null);
    setFormData({ ...formData, photoUrl: '' });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const result = await addCustomCategory.mutateAsync({
        projectId,
        category: newCategoryName.trim(),
      });

      // Auto-select the new category
      setSelectedCategories((prev) => new Set(prev).add(result.category));
      setNewCategoryName('');
      setShowAddCategoryInput(false);
    } catch (error: any) {
      alert(error.message || 'Failed to add category');
    }
  };

  const handleAddInlineCategory = async () => {
    if (!inlineCategoryName.trim()) return;

    try {
      const result = await addCustomCategory.mutateAsync({
        projectId,
        category: inlineCategoryName.trim(),
      });

      // Set it as the selected category in the form
      setFormData({ ...formData, category: result.category });
      setSelectedCategories((prev) => new Set(prev).add(result.category));
      setInlineCategoryName('');
      setShowInlineCategoryInput(false);
    } catch (error: any) {
      alert(error.message || 'Failed to add category');
    }
  };

  const handleRemoveCustomCategory = async (category: string) => {
    if (confirm(`Remove custom category "${category}"?`)) {
      await removeCustomCategory.mutateAsync({ projectId, category });
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const updated = new Set(prev);
      if (updated.has(category)) {
        updated.delete(category);
      } else {
        updated.add(category);
      }
      return updated;
    });
  };

  const toggleStatus = (status: EquipmentStatus) => {
    setSelectedStatuses((prev) => {
      const updated = new Set(prev);
      if (updated.has(status)) {
        updated.delete(status);
      } else {
        updated.add(status);
      }
      return updated;
    });
  };

  const toggleSource = (source: EquipmentSource) => {
    setSelectedSources((prev) => {
      const updated = new Set(prev);
      if (updated.has(source)) {
        updated.delete(source);
      } else {
        updated.add(source);
      }
      return updated;
    });
  };

  const selectAllCategories = () => {
    setSelectedCategories(new Set(allCategories));
  };

  const clearAllCategories = () => {
    setSelectedCategories(new Set());
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* View Toggle */}
          <div className="flex gap-2 mb-6 border-b border-[rgb(var(--border-default))]">
            <button
              onClick={() => setActiveView('equipment')}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                activeView === 'equipment'
                  ? 'border-[rgb(var(--accent-primary))] text-[rgb(var(--accent-primary))]'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              📦 Equipment
            </button>
            <button
              onClick={() => setActiveView('packages')}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                activeView === 'packages'
                  ? 'border-[rgb(var(--accent-primary))] text-[rgb(var(--accent-primary))]'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              🎁 Packages & Kits
            </button>
          </div>

          {activeView === 'equipment' ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-text-primary mb-2">Equipment</h1>
                  <p className="text-text-secondary">
                    Manage cameras, lights, audio gear, and equipment accountability
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-[rgb(var(--accent-primary))] rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors"
                    style={{ color: 'rgb(var(--colored-button-text))' }}
                  >
                    {showAddForm ? 'Cancel' : '+ Add Equipment'}
                  </button>
                  {canEdit && (
                    <button
                      className="px-4 py-2 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg hover:bg-[rgb(var(--background-tertiary))] transition-colors text-text-primary font-medium"
                      onClick={() => setShowTemplatesModal(true)}
                    >
                      📋 Apply Template
                    </button>
                  )}
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 border border-[rgb(var(--border-default))] rounded-lg p-1 bg-[rgb(var(--background-secondary))]">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-[rgb(var(--accent-primary))]' 
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      style={viewMode === 'grid' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-[rgb(var(--accent-primary))]' 
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      style={viewMode === 'list' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedEquipment.size > 0 && (
                <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-text-primary">
                      {selectedEquipment.size} equipment item{selectedEquipment.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-accent-primary hover:underline"
                    >
                      {selectedEquipment.size === filteredEquipment.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <>
                        <button
                          onClick={handleBulkCreateBudget}
                          className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors text-sm font-medium"
                          style={{ color: 'rgb(var(--colored-button-text))' }}
                          disabled={createFromEquipment.isPending}
                        >
                          {createFromEquipment.isPending ? 'Creating...' : '💰 Create Budget Items'}
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors text-sm font-medium"
                          disabled={bulkDeleteEquipment.isPending}
                        >
                          {bulkDeleteEquipment.isPending ? 'Deleting...' : '🗑️ Delete Selected'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedEquipment(new Set())}
                      className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-text-primary text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4">
              <div className="text-text-tertiary text-sm mb-1">Total Items</div>
              <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            </div>
            <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4">
              <div className="text-text-tertiary text-sm mb-1">Available</div>
              <div className="text-2xl font-bold text-green-400">{stats.available}</div>
            </div>
            <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4">
              <div className="text-text-tertiary text-sm mb-1">Checked Out</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.checkedOut}</div>
            </div>
            <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4">
              <div className="text-text-tertiary text-sm mb-1">Daily Rental Value</div>
              <div className="text-2xl font-bold text-text-primary">${stats.totalValue}</div>
            </div>
          </div>

          {/* Add Equipment Form */}
          {showAddForm && (
            <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Add New Equipment</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Equipment Photo */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Equipment Photo
                    </label>
                    {!imagePreview ? (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-[rgb(var(--border-default))] rounded-lg p-8 text-center cursor-pointer hover:border-[rgb(var(--accent-primary))] transition-colors"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                          className="hidden"
                          id="equipment-photo-upload"
                        />
                        <label htmlFor="equipment-photo-upload" className="cursor-pointer">
                          <div className="text-4xl mb-2">📷</div>
                          <div className="text-text-secondary">
                            Drag & drop or click to upload equipment photo
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Equipment preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleImageDelete}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          style={{ color: 'rgb(var(--colored-button-text))' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Equipment Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ARRI Alexa Mini LF"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Category *
                    </label>
                    {!showInlineCategoryInput ? (
                      <div className="flex gap-2">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="flex-1 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                          required
                        >
                          <option value="">Select category...</option>
                          {Object.keys(EQUIPMENT_CATEGORIES).map((key) => (
                            <option key={key} value={key}>
                              {EQUIPMENT_CATEGORIES[key]}
                            </option>
                          ))}
                          {customCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowInlineCategoryInput(true)}
                          className="px-3 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--accent-primary))] transition-colors text-text-secondary text-sm"
                        >
                          + Custom
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="New category name"
                          value={inlineCategoryName}
                          onChange={(e) => setInlineCategoryName(e.target.value)}
                          className="flex-1 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInlineCategory();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddInlineCategory}
                          className="px-3 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))]"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInlineCategoryInput(false);
                            setInlineCategoryName('');
                          }}
                          className="px-3 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--border-emphasis))] transition-colors text-text-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ARRI, RED, Sony"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Alexa Mini LF"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    />
                  </div>

                  {/* Source */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Source *
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value as EquipmentSource })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    >
                      <option value="owned">Owned</option>
                      <option value="rental">Rental</option>
                      <option value="crew_provided">Crew Provided</option>
                    </select>
                  </div>

                  {/* Rental Vendor (if rental) */}
                  {formData.source === 'rental' && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Rental Vendor
                      </label>
                      <input
                        type="text"
                        placeholder="Vendor name"
                        value={formData.rentalVendor}
                        onChange={(e) => setFormData({ ...formData, rentalVendor: e.target.value })}
                        className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      />
                    </div>
                  )}

                  {/* Daily Rate (if rental) */}
                  {formData.source === 'rental' && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Daily Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.dailyRate}
                        onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                        className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      />
                    </div>
                  )}

                  {/* Weekly Rate (if rental) */}
                  {formData.source === 'rental' && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Weekly Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.weeklyRate}
                        onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                        className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      />
                    </div>
                  )}

                  {/* Serial Number */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      placeholder="Serial or asset number"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Responsible Party */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Responsible Party
                    </label>
                    <select
                      value={formData.responsibleParty}
                      onChange={(e) => setFormData({ ...formData, responsibleParty: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    >
                      <option value="">Select crew member...</option>
                      {crewMembers.map((crew) => (
                        <option key={crew.id} value={crew.name}>
                          {crew.name} - {crew.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      rows={3}
                      placeholder="Condition, accessories, special notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={createEquipment.isPending || uploadingImage || authLoading || !firebaseUser?.uid}
                    className="px-4 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors disabled:opacity-50"
                  >
                    {authLoading ? 'Loading...' : uploadingImage ? 'Uploading...' : createEquipment.isPending ? 'Adding...' : 'Add Equipment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--border-emphasis))] transition-colors text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Equipment Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-text-secondary">Loading equipment...</div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">No equipment found</h3>
              <p className="text-text-secondary">
                {equipment.length === 0
                  ? 'Add your first piece of equipment to get started'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <>
              {sortedCategoryEntries.length > 0 ? (
                <div className="space-y-8">
                  {sortedCategoryEntries.map(([category, items]) => (
                    <div key={category}>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold text-text-primary">{getCategoryDisplayName(category)}</h2>
                        <span className="badge-primary">{items.length}</span>
                      </div>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((item) => (
                    <div
                      id={`element-${item.id}`}
                      key={item.id}
                      className={`bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4 hover:border-[rgb(var(--accent-primary))] transition-all relative ${selectedEquipment.has(item.id) ? 'ring-2 ring-accent-primary border-accent-primary' : ''}`}
                    >
                      {/* Selection Checkbox */}
                      {canEdit && (
                        <div className="absolute top-2 right-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedEquipment.has(item.id)}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer bg-transparent checked:bg-accent-primary"
                            style={{
                              accentColor: 'rgb(var(--accent-primary))',
                            }}
                          />
                        </div>
                      )}
                  {/* Equipment Photo */}
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">{item.name}</h3>
                      {(item.manufacturer || item.model) && (
                        <p className="text-sm text-text-tertiary mb-2">
                          {[item.manufacturer, item.model].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'available'
                          ? 'bg-green-500/20 text-green-400'
                          : item.status === 'checked_out'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : item.status === 'reserved'
                          ? 'bg-blue-500/20 text-blue-400'
                          : item.status === 'not_available'
                          ? 'bg-gray-500/20 text-gray-400'
                          : item.status === 'maintenance'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-tertiary">Category:</span>
                      <span className="text-text-secondary">{getCategoryDisplayName(item.category)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-tertiary">Quantity:</span>
                      <span className="text-text-secondary">
                        {item.quantityAvailable} / {item.quantity} available
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-tertiary">Source:</span>
                      <span className="text-text-secondary">
                        {item.source === 'owned' ? 'Owned' : item.source === 'rental' ? 'Rental' : 'Crew Provided'}
                      </span>
                    </div>
                    {item.serialNumber && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-tertiary">Serial:</span>
                        <span className="text-text-secondary font-mono">{item.serialNumber}</span>
                      </div>
                    )}
                    {item.dailyRate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-tertiary">Daily Rate:</span>
                        <span className="text-text-secondary">${item.dailyRate}</span>
                      </div>
                    )}
                  </div>

                  {/* Budget Integration */}
                  <EquipmentBudgetSection 
                    projectId={projectId} 
                    equipmentId={item.id}
                    canEdit={canEdit}
                    onCreateBudgetItem={() => {
                      createFromEquipment.mutate({ 
                        projectId, 
                        equipmentIds: [item.id] 
                      });
                    }}
                    onViewBudget={() => {
                      window.location.href = `/projects/${projectId}#budget`;
                    }}
                  />

                  <div className="flex gap-2">
                    {item.quantityAvailable > 0 && (
                      <button
                        onClick={() => handleCheckout(item)}
                        className="flex-1 px-3 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors text-sm"
                      >
                        Checkout
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--accent-primary))] transition-colors text-text-secondary text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                    <div 
                      id={`element-${item.id}`}
                      key={item.id} 
                      className={`bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4 hover:border-[rgb(var(--accent-primary))] transition-all flex items-center gap-4 ${selectedEquipment.has(item.id) ? 'ring-2 ring-accent-primary border-accent-primary bg-accent-primary/5' : ''}`}
                    >
                      {/* Selection Checkbox */}
                      {canEdit && (
                        <input
                          type="checkbox"
                          checked={selectedEquipment.has(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary flex-shrink-0 cursor-pointer bg-transparent checked:bg-accent-primary"
                          style={{
                            accentColor: 'rgb(var(--accent-primary))',
                          }}
                        />
                      )}
                      
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-[rgb(var(--background-tertiary))] rounded-lg flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-text-primary truncate">{item.name}</h3>
                            {(item.manufacturer || item.model) && (
                              <p className="text-sm text-text-tertiary">
                                {[item.manufacturer, item.model].filter(Boolean).join(' ')}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                              item.status === 'available'
                                ? 'bg-green-500/20 text-green-400'
                                : item.status === 'checked_out'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : item.status === 'reserved'
                                ? 'bg-blue-500/20 text-blue-400'
                                : item.status === 'not_available'
                                ? 'bg-gray-500/20 text-gray-400'
                                : item.status === 'maintenance'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span>Category: {getCategoryDisplayName(item.category)}</span>
                          <span>Qty: {item.quantityAvailable} / {item.quantity}</span>
                          {item.dailyRate && <span>${item.dailyRate}/day</span>}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {item.quantityAvailable > 0 && (
                          <button
                            onClick={() => handleCheckout(item)}
                            className="px-3 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors text-sm"
                          >
                            Checkout
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--accent-primary))] transition-colors text-text-secondary text-sm"
                        >
                          Edit
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No equipment found</h3>
                  <p className="text-text-secondary">
                    {equipment.length === 0
                      ? 'Add your first piece of equipment to get started'
                      : 'Try adjusting your filters'}
                  </p>
                </div>
              )}
            </>
          )}
            </>
          ) : (
            <>
              {/* Packages View */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-text-primary mb-2">Packages & Kits</h1>
                  <p className="text-text-secondary">
                    Group equipment into packages for easy checkout and management
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPackageForm(!showAddPackageForm)}
                  className="px-4 py-2 bg-[rgb(var(--accent-primary))] rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors"
                  style={{ color: 'rgb(var(--colored-button-text))' }}
                >
                  {showAddPackageForm ? 'Cancel' : '+ Create Package'}
                </button>
              </div>

              {/* Add Package Form */}
              {showAddPackageForm && (
                <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6 mb-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!firebaseUser || !firebaseUser.uid) return;
                      
                      createPackage.mutate({
                        projectId,
                        name: packageFormData.name,
                        description: packageFormData.description,
                        equipmentIds: packageFormData.equipmentIds,
                        createdBy: firebaseUser.uid,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={packageFormData.name}
                        onChange={(e) => setPackageFormData({ ...packageFormData, name: e.target.value })}
                        placeholder="e.g., Camera Package A, Lighting Kit 1"
                        className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Description
                      </label>
                      <textarea
                        value={packageFormData.description}
                        onChange={(e) => setPackageFormData({ ...packageFormData, description: e.target.value })}
                        placeholder="Describe what's in this package..."
                        className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary min-h-[100px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-3">
                        Add Equipment to Package
                      </label>

                      {/* Two-Panel Equipment Selector */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Available Equipment Panel */}
                        <div className="border border-border-default rounded-lg bg-background-primary">
                          <div className="p-3 border-b border-border-default bg-background-tertiary">
                            <div className="text-xs font-semibold text-text-tertiary mb-2">
                              AVAILABLE ({availableEquipmentForPackage.length})
                            </div>
                            
                            {/* Search */}
                            <input
                              type="text"
                              value={packageEquipmentSearch}
                              onChange={(e) => setPackageEquipmentSearch(e.target.value)}
                              placeholder="Search equipment..."
                              className="w-full px-2 py-1 text-sm bg-background-primary border border-border-default rounded"
                            />
                            
                            {/* Category Filter */}
                            <select
                              value={packageCategoryFilter}
                              onChange={(e) => setPackageCategoryFilter(e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-background-primary border border-border-default rounded mt-2"
                            >
                              <option value="">All Categories</option>
                              {Object.entries(EQUIPMENT_CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                              {customCategories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div className="max-h-96 overflow-y-auto p-2">
                            {availableEquipmentForPackage.length === 0 ? (
                              <p className="text-sm text-text-tertiary text-center py-8">
                                {equipment.length === 0 ? 'No equipment available' : 'No matching equipment'}
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {availableEquipmentForPackage.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setPackageFormData({
                                        ...packageFormData,
                                        equipmentIds: [...packageFormData.equipmentIds, item.id],
                                      });
                                    }}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-background-tertiary transition-colors group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-text-primary truncate">{item.name}</div>
                                        <div className="text-xs text-text-tertiary">
                                          {getCategoryDisplayName(item.category)}
                                        </div>
                                      </div>
                                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selected Equipment Panel */}
                        <div className="border border-border-default rounded-lg bg-background-primary">
                          <div className="p-3 border-b border-border-default bg-accent-primary/10">
                            <div className="text-xs font-semibold text-accent-primary">
                              SELECTED ({selectedEquipmentForPackage.length})
                            </div>
                          </div>

                          <div className="max-h-96 overflow-y-auto p-2">
                            {selectedEquipmentForPackage.length === 0 ? (
                              <p className="text-sm text-text-tertiary text-center py-8">
                                Click items to add them to the package
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {selectedEquipmentForPackage.map((item) => (
                                  <div
                                    key={item.id}
                                    className="px-3 py-2 rounded bg-accent-primary/5 group hover:bg-accent-primary/10 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-text-primary truncate">{item.name}</div>
                                        <div className="text-xs text-text-tertiary">
                                          {getCategoryDisplayName(item.category)}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPackageFormData({
                                            ...packageFormData,
                                            equipmentIds: packageFormData.equipmentIds.filter((id) => id !== item.id),
                                          });
                                        }}
                                        className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity"
                                      >
                                        <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPackageForm(false);
                          setPackageFormData({ name: '', description: '', equipmentIds: [] });
                          setPackageEquipmentSearch('');
                          setPackageCategoryFilter('');
                        }}
                        className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!packageFormData.name || packageFormData.equipmentIds.length === 0 || createPackage.isPending}
                        className="px-4 py-2 bg-[rgb(var(--accent-primary))] rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: 'rgb(var(--colored-button-text))' }}
                      >
                        {createPackage.isPending ? 'Creating...' : 'Create Package'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Packages List */}
              {packages.length === 0 ? (
                <div className="text-center py-16 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No Packages Yet</h3>
                  <p className="text-text-secondary">
                    Create your first equipment package to group related items together
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packages.map((pkg: any) => {
                    const packageEquipment = equipment.filter((e) => pkg.equipmentIds?.includes(e.id));
                    const allAvailable = packageEquipment.every((e) => e.status === 'available');
                    
                    return (
                      <div
                        key={pkg.id}
                        className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-text-primary mb-1">{pkg.name}</h3>
                            {pkg.description && (
                              <p className="text-sm text-text-secondary">{pkg.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              allAvailable
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {allAvailable ? 'All Available' : 'Partially Available'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-xs font-medium text-text-tertiary mb-2">
                            Equipment ({packageEquipment.length} items):
                          </div>
                          {packageEquipment.length === 0 ? (
                            <p className="text-sm text-text-tertiary italic">No equipment in this package</p>
                          ) : (
                            <div className="space-y-1">
                              {packageEquipment.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <span className="text-text-secondary">{item.name}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    item.status === 'available'
                                      ? 'bg-green-500/20 text-green-400'
                                      : item.status === 'checked_out'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {item.status.replace('_', ' ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-border-default">
                          <button
                            onClick={() => {
                              setCheckoutPackage(pkg);
                              setShowPackageCheckoutModal(true);
                            }}
                            disabled={packageEquipment.length === 0}
                            className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            📤 Checkout Kit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete package "${pkg.name}"?`)) {
                                deletePackage.mutate({ id: pkg.id });
                              }
                            }}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Sidebar - Filters & Accountability */}
      <div className="w-80 border-l border-[rgb(var(--border-default))] bg-[rgb(var(--background-secondary))] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Filters & Status</h2>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">Search</label>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary text-sm"
            />
          </div>

          {/* Category Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-secondary">Categories</label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllCategories}
                  className="text-xs text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--accent-hover))]"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllCategories}
                  className="text-xs text-text-tertiary hover:text-text-secondary"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.keys(EQUIPMENT_CATEGORIES)
                .sort((a, b) => {
                  const orderA = categoryOrder[a] ?? 500;
                  const orderB = categoryOrder[b] ?? 500;
                  if (orderA !== orderB) {
                    return orderA - orderB;
                  }
                  return a.localeCompare(b);
                })
                .map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(key)}
                    onChange={() => toggleCategory(key)}
                    className="rounded border-[rgb(var(--border-default))] bg-[rgb(var(--background-tertiary))] text-[rgb(var(--accent-primary))] focus:ring-[rgb(var(--accent-primary))]"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary">
                    {EQUIPMENT_CATEGORIES[key]}
                  </span>
                </label>
              ))}
              {customCategories.map((cat) => (
                <div key={cat} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer group flex-1">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded border-[rgb(var(--border-default))] bg-[rgb(var(--background-tertiary))] text-[rgb(var(--accent-primary))] focus:ring-[rgb(var(--accent-primary))]"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary">
                      {cat}
                    </span>
                  </label>
                  <button
                    onClick={() => handleRemoveCustomCategory(cat)}
                    className="text-xs text-red-400 hover:text-red-300"
                    title="Remove custom category"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {!showAddCategoryInput ? (
              <button
                onClick={() => setShowAddCategoryInput(true)}
                className="mt-3 text-sm text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--accent-hover))]"
              >
                + Add Custom Category
              </button>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded px-2 py-1 text-sm text-text-primary"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCategory();
                    }
                  }}
                />
                <button
                  onClick={handleAddCustomCategory}
                  className="px-2 py-1 bg-[rgb(var(--accent-primary))] text-white rounded text-xs hover:bg-[rgb(var(--accent-hover))]"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddCategoryInput(false);
                    setNewCategoryName('');
                  }}
                  className="px-2 py-1 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded text-xs text-text-secondary hover:border-[rgb(var(--border-emphasis))]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Status Filters */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-3">Status</label>
            <div className="space-y-2">
              {['available', 'checked_out', 'reserved', 'maintenance', 'not_available'].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.has(status as EquipmentStatus)}
                    onChange={() => toggleStatus(status as EquipmentStatus)}
                    className="rounded border-[rgb(var(--border-default))] bg-[rgb(var(--background-tertiary))] text-[rgb(var(--accent-primary))] focus:ring-[rgb(var(--accent-primary))]"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary capitalize">
                    {status.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Source Filters */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-3">Source</label>
            <div className="space-y-2">
              {['owned', 'rental', 'crew_provided'].map((source) => (
                <label key={source} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSources.has(source as EquipmentSource)}
                    onChange={() => toggleSource(source as EquipmentSource)}
                    className="rounded border-[rgb(var(--border-default))] bg-[rgb(var(--background-tertiary))] text-[rgb(var(--accent-primary))] focus:ring-[rgb(var(--accent-primary))]"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary">
                    {source === 'owned' ? 'Owned' : source === 'rental' ? 'Rental' : 'Crew Provided'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Accountability Panel */}
          <div className="border-t border-[rgb(var(--border-default))] pt-6">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Currently Checked Out</h3>
            {activeCheckouts.length === 0 ? (
              <p className="text-sm text-text-tertiary">No equipment currently checked out</p>
            ) : (
              <div className="space-y-3">
                {activeCheckouts.map((checkout) => (
                  <div
                    key={checkout.id}
                    className="bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg p-3"
                  >
                    <div className="text-sm font-medium text-text-primary mb-1">
                      {checkout.equipmentName}
                    </div>
                    <div className="text-xs text-text-secondary mb-1">
                      Checked out by: {checkout.userName}
                    </div>
                    <div className="text-xs text-text-tertiary mb-2">
                      Qty: {checkout.quantity} • {new Date(checkout.checkoutDate).toLocaleDateString()}
                    </div>
                    {checkout.dueDate && (
                      <div className="text-xs text-yellow-400 mb-2">
                        Due: {new Date(checkout.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <button
                      onClick={() => handleReturn(checkout)}
                      className="w-full px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                    >
                      Mark as Returned
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Equipment Modal */}
      {showEditModal && editingEquipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Edit Equipment</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEquipment(null);
                    resetForm();
                  }}
                  className="text-text-tertiary hover:text-text-primary text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Same form fields as Add Form */}
                  {/* Equipment Photo */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Equipment Photo
                    </label>
                    {!imagePreview ? (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-[rgb(var(--border-default))] rounded-lg p-8 text-center cursor-pointer hover:border-[rgb(var(--accent-primary))] transition-colors"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                          className="hidden"
                          id="equipment-photo-upload-edit"
                        />
                        <label htmlFor="equipment-photo-upload-edit" className="cursor-pointer">
                          <div className="text-4xl mb-2">📷</div>
                          <div className="text-text-secondary">
                            Drag & drop or click to upload equipment photo
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Equipment preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleImageDelete}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          style={{ color: 'rgb(var(--colored-button-text))' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Equipment Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ARRI Alexa Mini LF"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Category *
                    </label>
                    {!showInlineCategoryInput ? (
                      <div className="flex gap-2">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="flex-1 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                          required
                        >
                          <option value="">Select category...</option>
                          {Object.keys(EQUIPMENT_CATEGORIES).map((key) => (
                            <option key={key} value={key}>
                              {EQUIPMENT_CATEGORIES[key]}
                            </option>
                          ))}
                          {customCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowInlineCategoryInput(true)}
                          className="px-3 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--accent-primary))] transition-colors text-text-secondary text-sm"
                        >
                          + Custom
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="New category name"
                          value={inlineCategoryName}
                          onChange={(e) => setInlineCategoryName(e.target.value)}
                          className="flex-1 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInlineCategory();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddInlineCategory}
                          className="px-3 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))]"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInlineCategoryInput(false);
                            setInlineCategoryName('');
                          }}
                          className="px-3 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--border-emphasis))] transition-colors text-text-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ARRI, RED, Sony"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Alexa Mini LF"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    >
                      <option value="available">Available</option>
                      <option value="checked_out">Checked Out</option>
                      <option value="reserved">Reserved</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="not_available">Not Available</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Source *
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value as EquipmentSource })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    >
                      <option value="owned">Owned</option>
                      <option value="rental">Rental</option>
                      <option value="crew_provided">Crew Provided</option>
                    </select>
                  </div>

                  {/* Rental Vendor (if rental) */}
                  {formData.source === 'rental' && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Rental Vendor
                      </label>
                      <input
                        type="text"
                        placeholder="Vendor name"
                        value={formData.rentalVendor}
                        onChange={(e) => setFormData({ ...formData, rentalVendor: e.target.value })}
                        className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      />
                    </div>
                  )}

                  {/* Daily Rate (if rental) */}
                  {formData.source === 'rental' && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Daily Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.dailyRate}
                        onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                        className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      />
                    </div>
                  )}

                  {/* Weekly Rate (if rental) */}
                  {formData.source === 'rental' && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Weekly Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.weeklyRate}
                        onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                        className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      />
                    </div>
                  )}

                  {/* Serial Number */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      placeholder="Serial or asset number"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Responsible Party */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Responsible Party
                    </label>
                    <select
                      value={formData.responsibleParty}
                      onChange={(e) => setFormData({ ...formData, responsibleParty: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    >
                      <option value="">Select crew member...</option>
                      {crewMembers.map((crew) => (
                        <option key={crew.id} value={crew.name}>
                          {crew.name} - {crew.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      rows={3}
                      placeholder="Condition, accessories, special notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={updateEquipment.isPending || uploadingImage || authLoading || !firebaseUser?.uid}
                    className="px-4 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors disabled:opacity-50"
                  >
                    {authLoading ? 'Loading...' : uploadingImage ? 'Uploading...' : updateEquipment.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEquipment(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--border-emphasis))] transition-colors text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && checkoutEquipmentItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Checkout Equipment</h2>
                <button
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setCheckoutEquipmentItem(null);
                    resetCheckoutForm();
                  }}
                  className="text-text-tertiary hover:text-text-primary text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-[rgb(var(--background-tertiary))] rounded-lg">
                <div className="font-semibold text-text-primary mb-1">
                  {checkoutEquipmentItem.name}
                </div>
                <div className="text-sm text-text-secondary">
                  Available: {checkoutEquipmentItem.quantityAvailable} / {checkoutEquipmentItem.quantity}
                </div>
              </div>

              <form onSubmit={handleCheckoutSubmit}>
                <div className="space-y-4">
                  {/* User ID (hidden - auto-filled) */}
                  <input type="hidden" value={checkoutFormData.userId} />

                  {/* User Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Checked Out By *
                    </label>
                    <input
                      type="text"
                      placeholder="Person's name"
                      value={checkoutFormData.userName}
                      onChange={(e) =>
                        setCheckoutFormData({ ...checkoutFormData, userName: e.target.value })
                      }
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={checkoutEquipmentItem.quantityAvailable}
                      value={checkoutFormData.quantity}
                      onChange={(e) =>
                        setCheckoutFormData({
                          ...checkoutFormData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={checkoutFormData.dueDate}
                      onChange={(e) =>
                        setCheckoutFormData({ ...checkoutFormData, dueDate: e.target.value })
                      }
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={checkoutFormData.notes}
                      onChange={(e) =>
                        setCheckoutFormData({ ...checkoutFormData, notes: e.target.value })
                      }
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      rows={3}
                      placeholder="Special instructions or notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={checkoutEquipment.isPending}
                    className="flex-1 px-4 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors disabled:opacity-50"
                  >
                    {checkoutEquipment.isPending ? 'Checking Out...' : 'Checkout'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setCheckoutEquipmentItem(null);
                      resetCheckoutForm();
                    }}
                    className="px-4 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--border-emphasis))] transition-colors text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Package Checkout Modal */}
      {showPackageCheckoutModal && checkoutPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Checkout Package</h2>
                <button
                  onClick={() => {
                    setShowPackageCheckoutModal(false);
                    setCheckoutPackage(null);
                    resetCheckoutForm();
                  }}
                  className="text-text-tertiary hover:text-text-primary text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-[rgb(var(--background-tertiary))] rounded-lg">
                <div className="font-semibold text-text-primary mb-2">
                  {checkoutPackage.name}
                </div>
                {checkoutPackage.description && (
                  <div className="text-sm text-text-secondary mb-3">
                    {checkoutPackage.description}
                  </div>
                )}
                
                {/* Equipment List */}
                <div className="text-xs font-medium text-text-tertiary mb-2">Equipment in this package:</div>
                <div className="space-y-1">
                  {equipment.filter((e) => checkoutPackage.equipmentIds?.includes(e.id)).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">{item.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        item.status === 'available'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.status === 'available' ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  
                  // Checkout all available equipment in the package
                  const availableEquipment = equipment.filter(
                    (e) => checkoutPackage.equipmentIds?.includes(e.id) && e.status === 'available'
                  );

                  if (availableEquipment.length === 0) {
                    alert('No equipment available to checkout in this package');
                    return;
                  }

                  // Checkout each piece of equipment
                  Promise.all(
                    availableEquipment.map((item) =>
                      checkoutEquipment.mutateAsync({
                        projectId,
                        equipmentId: item.id,
                        equipmentName: item.name,
                        userId: checkoutFormData.userId,
                        userName: checkoutFormData.userName,
                        quantity: 1,
                        checkoutDate: new Date(),
                        dueDate: checkoutFormData.dueDate ? new Date(checkoutFormData.dueDate) : undefined,
                        notes: checkoutFormData.notes || undefined,
                      })
                    )
                  ).then(() => {
                    setShowPackageCheckoutModal(false);
                    setCheckoutPackage(null);
                    resetCheckoutForm();
                    alert(`Successfully checked out ${availableEquipment.length} items from package "${checkoutPackage.name}"`);
                  }).catch((error) => {
                    alert(`Error checking out package: ${error.message}`);
                  });
                }}
              >
                <div className="space-y-4">
                  {/* User Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Checked Out By *
                    </label>
                    <input
                      type="text"
                      placeholder="Person's name"
                      value={checkoutFormData.userName}
                      onChange={(e) =>
                        setCheckoutFormData({ ...checkoutFormData, userName: e.target.value })
                      }
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      required
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={checkoutFormData.dueDate}
                      onChange={(e) =>
                        setCheckoutFormData({ ...checkoutFormData, dueDate: e.target.value })
                      }
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={checkoutFormData.notes}
                      onChange={(e) =>
                        setCheckoutFormData({ ...checkoutFormData, notes: e.target.value })
                      }
                      className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
                      rows={3}
                      placeholder="Special instructions or notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={checkoutEquipment.isPending}
                    className="flex-1 px-4 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors disabled:opacity-50"
                  >
                    {checkoutEquipment.isPending ? 'Checking Out...' : 'Checkout Entire Kit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPackageCheckoutModal(false);
                      setCheckoutPackage(null);
                      resetCheckoutForm();
                    }}
                    className="px-4 py-2 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg hover:border-[rgb(var(--border-emphasis))] transition-colors text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <EquipmentTemplates
          projectId={projectId}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}
    </div>
  );
}

// Component to show budget items linked to equipment
function EquipmentBudgetSection({ 
  projectId, 
  equipmentId, 
  canEdit,
  onCreateBudgetItem,
  onViewBudget 
}: { 
  projectId: string; 
  equipmentId: string;
  canEdit: boolean;
  onCreateBudgetItem: () => void;
  onViewBudget: () => void;
}) {
  const { data: budgetItems = [], isLoading } = trpc.budget.getItemsByEquipment.useQuery({
    projectId,
    equipmentId,
  });

  if (isLoading) {
    return <div className="text-xs text-text-tertiary mb-2">Loading budget...</div>;
  }

  if (budgetItems.length === 0) {
    return (
      <div className="pt-2 pb-2 border-t border-border-default mb-2">
        {canEdit && (
          <button
            onClick={onCreateBudgetItem}
            className="w-full text-xs px-2 py-1 bg-background-tertiary hover:bg-accent-primary/10 text-accent-primary rounded border border-border-default transition-colors"
          >
            💰 Create Budget Item
          </button>
        )}
      </div>
    );
  }

  const totalAmount = budgetItems.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);

  return (
    <div className="pt-2 pb-2 border-t border-border-default mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-primary">
          💰 {budgetItems.length} Budget Item{budgetItems.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onViewBudget}
          className="text-xs text-accent-primary hover:text-accent-hover"
        >
          View →
        </button>
      </div>
      <div className="text-xs text-text-secondary">
        Total: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {canEdit && (
        <button
          onClick={onCreateBudgetItem}
          className="mt-1 w-full text-xs px-2 py-1 bg-background-tertiary hover:bg-accent-primary/10 text-accent-primary rounded border border-border-default transition-colors"
        >
          + Add Another
        </button>
      )}
    </div>
  );
}
