'use client';

import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  useProjectMembers,
  useMyRole,
  useAddProjectMember,
  useUpdateMemberRole,
  useRemoveProjectMember,
} from '@/features/projectMembers/hooks/useProjectMembers';
import Link from 'next/link';
import type { ProjectRole } from '@doublecheck/schemas';

export default function ProjectSettingsClient() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: members, isLoading } = useProjectMembers(projectId);
  const { data: myRole } = useMyRole(projectId);
  const addMember = useAddProjectMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveProjectMember();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('crew');

  const canManageMembers = myRole === 'owner' || myRole === 'admin';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    await addMember.mutateAsync({
      projectId,
      userEmail: inviteEmail,
      role: inviteRole,
    });

    setInviteEmail('');
    setInviteRole('crew');
    setShowInviteForm(false);
  };

  const handleRoleChange = async (memberId: string, newRole: ProjectRole) => {
    await updateRole.mutateAsync({
      id: memberId,
      role: newRole,
    });
  };

  const handleRemove = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember.mutateAsync({ id: memberId });
    }
  };

  const roleColors: Record<ProjectRole, string> = {
    owner: 'bg-purple-500',
    admin: 'bg-blue-500',
    dept_head: 'bg-green-500',
    crew: 'bg-gray-500',
  };

  const roleDescriptions: Record<ProjectRole, string> = {
    owner: 'Full control over the project',
    admin: 'Can manage members and edit content',
    dept_head: 'Can manage their department(s)',
    crew: 'Basic crew member access',
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
              <Link href="/dashboard" className="hover:text-text-primary">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/projects" className="hover:text-text-primary">
                Projects
              </Link>
              <span>/</span>
              <Link href={`/projects/${projectId}`} className="hover:text-text-primary">
                Project
              </Link>
              <span>/</span>
              <span className="text-text-primary">Settings</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">Project Settings</h1>
                <p className="text-text-secondary">Manage project members and permissions</p>
              </div>
              {canManageMembers && (
                <button
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
                >
                  {showInviteForm ? 'Cancel' : '+ Invite Member'}
                </button>
              )}
            </div>
          </div>

          {/* Invite Form */}
          {showInviteForm && canManageMembers && (
            <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
              <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      placeholder="colleague@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                      className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    >
                      <option value="viewer">Viewer - Read only</option>
                      <option value="editor">Editor - Can edit content</option>
                      <option value="admin">Admin - Can manage members</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addMember.isPending}
                  className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 font-medium"
                >
                  {addMember.isPending ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </form>
            </div>
          )}

          {/* Role Guide */}
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-semibold mb-4">Permission Levels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(roleDescriptions).map(([role, description]) => (
                <div key={role} className="flex items-start gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[role as ProjectRole]} mt-1`}>
                    {role}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members List */}
          <div className="bg-background-secondary rounded-lg border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold">Team Members</h2>
            </div>

            {isLoading && (
              <div className="p-8 text-center text-text-secondary">Loading members...</div>
            )}

            {!isLoading && members && members.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-text-secondary mb-4">No team members yet</p>
                {canManageMembers && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="text-accent-primary hover:text-accent-hover"
                  >
                    Invite your first team member
                  </button>
                )}
              </div>
            )}

            {!isLoading && members && members.length > 0 && (
              <div className="divide-y divide-gray-800">
                {members.map((member) => (
                  <div key={member.id} className="p-6 hover:bg-background-tertiary transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{member.userName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                            {member.role}
                          </span>
                          {member.status === 'pending' && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">{member.userEmail}</p>
                        <p className="text-xs text-text-tertiary mt-1">
                          Invited {new Date(member.invitedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {canManageMembers && member.role !== 'owner' && (
                        <div className="flex items-center gap-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as ProjectRole)}
                            disabled={updateRole.isPending}
                            className="px-3 py-2 bg-background-tertiary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-sm"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleRemove(member.id)}
                            disabled={removeMember.isPending}
                            className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {member.role === 'owner' && (
                        <span className="text-sm text-text-secondary italic">Project Owner</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

