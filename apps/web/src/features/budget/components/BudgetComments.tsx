import { useState, useEffect } from 'react';
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

interface BudgetCommentsProps {
  projectId: string;
  budgetItemId?: string;
}

export function BudgetComments({ projectId, budgetItemId }: BudgetCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) return;

    // Basic query, refine if needed for item specific comments
    let q = query(
      collection(db, 'budget_comments'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    if (budgetItemId) {
        q = query(
            collection(db, 'budget_comments'),
            where('projectId', '==', projectId),
            where('budgetItemId', '==', budgetItemId),
            orderBy('createdAt', 'desc')
        );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [projectId, budgetItemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    await addDoc(collection(db, 'budget_comments'), {
      projectId,
      budgetItemId,
      text: newComment,
      userId: user.id,
      userName: user.displayName || user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNewComment('');
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Comments</h4>
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {comments.map(comment => (
          <div key={comment.id} className="text-sm p-2 bg-background-tertiary rounded">
            <div className="font-semibold text-xs">{comment.userName}</div>
            <div>{comment.text}</div>
          </div>
        ))}
        {comments.length === 0 && <div className="text-xs text-text-tertiary">No comments yet</div>}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 input-field text-sm"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
        />
        <button type="submit" className="btn-primary text-xs px-3">Post</button>
      </form>
    </div>
  );
}
