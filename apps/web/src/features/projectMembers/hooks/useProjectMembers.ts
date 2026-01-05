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
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'project_members'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const memberList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }));
        
        setMembers(memberList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching project members:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { data: members, isLoading, error };
}

export function useMyRole(projectId: string) {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // Check project_members for role
    const q = query(
      collection(db, 'project_members'),
      where('projectId', '==', projectId),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        // User has explicit role in project_members
        setRole(snapshot.docs[0].data().role);
        setIsLoading(false);
      } else {
        // Fallback: Check if user created the project
        try {
          const projectDoc = await getDocs(
            query(collection(db, 'projects'), where('__name__', '==', projectId))
          );
          
          if (!projectDoc.empty) {
            const projectData = projectDoc.docs[0].data();
            if (projectData.createdBy === user.id) {
              // User is creator, grant owner role
              setRole('owner');
            } else {
              // User is not a member
              setRole(null);
            }
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error('Error checking project creator:', error);
          setRole(null);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, projectId]);

  return { data: role, isLoading };
}

export function useAddProjectMember() {
  const mutateAsync = async (data: any) => {
    await addDoc(collection(db, 'project_members'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return { mutateAsync, mutate: mutateAsync };
}

export function useUpdateMemberRole() {
  const mutateAsync = async ({ id, role }: { id: string, role: string }) => {
    await updateDoc(doc(db, 'project_members', id), {
      role,
      updatedAt: serverTimestamp(),
    });
  };

  return { mutateAsync, mutate: mutateAsync };
}

export function useRemoveProjectMember() {
  const mutateAsync = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'project_members', id));
  };

  return { mutateAsync, mutate: mutateAsync };
}
