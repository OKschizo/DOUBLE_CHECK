import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background-primary">
      <div className="w-full max-w-md">
        <div className="card rounded-2xl p-6 sm:p-8 border border-border-default">
          <div className="text-center mb-6">
            <div className="inline-flex mb-4">
              <Image src="/logo_light.png" alt="DoubleCheck" width={48} height={48} className="dark:hidden" />
              <Image src="/logo_dark.png" alt="DoubleCheck" width={48} height={48} className="hidden dark:block" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              Welcome to <span className="text-accent-primary">DoubleCheck</span>
            </h1>
            <p className="text-sm text-text-secondary">Sign in to continue</p>
          </div>

          <LoginForm />

          <p className="text-center mt-6 text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-accent-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

