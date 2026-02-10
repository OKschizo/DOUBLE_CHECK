import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useUsers() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setMyProjects([]);
      setIsLoading(false);
      return;
    }

    // 1. Listen for user profile
    const userUnsub = onSnapshot(doc(db, 'users', user.id), (doc) => {
      if (doc.exists()) {
        setProfile({ id: doc.id, ...doc.data() });
      } else {
        setProfile(null);
      }
    });

    // 2. Listen for my projects (where I am a member or owner)
    // Since simple queries are limited, we often query by owner or member collection
    // For now, assuming 'projects' has an 'orgId' or we query by ownership
    // Or better, query 'project_members' where userId == user.id, then fetch projects
    // Simplified: just fetch projects where owner == user.id for now (MVP)
    const projectsQuery = query(
      collection(db, 'projects'),
      where('createdBy', '==', user.id)
    );

    const projectsUnsub = onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyProjects(projects);
      setIsLoading(false);
    });

    return () => {
      userUnsub();
      projectsUnsub();
    };
  }, [user]);

  const updateProfile = async (data: any) => {
    if (!user) throw new Error("Not logged in");
    await updateDoc(doc(db, 'users', user.id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    profile,
    myProjects,
    isLoading,
    updateProfile: { mutate: updateProfile, mutateAsync: updateProfile }
  };
}

