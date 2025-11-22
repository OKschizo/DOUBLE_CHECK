'use client';

import { trpc } from '@/lib/trpc/client';

export function useProjectMembers(projectId: string) {
  return trpc.projectMembers.listByProject.useQuery({ projectId });
}

export function useMyRole(projectId: string) {
  return trpc.projectMembers.getMyRole.useQuery({ projectId });
}

export function useAddProjectMember() {
  const utils = trpc.useUtils();

  return trpc.projectMembers.addMember.useMutation({
    onSuccess: (data) => {
      utils.projectMembers.listByProject.invalidate({ projectId: data.projectId });
    },
  });
}

export function useUpdateMemberRole() {
  const utils = trpc.useUtils();

  return trpc.projectMembers.updateRole.useMutation({
    onSuccess: (data) => {
      utils.projectMembers.listByProject.invalidate({ projectId: data.projectId });
    },
  });
}

export function useRemoveProjectMember() {
  const utils = trpc.useUtils();

  return trpc.projectMembers.removeMember.useMutation({
    onSuccess: () => {
      utils.projectMembers.listByProject.invalidate();
    },
  });
}

