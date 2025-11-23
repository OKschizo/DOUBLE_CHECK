import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@/lib/api';

const handler = async (req: Request) => {
  // Get user info from custom headers (passed by client)
  const userId = req.headers.get('x-user-id');
  const userEmail = req.headers.get('x-user-email');
  const userName = req.headers.get('x-user-name');
  
  let user = null;

  if (userId) {
    user = {
      id: userId,
      email: userEmail || '',
      displayName: userName || 'Unknown',
      orgId: 'default-org',
      role: 'admin' as const,
      photoURL: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => createContext({ user }),
  });
};

export { handler as GET, handler as POST };

