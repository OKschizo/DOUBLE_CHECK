'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cloneNikeDemoForUser, hasNikeDemoProject } from '@/lib/firebase/cloneDemo';
import { useRouter } from 'next/navigation';

export function CloneDemoButton() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClone = async () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Check if user already has demo
      const hasDemo = await hasNikeDemoProject(user.orgId);
      if (hasDemo) {
        if (!confirm('You already have a Nike demo project. Create another copy?')) {
          setIsCloning(false);
          return;
        }
      }

      // Clone the demo
      const newProjectId = await cloneNikeDemoForUser(user.id, user.orgId);
      
      // Success! Redirect to the new project
      router.push(`/projects/${newProjectId}`);
    } catch (err: any) {
      console.error('Clone error:', err);
      setError(err.message || 'Failed to clone demo project');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <>
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm z-50">
          {error}
        </div>
      )}
      <button
        onClick={handleClone}
        disabled={isCloning}
        className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap relative"
        title="Get a fully populated Nike demo project with crew, cast, equipment, scenes, and more!"
      >
        {isCloning ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            <span>Cloning...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Get Nike Demo</span>
          </>
        )}
      </button>
    </>
  );
}

