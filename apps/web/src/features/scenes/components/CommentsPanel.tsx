'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  mentions: string[];
  createdAt: Date;
  resolved: boolean;
  replies?: Comment[];
}

interface CommentsPanelProps {
  entityId: string; // scene or shot ID
  entityType: 'scene' | 'shot';
  comments: Comment[];
  onAddComment: (content: string, mentions: string[]) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onReplyComment: (commentId: string, content: string) => Promise<void>;
  teamMembers: any[];
}

export function CommentsPanel({
  entityId,
  entityType,
  comments,
  onAddComment,
  onResolveComment,
  onReplyComment,
  teamMembers,
}: CommentsPanelProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const activeComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Extract mentions (@username)
    const mentions = (newComment.match(/@(\w+)/g) || []).map(m => m.slice(1));

    await onAddComment(newComment, mentions);
    setNewComment('');
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    
    await onReplyComment(commentId, replyContent);
    setReplyingTo(null);
    setReplyContent('');
  };

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <div className="card-elevated p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... Use @name to mention team members"
            className="input-field text-sm"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-tertiary">
              Tip: Use @name to mention team members
            </div>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Post Comment
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">
            Comments ({activeComments.length})
          </h3>
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            {showResolved ? 'Hide' : 'Show'} Resolved ({resolvedComments.length})
          </button>
        </div>

        {/* Active Comments */}
        {activeComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onResolve={() => onResolveComment(comment.id)}
            onReply={() => setReplyingTo(comment.id)}
            isReplying={replyingTo === comment.id}
            replyContent={replyContent}
            onReplyChange={setReplyContent}
            onSubmitReply={() => handleReply(comment.id)}
            onCancelReply={() => {
              setReplyingTo(null);
              setReplyContent('');
            }}
          />
        ))}

        {activeComments.length === 0 && (
          <div className="text-center py-8 text-text-tertiary">
            No comments yet. Start the conversation!
          </div>
        )}

        {/* Resolved Comments */}
        {showResolved && resolvedComments.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <h4 className="text-sm font-semibold text-text-secondary">Resolved</h4>
            {resolvedComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isResolved
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onResolve,
  onReply,
  isResolved = false,
  isReplying = false,
  replyContent = '',
  onReplyChange,
  onSubmitReply,
  onCancelReply,
}: {
  comment: Comment;
  onResolve?: () => void;
  onReply?: () => void;
  isResolved?: boolean;
  isReplying?: boolean;
  replyContent?: string;
  onReplyChange?: (value: string) => void;
  onSubmitReply?: () => void;
  onCancelReply?: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg border ${isResolved ? 'bg-background-secondary border-border-subtle opacity-60' : 'bg-background-primary border-border-default'}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-bold text-sm">
          {comment.userName.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-text-primary text-sm">{comment.userName}</span>
            <span className="text-xs text-text-tertiary">
              {comment.createdAt.toLocaleDateString()} {comment.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          {!isResolved && (
            <div className="flex items-center gap-3 mt-2">
              {onReply && (
                <button onClick={onReply} className="text-xs text-text-secondary hover:text-accent-primary">
                  Reply
                </button>
              )}
              {onResolve && (
                <button onClick={onResolve} className="text-xs text-text-secondary hover:text-green-400">
                  ✓ Resolve
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && onReplyChange && onSubmitReply && onCancelReply && (
            <div className="mt-3 pl-4 border-l-2 border-accent-primary">
              <textarea
                value={replyContent}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="Write a reply..."
                className="input-field text-sm mb-2"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button onClick={onSubmitReply} className="btn-primary text-xs">
                  Reply
                </button>
                <button onClick={onCancelReply} className="btn-secondary text-xs">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-border-subtle">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="text-sm">
                  <span className="font-semibold text-text-primary">{reply.userName}</span>
                  <span className="text-text-secondary ml-2">{reply.content}</span>
                  <span className="text-xs text-text-tertiary ml-2">
                    {reply.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

