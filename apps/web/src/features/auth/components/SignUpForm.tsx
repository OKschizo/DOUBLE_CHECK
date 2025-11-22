'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signInWithGoogle } from '@/lib/firebase/auth';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { user, error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else if (user) {
      // Check if user came from an invitation
      const urlParams = new URLSearchParams(window.location.search);
      const inviteId = urlParams.get('invite');
      
      if (inviteId) {
        // Redirect to accept invitation
        router.push(`/invite/${inviteId}`);
      } else {
        // Normal signup flow
        router.push('/dashboard');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const { user, error: signInError } = await signInWithGoogle();

    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else if (user) {
      // Check if user came from an invitation
      const urlParams = new URLSearchParams(window.location.search);
      const inviteId = urlParams.get('invite');
      
      if (inviteId) {
        // Redirect to accept invitation
        router.push(`/invite/${inviteId}`);
      } else {
        // Normal signup flow
        router.push('/dashboard');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-accent-primary rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        style={{ color: 'rgb(var(--colored-button-text))' }}
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background-primary text-text-secondary">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? 'Signing in...' : 'Sign up with Google'}
      </button>
    </form>
  );
}

