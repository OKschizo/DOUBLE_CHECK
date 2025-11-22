'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface BudgetCommentsProps {
  projectId: string;
  budgetItemId?: string;
  budgetCategoryId?: string;
  onClose: () => void;
}

export function BudgetComments({ projectId, budgetItemId, budgetCategoryId, onClose }: BudgetCommentsProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading } = trpc.budget.getComments.useQuery({
    projectId,
    budgetItemId,
    budgetCategoryId,
  });

  const createComment = trpc.budget.createComment.useMutation({
    onSuccess: () => {
      utils.budget.getComments.invalidate({ projectId, budgetItemId, budgetCategoryId });
      setNewComment('');
    },
  });

  const updateComment = trpc.budget.updateComment.useMutation({
    onSuccess: () => {
      utils.budget.getComments.invalidate({ projectId, budgetItemId, budgetCategoryId });
    },
  });

  const deleteComment = trpc.budget.deleteComment.useMutation({
    onSuccess: () => {
      utils.budget.getComments.invalidate({ projectId, budgetItemId, budgetCategoryId });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await createComment.mutateAsync({
      projectId,
      budgetItemId,
      budgetCategoryId,
      content: newComment,
      mentions: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-primary border border-border-default rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Comments</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Comments List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments && comments.length > 0 ? (
                comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg border ${
                      comment.resolved
                        ? 'bg-background-tertiary border-border-default opacity-60'
                        : 'bg-background-secondary border-border-default'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{comment.userName || 'Unknown'}</div>
                        <div className="text-xs text-text-tertiary">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {comment.userId === user?.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              updateComment.mutate({
                                id: comment.id,
                                resolved: !comment.resolved,
                              });
                            }}
                            className="text-xs text-text-secondary hover:text-text-primary"
                          >
                            {comment.resolved ? 'Unresolve' : 'Resolve'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this comment?')) {
                                deleteComment.mutate({ id: comment.id });
                              }
                            }}
                            className="text-xs text-red-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-text-primary whitespace-pre-wrap">
                      {comment.content}
                    </div>
                    {comment.mentions && comment.mentions.length > 0 && (
                      <div className="mt-2 text-xs text-text-tertiary">
                        Mentioned: {comment.mentions.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmit} className="border-t border-border-default pt-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary mb-2"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || createComment.isPending}
                  className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-hover transition-colors font-medium text-sm disabled:opacity-50"
                  style={{ color: 'rgb(var(--colored-button-text))' }}
                >
                  {createComment.isPending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

