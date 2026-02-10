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
    if (!user?.id) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    // We need to get projects from TWO sources:
    // 1. Projects owned by user's org (orgId match)
    // 2. Projects user is a member of (via project_members)
    
    let unsubscribeOrg: (() => void) | undefined;
    let unsubscribeMemberships: (() => void) | undefined;
    
    const orgProjects: Project[] = [];
    const memberProjects: Project[] = [];
    let orgLoaded = false;
    let membershipsLoaded = false;

    const updateProjects = () => {
      if (orgLoaded && membershipsLoaded) {
        // Merge and dedupe projects
        const allProjects = [...orgProjects];
        for (const mp of memberProjects) {
          if (!allProjects.find(p => p.id === mp.id)) {
            allProjects.push(mp);
          }
        }
        
        // Sort by createdAt desc
        allProjects.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });
        
        setProjects(allProjects);
        setIsLoading(false);
      }
    };

    // 1. Query for org-owned projects
    if (user.orgId) {
      let orgQuery = query(
        collection(db, 'projects'),
        where('orgId', '==', user.orgId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        orgQuery = query(orgQuery, where('status', '==', status));
      }

      unsubscribeOrg = onSnapshot(orgQuery, 
        (snapshot) => {
          orgProjects.length = 0;
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Filter out the public template
            if (data.orgId === user.orgId) {
              orgProjects.push({
                id: doc.id,
                ...data,
                isDemo: data.isClonedDemo || false,
                startDate: data.startDate?.toDate() || new Date(),
                endDate: data.endDate?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              } as Project);
            }
          });
          orgLoaded = true;
          updateProjects();
        },
        (err) => {
          console.error('Error fetching org projects:', err);
          setError(err);
          orgLoaded = true;
          updateProjects();
        }
      );
    } else {
      orgLoaded = true;
    }

    // 2. Query for projects user is a member of (invited projects)
    const membershipsQuery = query(
      collection(db, 'project_members'),
      where('userId', '==', user.id),
      where('status', '==', 'active')
    );

    unsubscribeMemberships = onSnapshot(membershipsQuery,
      async (snapshot) => {
        memberProjects.length = 0;
        
        // Get all project IDs the user is a member of
        const projectIds = snapshot.docs.map(d => d.data().projectId).filter(Boolean);
        
        // Fetch each project
        for (const projectId of projectIds) {
          try {
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            if (projectDoc.exists()) {
              const data = projectDoc.data();
              // Don't add if it's already from user's org (will be in orgProjects)
              if (data.orgId !== user.orgId) {
                const project = {
                  id: projectDoc.id,
                  ...data,
                  isInvited: true, // Flag that this is an invited project
                  isDemo: data.isClonedDemo || false,
                  startDate: data.startDate?.toDate() || new Date(),
                  endDate: data.endDate?.toDate() || new Date(),
                  createdAt: data.createdAt?.toDate() || new Date(),
                  updatedAt: data.updatedAt?.toDate() || new Date(),
                } as Project;
                
                // Apply status filter if specified
                if (!status || project.status === status) {
                  memberProjects.push(project);
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching project ${projectId}:`, err);
          }
        }
        
        membershipsLoaded = true;
        updateProjects();
      },
      (err) => {
        console.error('Error fetching memberships:', err);
        membershipsLoaded = true;
        updateProjects();
      }
    );

    return () => {
      unsubscribeOrg?.();
      unsubscribeMemberships?.();
    };
  }, [user?.id, user?.orgId, status]);

  return { data: projects, isLoading, error };
}

// Also export a hook for pending invites
export function usePendingInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setInvites([]);
      setIsLoading(false);
      return;
    }

    // Query for pending invites by email (user hasn't accepted yet)
    const q = query(
      collection(db, 'project_members'),
      where('userEmail', '==', user.email.toLowerCase()),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q,
      async (snapshot) => {
        const inviteList: any[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          
          // Fetch the project details for display
          try {
            const projectDoc = await getDoc(doc(db, 'projects', data.projectId));
            if (projectDoc.exists()) {
              inviteList.push({
                id: docSnap.id,
                ...data,
                project: {
                  id: projectDoc.id,
                  ...projectDoc.data(),
                },
                createdAt: data.createdAt?.toDate() || new Date(),
              });
            }
          } catch (err) {
            console.error('Error fetching project for invite:', err);
          }
        }
        
        setInvites(inviteList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching pending invites:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.email]);

  return { data: invites, isLoading };
}

// Accept an invite
export function useAcceptInvite() {
  const { user } = useAuth();

  const mutateAsync = async (inviteId: string) => {
    if (!user) throw new Error('Must be logged in');

    await updateDoc(doc(db, 'project_members', inviteId), {
      userId: user.id,
      userName: user.displayName || user.email?.split('@')[0] || 'User',
      status: 'active',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return { mutateAsync };
}

// Decline an invite
export function useDeclineInvite() {
  const mutateAsync = async (inviteId: string) => {
    await updateDoc(doc(db, 'project_members', inviteId), {
      status: 'declined',
      updatedAt: serverTimestamp(),
    });
  };

  return { mutateAsync };
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
        return;
      }

      const projectData = projectDoc.data();
      
      // ONLY protect the original template document
      if (id === 'demo-nike-project' && projectData.orgId === 'demo-public') {
        throw new Error('Cannot delete the public demo template');
      }
      
      // Check: User must be from same org OR be a member with owner role
      const isOrgOwner = projectData.orgId === user.orgId;
      
      if (!isOrgOwner) {
        // Check if user is owner via project_members
        const memberQuery = query(
          collection(db, 'project_members'),
          where('projectId', '==', id),
          where('userId', '==', user.id),
          where('role', '==', 'owner')
        );
        const memberSnap = await getDocs(memberQuery);
        
        if (memberSnap.empty) {
          throw new Error('You do not have permission to delete this project');
        }
      }

      // Delete the project
      await deleteDoc(projectRef);
      console.log(`✅ Deleted project: ${id}`);

    } catch (error: any) {
      console.error('Delete project error:', error);
      if (error.message?.includes('not found') || error.code === 'not-found') {
        return;
      }
      throw error;
    }
  };

  return { mutateAsync };
}
