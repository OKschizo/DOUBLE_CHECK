import { trpc } from '@/lib/trpc/client';
import { useMemo } from 'react';

export function useProjectShots(projectId: string) {
  const utils = trpc.useUtils();

  const { data: shots = [], isLoading, error, refetch } = trpc.shots.listByProject.useQuery({ projectId });

  // Convert date strings to Date objects
  const processedShots = useMemo(() => {
    return shots.map((shot) => ({
      ...shot,
      createdAt: shot.createdAt instanceof Date ? shot.createdAt : new Date(shot.createdAt),
      updatedAt: shot.updatedAt instanceof Date ? shot.updatedAt : new Date(shot.updatedAt),
    }));
  }, [shots]);

  const createShot = trpc.shots.create.useMutation({
    onSuccess: () => {
      utils.shots.listByProject.invalidate({ projectId });
      // Also invalidate scene-specific lists if we knew them, but we rely on listByProject here
      // Ideally we should invalidate specific scene lists too, but listByProject is independent
    },
  });

  const updateShot = trpc.shots.update.useMutation({
    onSuccess: () => {
      utils.shots.listByProject.invalidate({ projectId });
    },
  });

  const deleteShot = trpc.shots.delete.useMutation({
    onSuccess: () => {
      utils.shots.listByProject.invalidate({ projectId });
    },
  });

  const updateShotOrder = trpc.shots.updateOrder.useMutation({
    onSuccess: () => {
      utils.shots.listByProject.invalidate({ projectId });
    },
  });

  return {
    shots: processedShots,
    isLoading,
    error,
    refetch,
    createShot,
    updateShot,
    deleteShot,
    updateShotOrder,
  };
}

