import { appRouter, createContext } from '@doublecheck/api';

export const createCaller = async () => {
  // This will be called server-side
  // You'll need to get the user from cookies/session
  const context = await createContext({ user: null });
  return appRouter.createCaller(context);
};

