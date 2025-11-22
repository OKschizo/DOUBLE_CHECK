import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  integrationSchema,
  integrationTypeSchema,
  integrationStatusSchema,
  integrationConfigSchema,
  integrationMetadata,
  type Integration,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { TRPCError } from '@trpc/server';

export const integrationsRouter = router({
  /**
   * List all integrations for a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user has access to project
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project',
        });
      }

      const snapshot = await adminDb
        .collection('integrations')
        .where('projectId', '==', input.projectId)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastSyncAt: doc.data().lastSyncAt?.toDate(),
        config: {
          ...doc.data().config,
          tokenExpiresAt: doc.data().config?.tokenExpiresAt?.toDate(),
          lastImportDate: doc.data().config?.lastImportDate?.toDate(),
        },
      })) as Integration[];
    }),

  /**
   * Get a specific integration
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const doc = await adminDb.collection('integrations').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        });
      }

      const data = doc.data()!;

      // Check if user has access to project
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', data.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this integration',
        });
      }

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastSyncAt: data.lastSyncAt?.toDate(),
        config: {
          ...data.config,
          tokenExpiresAt: data.config?.tokenExpiresAt?.toDate(),
          lastImportDate: data.config?.lastImportDate?.toDate(),
        },
      } as Integration;
    }),

  /**
   * Create a new integration
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        type: integrationTypeSchema,
        config: integrationConfigSchema.optional(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user has admin/owner access to project
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', input.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project',
        });
      }

      const memberData = memberDoc.docs[0].data();
      if (memberData.role !== 'owner' && memberData.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and owners can create integrations',
        });
      }

      const metadata = integrationMetadata[input.type];
      const integrationData = {
        projectId: input.projectId,
        type: input.type,
        status: 'disconnected' as const,
        config: input.config || {
          enabled: true,
          syncDirection: 'import' as const,
          importSettings: {
            autoSync: false,
            syncFrequency: 'manual' as const,
          },
        },
        name: input.name || metadata.name,
        description: input.description || metadata.description,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: ctx.user.id,
      };

      const docRef = await adminDb.collection('integrations').add(integrationData);

      return {
        id: docRef.id,
        ...integrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Integration;
    }),

  /**
   * Update an integration
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: integrationStatusSchema.optional(),
        config: integrationConfigSchema.partial().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const doc = await adminDb.collection('integrations').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        });
      }

      const data = doc.data()!;

      // Check if user has admin/owner access to project
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', data.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this integration',
        });
      }

      const memberData = memberDoc.docs[0].data();
      if (memberData.role !== 'owner' && memberData.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and owners can update integrations',
        });
      }

      const updateData: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.config !== undefined) {
        updateData.config = {
          ...data.config,
          ...input.config,
        };
      }

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      await adminDb.collection('integrations').doc(input.id).update(updateData);

      const updatedDoc = await adminDb.collection('integrations').doc(input.id).get();
      const updatedData = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate(),
        updatedAt: updatedData.updatedAt?.toDate(),
        lastSyncAt: updatedData.lastSyncAt?.toDate(),
        config: {
          ...updatedData.config,
          tokenExpiresAt: updatedData.config?.tokenExpiresAt?.toDate(),
          lastImportDate: updatedData.config?.lastImportDate?.toDate(),
        },
      } as Integration;
    }),

  /**
   * Delete an integration
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const doc = await adminDb.collection('integrations').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        });
      }

      const data = doc.data()!;

      // Check if user has admin/owner access to project
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', data.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this integration',
        });
      }

      const memberData = memberDoc.docs[0].data();
      if (memberData.role !== 'owner' && memberData.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and owners can delete integrations',
        });
      }

      await adminDb.collection('integrations').doc(input.id).delete();

      return { success: true };
    }),

  /**
   * Initiate OAuth flow for an integration
   * Returns the OAuth initiation URL (now handled by API route)
   */
  initiateOAuth: protectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        redirectUri: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const doc = await adminDb.collection('integrations').doc(input.integrationId).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        });
      }

      const data = doc.data()!;
      const metadata = integrationMetadata[data.type as keyof typeof integrationMetadata];

      if (!metadata.requiresOAuth) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This integration does not require OAuth',
        });
      }

      // Check if user has admin/owner access
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', data.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this integration',
        });
      }

      const memberData = memberDoc.docs[0].data();
      if (memberData.role !== 'owner' && memberData.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and owners can connect integrations',
        });
      }

      // Update integration status to connecting
      await adminDb.collection('integrations').doc(input.integrationId).update({
        status: 'connecting',
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Return OAuth URL pointing to API route
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const redirectUri = input.redirectUri || `${baseUrl}/api/integrations/oauth/${data.type}/callback`;

      return {
        oauthUrl: `${baseUrl}/api/integrations/oauth/${data.type}?integrationId=${input.integrationId}&redirectUri=${encodeURIComponent(redirectUri)}`,
      };
    }),

  /**
   * Get Slack channels for an integration
   */
  getSlackChannels: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .query(async ({ input, ctx }) => {
      const doc = await adminDb.collection('integrations').doc(input.integrationId).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        });
      }

      const data = doc.data()!;

      if (data.type !== 'slack') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This endpoint is only for Slack integrations',
        });
      }

      // Check if user has access
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', data.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this integration',
        });
      }

      if (data.status !== 'connected') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Integration is not connected',
        });
      }

      const accessToken = data.config?.accessToken;
      if (!accessToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Slack access token not found',
        });
      }

      // Fetch channels from Slack API
      try {
        // First, try to get all public channels (bot doesn't need to be a member)
        const response = await fetch('https://slack.com/api/conversations.list', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            types: 'public_channel',
            exclude_archived: 'true',
            limit: '200',
          }),
        });

        const result = await response.json();

        if (!result.ok) {
          // Log the error for debugging
          console.error('Slack API error:', result.error, result);
          
          // Provide helpful error messages
          let errorMessage = result.error || 'Failed to fetch Slack channels';
          if (result.error === 'missing_scope') {
            errorMessage = 'Missing required Slack scope. Please reconnect the integration.';
          } else if (result.error === 'invalid_auth') {
            errorMessage = 'Invalid Slack token. Please reconnect the integration.';
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
          });
        }

        const channels = (result.channels || []).map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.is_private || false,
          isMember: channel.is_member || false,
        }));

        // If no channels found, try to get channels the bot is a member of
        if (channels.length === 0) {
          const memberResponse = await fetch('https://slack.com/api/users.conversations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              types: 'public_channel,private_channel',
              exclude_archived: 'true',
              limit: '200',
            }),
          });

          const memberResult = await memberResponse.json();
          if (memberResult.ok && memberResult.channels) {
            return {
              channels: memberResult.channels.map((channel: any) => ({
                id: channel.id,
                name: channel.name,
                isPrivate: channel.is_private || false,
                isMember: true,
              })),
            };
          }
        }

        return {
          channels,
          error: channels.length === 0 ? 'No channels found. Make sure the Slack app is added to at least one channel.' : undefined,
        };
      } catch (error: any) {
        console.error('Error fetching Slack channels:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch Slack channels',
        });
      }
    }),

  /**
   * Sync an integration (import/export data)
   */
  sync: protectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        direction: z.enum(['import', 'export', 'both']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const doc = await adminDb.collection('integrations').doc(input.integrationId).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        });
      }

      const data = doc.data()!;

      // Check if user has access
      const memberDoc = await adminDb
        .collection('projectMembers')
        .where('projectId', '==', data.projectId)
        .where('userId', '==', ctx.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberDoc.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this integration',
        });
      }

      if (data.status !== 'connected') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Integration is not connected',
        });
      }

      // Update last sync attempt
      await adminDb.collection('integrations').doc(input.integrationId).update({
        lastSyncAt: FieldValue.serverTimestamp(),
        lastSyncStatus: 'pending',
        updatedAt: FieldValue.serverTimestamp(),
      });

      try {
        // Import sync service
        const { syncIntegration } = await import('../services/integrations/syncService');
        
        const integration: Integration = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastSyncAt: data.lastSyncAt?.toDate(),
          config: {
            ...data.config,
            tokenExpiresAt: data.config?.tokenExpiresAt?.toDate(),
            lastImportDate: data.config?.lastImportDate?.toDate(),
          },
        } as Integration;

        const syncDirection = input.direction || data.config?.syncDirection || 'import';
        const result = await syncIntegration(integration, syncDirection);

        // Update sync status
        await adminDb.collection('integrations').doc(input.integrationId).update({
          lastSyncStatus: result.success ? 'success' : 'error',
          lastSyncError: result.success ? undefined : result.message,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return result;
      } catch (error: any) {
        // Update sync status with error
        await adminDb.collection('integrations').doc(input.integrationId).update({
          lastSyncStatus: 'error',
          lastSyncError: error.message || 'Sync failed',
          updatedAt: FieldValue.serverTimestamp(),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Sync failed',
        });
      }
    }),

  /**
   * Get available integration types
   */
  getAvailableTypes: protectedProcedure.query(async () => {
    return Object.entries(integrationMetadata).map(([key, value]) => ({
      type: key,
      ...value,
    }));
  }),
});
