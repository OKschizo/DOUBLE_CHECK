'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function AcceptInviteClient() {
  const params = useParams();
  const inviteId = params.inviteId as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function handleAcceptInvitation() {
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        if (!inviteId) throw new Error('Invalid invitation link');
        if (!user) throw new Error('You must be logged in to accept an invitation');

        // 1. Get the invitation
        const inviteRef = doc(db, 'project_members', inviteId); // Changed to project_members to match collection name used elsewhere
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          throw new Error('Invitation not found or has expired');
        }

        const inviteData = inviteSnap.data();

        // 2. Verify it's for this user (email match)
        if (inviteData.userEmail && inviteData.userEmail.toLowerCase() !== user.email?.toLowerCase()) {
          throw new Error('This invitation was sent to a different email address');
        }

        // 3. Update status to active
        await updateDoc(inviteRef, {
          userId: user.id,
          userName: user.displayName || user.email?.split('@')[0] || 'User',
          status: 'active',
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // 4. Redirect to project
        router.push(`/projects/${inviteData.projectId}`);
      } catch (err: any) {
        console.error('Error accepting invite:', err);
        setError(err.message || 'Failed to accept invitation');
        setIsProcessing(false);
      }
    }

    if (!authLoading && user && inviteId) {
      handleAcceptInvitation();
    } else if (!authLoading && !user) {
      // Redirect to sign up with invite ID preserved
      router.push(`/signup?invite=${inviteId}`);
    }
  }, [user, authLoading, inviteId, router, isProcessing]);

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
          Processing your invitation...
        </p>
      </div>
    </div>
  );
}

