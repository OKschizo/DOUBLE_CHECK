'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { useState, useMemo } from 'react';
import { trpc } from './client';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/features/auth/stores/authStore';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  const trpcClient = useMemo(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          headers() {
            // Access the store directly to get the latest auth state
            const store = useAuthStore.getState();
            const user = store.firebaseUser || auth.currentUser;
            if (user) {
              return {
                'x-user-id': user.uid,
                'x-user-email': user.email || '',
                'x-user-name': user.displayName || '',
              };
            }
            return {};
          },
        }),
      ],
    }), []
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

