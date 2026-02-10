'use client';

import { useState, useEffect } from 'react';
// import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ProjectRole } from '@/lib/schemas';
import { useProject, useUpdateProject } from '@/features/projects/hooks/useProjects';
import { useProjectMembers, useMyRole, useAddProjectMember, useUpdateMemberRole, useRemoveProjectMember } from '@/features/projectMembers/hooks/useProjectMembers';
import { useDepartmentHeads } from '@/features/projectMembers/hooks/useDepartmentHeads';
import { useRoleRequests } from '@/features/projectMembers/hooks/useRoleRequests';
import { useCrewByProject } from '@/features/crew/hooks/useCrew';
import { uploadImage, generateUniqueFilename, deleteImage, isBlobUrl } from '@/lib/firebase/storage';

interface AdminViewProps {
  projectId: string;
  userRole?: string | null;
  initialTab?: 'team' | 'deptHeads' | 'roleRequests' | 'settings';
}

export function AdminView({ projectId, userRole, initialTab }: AdminViewProps) {
  // Department heads and crew only see role requests, admins/owners see all tabs
  const isDeptHead = userRole === 'dept_head';
  const isCrew = userRole === 'crew';
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  
  // Check sessionStorage for tab preference from quick actions
  const getInitialTab = (): 'team' | 'deptHeads' | 'roleRequests' | 'settings' => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      const storedTab = sessionStorage.getItem(`adminTab_${projectId}`);
      if (storedTab && ['team', 'deptHeads', 'roleRequests', 'settings'].includes(storedTab)) {
        sessionStorage.removeItem(`adminTab_${projectId}`); // Clear after reading
        return storedTab as 'team' | 'deptHeads' | 'roleRequests' | 'settings';
      }
    }
    return (isDeptHead || isCrew) ? 'roleRequests' : 'team';
  };
  
  const [activeTab, setActiveTab] = useState<'team' | 'deptHeads' | 'roleRequests' | 'settings'>(
    getInitialTab()
  );
  // const utils = trpc.useUtils();

  // Queries
  const { data: project } = useProject(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const { data: departmentHeads = [] } = useDepartmentHeads(projectId);
  const { data: crewMembers = [] } = useCrewByProject(projectId);
  const { data: roleRequests = [] } = useRoleRequests(projectId);
  
  const pendingCount = { count: roleRequests.filter((r: any) => r.status === 'pending').length };

  // Get unique departments from crew
  const departments = Array.from(
    new Set(crewMembers.map((c) => c.department))
  ).sort();

  // Get active members with accounts for department head assignment
  const activeMembers = members.filter((m: any) => m.status === 'active');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {isDeptHead ? 'Department Management' : 'Admin Panel'}
        </h1>
        <p className="text-text-secondary">
          {isDeptHead 
            ? 'Review and approve role requests for your department(s)'
            : 'Manage team members, department heads, and project settings'
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[rgb(var(--border-default))]">
        {/* Team Management - Only for owners/admins */}
        {isOwnerOrAdmin && (
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'team'
                ? 'border-[rgb(var(--accent-primary))] text-[rgb(var(--accent-primary))]'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Team Management
          </button>
        )}
        
        {/* Department Heads - Only for owners/admins */}
        {isOwnerOrAdmin && (
          <button
            onClick={() => setActiveTab('deptHeads')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'deptHeads'
                ? 'border-[rgb(var(--accent-primary))] text-[rgb(var(--accent-primary))]'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Department Heads
          </button>
        )}
        
        {/* Role Requests - For all (dept heads see only their department requests) */}
        <button
          onClick={() => setActiveTab('roleRequests')}
          className={`px-6 py-3 font-medium transition-all border-b-2 relative ${
            activeTab === 'roleRequests'
              ? 'border-[rgb(var(--accent-primary))] text-[rgb(var(--accent-primary))]'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Role Requests
          {pendingCount && pendingCount.count > 0 && (
            <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
              {pendingCount.count}
            </span>
          )}
        </button>
        
        {/* Project Settings - Only for owners/admins */}
        {isOwnerOrAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'settings'
                ? 'border-[rgb(var(--accent-primary))] text-[rgb(var(--accent-primary))]'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Project Settings
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'team' && (
          <TeamManagementTab members={members} crewMembers={crewMembers} projectId={projectId} />
        )}
        {activeTab === 'deptHeads' && (
          <DepartmentHeadsTab
            projectId={projectId}
            departments={departments}
            departmentHeads={departmentHeads}
            activeMembers={activeMembers}
          />
        )}
        {activeTab === 'roleRequests' && (
          <RoleRequestsTab 
            projectId={projectId} 
            roleRequests={roleRequests}
            userRole={userRole}
            departmentHeads={departmentHeads}
          />
        )}
        {activeTab === 'settings' && <ProjectSettingsTab project={project} projectId={projectId} />}
      </div>
    </div>
  );
}

// Team Management Tab Component
function TeamManagementTab({ members, crewMembers, projectId }: { members: any[]; crewMembers: any[]; projectId: string }) {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'dept_head':
        return 'Department Head';
      case 'crew':
        return 'Crew Member';
      default:
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('crew');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const addMember = useAddProjectMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveProjectMember();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-400';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400';
      case 'dept_head':
        return 'bg-green-500/20 text-green-400';
      case 'crew':
        return 'bg-cyan-500/20 text-cyan-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'declined':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const result = await addMember.mutateAsync({
        projectId,
        userEmail: inviteEmail,
        role: inviteRole,
      });
      
      // Show the invite link
      setInviteLink(result.inviteLink);
      setInviteEmail('');
      setInviteRole('crew');
    } catch (error: any) {
      alert('Failed to invite: ' + error.message);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCloseInviteSuccess = () => {
    setInviteLink(null);
    setShowInviteForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Team Members</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-[rgb(var(--accent-primary))] rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            {showInviteForm ? '✕ Cancel' : '+ Invite Member'}
          </button>
        </div>
      </div>

      {/* Invite Form */}
      {showInviteForm && !inviteLink && (
        <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Invite Team Member</h3>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Project Role *
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="crew">Crew Member</option>
                <option value="dept_head">Department Head</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-text-tertiary mt-1">
                <strong>Crew Member:</strong> Can view and create/update their own crew, cast, equipment, and location entries. <strong>Department Head:</strong> Can manage their assigned departments and all items within those departments. <strong>Admin:</strong> Can manage the entire project including team members and settings.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                  setInviteRole('crew');
                }}
                className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMember.isPending}
                className="px-4 py-2 bg-[rgb(var(--accent-primary))] rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: 'rgb(var(--colored-button-text))' }}
              >
                {addMember.isPending ? 'Creating...' : 'Create Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invite Success - Show Link */}
      {inviteLink && (
        <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">Invitation Created!</h3>
              <p className="text-text-secondary text-sm mt-1">
                Share this link with your team member. They&apos;ll need to sign up or log in to accept.
              </p>
            </div>
          </div>
          
          <div className="bg-background-primary border border-border-default rounded-lg p-3 flex items-center gap-3">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-transparent text-text-primary text-sm font-mono outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-colors text-sm font-medium whitespace-nowrap"
            >
              {copiedLink ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCloseInviteSuccess}
              className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-lg font-medium text-text-primary">{member.userName || member.userEmail}</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                  {getRoleDisplayName(member.role)}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(member.status)}`}>
                  {member.status}
                </span>
              </div>
              <div className="text-sm text-text-secondary">{member.userEmail}</div>
            </div>

            <div className="flex items-center gap-3">
              {/* Active members - show admin toggle */}
              {member.role !== 'owner' && (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => {
                      const newRole = e.target.value as ProjectRole;
                      if (confirm(`Change ${member.userName || member.userEmail}'s role to ${getRoleDisplayName(newRole)}?`)) {
                        updateRole.mutate({ id: member.id, role: newRole });
                      }
                    }}
                    className="px-3 py-1 bg-background-tertiary border border-border-default rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="crew">Crew Member</option>
                    <option value="dept_head">Department Head</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${member.userName || member.userEmail} from the project?`)) {
                        removeMember.mutate({ id: member.id });
                      }
                    }}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </>
              )}
              {member.role === 'owner' && (
                <span className="text-xs text-text-tertiary">Project Owner</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 text-text-secondary">No team members yet</div>
      )}
    </div>
  );
}

// Department Heads Tab Component
function DepartmentHeadsTab({
  projectId,
  departments,
  departmentHeads,
  activeMembers,
}: {
  projectId: string;
  departments: string[];
  departmentHeads: any[];
  activeMembers: any[];
}) {
  const { assignHead, removeHead } = useDepartmentHeads(projectId);

  const getDepartmentHeads = (dept: string) => {
    return departmentHeads.filter((h) => h.department === dept);
  };

  const getAvailableMembers = (dept: string) => {
    const heads = getDepartmentHeads(dept);
    // Show all active members except those already heads of this department
    return activeMembers.filter((m) => !heads.some((h) => h.userId === m.userId));
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Department Heads</h2>
        <p className="text-text-secondary text-sm">
          Assign department heads who can manage their departments and approve role requests
        </p>
      </div>

      {departments.map((dept) => {
        const heads = getDepartmentHeads(dept);
        const availableMembers = getAvailableMembers(dept);

        return (
          <div
            key={dept}
            className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4 capitalize">
              {dept.replace('_', ' ')}
            </h3>

            {/* Current Heads */}
            {heads.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="text-sm text-text-tertiary mb-2">Current Heads:</div>
                {heads.map((head) => (
                  <div
                    key={head.id}
                    className="flex items-center justify-between bg-[rgb(var(--background-tertiary))] rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{head.userName}</div>
                        <div className="text-xs text-text-tertiary">
                          Assigned {head.assignedAt ? new Date(head.assignedAt.toDate()).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${head.userName} as department head?`)) {
                          removeHead.mutate({ id: head.id });
                        }
                      }}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Assign New Head */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Assign New Head:</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const selectedMember = activeMembers.find((m: any) => m.userId === e.target.value);
                    if (selectedMember) {
                      assignHead.mutate({
                        projectId,
                        department: dept,
                        userId: selectedMember.userId,
                        userName: selectedMember.userName,
                      });
                      e.target.value = '';
                    }
                  }
                }}
                className="w-full bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-default))] rounded-lg px-4 py-2 text-text-primary"
              >
                <option value="">Select team member...</option>
                {availableMembers.map((member: any) => (
                  <option key={member.id} value={member.userId}>
                    {member.userName} ({member.userEmail})
                  </option>
                ))}
              </select>
              {availableMembers.length === 0 && (
                <p className="text-xs text-text-tertiary mt-2">
                  All team members are already assigned as heads of this department
                </p>
              )}
            </div>
          </div>
        );
      })}

      {departments.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          No departments found. Add crew members to create departments.
        </div>
      )}
    </div>
  );
}

// Project Settings Tab Component
function ProjectSettingsTab({ project, projectId }: { project: any; projectId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(project?.coverImageUrl || null);
  
  const { mutateAsync: updateProject } = useUpdateProject();

  const [formData, setFormData] = useState({
    title: project?.title || '',
    client: project?.client || '',
    description: project?.description || '',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    status: project?.status || 'planning',
    budget: project?.budget?.toString() || '',
    coverImageUrl: project?.coverImageUrl || '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        client: project.client || '',
        description: project.description || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        status: project.status || 'planning',
        budget: project.budget?.toString() || '',
        coverImageUrl: project.coverImageUrl || '',
      });
      setImagePreview(project.coverImageUrl || null);
    }
  }, [project]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let finalCoverImageUrl = formData.coverImageUrl;
      const oldCoverImageUrl = project?.coverImageUrl;

      // Upload new image if selected
      if (imageFile) {
        setUploadingImage(true);
        const filename = generateUniqueFilename(imageFile.name);
        const storagePath = `projects/${projectId}/${filename}`;
        finalCoverImageUrl = await uploadImage(imageFile, storagePath);
        setUploadingImage(false);

        // Delete old image if it exists and is a Firebase Storage URL
        if (oldCoverImageUrl && !isBlobUrl(oldCoverImageUrl)) {
          await deleteImage(oldCoverImageUrl);
        }
      }

      await updateProject({
        id: projectId,
        data: {
          title: formData.title,
          client: formData.client,
          description: formData.description || undefined,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          status: formData.status as any,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          coverImageUrl: finalCoverImageUrl || undefined,
        },
      });
      setIsEditing(false);
      setImageFile(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
      setUploadingImage(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    if (project) {
      setFormData({
        title: project.title || '',
        client: project.client || '',
        description: project.description || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        status: project.status || 'planning',
        budget: project.budget?.toString() || '',
        coverImageUrl: project.coverImageUrl || '',
      });
      setImagePreview(project.coverImageUrl || null);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Project Settings</h2>
            <p className="text-text-secondary text-sm">Configure project details and preferences</p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Edit Project
          </button>
        </div>

        <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Project Information</h3>
          <div className="space-y-4">
            {project?.coverImageUrl && (
              <div>
                <label className="block text-sm text-text-secondary mb-2">Cover Image</label>
                <img
                  src={project.coverImageUrl}
                  alt="Project cover"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-border-default"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Project Name</label>
              <div className="text-lg text-text-primary">{project?.title}</div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Client</label>
              <div className="text-lg text-text-primary">{project?.client}</div>
            </div>
            {project?.description && (
              <div>
                <label className="block text-sm text-text-secondary mb-2">Description</label>
                <div className="text-text-primary">{project.description}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Start Date</label>
                <div className="text-text-primary">
                  {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">End Date</label>
                <div className="text-text-primary">
                  {project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Status</label>
              <div className="text-lg text-text-primary capitalize">{project?.status?.replace('-', ' ')}</div>
            </div>
            {project?.budget && (
              <div>
                <label className="block text-sm text-text-secondary mb-2">Budget</label>
                <div className="text-lg text-text-primary">${project.budget.toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[rgb(var(--background-secondary))] border border-red-500/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-text-secondary mb-4">
            Irreversible actions that affect the entire project
          </p>
          <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
            Delete Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Edit Project</h2>
        <p className="text-text-secondary text-sm">Update project details and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Project Information</h3>
          
          {/* Cover Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Cover Image
            </label>
            <div className="flex items-start gap-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  className="w-48 h-32 object-cover rounded-lg border border-border-default"
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Upload a cover image for your project (recommended: 1920x1080px)
                </p>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      setFormData({ ...formData, coverImageUrl: '' });
                    }}
                    className="mt-2 text-sm text-red-500 hover:text-red-400"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Client *
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                placeholder="Project description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  required
                >
                  <option value="planning">Planning</option>
                  <option value="pre-production">Pre-Production</option>
                  <option value="production">Production</option>
                  <option value="post-production">Post-Production</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-background-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
            disabled={uploadingImage}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'rgb(var(--colored-button-text))' }}
            disabled={uploadingImage}
          >
            {uploadingImage ? 'Uploading...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Role Requests Tab Component
function RoleRequestsTab({ 
  projectId, 
  roleRequests, 
  userRole,
  departmentHeads 
}: { 
  projectId: string; 
  roleRequests: any[];
  userRole?: string | null;
  departmentHeads: any[];
}) {
  const { firebaseUser } = useAuth();
  const { reviewRequest } = useRoleRequests(projectId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'denied':
        return 'bg-red-500/20 text-red-400';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Filter requests for department heads - only show their department requests
  let filteredRequests = roleRequests;
  if (userRole === 'dept_head' && firebaseUser?.uid) {
    // Get departments this user is head of
    const myDepartments = departmentHeads
      .filter(dh => dh.userId === firebaseUser.uid)
      .map(dh => dh.department);
    
    // Only show requests for those departments
    filteredRequests = roleRequests.filter(r => 
      myDepartments.includes(r.requestedDepartment)
    );
  }

  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending');
  const reviewedRequests = filteredRequests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Role Requests</h2>
        <p className="text-text-secondary text-sm">
          Review and approve role change requests from crew members
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            ⏳ Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-text-primary">
                        {request.requesterName}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      Requested {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Current Role</div>
                    <div className="text-sm text-text-primary">
                      <span className="font-medium">{request.currentRole}</span>
                      {' '}in{' '}
                      <span className="font-medium capitalize">
                        {request.currentDepartment.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Requested Role</div>
                    <div className="text-sm text-accent-primary">
                      <span className="font-medium">{request.requestedRole}</span>
                      {' '}in{' '}
                      <span className="font-medium capitalize">
                        {request.requestedDepartment.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {request.reason && (
                  <div className="mb-4 p-3 rounded bg-[rgb(var(--background-tertiary))]">
                    <div className="text-xs text-text-tertiary mb-1">Reason</div>
                    <div className="text-sm text-text-secondary">{request.reason}</div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const note = prompt('Add a note (optional):');
                      reviewRequest.mutate({
                        requestId: request.id,
                        action: 'approve',
                        reviewNote: note || undefined,
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt('Reason for denial (optional):');
                      reviewRequest.mutate({
                        requestId: request.id,
                        action: 'deny',
                        reviewNote: note || undefined,
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                  >
                    ✗ Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          No pending role requests
        </div>
      )}

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            📋 Recent Reviews ({reviewedRequests.length})
          </h3>
          <div className="space-y-3">
            {reviewedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-default))] rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-text-primary">{request.requesterName}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {request.currentRole} → {request.requestedRole}
                      {request.reviewerName && ` • Reviewed by ${request.reviewerName}`}
                    </div>
                    {request.reviewNote && (
                      <div className="text-xs text-text-tertiary mt-1 italic">
                        Note: {request.reviewNote}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
