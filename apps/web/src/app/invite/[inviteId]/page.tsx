'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { trpc } from '@/lib/trpc/client';

export default function AcceptInvitePage() {
  const params = useParams();
  const inviteId = params.inviteId as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = trpc.projectMembers.acceptInvite.useMutation();

  useEffect(() => {
    async function handleAcceptInvitation() {
      try {
        const result = await acceptInvite.mutateAsync({ inviteId });
        
        if (!result) {
          throw new Error('Failed to accept invitation');
        }
        
        // Redirect to the project
        router.push(`/projects/${result.projectId}`);
      } catch (err: any) {
        setError(err.message || 'Failed to accept invitation');
      }
    }

    if (!authLoading && user && inviteId) {
      handleAcceptInvitation();
    } else if (!authLoading && !user) {
      // Redirect to sign up with invite ID preserved
      router.push(`/signup?invite=${inviteId}`);
    }
  }, [user, authLoading, inviteId, router, acceptInvite]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="max-w-md text-center p-8 bg-background-secondary rounded-lg border border-gray-800">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-red-500">Invitation Error</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary">
      <div className="max-w-md text-center p-8 bg-background-secondary rounded-lg border border-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
        <h1 className="text-3xl font-bold mb-4">Accepting Invitation...</h1>
        <p className="text-text-secondary">
          {acceptInvite.isPending ? 'Processing your invitation...' : 'Redirecting to project...'}
        </p>
      </div>
    </div>
  );
}

