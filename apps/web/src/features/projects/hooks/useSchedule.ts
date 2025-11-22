import { trpc } from '@/lib/trpc/client';
import { useMemo } from 'react';

export function useSchedule(projectId: string) {
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.schedule.getSchedule.useQuery({ projectId });

  // Convert date strings to Date objects (tRPC serializes dates as strings)
  const schedule = useMemo(() => {
    if (!data) return data;
    return {
      ...data,
      days: data.days.map(day => ({
        ...day,
        date: day.date instanceof Date ? day.date : new Date(day.date),
        createdAt: day.createdAt instanceof Date ? day.createdAt : new Date(day.createdAt),
        updatedAt: day.updatedAt instanceof Date ? day.updatedAt : new Date(day.updatedAt),
      })),
      events: data.events.map(event => ({
        ...event,
        createdAt: event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt),
        updatedAt: event.updatedAt instanceof Date ? event.updatedAt : new Date(event.updatedAt),
      })),
    };
  }, [data]);

  const createDay = trpc.schedule.createDay.useMutation({
    onSuccess: () => {
      utils.schedule.getSchedule.invalidate({ projectId });
    },
  });

  const updateDay = trpc.schedule.updateDay.useMutation({
    onSuccess: () => {
      utils.schedule.getSchedule.invalidate({ projectId });
    },
  });

  const deleteDay = trpc.schedule.deleteDay.useMutation({
    onSuccess: () => {
      utils.schedule.getSchedule.invalidate({ projectId });
    },
  });

  const createEvent = trpc.schedule.createEvent.useMutation({
    onSuccess: () => {
      utils.schedule.getSchedule.invalidate({ projectId });
    },
  });

  const updateEvent = trpc.schedule.updateEvent.useMutation({
    onSuccess: () => {
      utils.schedule.getSchedule.invalidate({ projectId });
    },
  });

  const deleteEvent = trpc.schedule.deleteEvent.useMutation({
    onSuccess: () => {
      utils.schedule.getSchedule.invalidate({ projectId });
    },
  });

  return {
    schedule,
    isLoading,
    error,
    createDay,
    updateDay,
    deleteDay,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}


