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
  orderBy,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: Date;
}

export interface BudgetApproval {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ApprovalStatus;
  submittedBy: string;
  submittedByName: string;
  submittedAt: Date;
  
  // Optional reviewer info
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  
  // Budget snapshot
  totalEstimated: number;
  totalActual: number;
  categoryCount: number;
  itemCount: number;
  previousTotal?: number; // For showing the change
  
  // Comments thread
  comments: ApprovalComment[];
  
  // Categories and items affected (optional)
  affectedCategories?: string[];
  changesSummary?: string;
}

export function useBudgetApprovals(projectId: string) {
  const [approvals, setApprovals] = useState<BudgetApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, firebaseUser } = useAuth();

  useEffect(() => {
    if (!projectId) {
      setApprovals([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'budget_approvals'),
      where('projectId', '==', projectId),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const approvalList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate() || new Date(),
          reviewedAt: doc.data().reviewedAt?.toDate(),
          comments: (doc.data().comments || []).map((c: any) => ({
            ...c,
            createdAt: c.createdAt?.toDate() || new Date(),
          })),
        })) as BudgetApproval[];
        setApprovals(approvalList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching budget approvals:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Submit budget for approval
  const submitForApproval = useCallback(async (
    categories: BudgetCategory[],
    items: BudgetItem[],
    title: string,
    description?: string,
    previousTotal?: number
  ) => {
    if (!firebaseUser) throw new Error("Not logged in");
    
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    
    const approvalData = {
      projectId,
      title,
      description: description || '',
      status: 'pending' as ApprovalStatus,
      submittedBy: firebaseUser.uid,
      submittedByName: user?.name || firebaseUser.email || 'Unknown',
      totalEstimated,
      totalActual,
      categoryCount: categories.length,
      itemCount: items.length,
      previousTotal,
      affectedCategories: categories.map(c => c.name),
      changesSummary: `${categories.length} categories, ${items.length} line items`,
      comments: [],
      submittedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'budget_approvals'), approvalData);
    return docRef.id;
  }, [projectId, firebaseUser, user]);

  // Approve budget
  const approveBudget = useCallback(async (approvalId: string, comment?: string) => {
    if (!firebaseUser) throw new Error("Not logged in");
    
    const updateData: any = {
      status: 'approved',
      reviewedBy: firebaseUser.uid,
      reviewedByName: user?.name || firebaseUser.email || 'Unknown',
      reviewedAt: serverTimestamp(),
    };
    
    if (comment) {
      updateData.comments = arrayUnion({
        id: `${Date.now()}`,
        userId: firebaseUser.uid,
        userName: user?.name || firebaseUser.email || 'Unknown',
        message: comment,
        createdAt: new Date(),
      });
    }
    
    await updateDoc(doc(db, 'budget_approvals', approvalId), updateData);
  }, [firebaseUser, user]);

  // Reject budget
  const rejectBudget = useCallback(async (approvalId: string, reason: string) => {
    if (!firebaseUser) throw new Error("Not logged in");
    
    await updateDoc(doc(db, 'budget_approvals', approvalId), {
      status: 'rejected',
      reviewedBy: firebaseUser.uid,
      reviewedByName: user?.name || firebaseUser.email || 'Unknown',
      reviewedAt: serverTimestamp(),
      comments: arrayUnion({
        id: `${Date.now()}`,
        userId: firebaseUser.uid,
        userName: user?.name || firebaseUser.email || 'Unknown',
        message: `Rejected: ${reason}`,
        createdAt: new Date(),
      }),
    });
  }, [firebaseUser, user]);

  // Request revision
  const requestRevision = useCallback(async (approvalId: string, feedback: string) => {
    if (!firebaseUser) throw new Error("Not logged in");
    
    await updateDoc(doc(db, 'budget_approvals', approvalId), {
      status: 'revision_requested',
      reviewedBy: firebaseUser.uid,
      reviewedByName: user?.name || firebaseUser.email || 'Unknown',
      reviewedAt: serverTimestamp(),
      comments: arrayUnion({
        id: `${Date.now()}`,
        userId: firebaseUser.uid,
        userName: user?.name || firebaseUser.email || 'Unknown',
        message: `Revision requested: ${feedback}`,
        createdAt: new Date(),
      }),
    });
  }, [firebaseUser, user]);

  // Add comment
  const addComment = useCallback(async (approvalId: string, message: string) => {
    if (!firebaseUser) throw new Error("Not logged in");
    
    await updateDoc(doc(db, 'budget_approvals', approvalId), {
      comments: arrayUnion({
        id: `${Date.now()}`,
        userId: firebaseUser.uid,
        userName: user?.name || firebaseUser.email || 'Unknown',
        message,
        createdAt: new Date(),
      }),
    });
  }, [firebaseUser, user]);

  // Delete approval
  const deleteApproval = useCallback(async (approvalId: string) => {
    await deleteDoc(doc(db, 'budget_approvals', approvalId));
  }, []);

  // Get pending count
  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return {
    approvals,
    pendingCount,
    isLoading,
    error,
    submitForApproval: { mutate: submitForApproval, mutateAsync: submitForApproval },
    approveBudget: { mutate: approveBudget, mutateAsync: approveBudget },
    rejectBudget: { mutate: rejectBudget, mutateAsync: rejectBudget },
    requestRevision: { mutate: requestRevision, mutateAsync: requestRevision },
    addComment: { mutate: addComment, mutateAsync: addComment },
    deleteApproval: { mutate: deleteApproval, mutateAsync: deleteApproval },
  };
}
