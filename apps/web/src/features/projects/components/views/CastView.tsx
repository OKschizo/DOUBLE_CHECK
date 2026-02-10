'use client';

import { useState, useEffect } from 'react';
// import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl } from '@/lib/firebase/storage';
import { CastTemplates } from '@/features/cast/components/CastTemplates';
import { 
  useCastByProject, 
  useCreateCastMember, 
  useUpdateCastMember, 
  useDeleteCastMember 
} from '@/features/cast/hooks/useCast';
import { useProject, useUpdateProject } from '@/features/projects/hooks/useProjects';
import { useBudget } from '@/features/projects/hooks/useBudget';

interface CastViewProps {
  projectId: string;
}

const CAST_TYPES = [
  { value: 'lead', label: 'Lead Role' },
  { value: 'supporting', label: 'Supporting Role' },
  { value: 'featured', label: 'Featured' },
  { value: 'extra', label: 'Extra/Background' },
  { value: 'stunt', label: 'Stunt Performer' },
  { value: 'voice', label: 'Voice Only' },
] as const;

export function CastView({ projectId }: CastViewProps) {
  const { firebaseUser, user: firestoreUser } = useAuth();
  // const utils = trpc.useUtils();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedCastMembers, setSelectedCastMembers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newTypeName, setNewTypeName] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(CAST_TYPES.map(t => t.value))
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [formData, setFormData] = useState({
    actorName: '',
    characterName: '',
    castType: '',
    photoUrl: '',
    email: '',
    phone: '',
    agent: '',
    rate: '' as string | number,
  });

  // Fetch project data for custom cast types
  const { data: project } = useProject(projectId);
  const { mutateAsync: updateProject } = useUpdateProject();
  
  // Fetch cast members from Firestore
  const { data: castMembers = [], isLoading, error, refetch } = useCastByProject(projectId);

  // Mutations
  const createCastMember = useCreateCastMember();
  const updateCastMember = useUpdateCastMember();
  const deleteCastMember = useDeleteCastMember();
  
  // Placeholder budget hooks
  const { createItem: createBudgetItem } = useBudget(projectId);

  // Custom Cast Types Logic
  const handleAddCustomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || !project) {
      alert('Please enter a cast type name');
      return;
    }

    try {
      const currentTypes = project.customCastTypes || [];
      await updateProject({
        id: projectId,
        data: {
          customCastTypes: [...currentTypes, newTypeName.trim()]
        }
      });
      
      const newSelected = new Set(selectedTypes);
      newSelected.add(newTypeName.trim());
      setSelectedTypes(newSelected);
      
      setShowAddTypeModal(false);
      setNewTypeName('');
    } catch (error: any) {
      alert(error.message || 'Failed to add custom cast type');
    }
  };

  // Helper for cast types
  // FIX: Ensure cast types are distinct, sanitize input, and type correctly

  // Ensure custom cast types are valid, unique, and sorted
  const customTypes: string[] = Array.isArray(project?.customCastTypes)
    ? (Array.from(
        new Set(
          project.customCastTypes.filter(
            (t: unknown): t is string => typeof t === 'string' && !!t.trim()
          )
        )
      ) as string[]).sort((a: string, b: string) => a.localeCompare(b))
    : [];

  // Merge default and custom cast types, sort by label
  const allCastTypes = [
    ...CAST_TYPES,
    ...customTypes.map(t => ({ value: t, label: t })),
  ].sort((a, b) => a.label.localeCompare(b.label));

  const handleImageUpload = async (file: File) => {
      try {
          setUploadingImage(true);
          const url = await uploadImage(file, `cast/${projectId}`);
          setFormData(prev => ({ ...prev, photoUrl: url }));
      } catch (e) {
          console.error(e);
          alert("Upload failed");
      } finally {
          setUploadingImage(false);
      }
  };

  const handleDragOver = (e: any) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: any) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: any) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageUpload(file);
  };
  const handleFileInput = (e: any) => {
      // @ts-ignore
      const file = e.target.files[0];
      if (file) handleImageUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await createCastMember.mutateAsync({
            projectId,
            ...formData,
            rate: Number(formData.rate) || 0
        });
        setShowAddForm(false);
        setFormData({
            actorName: '',
            characterName: '',
            castType: '',
            photoUrl: '',
            email: '',
            phone: '',
            agent: '',
            rate: '',
        });
    } catch (e) {
        console.error(e);
        alert("Failed to add cast member");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
        await updateCastMember.mutateAsync({
            id: editingMember.id,
            data: {
                ...formData,
                rate: Number(formData.rate) || 0
            }
        });
        setShowEditModal(false);
        setEditingMember(null);
    } catch (e) {
        console.error(e);
        alert("Failed to update cast member");
    }
  };

  const handleDelete = async (id: string) => {
      if (confirm("Delete cast member?")) {
          await deleteCastMember.mutateAsync({ id });
      }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      actorName: member.actorName,
      characterName: member.characterName,
      castType: member.castType,
      photoUrl: member.photoUrl || '',
      email: member.email || '',
      phone: member.phone || '',
      agent: member.agent || '',
      rate: member.rate || '',
    });
    setShowAddForm(false);
    setShowEditModal(true);
  };

  const handleToggleSelect = (memberId: string) => {
    const newSelected = new Set(selectedCastMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedCastMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCastMembers.size === castMembers.length) {
      setSelectedCastMembers(new Set());
    } else {
      setSelectedCastMembers(new Set(castMembers.map(m => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCastMembers.size} members?`)) return;
    for (const id of Array.from(selectedCastMembers)) {
        await deleteCastMember.mutateAsync({ id });
    }
    setSelectedCastMembers(new Set());
  };

  const handleBulkCreateBudget = () => {
      alert("Not implemented");
  };

  const selectAllTypes = () => {
    setSelectedTypes(new Set(allCastTypes.map(t => t.value)));
  };

  const clearAllTypes = () => {
    setSelectedTypes(new Set());
  };

  const toggleType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const handleRemoveCustomType = async (type: string) => {
      if (!project) return;
      if (confirm(`Remove custom type "${type}"?`)) {
          const currentTypes = project.customCastTypes || [];
          try {
              await updateProject({
                  id: projectId,
                  data: { customCastTypes: currentTypes.filter((t: string) => t !== type) }
              });
              if (selectedTypes.has(type)) {
                  const newSelected = new Set(selectedTypes);
                  newSelected.delete(type);
                  setSelectedTypes(newSelected);
              }
          } catch (e) {
              console.error(e);
              alert("Failed to remove type");
          }
      }
  };

  // Mocks for undefined variables in JSX
  const addCustomCastType = { isPending: false };
  const createFromCast = { isPending: false, mutate: (args:any) => {} };
  const bulkDeleteCast = { isPending: false };

  const getAvatarColor = (name: string) => 'from-blue-500 to-purple-500'; // Placeholder
  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';

  // Filter cast members by search query and selected types
  const filteredCastMembers = castMembers.filter(member => {
    // Filter by selected type
    if (!selectedTypes.has(member.castType)) {
      return false;
    }
    
    // Filter by search query (actor name or character name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesActor = member.actorName.toLowerCase().includes(query);
      const matchesCharacter = member.characterName.toLowerCase().includes(query);
      return matchesActor || matchesCharacter;
    }
    
    return true;
  });

  // Group filtered cast by type
  const castByType = filteredCastMembers.reduce((acc, member) => {
    const type = member.castType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(member);
    return acc;
  }, {} as Record<string, typeof castMembers>);

  // Get count for each type (from all members, not filtered)
  const getTypeCount = (type: string) => {
    return castMembers.filter(m => m.castType === type).length;
  };

  const getCastTypeLabel = (value: string) => {
    const type = CAST_TYPES.find(t => t.value === value);
    return type?.label || value;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading cast members...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-text-primary">Error Loading Cast</h3>
          <p className="text-text-secondary mb-4">{error.message}</p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full relative">
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={() => setShowMobileFilters(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-accent-primary rounded-full shadow-lg flex items-center justify-center text-white"
        aria-label="Open filters"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {/* Center Content - Cast List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 text-text-primary">Cast</h1>
              <p className="text-text-secondary text-sm">
                {filteredCastMembers.length} of {castMembers.length} members
                {searchQuery && <span className="text-accent-primary"> • &quot;{searchQuery}&quot;</span>}
              </p>
            </div>
            {/* Mobile overflow menu */}
            <div className="relative md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-3 rounded-lg bg-background-secondary border border-border-default"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-background-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={() => { setShowMobileMenu(false); setShowTemplatesModal(true); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-background-tertiary flex items-center gap-3"
                    >
                      <span className="text-lg">📋</span> Apply Template
                    </button>
                    <div className="border-t border-border-default" />
                    <button
                      onClick={() => { setShowMobileMenu(false); setShowAddTypeModal(true); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-background-tertiary flex items-center gap-3"
                    >
                      <span className="text-lg">➕</span> Add Cast Type
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Desktop action buttons */}
          <div className="hidden md:flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => {
                if (!showAddForm) {
                  setFormData({
                    actorName: '',
                    characterName: '',
                    castType: '',
                    photoUrl: '',
                    email: '',
                    phone: '',
                    agent: '',
                    rate: '',
                  });
                  setPhotoFile(null);
                }
                setShowAddForm(!showAddForm);
              }}
              className="btn-primary"
            >
              + Add Cast Member
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowTemplatesModal(true)}
            >
              📋 Apply Template
            </button>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border border-border-default rounded-lg p-1 bg-background-secondary">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                style={viewMode === 'grid' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                style={viewMode === 'list' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
              >
                List
              </button>
            </div>
          </div>
          
          {/* Mobile primary action - Add Cast */}
          <button 
            onClick={() => {
              setFormData({
                actorName: '',
                characterName: '',
                castType: '',
                photoUrl: '',
                email: '',
                phone: '',
                agent: '',
                rate: '',
              });
              setPhotoFile(null);
              setShowAddForm(true);
            }} 
            className="md:hidden w-full btn-primary py-3 text-base font-semibold mb-4"
          >
            + Add Cast Member
          </button>
          
          {/* Desktop Bulk Actions Toolbar */}
          {selectedCastMembers.size > 0 && (
            <div className="hidden md:flex bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 mb-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-text-primary">
                  {selectedCastMembers.size} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-accent-primary hover:underline"
                >
                  {selectedCastMembers.size === filteredCastMembers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkCreateBudget}
                  className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors text-sm font-medium"
                  style={{ color: 'rgb(var(--colored-button-text))' }}
                  disabled={createFromCast.isPending}
                >
                  {createFromCast.isPending ? 'Creating...' : '💰 Create Budget Items'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors text-sm font-medium"
                  disabled={bulkDeleteCast.isPending}
                >
                  {bulkDeleteCast.isPending ? 'Deleting...' : '🗑️ Delete Selected'}
                </button>
                <button
                  onClick={() => setSelectedCastMembers(new Set())}
                  className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-text-primary text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by actor or character name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
            <svg 
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card-elevated p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Add New Cast Member</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                  isDragging
                    ? 'border-accent-primary bg-accent-primary/5'
                    : 'border-border-default bg-background-tertiary hover:border-accent-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  {formData.photoUrl ? (
                    <div className="relative">
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl object-cover shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center hover:bg-error/80 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-primary flex items-center justify-center text-3xl">
                        📷
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">
                        Drag & drop photo here
                      </p>
                      <p className="text-xs text-text-tertiary mb-3">or</p>
                      <label className="btn-secondary cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Actor Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Jane Smith"
                    required
                    className="input-field"
                    value={formData.actorName}
                    onChange={(e) => setFormData({ ...formData, actorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Character Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Sarah Connor"
                    required
                    className="input-field"
                    value={formData.characterName}
                    onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cast Type <span className="text-error">*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.castType}
                    onChange={(e) => setFormData({ ...formData, castType: e.target.value })}
                  >
                    <option value="">Select cast type</option>
                    {allCastTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="actor@example.com"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Agent/Agency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CAA, WME"
                    className="input-field"
                    value={formData.agent}
                    onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Day Rate
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    className="input-field"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" disabled={uploadingImage}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploadingImage}>
                  {uploadingImage ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    'Add Cast Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cast Grid by Type */}
        {castMembers.length === 0 && !showAddForm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary">No cast members yet</h3>
            <p className="text-text-secondary">Add your first cast member to get started</p>
          </div>
        )}

        {castMembers.length > 0 && filteredCastMembers.length === 0 && !showAddForm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2 text-text-primary">No matching cast members</h3>
            <p className="text-text-secondary mb-4">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : 'Try selecting different cast types in the filter'
              }
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                selectAllTypes();
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {Object.keys(castByType).length > 0 && (
          <div className="space-y-6 md:space-y-8">
            {Object.entries(castByType).map(([type, members]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <h2 className="text-base md:text-xl font-bold text-text-primary">{getCastTypeLabel(type)}</h2>
                  <span className="badge-primary text-xs">{members.length}</span>
                </div>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                    {members.map((member) => (
                      <div 
                        id={`element-${member.id}`} 
                        key={member.id} 
                        className={`card p-3 md:p-5 transition-all relative ${
                          selectedCastMembers.has(member.id) 
                            ? 'ring-2 ring-accent-primary border-accent-primary' 
                            : 'hover:border-accent-primary/50'
                        }`}
                      >
                        {/* Mobile Compact Layout */}
                        <div className="md:hidden">
                          {/* Selection checkbox - absolute positioned */}
                          <input
                            type="checkbox"
                            checked={selectedCastMembers.has(member.id)}
                            onChange={() => handleToggleSelect(member.id)}
                            className="absolute top-2 right-2 w-5 h-5 rounded z-10"
                          />
                          
                          {/* Photo/Avatar - smaller on mobile */}
                          <div className="flex justify-center mb-2">
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.actorName}
                                className="w-14 h-14 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarColor(member.actorName)} flex items-center justify-center text-white text-lg font-bold ${member.photoUrl ? 'hidden' : ''}`}>
                              {getInitials(member.actorName)}
                            </div>
                          </div>
                          
                          {/* Name & Character - centered */}
                          <div className="text-center mb-2">
                            <h4 className="font-semibold text-text-primary text-sm truncate">{member.actorName}</h4>
                            <p className="text-xs text-accent-secondary truncate">{member.characterName}</p>
                          </div>
                          
                          {/* Rate badge */}
                          {member.rate && member.rate > 0 && (
                            <div className="text-center text-xs font-medium text-text-secondary">
                              ${member.rate.toLocaleString()}/d
                            </div>
                          )}
                          
                          {/* Action buttons - tap to reveal */}
                          <div className="flex gap-2 mt-3 pt-2 border-t border-border-subtle">
                            <button
                              onClick={() => handleEdit(member)}
                              className="flex-1 text-xs py-1.5 text-text-secondary hover:text-accent-primary"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="flex-1 text-xs py-1.5 text-text-secondary hover:text-error"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Desktop Layout - Original */}
                        <div className="hidden md:block">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 pt-1">
                              <input
                                type="checkbox"
                                checked={selectedCastMembers.has(member.id)}
                                onChange={() => handleToggleSelect(member.id)}
                                className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer bg-transparent checked:bg-accent-primary"
                              />
                            </div>
                            <div className="flex gap-4 flex-1">
                              {/* Photo or Placeholder Avatar */}
                              <div className="flex-shrink-0">
                                {member.photoUrl ? (
                                  <img
                                    src={member.photoUrl}
                                    alt={member.actorName}
                                    className="w-20 h-20 rounded-xl object-cover shadow-md"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${getAvatarColor(member.actorName)} flex items-center justify-center text-white text-xl font-bold shadow-md ${member.photoUrl ? 'hidden' : ''}`}>
                                  {getInitials(member.actorName)}
                                </div>
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-text-primary truncate">{member.actorName}</h4>
                                    <p className="text-sm text-accent-secondary font-medium">as {member.characterName}</p>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <button
                                      onClick={() => handleEdit(member)}
                                      className="flex-shrink-0 text-text-tertiary hover:text-accent-primary transition-colors p-1"
                                      title="Edit cast member"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(member.id)}
                                      className="flex-shrink-0 text-text-tertiary hover:text-error transition-colors p-1"
                                      title="Delete cast member"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Contact Details */}
                          <div className="space-y-1 text-xs text-text-secondary mb-3">
                            {member.agent && (
                              <div className="flex items-center gap-2">
                                <span>🏢</span>
                                <span className="truncate">{member.agent}</span>
                              </div>
                            )}
                            {member.email && <div className="truncate">📧 {member.email}</div>}
                            {member.phone && <div>📞 {member.phone}</div>}
                            {member.rate && member.rate > 0 && (
                              <div className="text-text-primary font-semibold">
                                💰 ${member.rate.toLocaleString()}/day
                              </div>
                            )}
                          </div>

                          {/* Budget Integration */}
                          <CastMemberBudgetSection 
                            projectId={projectId} 
                            castMemberId={member.id}
                            canEdit={true}
                            onCreateBudgetItem={() => {
                              createFromCast.mutate({ 
                                projectId, 
                                castMemberIds: [member.id] 
                              });
                            }}
                            onViewBudget={() => {
                              window.location.href = `/projects/${projectId}#budget`;
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div 
                        id={`element-${member.id}`}
                        key={member.id} 
                        className={`card p-4 hover:border-accent-primary/50 transition-all flex items-center gap-4 ${selectedCastMembers.has(member.id) ? 'ring-2 ring-accent-primary border-accent-primary bg-accent-primary/5' : ''}`}
                      >
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedCastMembers.has(member.id)}
                          onChange={() => handleToggleSelect(member.id)}
                          className="w-5 h-5 rounded border-2 border-accent-primary text-accent-primary focus:ring-2 focus:ring-accent-primary flex-shrink-0 cursor-pointer bg-transparent checked:bg-accent-primary"
                          style={{
                            accentColor: 'rgb(var(--accent-primary))',
                          }}
                        />
                        
                        {/* Photo or Avatar */}
                        <div className="flex-shrink-0">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.actorName}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getAvatarColor(member.actorName)} flex items-center justify-center text-white text-sm font-bold ${member.photoUrl ? 'hidden' : ''}`}>
                            {getInitials(member.actorName)}
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-text-primary truncate">{member.actorName}</h4>
                              <p className="text-sm text-accent-secondary font-medium">as {member.characterName}</p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleEdit(member)}
                                className="flex-shrink-0 text-text-tertiary hover:text-accent-primary transition-colors p-1"
                                title="Edit cast member"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="flex-shrink-0 text-text-tertiary hover:text-error transition-colors p-1"
                                title="Delete cast member"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-text-secondary mt-2">
                            {member.agent && (
                              <div className="flex items-center gap-2">
                                <span>🏢</span>
                                <span className="truncate">{member.agent}</span>
                              </div>
                            )}
                            {member.email && <div className="truncate">📧 {member.email}</div>}
                            {member.phone && <div>📞 {member.phone}</div>}
                            {member.rate && member.rate > 0 && (
                              <div className="text-text-primary font-semibold">
                                💰 ${member.rate.toLocaleString()}/day
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Action Bar - shown when cast members selected */}
      {selectedCastMembers.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-border-default p-4 z-30 safe-area-bottom">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{selectedCastMembers.size} selected</span>
            <button
              onClick={() => setSelectedCastMembers(new Set())}
              className="text-sm text-text-tertiary"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkCreateBudget}
              className="flex-1 py-3 bg-accent-primary/20 text-accent-primary rounded-lg font-medium"
            >
              Add to Budget
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex-1 py-3 bg-error/20 text-error rounded-lg font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/60" 
            onClick={() => setShowMobileFilters(false)} 
          />
          <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-background-secondary overflow-y-auto p-6 animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Cast Overview</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-text-secondary hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Filter by Type */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-secondary">Filter by Type</h4>
                <div className="flex gap-2">
                  <button onClick={selectAllTypes} className="text-xs text-accent-primary hover:text-accent-hover">All</button>
                  <span className="text-text-tertiary">•</span>
                  <button onClick={clearAllTypes} className="text-xs text-accent-primary hover:text-accent-hover">Clear</button>
                </div>
              </div>
              
              <div className="space-y-2">
                {allCastTypes.map((type) => {
                  const count = getTypeCount(type.value);
                  const isSelected = selectedTypes.has(type.value);
                  
                  return (
                    <label 
                      key={type.value} 
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-background-tertiary hover:bg-background-elevated' 
                          : 'bg-background-primary hover:bg-background-tertiary opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleType(type.value)}
                          className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary focus:ring-2"
                        />
                        <span className="text-sm font-medium text-text-primary">{type.label}</span>
                      </div>
                      <span className={`badge-primary ${!isSelected && 'opacity-40'}`}>{count}</span>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={() => { setShowMobileFilters(false); setShowAddTypeModal(true); }}
                className="w-full mt-3 py-2 px-3 rounded-lg border-2 border-dashed border-border-default hover:border-accent-primary text-text-secondary hover:text-accent-primary transition-colors text-sm font-medium"
              >
                + Add Custom Type
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Right Sidebar - Desktop Only */}
      <aside className="hidden md:block w-80 bg-background-secondary border-l border-border-subtle overflow-y-auto p-6">
        <h3 className="text-lg font-bold mb-4 text-text-primary">Cast Overview</h3>
        
        {/* Filter by Type */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-secondary">Filter by Type</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllTypes}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                Select All
              </button>
              <span className="text-text-tertiary">•</span>
              <button
                onClick={clearAllTypes}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {allCastTypes.map((type) => {
              const count = getTypeCount(type.value);
              const isSelected = selectedTypes.has(type.value);
              const isCustomType = customTypes.includes(type.value);
              
              return (
                <label 
                  key={type.value} 
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-background-tertiary hover:bg-background-elevated' 
                      : 'bg-background-primary hover:bg-background-tertiary opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleType(type.value)}
                      className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary focus:ring-2"
                    />
                    <span className="text-sm font-medium text-text-primary">{type.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge-primary ${!isSelected && 'opacity-40'}`}>
                      {count}
                    </span>
                    {isCustomType && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCustomType(type.value);
                        }}
                        className="text-text-tertiary hover:text-error transition-colors p-1"
                        title="Remove custom type"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Add Custom Type Button */}
          <button
            onClick={() => setShowAddTypeModal(true)}
            className="w-full mt-3 py-2 px-3 rounded-lg border-2 border-dashed border-border-default hover:border-accent-primary text-text-secondary hover:text-accent-primary transition-colors text-sm font-medium"
          >
            + Add Custom Type
          </button>
        </div>

        <div className="p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
          <h4 className="text-sm font-semibold mb-2 text-accent-primary">💡 Cast Management Tips</h4>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>• Keep contact info updated</li>
            <li>• Track availability dates</li>
            <li>• Maintain agent relationships</li>
            <li>• Document day rates clearly</li>
          </ul>
        </div>
      </aside>

      {/* Add Custom Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-elevated max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Add Custom Cast Type</h2>
                <button
                  onClick={() => {
                    setShowAddTypeModal(false);
                    setNewTypeName('');
                  }}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddCustomType} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cast Type Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Stand-In, Body Double, etc."
                    required
                    className="input-field w-full"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-text-tertiary mt-2">
                    This custom type will be available for all team members working on this project.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTypeModal(false);
                      setNewTypeName('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={addCustomCastType.isPending}
                  >
                    {addCustomCastType.isPending ? 'Adding...' : 'Add Type'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Edit Cast Member</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                {/* Photo Upload - Same as add form */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                    isDragging
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border-default bg-background-tertiary hover:border-accent-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    {formData.photoUrl ? (
                      <div className="relative">
                        <img
                          src={formData.photoUrl}
                          alt="Preview"
                          className="w-32 h-32 rounded-xl object-cover shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center hover:bg-error/80 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-primary flex items-center justify-center text-3xl">
                          📷
                        </div>
                        <p className="text-sm font-medium text-text-primary mb-1">
                          Drag & drop photo here
                        </p>
                        <p className="text-xs text-text-tertiary mb-3">or</p>
                        <label className="btn-secondary cursor-pointer inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Actor Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Jane Smith"
                      required
                      className="input-field"
                      value={formData.actorName}
                      onChange={(e) => setFormData({ ...formData, actorName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Character Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sarah Connor"
                      required
                      className="input-field"
                      value={formData.characterName}
                      onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Cast Type <span className="text-error">*</span>
                    </label>
                    <select
                      required
                      className="input-field"
                      value={formData.castType}
                      onChange={(e) => setFormData({ ...formData, castType: e.target.value })}
                    >
                      <option value="">Select cast type</option>
                      {allCastTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="actor@example.com"
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="input-field"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Agent/Agency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CAA, WME"
                      className="input-field"
                      value={formData.agent}
                      onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Day Rate
                    </label>
                    <input
                      type="number"
                      placeholder="1000"
                      className="input-field"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                    }}
                    className="btn-secondary"
                    disabled={uploadingImage}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={uploadingImage}>
                    {uploadingImage ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      'Update Cast Member'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <CastTemplates
          projectId={projectId}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}
    </div>
  );
}

  // CastMemberBudgetSection component needs to be updated too
function CastMemberBudgetSection({ 
  projectId, 
  castMemberId, 
  canEdit,
  onCreateBudgetItem,
  onViewBudget 
}: { 
  projectId: string; 
  castMemberId: string;
  canEdit: boolean;
  onCreateBudgetItem: () => void;
  onViewBudget: () => void;
}) {
  // Use client-side budget hook
  const { budget, isLoading } = useBudget(projectId);
  
  // Filter budget items for this cast member locally
  const budgetItems = budget?.items.filter(item => item.castMemberId === castMemberId) || [];

  if (isLoading) {
    return <div className="text-xs text-text-tertiary">Loading budget...</div>;
  }

  if (budgetItems.length === 0) {
    return (
      <div className="pt-2 border-t border-border-default">
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
    <div className="pt-2 border-t border-border-default">
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

