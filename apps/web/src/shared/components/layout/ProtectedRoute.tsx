'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure there's no auth (after loading completes)
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

  // Show loading only for initial auth check
  if (loading && !firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent-primary border-r-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // If no firebase auth, don't render (redirect will happen)
  if (!firebaseUser) {
    return null;
  }

  // Allow access if firebaseUser exists, even if user document doesn't exist yet
  // The user document will be created/loaded asynchronously
  return <>{children}</>;
}

