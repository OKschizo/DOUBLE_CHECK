import { trpc } from '@/lib/trpc/client';
import { useMemo } from 'react';

export function useShots(sceneId: string) {
  const utils = trpc.useUtils();

  const { data: shots = [], isLoading, error, refetch } = trpc.shots.listByScene.useQuery({ sceneId });

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
      utils.shots.listByScene.invalidate({ sceneId });
    },
  });

  const updateShot = trpc.shots.update.useMutation({
    onSuccess: () => {
      utils.shots.listByScene.invalidate({ sceneId });
      utils.shots.getById.invalidate({ id: sceneId });
    },
  });

  const deleteShot = trpc.shots.delete.useMutation({
    onSuccess: () => {
      utils.shots.listByScene.invalidate({ sceneId });
    },
  });

  const bulkCreate = trpc.shots.bulkCreate.useMutation({
    onSuccess: () => {
      utils.shots.listByScene.invalidate({ sceneId });
    },
  });

  const markBestTake = trpc.shots.markBestTake.useMutation({
    onSuccess: () => {
      utils.shots.listByScene.invalidate({ sceneId });
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
    bulkCreate,
    markBestTake,
  };
}

