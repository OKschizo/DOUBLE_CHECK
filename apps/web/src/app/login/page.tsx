import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome to <span className="text-accent-primary">DoubleCheck</span>
          </h1>
          <p className="text-text-secondary">Sign in to continue</p>
        </div>

        <LoginForm />

        <p className="text-center mt-6 text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-primary hover:text-accent-hover">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

