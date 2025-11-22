'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@doublecheck/api';

export const trpc = createTRPCReact<AppRouter>();

