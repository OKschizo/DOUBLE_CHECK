import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState, useMemo } from 'react';

export function useSchedule(projectId: string) {
  const [scheduleData, setScheduleData] = useState<{ days: any[], events: any[] }>({ days: [], events: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    const daysQuery = query(
      collection(db, 'schedule_days'),
      where('projectId', '==', projectId),
      orderBy('date', 'asc')
    );

    const eventsQuery = query(
      collection(db, 'schedule_events'),
      where('projectId', '==', projectId)
    );

    const unsubscribeDays = onSnapshot(daysQuery, (snap) => {
      const days = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        date: d.data().date?.toDate() || new Date(d.data().date),
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate()
      }));
      setScheduleData(prev => ({ ...prev, days }));
      setIsLoading(false);
    }, (err) => setError(err));

    const unsubscribeEvents = onSnapshot(eventsQuery, (snap) => {
      const events = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate()
      }));
      setScheduleData(prev => ({ ...prev, events }));
      setIsLoading(false);
    }, (err) => setError(err));

    return () => {
      unsubscribeDays();
      unsubscribeEvents();
    };
  }, [projectId]);

  const schedule = useMemo(() => {
    return scheduleData;
  }, [scheduleData]);

  // Mutations
  const createDay = async (data: any) => {
    const docRef = await addDoc(collection(db, 'schedule_days'), {
      ...data,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id; // Return the new document ID
  };

  const updateDay = async ({ id, data }: { id: string, data: any }) => {
    await updateDoc(doc(db, 'schedule_days', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const deleteDay = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'schedule_days', id));
  };

  const createEvent = async (data: any) => {
    await addDoc(collection(db, 'schedule_events'), {
      ...data,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateEvent = async ({ id, data }: { id: string, data: any }) => {
    await updateDoc(doc(db, 'schedule_events', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const deleteEvent = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'schedule_events', id));
  };

  return {
    schedule,
    isLoading,
    error,
    createDay: { mutate: createDay, mutateAsync: createDay },
    updateDay: { mutate: updateDay, mutateAsync: updateDay },
    deleteDay: { mutate: deleteDay, mutateAsync: deleteDay },
    createEvent: { mutate: createEvent, mutateAsync: createEvent },
    updateEvent: { mutate: updateEvent, mutateAsync: updateEvent },
    deleteEvent: { mutate: deleteEvent, mutateAsync: deleteEvent },
  };
}
