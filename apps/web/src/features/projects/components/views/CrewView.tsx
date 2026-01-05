import { useState, useEffect } from 'react';
import { useCrewByProject, useCreateCrewMember, useUpdateCrewMember, useDeleteCrewMember } from '@/features/crew/hooks/useCrew';
import { CrewTemplates } from '@/features/crew/components/CrewTemplates';
import { useProject, useUpdateProject } from '@/features/projects/hooks/useProjects';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { uploadImage, deleteImage, generateUniqueFilename, isBlobUrl } from '@/lib/firebase/storage';

interface CrewViewProps {
  projectId: string;
}

const DEPARTMENTS = [
  'Production',
  'Direction',
  'Art',
  'Camera',
  'Sound',
  'Lighting',
  'Grip',
  'Costume',
  'Hair & Makeup',
  'Locations',
  'Transportation',
  'Catering',
  'Post-Production',
  'Other',
];

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
    if (selectedCrewMembers.size === crewMembers.length) {
      setSelectedCrewMembers(new Set());
    } else {
      setSelectedCrewMembers(new Set(crewMembers.map(m => m.id)));
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

  // Combine default and custom departments
  const allDepartments = [
    ...DEPARTMENTS,
    ...(project?.customCrewDepartments || []),
  ].sort();

  // Group crew by department
  const crewByDept = crewMembers.reduce((acc: any, member: any) => {
    const dept = member.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(member);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-center py-10 text-text-secondary">Loading crew...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-text-primary">Crew Management</h1>
              <p className="text-text-secondary">
                {crewMembers.length} crew members
              </p>
            </div>
            <div className="flex gap-3">
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
                className="px-4 py-2 bg-background-secondary border border-border-default rounded-lg hover:bg-background-tertiary transition-colors text-text-primary font-medium"
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
          </div>

          {/* Bulk Actions */}
          {selectedCrewMembers.size > 0 && (
            <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 mb-4 flex items-center justify-between">
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
          <div className="card-elevated p-6 mb-8">
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

              <div className="grid grid-cols-2 gap-4">
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
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
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

        {/* Crew List */}
        <div className="space-y-8">
          {Object.entries(crewByDept).map(([dept, members]: [string, any]) => (
            <div key={dept}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-text-primary">{dept}</h2>
                <span className="badge-primary">{members.length}</span>
              </div>
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {members.map((member: any) => (
                  <div 
                    key={member.id} 
                    className={`card p-4 relative ${selectedCrewMembers.has(member.id) ? 'ring-2 ring-accent-primary border-accent-primary' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedCrewMembers.has(member.id)}
                        onChange={() => handleToggleSelect(member.id)}
                        className="mt-1 w-4 h-4"
                      />
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-bold text-lg">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-text-primary">{member.name}</h3>
                            <p className="text-sm text-accent-primary">{member.role}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(member)}
                              className="text-text-tertiary hover:text-accent-primary p-1"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete member?')) {
                                  deleteCrewMember.mutateAsync({ id: member.id });
                                }
                              }}
                              className="text-text-tertiary hover:text-error p-1"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-text-secondary">
                          {member.email && <div>📧 {member.email}</div>}
                          {member.phone && <div>📞 {member.phone}</div>}
                          {member.rate && <div>💰 ${member.rate}/day</div>}
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
        <h3 className="text-lg font-bold mb-4 text-text-primary">Departments</h3>
        <div className="space-y-2">
          {allDepartments.map(dept => (
            <div key={dept} className="flex justify-between items-center p-2 hover:bg-background-tertiary rounded">
              <span className="text-sm text-text-secondary">{dept}</span>
              {project?.customCrewDepartments?.includes(dept) && (
                <button 
                  onClick={() => handleRemoveCustomDepartment(dept)}
                  className="text-text-tertiary hover:text-error"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="w-full mt-4 py-2 border-2 border-dashed border-border-default rounded-lg text-sm text-text-secondary hover:border-accent-primary hover:text-accent-primary"
          >
            + Add Department
          </button>
        </div>
      </aside>

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
                  <input
                    className="input-field"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
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
    </div>
  );
}
