import type { User } from '@doublecheck/schemas';

export interface Context {
  user: User | null;
}

/**
 * Creates context for an incoming request
 * This will be used by the Next.js API route handler
 */
export async function createContext(opts: {
  user: User | null;
}): Promise<Context> {
  return {
    user: opts.user,
  };
}

