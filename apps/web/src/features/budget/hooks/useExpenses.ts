import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

export function useExpenses(projectId: string) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'expenses'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const expenseList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(doc.data().date),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }));
        
        setExpenses(expenseList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  const createExpense = async (data: any) => {
    if (!user) throw new Error("Not logged in");
    await addDoc(collection(db, 'expenses'), {
      ...data,
      projectId,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateExpense = async ({ id, data }: { id: string, data: any }) => {
    await updateDoc(doc(db, 'expenses', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteExpense = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  const importExpenses = async (data: any) => {
     // Placeholder for bulk import
     console.log("Import expenses", data);
  };

  return {
    expenses,
    isLoading,
    error,
    createExpense: { mutate: createExpense, mutateAsync: createExpense },
    updateExpense: { mutate: updateExpense, mutateAsync: updateExpense },
    deleteExpense: { mutate: deleteExpense, mutateAsync: deleteExpense },
    importExpenses: { mutate: importExpenses, mutateAsync: importExpenses },
  };
}

export function useExpensesByBudgetItem(budgetItemId: string) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!budgetItemId) return;

    const q = query(
      collection(db, 'expenses'),
      where('budgetItemId', '==', budgetItemId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
      setExpenses(expenseList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [budgetItemId]);

  return { expenses, isLoading };
}
