'use client';

import { trpc } from '@/lib/trpc/client';

export function useCrewByProject(projectId: string) {
  return trpc.crew.listByProject.useQuery({ projectId });
}

export function useCrewMember(id: string) {
  return trpc.crew.getById.useQuery({ id });
}

export function useCreateCrewMember() {
  const utils = trpc.useUtils();

  return trpc.crew.create.useMutation({
    onSuccess: (data) => {
      utils.crew.listByProject.invalidate({ projectId: data.projectId });
    },
  });
}

export function useUpdateCrewMember() {
  const utils = trpc.useUtils();

  return trpc.crew.update.useMutation({
    onSuccess: (data) => {
      if (data) {
        utils.crew.listByProject.invalidate({ projectId: data.projectId });
        utils.crew.getById.invalidate({ id: data.id });
      }
    },
  });
}

export function useDeleteCrewMember() {
  const utils = trpc.useUtils();

  return trpc.crew.delete.useMutation({
    onSuccess: () => {
      utils.crew.listByProject.invalidate();
    },
  });
}

