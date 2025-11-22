import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  castMemberSchema,
  createCastMemberSchema,
  updateCastMemberSchema,
} from '@doublecheck/schemas';
import { adminDb } from '../lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { syncBudgetItemsForCast, unlinkBudgetItemsForCast } from '../services/budgetSync';

export const castRouter = router({
  // List all cast members for a project
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const snapshot = await adminDb
          .collection('cast')
          .where('projectId', '==', input.projectId)
          .orderBy('castType', 'asc')
          .orderBy('actorName', 'asc')
          .get();

        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            projectId: data.projectId,
            actorName: data.actorName,
            characterName: data.characterName,
            castType: data.castType,
            photoUrl: data.photoUrl || '',
            email: data.email || '',
            phone: data.phone || '',
            agent: data.agent || '',
            rate: data.rate || 0,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });
      } catch (error: any) {
        console.error('Error fetching cast members:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch cast members',
        });
      }
    }),

  // Get a single cast member
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const doc = await adminDb.collection('cast').doc(input.id).get();

      if (!doc.exists) {
        throw new Error('Cast member not found');
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        projectId: data.projectId,
        actorName: data.actorName,
        characterName: data.characterName,
        castType: data.castType,
        photoUrl: data.photoUrl || '',
        email: data.email || '',
        phone: data.phone || '',
        agent: data.agent || '',
        rate: data.rate || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }),

  // Create a new cast member
  create: protectedProcedure
    .input(createCastMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const docRef = adminDb.collection('cast').doc();

      const castData = {
        projectId: input.projectId,
        actorName: input.actorName,
        characterName: input.characterName,
        castType: input.castType,
        photoUrl: input.photoUrl || '',
        email: input.email || '',
        phone: input.phone || '',
        agent: input.agent || '',
        rate: input.rate || 0,
        createdBy: input.createdBy,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(castData);

      return {
        id: docRef.id,
        ...castData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  // Update a cast member
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateCastMemberSchema,
      })
    )
    .mutation(async ({ input }) => {
      const docRef = adminDb.collection('cast').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Cast member not found');
      }

      const updateData: any = {
        ...input.data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.update(updateData);

      // Sync linked budget items
      try {
        await syncBudgetItemsForCast(input.id, {
          actorName: input.data.actorName,
          characterName: input.data.characterName,
          rate: input.data.rate,
        });
      } catch (error) {
        console.error('Error syncing budget items for cast:', error);
        // Don't fail the update if budget sync fails
      }

      const updated = await docRef.get();
      const data = updated.data()!;

      return {
        id: updated.id,
        projectId: data.projectId,
        actorName: data.actorName,
        characterName: data.characterName,
        castType: data.castType,
        photoUrl: data.photoUrl || '',
        email: data.email || '',
        phone: data.phone || '',
        agent: data.agent || '',
        rate: data.rate || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }),

  // Delete a cast member
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const docRef = adminDb.collection('cast').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Cast member not found');
      }

      // TODO: Also delete the photo from Firebase Storage if it exists
      const data = doc.data();
      if (data?.photoUrl) {
        // Add storage deletion logic here when we implement Firebase Storage
      }

      // Unlink budget items (don't delete them to preserve budget history)
      try {
        await unlinkBudgetItemsForCast(input.id);
      } catch (error) {
        console.error('Error unlinking budget items for cast:', error);
        // Don't fail the delete if unlink fails
      }

      await docRef.delete();

      return { success: true, id: input.id };
    }),
});



