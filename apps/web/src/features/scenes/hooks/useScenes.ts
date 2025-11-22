import { trpc } from '@/lib/trpc/client';
import { useMemo } from 'react';

export function useScenes(projectId: string) {
  const utils = trpc.useUtils();

  const { data: scenes = [], isLoading, error, refetch } = trpc.scenes.listByProject.useQuery({ projectId });

  // Convert date strings to Date objects and sort numerically
  const processedScenes = useMemo(() => {
    const mapped = scenes.map((scene) => ({
      ...scene,
      scheduledDate: scene.scheduledDate instanceof Date ? scene.scheduledDate : scene.scheduledDate ? new Date(scene.scheduledDate) : undefined,
      createdAt: scene.createdAt instanceof Date ? scene.createdAt : new Date(scene.createdAt),
      updatedAt: scene.updatedAt instanceof Date ? scene.updatedAt : new Date(scene.updatedAt),
    }));
    
    return mapped.sort((a, b) => a.sceneNumber.localeCompare(b.sceneNumber, undefined, { numeric: true }));
  }, [scenes]);

  const createScene = trpc.scenes.create.useMutation({
    onSuccess: () => {
      utils.scenes.listByProject.invalidate({ projectId });
    },
  });

  const updateScene = trpc.scenes.update.useMutation({
    onSuccess: () => {
      utils.scenes.listByProject.invalidate({ projectId });
      utils.scenes.getById.invalidate({ id: projectId });
    },
  });

  const deleteScene = trpc.scenes.delete.useMutation({
    onSuccess: () => {
      utils.scenes.listByProject.invalidate({ projectId });
    },
  });

  const linkToSchedule = trpc.scenes.linkToSchedule.useMutation({
    onSuccess: () => {
      utils.scenes.listByProject.invalidate({ projectId });
      utils.schedule.getSchedule.invalidate({ projectId });
    },
  });

  const getScheduleConflicts = trpc.scenes.getScheduleConflicts.useQuery;

  const bulkCreate = trpc.scenes.bulkCreate.useMutation({
    onSuccess: () => {
      utils.scenes.listByProject.invalidate({ projectId });
    },
  });

  return {
    scenes: processedScenes,
    isLoading,
    error,
    refetch,
    createScene,
    updateScene,
    deleteScene,
    linkToSchedule,
    getScheduleConflicts,
    bulkCreate,
  };
}

