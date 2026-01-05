import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';
import type { Project } from '@doublecheck/schemas';

export function useProjects(status?: 'planning' | 'pre-production' | 'production' | 'post-production' | 'completed' | 'archived') {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.orgId) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    // Query for user's projects (includes their Nike clones)
    let q = query(
      collection(db, 'projects'),
      where('orgId', '==', user.orgId),
      orderBy('createdAt', 'desc')
    );

    // Optional status filter
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const projectList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Flag cloned demo projects for UI badges
            isDemo: doc.data().isClonedDemo || false,
            startDate: doc.data().startDate?.toDate() || new Date(),
            endDate: doc.data().endDate?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          }))
          // Filter out the public template demo (orgId: demo-public)
          .filter(project => project.orgId === user.orgId) as Project[];
        
        setProjects(projectList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.orgId, status]);

  return { data: projects, isLoading, error };
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'projects', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setProject({
            id: docSnap.id,
            ...docSnap.data(),
            startDate: docSnap.data().startDate?.toDate() || new Date(),
            endDate: docSnap.data().endDate?.toDate() || new Date(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
          } as Project);
        } else {
          setProject(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching project:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  return { data: project, isLoading, error };
}

export function useCreateProject() {
  const { user } = useAuth();

  const mutateAsync = async (data: any) => {
    if (!user) throw new Error('Must be logged in');

    const projectData = {
      ...data,
      orgId: user.orgId,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      customCastTypes: [],
      customCrewDepartments: [],
      customRolesByDepartment: {},
      customEquipmentCategories: [],
    };

    // Create the project
    const docRef = await addDoc(collection(db, 'projects'), projectData);
    const projectId = docRef.id;

    // Automatically add creator as owner in project_members collection
    try {
      await addDoc(collection(db, 'project_members'), {
        projectId,
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        role: 'owner',
        status: 'active',
        invitedBy: user.id,
        invitedAt: serverTimestamp(),
        joinedAt: serverTimestamp(),
      });
      console.log('✅ Added creator as project owner');
    } catch (error) {
      console.error('Failed to add creator as owner:', error);
      // Don't fail project creation if this fails
    }

    return { id: projectId, ...projectData };
  };

  return { mutateAsync };
}

export function useUpdateProject() {
  const mutateAsync = async ({ id, data }: { id: string; data: any }) => {
    const docRef = doc(db, 'projects', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  return { mutateAsync };
}

export function useDeleteProject() {
  const { user } = useAuth();

  const mutateAsync = async ({ id }: { id: string }) => {
    if (!user) throw new Error('Must be logged in');

    try {
      // Check if user is owner/creator before deleting
      const projectRef = doc(db, 'projects', id);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        console.warn('Project already deleted or does not exist');
        // Still return success - it's already gone
        return;
      }

      const projectData = projectDoc.data();
      
      console.log('Delete check for project:', {
        firestoreDocId: id,
        projectIdField: projectData.id,
        projectOrgId: projectData.orgId,
        userOrgId: user.orgId,
        projectCreatedBy: projectData.createdBy,
        userId: user.id,
        isPublic: projectData.isPublic,
        isClonedDemo: projectData.isClonedDemo,
      });
      
      // ONLY protect the original template document (Firestore doc ID: demo-nike-project)
      // Don't check the 'id' field in the data - check the actual Firestore document ID
      if (id === 'demo-nike-project' && projectData.orgId === 'demo-public') {
        throw new Error('Cannot delete the public demo template');
      }
      
      // Simple check: If project is in your org, you can delete it
      if (projectData.orgId !== user.orgId) {
        throw new Error('You do not have permission to delete this project (different org)');
      }
      
      // If we got here, user owns this project via orgId - allow deletion

      // Delete the project
      await deleteDoc(projectRef);
      console.log(`✅ Deleted project: ${id}`);

      // Optional: Clean up related collections (or use Cloud Functions triggers)
      // For now, orphaned data is okay (can be cleaned up later)
    } catch (error: any) {
      console.error('Delete project error:', error);
      // If it's already deleted, don't throw
      if (error.message?.includes('not found') || error.code === 'not-found') {
        return;
      }
      throw error;
    }
  };

  return { mutateAsync };
}
