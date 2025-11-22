import { trpc } from '@/lib/trpc/client';

export function useReferenceImages(projectId: string) {
  const utils = trpc.useUtils();

  const { data: images = [], isLoading, error } = trpc.referenceImages.list.useQuery({ projectId });

  const createReferenceImage = trpc.referenceImages.create.useMutation({
    onSuccess: () => {
      utils.referenceImages.list.invalidate({ projectId });
    },
  });

  const deleteReferenceImage = trpc.referenceImages.delete.useMutation({
    onSuccess: () => {
      utils.referenceImages.list.invalidate({ projectId });
    },
  });

  const migrateShotReferences = trpc.referenceImages.migrateShotReferences.useMutation({
    onSuccess: () => {
      utils.referenceImages.list.invalidate({ projectId });
      // Invalidate shots queries to refresh shot references
      utils.shots.listByProject.invalidate({ projectId });
      // Also invalidate any scene-specific shot queries
      utils.shots.listByScene.invalidate();
    },
  });

  return {
    images,
    isLoading,
    error,
    createReferenceImage,
    deleteReferenceImage,
    migrateShotReferences,
  };
}

