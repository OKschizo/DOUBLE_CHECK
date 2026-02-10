import { useState, useEffect, useMemo } from 'react';
import { useCrewByProject, useCreateCrewMember, useUpdateCrewMember, useDeleteCrewMember } from '@/features/crew/hooks/useCrew';
import { CrewTemplates } from '@/features/crew/components/CrewTemplates';
import { useProject, useUpdateProject } from '@/features/projects/hooks/useProjects';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl } from '@/lib/firebase/storage';
import { DEPARTMENTS_AND_ROLES, getRolesForDepartment, getDepartmentIcon } from '@/features/crew/data/departmentsAndRoles';

interface CrewViewProps {
  projectId: string;
}

// Role Browser Component for exploring roles by department
function RoleBrowser({ 
  departments, 
  onSelectRole 
}: { 
  departments: typeof DEPARTMENTS_AND_ROLES;
  onSelectRole: (role: string, department: string) => void;
}) {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [searchRoles, setSearchRoles] = useState('');

  // Filter departments and roles based on search
  const filteredDepts = searchRoles
    ? departments.filter(dept => 
        dept.name.toLowerCase().includes(searchRoles.toLowerCase()) ||
        dept.roles.some(role => role.name.toLowerCase().includes(searchRoles.toLowerCase()))
      )
    : departments;

  return (
    <div className="space-y-2">
      {/* Search roles */}
      <input
        type="text"
        placeholder="Search roles..."
        value={searchRoles}
        onChange={(e) => setSearchRoles(e.target.value)}
        className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
      />
      
      {/* Department list with expandable roles */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredDepts.map((dept) => {
          const isExpanded = expandedDept === dept.name;
          const filteredRoles = searchRoles
            ? dept.roles.filter(r => r.name.toLowerCase().includes(searchRoles.toLowerCase()))
            : dept.roles;
          
          // Auto-expand if searching and has matching roles
          const shouldShow = searchRoles ? filteredRoles.length > 0 : true;
          if (!shouldShow) return null;

          return (
            <div key={dept.name} className="border border-border-default rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDept(isExpanded ? null : dept.name)}
                className="w-full flex items-center justify-between px-3 py-2 bg-background-tertiary hover:bg-background-primary transition-colors text-left"
              >
                <span className="text-sm font-medium text-text-primary">
                  {dept.icon} {dept.name}
                </span>
                <span className="text-xs text-text-tertiary">
                  {filteredRoles.length} roles {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              {(isExpanded || searchRoles) && filteredRoles.length > 0 && (
                <div className="bg-background-primary border-t border-border-default">
                  {filteredRoles.slice(0, searchRoles ? filteredRoles.length : 8).map((role) => (
                    <button
                      key={role.id}
                      onClick={() => onSelectRole(role.name, dept.name)}
                      className="w-full px-4 py-1.5 text-left text-xs text-text-secondary hover:bg-accent-primary/10 hover:text-accent-primary transition-colors"
                    >
                      {role.name}
                    </button>
                  ))}
                  {!searchRoles && filteredRoles.length > 8 && (
                    <div className="px-4 py-1.5 text-xs text-text-tertiary">
                      +{filteredRoles.length - 8} more roles
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {filteredDepts.length === 0 && (
        <p className="text-xs text-text-tertiary text-center py-2">No roles found</p>
      )}
    </div>
  );
}

// Get department names from comprehensive list plus 'Other' for custom
const DEPARTMENTS = [...DEPARTMENTS_AND_ROLES.map(d => d.name), 'Other'];

export function CrewView({ projectId }: CrewViewProps) {
  const { firebaseUser, user: firestoreUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedCrewMembers, setSelectedCrewMembers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set(DEPARTMENTS));
  const [departmentsInitialized, setDepartmentsInitialized] = useState(false);
  const [useCustomRole, setUseCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    rate: '',
    photoUrl: '',
  });

  const { data: project } = useProject(projectId);
  const { mutateAsync: updateProject } = useUpdateProject();
  const { data: crewMembers = [], isLoading, error } = useCrewByProject(projectId);

  const createCrewMember = useCreateCrewMember();
  const updateCrewMember = useUpdateCrewMember();
  const deleteCrewMember = useDeleteCrewMember();

  // Placeholder mutations
  const createFromCrew = {
    mutate: () => alert('Budget creation from crew not yet implemented in client mode')
  };

  const handleBulkCreateBudget = () => {
    if (selectedCrewMembers.size === 0) return;
    createFromCrew.mutate();
    setSelectedCrewMembers(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedCrewMembers.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCrewMembers.size} crew member(s)?`)) return;
    
    for (const id of Array.from(selectedCrewMembers)) {
      await deleteCrewMember.mutateAsync({ id });
    }
    setSelectedCrewMembers(new Set());
  };

  // Image upload handlers
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!firebaseUser) return;
    setIsUploading(true);
    try {
      const filename = generateUniqueFilename(file.name);
      const storagePath = `crew/${projectId}/${filename}`;
      const downloadURL = await uploadImage(file, storagePath);
      setFormData({ ...formData, photoUrl: downloadURL });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCrewMember.mutateAsync({
        projectId,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        email: formData.email,
        phone: formData.phone,
        rate: formData.rate ? Number(formData.rate) : undefined,
        photoUrl: formData.photoUrl,
      });
      setShowAddForm(false);
      setFormData({
        name: '',
        role: '',
        department: '',
        email: '',
        phone: '',
        rate: '',
        photoUrl: '',
      });
    } catch (error) {
      console.error("Failed to add crew member", error);
      alert("Failed to add crew member");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      // Delete old photo if changed
      if (editingMember.photoUrl && formData.photoUrl !== editingMember.photoUrl && !isBlobUrl(editingMember.photoUrl)) {
        await deleteImage(editingMember.photoUrl);
      }

      await updateCrewMember.mutateAsync({
        id: editingMember.id,
        data: {
          name: formData.name,
          role: formData.role,
          department: formData.department,
          email: formData.email,
          phone: formData.phone,
          rate: formData.rate ? Number(formData.rate) : undefined,
          photoUrl: formData.photoUrl,
        },
      });
      setShowEditModal(false);
      setEditingMember(null);
    } catch (error) {
      console.error("Failed to update crew member", error);
      alert("Failed to update crew member");
    }
  };

  const handleAddCustomDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName.trim() || !project) {
        alert("Please enter a department name");
        return;
    }
    
    try {
        const currentDepts = project.customCrewDepartments || [];
        await updateProject({
            id: projectId,
            data: { customCrewDepartments: [...currentDepts, newDepartmentName.trim()] }
        });
        setNewDepartmentName('');
        setShowAddDeptModal(false);
    } catch (e: any) {
        alert("Failed to add department: " + e.message);
    }
  };

  const handleRemoveCustomDepartment = async (dept: string) => {
    if (!project) return;
    if (confirm(`Remove custom department "${dept}"?`)) {
        try {
             const currentDepts = project.customCrewDepartments || [];
             await updateProject({
                 id: projectId,
                 data: { customCrewDepartments: currentDepts.filter((d: string) => d !== dept) }
             });
        } catch (e: any) {
             alert("Failed to remove department: " + e.message);
        }
    }
  };

  const handleToggleSelect = (memberId: string) => {
    const newSelected = new Set(selectedCrewMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedCrewMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCrewMembers.size === filteredCrewMembers.length) {
      setSelectedCrewMembers(new Set());
    } else {
      setSelectedCrewMembers(new Set(filteredCrewMembers.map((m: any) => m.id)));
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      department: member.department,
      email: member.email || '',
      phone: member.phone || '',
      rate: member.rate || '',
      photoUrl: member.photoUrl || '',
    });
    setShowAddForm(false);
    setShowEditModal(true);
  };

  // Get all unique departments from actual crew data + predefined + custom
  const allDepartments = useMemo(() => {
    const crewDepartments = crewMembers.map((m: any) => m.department).filter(Boolean);
    const customDepartments = project?.customCrewDepartments || [];
    return [...new Set([...DEPARTMENTS, ...crewDepartments, ...customDepartments])].sort();
  }, [crewMembers, project?.customCrewDepartments]);

  // Auto-select all departments (including from data) when crew loads
  useEffect(() => {
    if (!departmentsInitialized && crewMembers.length > 0) {
      setSelectedDepartments(new Set(allDepartments));
      setDepartmentsInitialized(true);
    }
  }, [crewMembers, allDepartments, departmentsInitialized]);

  // Filter crew members by search and selected departments
  const filteredCrewMembers = crewMembers.filter((member: any) => {
    // Filter by department
    if (!selectedDepartments.has(member.department)) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        member.name?.toLowerCase().includes(query) ||
        member.role?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group filtered crew by department
  const crewByDept = filteredCrewMembers.reduce((acc: any, member: any) => {
    const dept = member.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(member);
    return acc;
  }, {});

  // Get count per department (from all members, not filtered)
  const getDepartmentCount = (dept: string) => {
    return crewMembers.filter((m: any) => m.department === dept).length;
  };

  // Toggle department filter
  const toggleDepartment = (dept: string) => {
    const newSelected = new Set(selectedDepartments);
    if (newSelected.has(dept)) {
      newSelected.delete(dept);
    } else {
      newSelected.add(dept);
    }
    setSelectedDepartments(newSelected);
  };

  // Select/deselect all departments
  const selectAllDepartments = () => setSelectedDepartments(new Set(allDepartments));
  const deselectAllDepartments = () => setSelectedDepartments(new Set());

  // Get roles for selected department in form
  const availableRoles = formData.department ? getRolesForDepartment(formData.department) : [];

  if (isLoading) {
    return <div className="text-center py-10 text-text-secondary">Loading crew...</div>;
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

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 text-text-primary">Crew</h1>
              <p className="text-text-secondary text-sm">
                {filteredCrewMembers.length} of {crewMembers.length} members
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
                      onClick={() => { setShowMobileMenu(false); setShowAddDeptModal(true); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-background-tertiary flex items-center gap-3"
                    >
                      <span className="text-lg">➕</span> Add Department
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
                      name: '',
                      role: '',
                      department: '',
                      email: '',
                      phone: '',
                      rate: '',
                      photoUrl: '',
                    });
                }
                setShowAddForm(!showAddForm);
              }}
              className="btn-primary"
            >
              + Add Crew Member
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowTemplatesModal(true)}
            >
              📋 Apply Template
            </button>
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
          
          {/* Mobile primary action - Add Crew */}
          <button 
            onClick={() => {
              setFormData({
                name: '',
                role: '',
                department: '',
                email: '',
                phone: '',
                rate: '',
                photoUrl: '',
              });
              setShowAddForm(true);
            }} 
            className="md:hidden w-full btn-primary py-3 text-base font-semibold mb-4"
          >
            + Add Crew Member
          </button>

          {/* Desktop Bulk Actions */}
          {selectedCrewMembers.size > 0 && (
            <div className="hidden md:flex bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 mb-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-text-primary">
                  {selectedCrewMembers.size} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-accent-primary hover:underline"
                >
                  {selectedCrewMembers.size === crewMembers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkCreateBudget}
                  className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors text-sm font-medium"
                  style={{ color: 'rgb(var(--colored-button-text))' }}
                >
                  💰 Create Budget Items
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors text-sm font-medium"
                >
                  🗑️ Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card-elevated p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Add New Crew Member</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
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
                  {isUploading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-2"></div>
                      <p className="text-sm text-text-secondary">Uploading...</p>
                    </div>
                  ) : formData.photoUrl ? (
                    <div className="relative">
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover shadow-md"
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
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-3xl">
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
                      <p className="text-xs text-text-muted mt-2">Optional crew member photo</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Role</label>
                  {availableRoles.length > 0 && !useCustomRole ? (
                    <div className="space-y-2">
                      <select
                        required
                        className="input-field"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="">Select a role...</option>
                        {availableRoles.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setUseCustomRole(true)}
                        className="text-xs text-accent-primary hover:text-accent-hover"
                      >
                        + Custom Role
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter custom role..."
                        className="input-field"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      />
                      {availableRoles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomRole(false);
                            setFormData({ ...formData, role: '' });
                          }}
                          className="text-xs text-accent-primary hover:text-accent-hover"
                        >
                          ← Select from list
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Department</label>
                  <select
                    required
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {allDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Rate</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Crew List - Compact Grid */}
        <div className="space-y-6">
          {Object.entries(crewByDept).map(([dept, members]: [string, any]) => (
            <div key={dept}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm md:text-base font-semibold text-text-primary">{dept}</h2>
                <span className="text-xs px-1.5 py-0.5 bg-background-secondary rounded text-text-tertiary">{members.length}</span>
              </div>
              {/* Compact 2-col on mobile, 3-4 col on larger */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                {members.map((member: any) => (
                  <div 
                    key={member.id} 
                    onClick={() => handleEdit(member)}
                    className={`bg-background-secondary border border-border-subtle rounded-lg p-2.5 md:p-3 cursor-pointer hover:border-accent-primary/50 transition-all ${selectedCrewMembers.has(member.id) ? 'ring-2 ring-accent-primary border-accent-primary' : ''}`}
                  >
                    {/* Compact card content */}
                    <div className="flex items-start gap-2">
                      {/* Checkbox - compact */}
                      <input
                        type="checkbox"
                        checked={selectedCrewMembers.has(member.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(member.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                      />
                      
                      {/* Avatar - smaller */}
                      <div className="flex-shrink-0">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-bold text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Name - truncated */}
                        <h3 className="text-xs md:text-sm font-medium text-text-primary truncate leading-tight">{member.name}</h3>
                        
                        {/* Role - compact */}
                        <p className="text-[10px] text-accent-primary truncate">{member.role}</p>
                        
                        {/* Rate - if exists */}
                        {member.rate && (
                          <div className="text-[10px] text-text-tertiary mt-0.5">${member.rate}/day</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mobile Bottom Action Bar - shown when crew members selected */}
      {selectedCrewMembers.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-border-default p-4 z-30 safe-area-bottom">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{selectedCrewMembers.size} selected</span>
            <button
              onClick={() => setSelectedCrewMembers(new Set())}
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

      {/* Modals */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card-elevated p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Edit Crew Member</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 transition-all ${
                  isDragging
                    ? 'border-accent-primary bg-accent-primary/5'
                    : 'border-border-default bg-background-tertiary hover:border-accent-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {isUploading ? (
                    <div className="flex-1 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
                      <p className="text-sm text-text-secondary mt-2">Uploading...</p>
                    </div>
                  ) : formData.photoUrl ? (
                    <>
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover shadow-md"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary mb-2">Photo uploaded</p>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: '' })}
                          className="text-xs text-error hover:underline"
                        >
                          Remove photo
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 text-center">
                      <p className="text-sm text-text-primary mb-2">Add crew member photo</p>
                      <label className="btn-secondary cursor-pointer inline-block text-sm">
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
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  {availableRoles.length > 0 && !useCustomRole ? (
                    <div className="space-y-2">
                      <select
                        className="input-field"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="">Select a role...</option>
                        {availableRoles.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setUseCustomRole(true)}
                        className="text-xs text-accent-primary hover:text-accent-hover"
                      >
                        + Custom Role
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        placeholder="Enter custom role..."
                        className="input-field"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      />
                      {availableRoles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomRole(false);
                            setFormData({ ...formData, role: '' });
                          }}
                          className="text-xs text-accent-primary hover:text-accent-hover"
                        >
                          ← Select from list
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <select
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rate</label>
                  <input
                    className="input-field"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card-elevated p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Custom Department</h3>
            <form onSubmit={handleAddCustomDepartment}>
              <input
                autoFocus
                className="input-field w-full mb-4"
                placeholder="Department Name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddDeptModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplatesModal && (
        <CrewTemplates
          projectId={projectId}
          onClose={() => setShowTemplatesModal(false)}
        />
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
              <h3 className="text-lg font-bold text-text-primary">Crew Overview</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-text-secondary hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-secondary mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, role, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            {/* Quick Stats */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-3">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background-tertiary rounded-lg p-3">
                  <div className="text-2xl font-bold text-accent-primary">{crewMembers.length}</div>
                  <div className="text-xs text-text-secondary">Total Crew</div>
                </div>
                <div className="bg-background-tertiary rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-500">{Object.keys(crewByDept).length}</div>
                  <div className="text-xs text-text-secondary">Departments</div>
                </div>
              </div>
            </div>

            {/* Filter by Department */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-secondary">Filter by Department</h4>
                <div className="flex gap-2">
                  <button onClick={selectAllDepartments} className="text-xs text-accent-primary hover:text-accent-hover">All</button>
                  <button onClick={deselectAllDepartments} className="text-xs text-accent-primary hover:text-accent-hover">None</button>
                </div>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {allDepartments.map((dept) => {
                  const count = getDepartmentCount(dept);
                  const isSelected = selectedDepartments.has(dept);
                  const icon = getDepartmentIcon(dept);
                  return (
                    <label
                      key={dept}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-accent-primary/10 text-text-primary' : 'hover:bg-background-tertiary text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDepartment(dept)}
                          className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
                        />
                        <span className="text-sm">{icon} {dept}</span>
                      </div>
                      <span className="text-xs text-text-tertiary bg-background-tertiary px-2 py-0.5 rounded">{count}</span>
                    </label>
                  );
                })}
              </div>
              <button
                onClick={() => { setShowAddDeptModal(true); setShowMobileFilters(false); }}
                className="w-full mt-3 py-2 border-2 border-dashed border-border-default rounded-lg text-xs text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
              >
                + Add Custom Department
              </button>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium"
            >
              Apply Filters
            </button>
          </aside>
        </div>
      )}

      {/* Right Sidebar - Crew Overview & Filters (Desktop Only) */}
      <aside className="hidden md:block w-80 bg-background-secondary border-l border-border-subtle overflow-y-auto p-6">
        <h3 className="text-lg font-bold mb-4 text-text-primary">Crew Overview</h3>
        
        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-secondary mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by name, role, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        {/* Quick Stats */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-secondary mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background-tertiary rounded-lg p-3">
              <div className="text-2xl font-bold text-accent-primary">{crewMembers.length}</div>
              <div className="text-xs text-text-secondary">Total Crew</div>
            </div>
            <div className="bg-background-tertiary rounded-lg p-3">
              <div className="text-2xl font-bold text-green-500">
                {Object.keys(crewByDept).length}
              </div>
              <div className="text-xs text-text-secondary">Departments</div>
            </div>
          </div>
        </div>

        {/* Filter by Department */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-secondary">Filter by Department</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllDepartments}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                All
              </button>
              <button
                onClick={deselectAllDepartments}
                className="text-xs text-accent-primary hover:text-accent-hover"
              >
                None
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {allDepartments.map((dept) => {
              const count = getDepartmentCount(dept);
              const isSelected = selectedDepartments.has(dept);
              const icon = getDepartmentIcon(dept);
              const isCustom = project?.customCrewDepartments?.includes(dept);
              return (
                <label
                  key={dept}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent-primary/10 text-text-primary'
                      : 'hover:bg-background-tertiary text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDepartment(dept)}
                      className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
                    />
                    <span className="text-sm">{icon} {dept}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-text-tertiary bg-background-tertiary px-2 py-0.5 rounded">
                      {count}
                    </span>
                    {isCustom && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCustomDepartment(dept);
                        }}
                        className="text-text-tertiary hover:text-error ml-1"
                        title="Remove custom department"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="w-full mt-3 py-2 border-2 border-dashed border-border-default rounded-lg text-xs text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            + Add Custom Department
          </button>
        </div>

        {/* Browse Roles by Department */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-text-secondary mb-3">Browse Roles</h4>
          <RoleBrowser 
            departments={DEPARTMENTS_AND_ROLES} 
            onSelectRole={(role, dept) => {
              setFormData(prev => ({ ...prev, role, department: dept }));
              setShowAddForm(true);
            }}
          />
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedDepartments.size !== allDepartments.length) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDepartments(new Set(allDepartments));
            }}
            className="w-full py-2 text-sm text-accent-primary hover:text-accent-hover border border-accent-primary rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </aside>
    </div>
  );
}
