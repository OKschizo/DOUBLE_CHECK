import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/lib/schemas';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  user: null,
  loading: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ firebaseUser: null, user: null }),
}));

