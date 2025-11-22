'use client';

import { trpc } from '@/lib/trpc/client';

export function useProjects(status?: 'planning' | 'pre-production' | 'production' | 'post-production' | 'completed' | 'archived') {
  return trpc.projects.list.useQuery({ status });
}

export function useProject(id: string) {
  return trpc.projects.getById.useQuery({ id });
}

export function useCreateProject() {
  const utils = trpc.useUtils();
  
  return trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
    },
  });
}

export function useUpdateProject() {
  const utils = trpc.useUtils();
  
  return trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
    },
  });
}

export function useDeleteProject() {
  const utils = trpc.useUtils();
  
  return trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
    },
  });
}

