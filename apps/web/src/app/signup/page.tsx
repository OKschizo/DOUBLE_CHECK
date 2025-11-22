'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { useSearchParams } from 'next/navigation';

function SignUpContent() {
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('invite');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {inviteId && (
          <div className="mb-6 p-4 bg-accent-primary/10 border border-accent-primary rounded-lg text-center">
            <p className="text-sm text-accent-primary font-medium">
              ✨ You&apos;ve been invited to join a project!
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Sign up to accept your invitation
            </p>
          </div>
        )}
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Join <span className="text-accent-primary">DoubleCheck</span>
          </h1>
          <p className="text-text-secondary">Create your account</p>
        </div>

        <SignUpForm />

        <p className="text-center mt-6 text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-primary hover:text-accent-hover">
            Sign in
          </Link>
        </p>
        
        {inviteId && (
          <p className="text-xs text-text-tertiary text-center mt-4">
            After signing up, you&apos;ll automatically be added to the project.
          </p>
        )}
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Join <span className="text-accent-primary">DoubleCheck</span>
            </h1>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <SignUpContent />
    </Suspense>
  );
}

