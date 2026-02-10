'use client';

import { useState } from 'react';
import { useBudgetApprovals, BudgetApproval, ApprovalStatus } from '../hooks/useBudgetApprovals';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';

interface BudgetApprovalsProps {
  projectId: string;
  categories: BudgetCategory[];
  items: BudgetItem[];
  canApprove?: boolean; // Admin/Producer role
  onClose: () => void;
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending Review', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  approved: { label: 'Approved', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
  rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  revision_requested: { label: 'Revision Requested', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
};

export function BudgetApprovals({ 
  projectId, 
  categories, 
  items, 
  canApprove = false,
  onClose 
}: BudgetApprovalsProps) {
  const { 
    approvals, 
    isLoading, 
    submitForApproval, 
    approveBudget, 
    rejectBudget,
    requestRevision,
    addComment,
    deleteApproval
  } = useBudgetApprovals(projectId);
  
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedApproval, setSelectedApproval] = useState<BudgetApproval | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [showActionModal, setShowActionModal] = useState<'approve' | 'reject' | 'revision' | 'comment' | null>(null);

  const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);

  const handleSubmit = async () => {
    if (!submitTitle.trim()) return;
    setIsSubmitting(true);
    
    try {
      await submitForApproval.mutateAsync(
        categories, 
        items, 
        submitTitle, 
        submitDescription,
        totalEstimated
      );
      setSubmitTitle('');
      setSubmitDescription('');
      setShowSubmitForm(false);
    } catch (err: any) {
      alert(`Failed to submit: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async () => {
    if (!selectedApproval || !showActionModal) return;
    
    try {
      switch (showActionModal) {
        case 'approve':
          await approveBudget.mutateAsync(selectedApproval.id, actionComment || undefined);
          break;
        case 'reject':
          if (!actionComment.trim()) {
            alert('Please provide a reason for rejection');
            return;
          }
          await rejectBudget.mutateAsync(selectedApproval.id, actionComment);
          break;
        case 'revision':
          if (!actionComment.trim()) {
            alert('Please provide feedback for the revision');
            return;
          }
          await requestRevision.mutateAsync(selectedApproval.id, actionComment);
          break;
        case 'comment':
          if (!actionComment.trim()) return;
          await addComment.mutateAsync(selectedApproval.id, actionComment);
          break;
      }
      setShowActionModal(null);
      setActionComment('');
      setSelectedApproval(null);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const formatCurrency = (n: number) => 
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const formatDate = (date: Date) => 
    date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background-primary border border-border-default rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary border border-border-default rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-default flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Budget Approvals</h2>
            <p className="text-sm text-text-secondary mt-1">
              Submit and track budget approval requests
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Submit New Request */}
          <div className="bg-background-secondary rounded-lg border border-border-default p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Current Budget</h3>
                <p className="text-sm text-text-tertiary">
                  Total: ${formatCurrency(totalEstimated)} • {categories.length} categories • {items.length} items
                </p>
              </div>
              <button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors text-sm font-medium"
                style={{ color: 'rgb(var(--colored-button-text))' }}
              >
                📤 Submit for Approval
              </button>
            </div>

            {showSubmitForm && (
              <div className="mt-4 pt-4 border-t border-border-default space-y-3">
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Title *</label>
                  <input
                    type="text"
                    value={submitTitle}
                    onChange={(e) => setSubmitTitle(e.target.value)}
                    placeholder="e.g., Q1 Budget Update, Equipment Addition Request"
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Description</label>
                  <textarea
                    value={submitDescription}
                    onChange={(e) => setSubmitDescription(e.target.value)}
                    placeholder="Explain the changes and why approval is needed..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background-primary border border-border-default rounded text-sm resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSubmitForm(false)}
                    className="px-4 py-2 bg-background-tertiary border border-border-default rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!submitTitle.trim() || isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Approval Requests */}
          <h3 className="font-semibold mb-3">Approval Requests ({approvals.length})</h3>
          {approvals.length === 0 ? (
            <div className="text-center py-8 text-text-tertiary">
              <div className="text-4xl mb-2">📋</div>
              <p>No approval requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => {
                const statusConfig = STATUS_CONFIG[approval.status];
                return (
                  <div
                    key={approval.id}
                    className={`rounded-lg border p-4 ${statusConfig.bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{approval.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded ${statusConfig.color} ${statusConfig.bg}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        {approval.description && (
                          <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                            {approval.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-text-tertiary">
                          <span>Est: ${formatCurrency(approval.totalEstimated)}</span>
                          {approval.previousTotal && approval.previousTotal !== approval.totalEstimated && (
                            <span className={approval.totalEstimated > approval.previousTotal ? 'text-red-500' : 'text-green-500'}>
                              {approval.totalEstimated > approval.previousTotal ? '+' : ''}
                              ${formatCurrency(approval.totalEstimated - approval.previousTotal)} change
                            </span>
                          )}
                          <span>{approval.changesSummary}</span>
                        </div>
                        <div className="text-xs text-text-tertiary mt-2">
                          Submitted by {approval.submittedByName} on {formatDate(approval.submittedAt)}
                          {approval.reviewedByName && (
                            <span> • Reviewed by {approval.reviewedByName}</span>
                          )}
                        </div>
                        
                        {/* Comments */}
                        {approval.comments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border-default/50">
                            <div className="text-xs font-medium mb-2">Comments ({approval.comments.length})</div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {approval.comments.map((comment) => (
                                <div key={comment.id} className="text-xs bg-background-primary/50 rounded p-2">
                                  <span className="font-medium">{comment.userName}:</span>{' '}
                                  <span className="text-text-secondary">{comment.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-1 ml-4">
                        {approval.status === 'pending' && canApprove && (
                          <>
                            <button
                              onClick={() => { setSelectedApproval(approval); setShowActionModal('approve'); }}
                              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setSelectedApproval(approval); setShowActionModal('revision'); }}
                              className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs font-medium"
                            >
                              Request Revision
                            </button>
                            <button
                              onClick={() => { setSelectedApproval(approval); setShowActionModal('reject'); }}
                              className="px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setSelectedApproval(approval); setShowActionModal('comment'); }}
                          className="px-3 py-1.5 bg-background-tertiary border border-border-default rounded text-xs"
                        >
                          💬 Comment
                        </button>
                        {approval.status !== 'approved' && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this approval request?')) {
                                deleteApproval.mutateAsync(approval.id);
                              }
                            }}
                            className="px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors font-medium"
            style={{ color: 'rgb(var(--colored-button-text))' }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-background-primary border border-border-default rounded-lg w-full max-w-md p-6">
            <h3 className="font-semibold mb-4">
              {showActionModal === 'approve' && '✅ Approve Budget'}
              {showActionModal === 'reject' && '❌ Reject Budget'}
              {showActionModal === 'revision' && '📝 Request Revision'}
              {showActionModal === 'comment' && '💬 Add Comment'}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {showActionModal === 'approve' && 'Add an optional approval comment.'}
              {showActionModal === 'reject' && 'Please provide a reason for rejection.'}
              {showActionModal === 'revision' && 'Provide feedback on what needs to be revised.'}
              {showActionModal === 'comment' && 'Add a comment to the discussion.'}
            </p>
            <textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder={
                showActionModal === 'approve' ? 'Optional comment...' :
                showActionModal === 'reject' ? 'Reason for rejection (required)...' :
                showActionModal === 'revision' ? 'Feedback for revision (required)...' :
                'Your comment...'
              }
              rows={3}
              className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded text-sm resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowActionModal(null); setActionComment(''); }}
                className="px-4 py-2 bg-background-tertiary border border-border-default rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 rounded text-sm font-medium text-white ${
                  showActionModal === 'approve' ? 'bg-green-600' :
                  showActionModal === 'reject' ? 'bg-red-500' :
                  showActionModal === 'revision' ? 'bg-orange-500' :
                  'bg-accent-primary'
                }`}
              >
                {showActionModal === 'approve' && 'Approve'}
                {showActionModal === 'reject' && 'Reject'}
                {showActionModal === 'revision' && 'Request Revision'}
                {showActionModal === 'comment' && 'Add Comment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
